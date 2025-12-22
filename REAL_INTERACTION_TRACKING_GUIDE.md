# 🎯 Real Interaction Tracking - Testing Guide

## What Was Implemented

Your system now tracks **real user interactions** instead of synthetic data:

- ✅ **Product Views** - When user views a product
- ✅ **Cart Additions** - When user adds to cart (weight: 2)
- ✅ **Saves/Likes** - When user saves a product (weight: 3)  
- ✅ **Purchases** - When user purchases with rating (weight: 5 + rating*2)

These interactions are stored in MongoDB and used to **train the CF model** automatically.

---

## How to Test

### Step 1: Start the Backend
```bash
npm start
```

Wait for: `✓ CF Model initialized successfully`

### Step 2: Track Some Interactions

Open browser console and run:

```javascript
const userId = "6551234567890abcdef00001";  // Replace with real user ID
const productId = "6551234567890abcdef00002";  // Replace with real product ID

// Track a product view (weight: 1)
fetch(`http://localhost:5000/product/${productId}/view`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId })
})
.then(r => r.json())
.then(d => console.log('✓ View tracked:', d))

// Track cart addition (weight: 2)
setTimeout(() => {
  fetch(`http://localhost:5000/product/${productId}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  .then(r => r.json())
  .then(d => console.log('✓ Cart tracked:', d))
}, 500)

// Track purchase with rating (weight: 5 + 4*2 = 13)
setTimeout(() => {
  fetch(`http://localhost:5000/product/${productId}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, rating: 4 })
  })
  .then(r => r.json())
  .then(d => console.log('✓ Purchase tracked:', d))
}, 1000)
```

### Step 3: Check Interaction Summary

```javascript
fetch('http://localhost:5000/product/interactions/summary')
  .then(r => r.json())
  .then(d => {
    console.log('Total interactions:', d.summary.totalInteractions);
    console.log('Unique users:', d.summary.uniqueUsers);
    console.log('Unique products:', d.summary.uniqueProducts);
    console.log('By action:', d.summary.byAction);
  })
```

Expected output:
```javascript
Total interactions: 3
Unique users: 1
Unique products: 1
By action: [
  { _id: 'purchase', count: 1, avgWeight: 13 },
  { _id: 'cart', count: 1, avgWeight: 2 },
  { _id: 'view', count: 1, avgWeight: 1 }
]
```

### Step 4: Retrain Model with Real Data

After tracking at least 10 interactions:

```javascript
// Retrain model (uses real interactions instead of synthetic)
fetch('http://localhost:5000/product/ai/retrain', { method: 'POST' })
  .then(r => r.json())
  .then(d => {
    console.log('✓ Model retrained');
    console.log('Training data source:', d.stats.training_data || 'real interactions');
  })
```

### Step 5: Get Recommendations Based on Real Data

```javascript
// Get recommendations for a user (now based on real interactions!)
fetch('http://localhost:5000/product/recommendations/1')
  .then(r => r.json())
  .then(d => {
    console.log('Recommendations:');
    console.log(d.recommendations);
  })
```

---

## Weight System (CF Algorithm)

| Action | Weight | Meaning |
|--------|--------|---------|
| **View** | 1 | User saw the product |
| **Cart** | 2 | User added to cart (strong interest) |
| **Save** | 3 | User bookmarked/liked (very interested) |
| **Purchase** | 5 + rating*2 | User bought it (strongest signal) |

Example:
- View + Cart + Purchase with 5 rating = 1 + 2 + 5 + 10 = **18 interaction strength**

---

## For Your FYP Demonstration

### What to Show Your Examiner

1. **Real Interactions Being Tracked**
   - Open MongoDB and show `interactions` collection populated with real data
   - Show different action types: view, cart, save, purchase

2. **Model Training on Real Data**
   - Run `/product/ai/retrain`
   - Show it reads from interactions instead of synthetic data
   - Terminal shows: `✓ CF Model retrained successfully`

3. **Personalized Recommendations**
   - User X views products A, B, C
   - User X purchases product A with 5-star rating
   - System recommends products similar to A to user X
   - Show in `/product/recommendations/user_X`

4. **Academic Explanation**
   ```
   "The collaborative filtering model uses real user interactions 
   (views, cart additions, saves, purchases, ratings) to build a 
   user-item interaction matrix. It then applies SVD matrix 
   factorization to find latent factors representing user 
   preferences and product characteristics. Recommendations are 
   made by predicting ratings for unseen products using these 
   latent factors."
   ```

---

## Troubleshooting

### Q: Recommendations still empty after retraining?
**A:** You need at least 10 real interactions. Check:
```javascript
fetch('http://localhost:5000/product/interactions/summary')
  .then(r => r.json())
  .then(d => console.log(d.summary.totalInteractions))
```

### Q: Model still using synthetic data?
**A:** If < 10 real interactions, it falls back to synthetic. Recommendations will still work, but show that you understand the hybrid approach.

### Q: How do I track interactions from the frontend?
**A:** When users perform actions on the website:
```javascript
// In Frontend component (e.g., ProductPage.tsx)
const trackView = async (productId) => {
  await fetch(`/product/${productId}/view`, {
    method: 'POST',
    body: JSON.stringify({ userId: currentUser._id })
  })
}

const trackCartAdd = async (productId) => {
  await fetch(`/product/${productId}/cart`, {
    method: 'POST',
    body: JSON.stringify({ userId: currentUser._id })
  })
}
```

---

## MongoDB Collections

### interactions
```json
{
  "_id": ObjectId,
  "userId": ObjectId("user_id"),
  "productId": ObjectId("product_id"),
  "action": "view|cart|save|purchase",
  "rating": 1-5,
  "weight": number,
  "timestamp": Date
}
```

Query to see all interactions:
```bash
db.interactions.find().pretty()

# By user
db.interactions.find({ userId: ObjectId("...") })

# By action
db.interactions.find({ action: "purchase" })

# Aggregation
db.interactions.aggregate([
  { $group: { _id: "$action", count: { $sum: 1 } } }
])
```

---

## Summary for FYP

✅ **Real interaction tracking implemented**
✅ **Model trains on real data (10+ interactions) or synthetic data fallback**
✅ **Automatic recommendations based on user behavior**
✅ **Weight system rewards purchases > saves > cart > views**
✅ **Ready for examiner demo**

You can now show your examiner a fully functional recommendation system that learns from real user behavior! 🎉
