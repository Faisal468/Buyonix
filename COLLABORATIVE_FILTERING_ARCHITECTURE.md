# 🤖 Collaborative Filtering Architecture - Complete Guide

## Overview

This document explains the **CORRECT** architecture for Collaborative Filtering (CF) using Matrix Factorization (SVD) as implemented in this system.

---

## 📊 The Complete Flow

### Step 1: Interaction → Numeric Rating

**This converts implicit feedback into numbers.**

When users interact with products, we convert their actions to numeric ratings:

| Action | Weight | Meaning |
|--------|--------|---------|
| `view` | **1** | User viewed the product |
| `cart` | **2** | User added product to cart |
| `purchase` | **5** | User purchased the product |

**Example:**
```
User U1 viewed Product P2 → Rating: 1
User U1 added Product P2 to cart → Rating: 2 (updates previous)
User U1 purchased Product P2 → Rating: 5 (updates previous)
```

**Location:** `Backend/models/interaction.js`
- Each interaction is saved with `action` and `weight`
- Weight IS the rating we use for CF

**Status:** ✅ **IMPLEMENTED**
- Frontend tracks interactions: `trackCartAdd()`, `trackPurchase()`
- Backend saves to MongoDB `interactions` collection

---

### Step 2: Build User × Product Matrix (CF Input)

**This creates the matrix that CF needs.**

We aggregate all interactions into a matrix:

```
        P1    P2    P3    P4    ...
U1      0     5     1     0     ...
U2      2     0     0     5     ...
U3      1     0     2     0     ...
...
```

**Matrix Structure:**
- **Rows:** Users (user IDs from MongoDB)
- **Columns:** Products (product IDs from MongoDB)
- **Values:** Ratings (1-5) or 0 if no interaction

**Aggregation Rule:**
- If user has multiple interactions with same product, take **maximum weight**
- Example: User viewed (1) then purchased (5) → Use 5

**Location:** `Backend/ai_models/cf_integration.py`
- `get_real_interactions()`: Reads from MongoDB
- Groups by `(user_id, product_id)` and takes max rating
- Returns DataFrame with columns: `user_id`, `product_id`, `rating`

**Status:** ✅ **IMPLEMENTED**
- Reads real interactions from MongoDB
- Converts to DataFrame format
- Aggregates multiple interactions correctly

---

### Step 3: Apply AI Model - Matrix Factorization (SVD)

**💥 THIS IS THE AI PART 💥**

We use **TruncatedSVD** (Singular Value Decomposition) to factorize the matrix:

```
R ≈ U × Vᵀ
```

**Where:**
- **R** = User × Product matrix (from Step 2)
- **U** = User latent features (hidden patterns in user preferences)
- **V** = Product latent features (hidden patterns in products)
- **Σ** = Importance of each latent factor

**What the Model Learns:**
- **User latent features:** Hidden patterns in what users like
  - Example: User prefers "tech gadgets" and "affordable items"
- **Product latent features:** Hidden patterns in products
  - Example: Product is "tech gadget" and "affordable"

**Training Process:**
1. Takes User × Product matrix
2. Decomposes into U, Σ, V matrices
3. Learns latent features automatically
4. Can predict ratings for unseen user-product pairs

**Location:** `Backend/ai_models/collaborative_filtering.py`
- `CollaborativeFilteringModel.train()`: Applies SVD
- Uses `sklearn.decomposition.TruncatedSVD`
- Default: 10 latent factors

**Status:** ✅ **IMPLEMENTED**
- SVD training works correctly
- Model learns latent features
- Can predict ratings

---

### Step 4: Generate Recommendations

**Predict ratings for all products and recommend top N.**

**Process:**
1. For a given user, predict rating for ALL products
2. Sort by predicted rating (descending)
3. Return top N products

**Prediction Formula:**
```
predicted_rating = U[user] × V[product]ᵀ
```

**Location:** `Backend/ai_models/collaborative_filtering.py`
- `recommend_products()`: Generates recommendations
- `predict_rating()`: Predicts rating for user-product pair

**Status:** ✅ **IMPLEMENTED**
- Recommendations generated correctly
- Returns products with predicted ratings

---

## 🔄 Complete Data Flow

```
1. User Action (Frontend)
   ↓
   trackCartAdd(productId) or trackPurchase(productId)
   ↓
2. Save Interaction (Backend)
   ↓
   POST /product/:id/cart → MongoDB interactions collection
   { userId, productId, action: "cart", weight: 2 }
   ↓
3. Build Matrix (Python CF Model)
   ↓
   Read interactions → Aggregate → User × Product matrix
   ↓
4. Train SVD Model (Python CF Model)
   ↓
   Matrix Factorization → Learn latent features
   ↓
5. Generate Recommendations (Python CF Model)
   ↓
   Predict ratings → Sort → Top N products
   ↓
6. Return to Frontend (Backend API)
   ↓
   GET /product/recommendations/:userId → Return products
```

---

## 📁 File Structure

### Backend Files

**Interaction Tracking:**
- `Backend/models/interaction.js` - Interaction schema
- `Backend/routes/product.js` - API endpoints for tracking
  - `POST /product/:id/view` - Track view (weight: 1)
  - `POST /product/:id/cart` - Track cart (weight: 2)
  - `POST /product/:id/purchase` - Track purchase (weight: 5)

**CF Model:**
- `Backend/ai_models/collaborative_filtering.py` - Core CF model (SVD)
- `Backend/ai_models/cf_integration.py` - Integration with MongoDB
- `Backend/utils/cfRecommender.js` - Node.js wrapper

**API:**
- `Backend/routes/product.js` - Recommendation endpoint
  - `GET /product/recommendations/:userId` - Get recommendations

### Frontend Files

**Tracking:**
- `Frontend/src/utils/interactionTracking.ts` - Tracking functions
- `Frontend/src/pages/*.tsx` - All pages with "Add to Cart" buttons
- `Frontend/src/pages/BuyNow.tsx` - Purchase tracking

---

## 🧪 Testing the System

### 1. Generate Interactions

```javascript
// In browser console or via UI:
// 1. Add products to cart (weight: 2)
// 2. Complete checkout (weight: 5)
```

### 2. Check MongoDB

```javascript
// In MongoDB Compass:
db.interactions.find().pretty()

// Should see:
{
  userId: ObjectId("..."),
  productId: ObjectId("..."),
  action: "cart",
  weight: 2
}
```

### 3. Retrain Model

```bash
# Retrain with real interactions
curl -X POST http://localhost:5000/product/ai/retrain
```

### 4. Get Recommendations

```bash
# Get recommendations for user
curl http://localhost:5000/product/recommendations/USER_ID?num=5
```

---

## ✅ What's Working

1. ✅ **Interaction Tracking:** View, Cart, Purchase tracked correctly
2. ✅ **Weight Assignment:** view=1, cart=2, purchase=5
3. ✅ **Matrix Building:** Real interactions → User × Product matrix
4. ✅ **SVD Training:** Matrix Factorization working
5. ✅ **Recommendations:** Generated correctly

---

## 🎯 Key Points

1. **Weights ARE Ratings:** The `weight` field in interactions IS the rating used for CF
2. **Real Data:** Model uses REAL user interactions from MongoDB
3. **Matrix Factorization:** SVD learns latent features automatically
4. **No Hardcoding:** Model generalizes to unseen users/products
5. **AI Learning:** Model learns patterns, not rules

---

## 📚 References

- **SVD:** https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.TruncatedSVD.html
- **Matrix Factorization:** https://en.wikipedia.org/wiki/Matrix_factorization_(recommender_systems)
- **Collaborative Filtering:** https://en.wikipedia.org/wiki/Collaborative_filtering

---

**Last Updated:** 2025-12-21
**Status:** ✅ Fully Implemented

