# 📱 Frontend Integration - Interaction Tracking

## What's Now Tracking Automatically

Your frontend is now sending interaction data to the backend. Here's what happens:

### ✅ 1. **Product View** - When User Clicks Product
**Where**: Shop.tsx
```jsx
<Link 
  to={`/product/${p._id}`} 
  onClick={() => trackProductView(p._id)}
>
  Product Name
</Link>
```

**What Happens**:
```
User clicks product → 
  Frontend calls: POST /product/[ID]/view
    → Backend saves to MongoDB
      → interactions collection gets: 
        { action: "view", weight: 1 }
```

---

### ✅ 2. **Cart Addition** - When User Clicks "Add to Cart"
**Where**: Shop.tsx
```jsx
<button onClick={() => {
  trackCartAdd(p._id);  // ← Track before adding
  cartContext.addToCart(...);
}}>
  Add to cart
</button>
```

**What Happens**:
```
User clicks "Add to cart" →
  Frontend calls: POST /product/[ID]/cart
    → Backend saves to MongoDB
      → interactions collection gets: 
        { action: "cart", weight: 2 }
```

---

### ✅ 3. **Purchase** - When User Completes Checkout
**Where**: BuyNow.tsx
```jsx
const handlePlaceOrder = async () => {
  // ... create order ...
  
  // Track purchase for each item
  for (const item of cartItems) {
    await trackPurchase(item._id);
  }
  
  navigate('/order-confirmation');
}
```

**What Happens**:
```
User completes payment →
  Frontend calls: POST /product/[ID]/purchase
    → Backend saves to MongoDB
      → interactions collection gets: 
        { action: "purchase", weight: 5, rating: null }
```

---

## How to Test

### **Step 1: User Not Logged In? Add User ID to localStorage**

Open browser console and run:
```javascript
// Simulate logged-in user (temporary, for testing)
localStorage.setItem('user', JSON.stringify({
  _id: '655abcdef1234567890abcd',
  name: 'Test User'
}))
```

### **Step 2: Click a Product in Shop**

**Expected Console Output**:
```
✓ Product view tracked: 655xyz123
```

Check MongoDB:
```bash
db.interactions.find({ action: "view" }).pretty()
# Should show your user ID and product ID
```

### **Step 3: Add Product to Cart**

**Expected Console Output**:
```
✓ Cart addition tracked: 655xyz123
```

Check MongoDB:
```bash
db.interactions.find({ action: "cart" }).pretty()
```

### **Step 4: Complete a Purchase**

Go through checkout with real user credentials.

**Expected Console Output**:
```
✓ Purchase tracked: 655xyz123 Rating: None
✓ Purchase tracked: 655abc789 Rating: None
```

Check MongoDB:
```bash
db.interactions.find({ action: "purchase" }).pretty()

# Should show 2 interactions with weight: 5
```

---

## Check All Interactions in Database

```bash
# Open MongoDB Compass or mongosh
use buyonix
db.interactions.find().pretty()

# Should show:
[
  { userId: "...", productId: "...", action: "view", weight: 1, timestamp: ... },
  { userId: "...", productId: "...", action: "cart", weight: 2, timestamp: ... },
  { userId: "...", productId: "...", action: "purchase", weight: 5, timestamp: ... }
]
```

---

## Summary of Frontend Changes

| File | Change | Purpose |
|------|--------|---------|
| [Frontend/src/utils/interactionTracking.ts](Frontend/src/utils/interactionTracking.ts) | **New File** | Utility functions to track interactions |
| [Frontend/src/pages/Shop.tsx](Frontend/src/pages/Shop.tsx) | Import + Add onClick handlers | Track views and cart additions |
| [Frontend/src/pages/BuyNow.tsx](Frontend/src/pages/BuyNow.tsx) | Import + Add purchase tracking | Track purchases after payment |

---

## Complete Data Flow Now

```
┌─────────────────────────────────────────┐
│  USER PERFORMS ACTION IN FRONTEND       │
├─────────────────────────────────────────┤
│  1. Clicks product → trackProductView() │
│  2. Adds to cart → trackCartAdd()       │
│  3. Completes order → trackPurchase()   │
└──────────────────┬──────────────────────┘
                   │ 
                   ↓
┌─────────────────────────────────────────┐
│  BACKEND RECEIVES POST REQUEST          │
├─────────────────────────────────────────┤
│  POST /product/[ID]/view                │
│  POST /product/[ID]/cart                │
│  POST /product/[ID]/purchase            │
└──────────────────┬──────────────────────┘
                   │ 
                   ↓
┌─────────────────────────────────────────┐
│  SAVES TO MONGODB                       │
├─────────────────────────────────────────┤
│  db.interactions.insertOne({            │
│    userId, productId, action, weight    │
│  })                                     │
└──────────────────┬──────────────────────┘
                   │ 
                   ↓
┌─────────────────────────────────────────┐
│  USER RETRAINS MODEL                    │
├─────────────────────────────────────────┤
│  POST /product/ai/retrain               │
└──────────────────┬──────────────────────┘
                   │ 
                   ↓
┌─────────────────────────────────────────┐
│  PYTHON READS REAL INTERACTIONS         │
├─────────────────────────────────────────┤
│  get_real_interactions()                │
│  Reads from MongoDB interactions        │
└──────────────────┬──────────────────────┘
                   │ 
                   ↓
┌─────────────────────────────────────────┐
│  TRAINS CF MODEL ON REAL DATA           │
├─────────────────────────────────────────┤
│  Builds user-item matrix                │
│  Applies SVD matrix factorization       │
│  Saves model.pkl                        │
└──────────────────┬──────────────────────┘
                   │ 
                   ↓
┌─────────────────────────────────────────┐
│  USER GETS RECOMMENDATIONS              │
├─────────────────────────────────────────┤
│  GET /product/related/[userID]          │
│  Frontend displays ⭐ predicted ratings  │
└─────────────────────────────────────────┘
```

---

## Next: Test the Full Flow

1. ✅ **Frontend tracking implemented** - Clicks now tracked
2. ✅ **Data saved to MongoDB** - Check interactions collection
3. ⏭️ **Next: Retrain model on real data**
   ```javascript
   fetch('http://localhost:5000/product/ai/retrain', { method: 'POST' })
   ```
4. ⏭️ **Get recommendations based on real behavior**
   ```javascript
   fetch('http://localhost:5000/product/related/USER_ID')
   ```

The system now learns from **real user behavior** instead of synthetic data! 🎉
