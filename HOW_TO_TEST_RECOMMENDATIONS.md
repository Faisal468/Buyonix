# 🧪 How to Test Recommendations

## Understanding Your Results

### ✅ Retrain Result (SUCCESS!)

```json
{
  "success": true,
  "message": "✓ Model retrained successfully",
  "stats": {
    "n_users": 10,           // 10 users in the model
    "n_products": 47,        // 47 products in the model
    "total_interactions": 470, // 470 interactions used for training
    "explained_variance": 0.9999... // 99.99% - Excellent!
  }
}
```

**What this means:**
- ✅ Model trained successfully
- ✅ 470 interactions from real users
- ✅ Model learned patterns from 10 users and 47 products
- ✅ 99.99% explained variance = Model captures almost all patterns

---

### ❌ Recommendations Result (EMPTY)

```json
{
  "success": true,
  "count": 0,
  "recommendations": [],
  "source": "collaborative_filtering_ai"
}
```

**Why empty?**
- ❌ `"YOUR_U"` is NOT a real user ID
- ❌ The model doesn't know this user
- ❌ Need to use a **real MongoDB ObjectId** from your interactions

---

## 🔍 How to Get a Real User ID

### Method 1: Check MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Go to `interactions` collection
4. Look at any document
5. Copy the `userId` field (it's a MongoDB ObjectId)

**Example:**
```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("65d8c12e9f1a2b3c4d5e6f78"),  // ← Copy this!
  "productId": ObjectId("..."),
  "action": "cart",
  "weight": 2
}
```

### Method 2: Use API to Get User IDs

```bash
# Get all unique user IDs from interactions
curl http://localhost:5000/product/interactions/summary
```

This will show you:
- Total interactions
- Unique users
- Unique products

### Method 3: Check Browser Console

If you're logged in, check localStorage:

```javascript
// In browser console:
const userInfo = JSON.parse(localStorage.getItem('userInfo'));
console.log(userInfo.id); // This is your user ID
```

---

## ✅ Correct Way to Test

### Step 1: Get a Real User ID

```bash
# Option A: Get interaction summary
curl http://localhost:5000/product/interactions/summary

# Response will show unique users
```

### Step 2: Use Real User ID

```bash
# Replace USER_ID with actual MongoDB ObjectId
curl http://localhost:5000/product/recommendations/65d8c12e9f1a2b3c4d5e6f78?num=5
```

**Example with real ID:**
```bash
curl http://localhost:5000/product/recommendations/65d8c12e9f1a2b3c4d5e6f78?num=5
```

---

## 🎯 Expected Results

### If User Has Interactions:

```json
{
  "success": true,
  "count": 5,
  "recommendations": [
    {
      "_id": "...",
      "name": "Product Name",
      "price": 99.99,
      "predictedRating": 4.5,
      "reason": "Personalized recommendation based on user behavior"
    },
    ...
  ],
  "source": "collaborative_filtering_ai"
}
```

### If User Has NO Interactions (Cold Start):

```json
{
  "success": true,
  "count": 0,
  "recommendations": [],
  "source": "collaborative_filtering_ai"
}
```

**Why?** The model can't recommend for users it hasn't seen before.

**Solution:** The frontend should fallback to popular products.

---

## 🔧 Quick Test Script

Create a file `test_recommendations.js`:

```javascript
const axios = require('axios');

async function testRecommendations() {
  try {
    // Step 1: Get interaction summary
    const summary = await axios.get('http://localhost:5000/product/interactions/summary');
    console.log('📊 Interaction Summary:');
    console.log(`   Users: ${summary.data.summary.uniqueUsers}`);
    console.log(`   Products: ${summary.data.summary.uniqueProducts}`);
    console.log(`   Total Interactions: ${summary.data.summary.totalInteractions}`);
    
    // Step 2: Get a user ID (if available)
    // You'll need to get this from MongoDB or your database
    const userId = 'YOUR_REAL_USER_ID_HERE'; // Replace with real ID
    
    // Step 3: Get recommendations
    const recs = await axios.get(`http://localhost:5000/product/recommendations/${userId}?num=5`);
    console.log('\n🎯 Recommendations:');
    console.log(`   Count: ${recs.data.count}`);
    recs.data.recommendations.forEach((rec, i) => {
      console.log(`   ${i+1}. ${rec.name} (Rating: ${rec.predictedRating})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRecommendations();
```

---

## 📝 Summary

1. **Retrain worked!** ✅ Model has 470 interactions from 10 users
2. **Recommendations empty** ❌ Because "YOUR_U" is not a real user ID
3. **Solution:** Use a real MongoDB ObjectId from your interactions collection
4. **Get User ID:** Check MongoDB Compass or use `/product/interactions/summary` endpoint

---

## 🚀 Next Steps

1. Get a real user ID from MongoDB
2. Test with that user ID
3. If still empty, that user might not have enough interactions
4. Try a different user ID that has more interactions

