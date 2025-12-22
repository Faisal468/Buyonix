# VISUAL GUIDE & EXAMPLES

## 1. How Model Retraining Works

### Console Output - Server Startup

**After Adding 3 New Users (5 → 8)**:

```
🤖 Initializing Collaborative Filtering model...
  ℹ️  Data changed (Users: 5 → 8, Products: 45 → 45), retraining model...
  Generating Synthetic Data:
     • Users: 8
     • Products: 45
     • Interactions: 3000
  Generated 2800 unique interactions
  Building User-Item Matrix...
  Matrix shape: (8, 45) (Users × Products)
  Sparsity: 92.3% (% of empty cells)
  Training Collaborative Filtering Model (SVD)...
     • Using 10 latent factors
     • Factorizing user-item matrix...
     • Explained variance: 75.2%
     • This means the model captures 75.2% of rating patterns
  Model training complete!
✓ CF Model retrained successfully
  Users: 8, Products: 45
```

---

## 2. Checkout Page - Before & After

### BEFORE (Random Products):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECKOUT PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cart Items:
├─ Blue T-Shirt (Size M)
│  Qty: 1 | Price: $29.99 | Total: $29.99
└─ Black Jeans
   Qty: 1 | Price: $59.99 | Total: $59.99

Order Summary:
Subtotal: $89.98
Shipping: $10.00
Total: $99.98

Product Related Recommendations     ← JUST RANDOM PRODUCTS
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Random 1    │ Random 2    │ Random 3    │ Random 4    │
│ $45.99      │ $89.99      │ $25.50      │ $199.99     │
│             │             │             │             │
│  Add to Cart│  Add to Cart│  Add to Cart│  Add to Cart│
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### AFTER (AI Recommendations):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECKOUT PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cart Items:
├─ Blue T-Shirt (Size M)
│  Qty: 1 | Price: $29.99 | Total: $29.99
└─ Black Jeans
   Qty: 1 | Price: $59.99 | Total: $59.99

Order Summary:
Subtotal: $89.98
Shipping: $10.00
Total: $99.98

🤖 AI-Powered Recommendations [Based on your history]   ← AI POWERED!
┌────────────────┬────────────────┬────────────────┬────────────────┐
│ White T-Shirt  │ Running Shoes   │ Winter Jacket  │ Denim Belt     │
│ ⭐ 4.5         │ ⭐ 4.7         │ ⭐ 4.3         │ ⭐ 4.2         │
│                │                │                │                │
│ Based on your  │ Based on your  │ Based on your  │ Based on your  │
│ shopping       │ shopping       │ shopping       │ shopping       │
│ history        │ history        │ history        │ history        │
│                │                │                │                │
│ $24.99         │ $89.99         │ $129.99        │ $19.99         │
│                │                │                │                │
│ Add to Cart    │ Add to Cart    │ Add to Cart    │ Add to Cart    │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

---

## 3. API Response Example

### Request:
```javascript
GET http://localhost:5000/product/related/user_1?num=4

Headers:
  Content-Type: application/json
```

### Response:
```json
{
  "success": true,
  "count": 4,
  "relatedProducts": [
    {
      "_id": "6547abc123def456",
      "name": "White T-Shirt",
      "price": 24.99,
      "originalPrice": 29.99,
      "discount": 16,
      "images": [
        "https://cdn.example.com/shirt-white-1.jpg",
        "https://cdn.example.com/shirt-white-2.jpg"
      ],
      "rating": 4.5,
      "reviewCount": 127,
      "category": "Clothing > Tops",
      "sellerId": {
        "_id": "seller_123",
        "storeName": "Fashion Hub",
        "businessName": "Fashion Hub Ltd"
      },
      "stock": 45,
      "status": "active",
      "predictedRating": 4.5,
      "reason": "Based on your shopping history"
    },
    {
      "_id": "6547def456abc789",
      "name": "Running Shoes",
      "price": 89.99,
      "originalPrice": 119.99,
      "discount": 25,
      "images": [
        "https://cdn.example.com/shoes-run-1.jpg"
      ],
      "rating": 4.7,
      "reviewCount": 234,
      "category": "Footwear > Sports",
      "sellerId": {
        "_id": "seller_456",
        "storeName": "Sports Central",
        "businessName": "Sports Central Inc"
      },
      "stock": 32,
      "status": "active",
      "predictedRating": 4.7,
      "reason": "Based on your shopping history"
    },
    {
      "_id": "6547ghi789jkl012",
      "name": "Winter Jacket",
      "price": 129.99,
      "originalPrice": 179.99,
      "discount": 28,
      "images": [
        "https://cdn.example.com/jacket-winter-1.jpg"
      ],
      "rating": 4.3,
      "reviewCount": 89,
      "category": "Clothing > Outerwear",
      "sellerId": {
        "_id": "seller_789",
        "storeName": "Warm Wear Co",
        "businessName": "Warm Wear Co Ltd"
      },
      "stock": 18,
      "status": "active",
      "predictedRating": 4.3,
      "reason": "Based on your shopping history"
    },
    {
      "_id": "6547mno456pqr789",
      "name": "Denim Belt",
      "price": 19.99,
      "originalPrice": 24.99,
      "discount": 20,
      "images": [
        "https://cdn.example.com/belt-denim-1.jpg"
      ],
      "rating": 4.2,
      "reviewCount": 56,
      "category": "Accessories > Belts",
      "sellerId": {
        "_id": "seller_321",
        "storeName": "Accessories Plus",
        "businessName": "Accessories Plus Ltd"
      },
      "stock": 67,
      "status": "active",
      "predictedRating": 4.2,
      "reason": "Based on your shopping history"
    }
  ],
  "source": "collaborative_filtering_ai"
}
```

---

## 4. Model Stats Endpoint Response

### Request:
```
GET http://localhost:5000/product/ai/model-stats
```

### Response (Model Updated):
```json
{
  "success": true,
  "model": {
    "type": "Collaborative Filtering (SVD)",
    "status": "ready",
    "n_users": 8,
    "n_products": 45,
    "n_factors": 10,
    "total_interactions": 2800,
    "explained_variance": 0.752,
    "training_date": "2025-12-21T14:35:22.123456",
    "description": "Collaborative Filtering using Matrix Factorization (SVD)"
  }
}
```

### Response (Before Update):
```json
{
  "success": true,
  "model": {
    "type": "Collaborative Filtering (SVD)",
    "status": "ready",
    "n_users": 5,        ← Old value
    "n_products": 45,
    "n_factors": 10,
    "total_interactions": 1500,
    "explained_variance": 0.748,
    "training_date": "2025-12-20T10:15:22.654321",
    "description": "Collaborative Filtering using Matrix Factorization (SVD)"
  }
}
```

---

## 5. Frontend Component Rendering

### React State:
```typescript
const [relatedProducts, setRelatedProducts] = useState<Product[]>([
  {
    _id: "6547abc123",
    name: "White T-Shirt",
    price: 24.99,
    images: ["url1", "url2"],
    rating: 4.5,
    discount: 16,
    predictedRating: 4.5,
    reason: "Based on your shopping history"
  },
  // ... 3 more products
]);
```

### Rendered HTML:
```html
<div class="mb-8">
  <!-- Header -->
  <div class="flex items-center gap-2 mb-6">
    <h2 class="text-2xl font-bold text-gray-900">
      🤖 AI-Powered Recommendations
    </h2>
    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
      Based on your history
    </span>
  </div>

  <!-- Product Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
    
    <!-- Product Card 1 -->
    <div class="bg-white rounded-lg shadow hover:shadow-lg">
      <div class="h-48 bg-gray-100 relative">
        <!-- Discount Badge -->
        <div class="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded">
          -16%
        </div>
        <!-- Predicted Rating Badge (NEW!) -->
        <div class="absolute top-3 left-3 bg-blue-500 text-white px-2 py-1 rounded">
          ⭐ 4.5
        </div>
        <!-- Product Image -->
        <img src="shirt-white.jpg" alt="White T-Shirt" 
             class="w-full h-full object-cover">
      </div>

      <div class="p-4">
        <h3 class="font-semibold text-gray-900 text-sm">White T-Shirt</h3>
        
        <!-- Recommendation Reason (NEW!) -->
        <p class="text-xs text-blue-600 mb-2 italic">
          Based on your shopping history
        </p>

        <!-- Rating -->
        <div class="flex items-center gap-1 mb-2">
          <span class="text-yellow-400">★</span>
          <span class="text-xs text-gray-600">4.5</span>
        </div>

        <!-- Price -->
        <div class="mb-3">
          <p class="text-teal-600 font-bold text-lg">$ 24.99</p>
        </div>

        <!-- Add to Cart Button -->
        <button class="w-full bg-teal-600 text-white py-2 rounded-lg">
          Add to cart
        </button>
      </div>
    </div>

    <!-- Product Card 2, 3, 4 ... -->

  </div>
</div>
```

---

## 6. User Interaction Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Adds Item to Cart                               │
│    └─ Button: "Add to Cart"                             │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Navigate to Checkout Page                            │
│    └─ Route: /checkout                                  │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Checkout Page Mounts                                 │
│    └─ useEffect calls fetchRelatedProducts()            │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Frontend Calls API                                   │
│    GET /product/related/user_1?num=4                    │
│    └─ Sends user ID and desired count                   │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Backend Processing                                   │
│    ├─ Get CF model recommendations                      │
│    ├─ Predict ratings for top products                  │
│    ├─ Fetch product details from DB                     │
│    └─ Add fallback if needed                            │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Return JSON Response                                 │
│    {                                                    │
│      relatedProducts: [ ... ],                          │
│      source: "collaborative_filtering_ai"               │
│    }                                                    │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Frontend Renders                                     │
│    ├─ Title: "🤖 AI-Powered Recommendations"            │
│    ├─ Badge: "Based on your history"                    │
│    ├─ Product Cards with:                               │
│    │  ├─ ⭐ Predicted Rating                            │
│    │  ├─ Product Image & Price                          │
│    │  ├─ Recommendation Reason                          │
│    │  └─ [Add to Cart] Button                           │
│    └─ 4 products in responsive grid                     │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 8. User Interaction                                     │
│    ├─ Click: Add related product to cart                │
│    ├─ Click: View product details                       │
│    └─ Continue shopping or checkout                     │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Database Schema Affected

### Users Collection (Read):
```javascript
db.users.countDocuments({})
// Returns: 8 (or whatever actual count is)
// Used by: cfRecommender.getUserCount()
```

### Products Collection (Read):
```javascript
db.products.countDocuments({ status: 'active' })
// Returns: 45 (or actual count)
// Used by: cfRecommender.getProductCount()
```

### Model File (Read/Write):
```
Backend/ai_models/cf_model.pkl
├─ size: ~50KB when saved
├─ contains:
│  ├─ SVD model object
│  ├─ user_item_matrix
│  ├─ user_ids list
│  ├─ product_ids list
│  └─ training metadata
└─ auto-deleted when retraining
```

---

## 8. Performance Timeline

### Scenario: Adding 3 New Users

```
Time: 0ms
Event: User signup completes (3 new users added)

Time: 5ms  
Event: Order created (triggers model check)

Time: 10ms
Event: Backend calls cfRecommender.getModelStats()
       Detects: 5 users (old) vs 8 users (new)

Time: 15ms
Event: Model file deleted

Time: 20ms
Event: Python script starts retraining
       - Generate synthetic data: 200ms
       - Build matrix: 50ms
       - Train SVD: 1800ms
       - Save model: 150ms

Time: 2220ms
Event: Model retraining complete
       New model saved to disk

Time: 2225ms
Event: Frontend can now get recommendations
```

---

## 9. Error Scenarios

### Scenario 1: AI Model Fails
```
Frontend Request:
GET /product/related/user_1

Backend Flow:
Try: Get CF recommendations → FAIL (model error)
Catch: Fetch popular products instead
Return: Recommendations with source: "popularity_based"

User Sees:
✓ Still shows products (not empty)
✓ Products are popular items
✓ No error message (graceful fallback)
```

### Scenario 2: Wrong User ID
```
Frontend Request:
GET /product/related/xyz_invalid

Backend Flow:
Try: Get recommendations for "xyz_invalid"
Result: Model returns [] (no recommendations for unknown user)
Catch: Fetch fallback products
Return: Popular products

User Sees:
✓ Popular products instead
✓ Still functional
```

---

**Visual Guide Complete!**
