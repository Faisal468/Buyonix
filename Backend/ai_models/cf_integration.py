"""
Integration module for Collaborative Filtering AI Model
This provides an interface for Node.js/Express backend to call the AI model
"""

import sys
import json
import os
import io
import subprocess
from contextlib import redirect_stdout, redirect_stderr
from collaborative_filtering import CollaborativeFilteringModel

# Suppress print statements globally
class SuppressPrint:
    def write(self, x): 
        pass
    def flush(self): 
        pass

class CFIntegration:
    def __init__(self, model_path=None, db_uri=None):
        """Initialize the CF model integration"""
        self.model = CollaborativeFilteringModel(n_factors=10)
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), 'cf_model.pkl')
        self.db_uri = db_uri
        self.is_initialized = False
    
    def get_product_count(self):
        """Get actual product count from database"""
        try:
            # Try to import and connect to MongoDB
            import mongoose
            from pymongo import MongoClient
            
            # Extract MongoDB connection string from environment or use default
            db_uri = self.db_uri or os.getenv('DB_URI', 'mongodb://localhost:27017/buyonix')
            client = MongoClient(db_uri, serverSelectionTimeoutMS=2000)
            db = client.get_database()
            product_count = db['products'].count_documents({'status': 'active'})
            client.close()
            return product_count if product_count > 0 else 45
        except Exception:
            # If DB connection fails, use default
            return 45
    
    def get_user_count(self):
        """Get actual user count from database"""
        try:
            # Try to import and connect to MongoDB
            from pymongo import MongoClient
            
            # Extract MongoDB connection string from environment or use default
            db_uri = self.db_uri or os.getenv('DB_URI', 'mongodb://localhost:27017/buyonix')
            client = MongoClient(db_uri, serverSelectionTimeoutMS=2000)
            db = client.get_database()
            user_count = db['users'].count_documents({})
            client.close()
            return user_count if user_count > 0 else 5
        except Exception:
            # If DB connection fails, use default
            return 5
    
    def get_real_interactions(self):
        """
        Get real user-product interactions from MongoDB
        Returns DataFrame with columns: user_id, product_id, rating
        
        Step 1: Interaction → Numeric Rating
        - view → 1
        - cart → 2
        - purchase → 5
        
        Step 2: Build User × Product Matrix (CF Input)
        - Aggregates multiple interactions (takes maximum weight)
        - Creates matrix where rows=users, columns=products, values=ratings
        
        This is the CORRECT architecture for CF:
        User × Product → rating (1-5 scale)
        """
        try:
            from pymongo import MongoClient
            import pandas as pd
            
            db_uri = self.db_uri or os.getenv('DB_URI', 'mongodb://localhost:27017/buyonix')
            client = MongoClient(db_uri, serverSelectionTimeoutMS=2000)
            db = client.get_database()
            
            interactions_collection = db['interactions']
            
            # Get all interactions from database
            interactions = interactions_collection.find()
            interaction_data = []
            
            print(f"\n📊 Reading interactions from MongoDB...")
            
            for interaction in interactions:
                try:
                    user_id = str(interaction.get('userId', ''))
                    product_id = str(interaction.get('productId', ''))
                    action = interaction.get('action', 'view')
                    weight = interaction.get('weight', 1)
                    
                    # Step 1: Convert interaction → numeric rating
                    # view → 1, cart → 2, purchase → 5
                    # Weight IS the rating we want (already set correctly in backend)
                    cf_rating = weight
                    
                    if user_id and product_id and cf_rating > 0:
                        interaction_data.append({
                            'user_id': user_id,
                            'product_id': product_id,
                            'rating': cf_rating
                        })
                except Exception as e:
                    continue
            
            client.close()
            
            if len(interaction_data) == 0:
                print("   ⚠️  No interactions found in database")
                return pd.DataFrame(columns=['user_id', 'product_id', 'rating']), 0
            
            # Convert to DataFrame
            df = pd.DataFrame(interaction_data)
            
            # Step 2: Aggregate multiple interactions for same user-product pair
            # If user has multiple interactions (e.g., viewed then purchased),
            # take the maximum weight (purchase > cart > view)
            df_aggregated = df.groupby(['user_id', 'product_id'])['rating'].max().reset_index()
            
            interaction_count = len(df_aggregated)
            unique_users = df_aggregated['user_id'].nunique()
            unique_products = df_aggregated['product_id'].nunique()
            
            print(f"   ✓ Found {interaction_count} unique user-product interactions")
            print(f"   ✓ {unique_users} unique users")
            print(f"   ✓ {unique_products} unique products")
            
            return df_aggregated, interaction_count
        except Exception as e:
            print(f"   ✗ Error reading interactions: {str(e)}")
            import pandas as pd
            return pd.DataFrame(columns=['user_id', 'product_id', 'rating']), 0
    
    def initialize(self, n_products=None, n_users=None):
        """
        Initialize the model (train or load)
        Called once on backend startup
        
        Args:
            n_products: Number of products to use (optional, gets from DB)
            n_users: Number of users to use (optional, gets from DB)
        """
        try:
            # Use provided counts or get from database
            if n_products is None:
                n_products = self.get_product_count()
            if n_users is None:
                n_users = self.get_user_count()
            
            # Suppress all output during initialization
            old_stdout = sys.stdout
            old_stderr = sys.stderr
            sys.stdout = SuppressPrint()
            sys.stderr = SuppressPrint()
            
            try:
                if os.path.exists(self.model_path):
                    # Check if model needs retraining due to product or user count change
                    self.model.load_model(self.model_path)
                    current_product_count = len(self.model.product_ids) if self.model.product_ids else 45
                    current_user_count = len(self.model.user_ids) if self.model.user_ids else 5
                    
                    # If product or user count changed, retrain
                    if n_products != current_product_count or n_users != current_user_count:
                        os.remove(self.model_path)
                        
                        # Try to use real interactions first, fall back to synthetic
                        real_interactions_df, interaction_count = self.get_real_interactions()
                        
                        if interaction_count >= 10:  # Need at least 10 real interactions
                            # Use real interactions DataFrame
                            print(f"\n🤖 Training CF model with {interaction_count} REAL interactions...")
                            print("   Step 1: Interaction → Numeric Rating ✓")
                            print("   Step 2: Building User × Product Matrix...")
                            self.model.build_user_item_matrix(real_interactions_df)
                            print("   Step 3: Applying Matrix Factorization (SVD)...")
                            self.model.train(real_interactions_df)
                            print("   ✓ Model trained with REAL user behavior data!")
                        else:
                            # Fall back to synthetic data
                            print(f"\n⚠️  Only {interaction_count} real interactions found (need ≥10)")
                            print("   Using synthetic data for initial training...")
                            interactions = self.model.generate_synthetic_data(n_users=n_users, n_products=n_products)
                            self.model.build_user_item_matrix(interactions)
                            self.model.train(interactions)
                        
                        self.model.save_model(self.model_path)
                else:
                    # Generate and train on synthetic data with product and user counts
                    # Or use real interactions if available
                    real_interactions_df, interaction_count = self.get_real_interactions()
                    
                    if interaction_count >= 10:  # Need at least 10 real interactions
                        # Use real interactions DataFrame
                        print(f"\n🤖 Training CF model with {interaction_count} REAL interactions...")
                        print("   Step 1: Interaction → Numeric Rating ✓")
                        print("   Step 2: Building User × Product Matrix...")
                        self.model.build_user_item_matrix(real_interactions_df)
                        print("   Step 3: Applying Matrix Factorization (SVD)...")
                        self.model.train(real_interactions_df)
                        print("   ✓ Model trained with REAL user behavior data!")
                    else:
                        # Fall back to synthetic data
                        print(f"\n⚠️  Only {interaction_count} real interactions found (need ≥10)")
                        print("   Using synthetic data for initial training...")
                        interactions = self.model.generate_synthetic_data(n_users=n_users, n_products=n_products)
                        self.model.build_user_item_matrix(interactions)
                        self.model.train(interactions)
                    
                    self.model.save_model(self.model_path)
            finally:
                sys.stdout = old_stdout
                sys.stderr = old_stderr
            
            self.is_initialized = True
            return True
        except Exception as e:
            return False
    
    def get_recommendations(self, user_id, num_recommendations=5):
        """
        Get personalized recommendations for a user
        
        Args:
            user_id: User identifier (e.g., "user_1")
            num_recommendations: Number of products to recommend
        
        Returns:
            List of (product_id, predicted_rating) tuples
        """
        if not self.is_initialized:
            raise ValueError("Model not initialized. Call initialize() first.")
        
        recommendations = self.model.recommend_products(
            user_id, 
            n_recommendations=num_recommendations,
            exclude_rated=True
        )
        
        return recommendations
    
    def get_model_stats(self):
        """Get model statistics"""
        return self.model.get_model_stats()
    
    def retrain_with_real_data(self):
        """
        Retrain the model using ONLY real interactions from database
        This is called when you want to update the model with new user behavior
        
        Process:
        1. Get all interactions from MongoDB
        2. Convert to User × Product matrix (view=1, cart=2, purchase=5)
        3. Apply SVD (Matrix Factorization)
        4. Save updated model
        """
        try:
            # Get real interactions
            real_interactions_df, interaction_count = self.get_real_interactions()
            
            if interaction_count < 10:
                return {
                    "success": False,
                    "message": f"Need at least 10 interactions. Found: {interaction_count}",
                    "interaction_count": interaction_count
                }
            
            # Retrain model
            print(f"\n🔄 Retraining CF model with {interaction_count} real interactions...")
            print("   Step 1: Interaction → Numeric Rating ✓")
            print("   Step 2: Building User × Product Matrix...")
            self.model.build_user_item_matrix(real_interactions_df)
            print("   Step 3: Applying Matrix Factorization (SVD)...")
            self.model.train(real_interactions_df)
            print("   Step 4: Saving model...")
            self.model.save_model(self.model_path)
            print("   ✓ Model retrained successfully!")
            
            stats = self.model.get_model_stats()
            return {
                "success": True,
                "message": "Model retrained with real interactions",
                "interaction_count": interaction_count,
                "stats": stats
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error retraining: {str(e)}",
                "error": str(e)
            }


if __name__ == "__main__":
    # Initialize integration (suppress output)
    cf = CFIntegration()
    
    # Suppress stdout/stderr during initialization
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = SuppressPrint()
    sys.stderr = SuppressPrint()
    
    # Check if product and user counts were passed as arguments
    n_products = None
    n_users = None
    for arg in sys.argv:
        if arg.startswith('n_products='):
            try:
                n_products = int(arg.split('=')[1])
            except:
                pass
        elif arg.startswith('n_users='):
            try:
                n_users = int(arg.split('=')[1])
            except:
                pass
    
    try:
        init_success = cf.initialize(n_products=n_products, n_users=n_users)
    except Exception as init_error:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        print(json.dumps({"error": f"Initialization error: {str(init_error)}"}))
        sys.exit(1)
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
    
    if not init_success:
        print(json.dumps({"error": "Failed to initialize model"}))
        sys.exit(1)
    
    # Get command from arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        if command == "recommend":
            # Command: python cf_integration.py recommend user_1 5
            user_id = sys.argv[2] if len(sys.argv) > 2 else "user_1"
            num_recs = int(sys.argv[3]) if len(sys.argv) > 3 else 5
            
            recommendations = cf.get_recommendations(user_id, num_recs)
            
            result = {
                "success": True,
                "user_id": user_id,
                "recommendations": [
                    {
                        "product_id": product_id,
                        "predicted_rating": float(rating)
                    }
                    for product_id, rating in recommendations
                ]
            }
            print(json.dumps(result))
        
        elif command == "stats":
            # Command: python cf_integration.py stats
            stats = cf.get_model_stats()
            result = {
                "success": True,
                "stats": stats
            }
            print(json.dumps(result))
        
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
            sys.exit(1)
    
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
