# 🎯 Recommendations System - Complete Setup Guide

## ✅ What's Now Working

Your recommendations system is now fully integrated with MongoDB Atlas interactions!

### How It Works:

1. **User Interactions → MongoDB Atlas**
   - When user adds to cart → `action: "cart"`, `weight: 2`
   - When user purchases → `action: "purchase"`, `weight: 5`
   - All saved to `interactions` collection in MongoDB Atlas

2. **CF Model Training**
   - Reads interactions from MongoDB Atlas
   - Builds User × Product matrix (view=1, cart=2, purchase=5)
   - Trains SVD model to learn user preferences
   - Recommends products based on what user bought and similar users

3. **Home Page Recommendations**
   - Shows personalized products based on user's purchase history
   - Only shows when user is logged in
   - Uses real MongoDB ObjectIds (no fake "product_1" IDs)

---

## 🚀 Setup Steps

### Step 1: Make Sure You Have Interactions

Check your MongoDB Atlas `interactions` collection has data:

```bash
# In MongoDB Compass or Atlas UI, check:
db.interactions.find().count()
```

You should see interactions like:
```json
{
  "userId": ObjectId("..."),
  "productId": ObjectId("..."),
  "action": "purchase",
  "weight": 5
}
```

### Step 2: Train the CF Model

```bash
curl -X POST http://localhost:5000/product/ai/retrain
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✓ Model retrained successfully",
  "stats": {
    "n_users": 10,
    "n_products": 47,
    "total_interactions": 470
  }
}
```

### Step 3: Test Recommendations

1. **Login to your app** (so `userInfo` is in localStorage)

2. **Go to Home page** - You should see "Personalized For You" section

3. **Check browser console** - Should see:
   ```
   Fetching recommendations for user: 6947be857b4c14f4b7fa15fa
   ```

---

## 🔍 Troubleshooting

### Problem: "No recommendations available"

**Solution:**
1. Make sure user is logged in (check `localStorage.getItem('userInfo')`)
2. Check user has interactions in MongoDB:
   ```bash
   curl http://localhost:5000/product/interactions/summary
   ```
3. Retrain model:
   ```bash
   curl -X POST http://localhost:5000/product/ai/retrain
   ```

### Problem: Recommendations show popular products instead of personalized

**This means:**
- CF model is not ready yet
- User doesn't have enough interactions
- Model needs retraining

**Solution:**
- Add more interactions (cart + purchase)
- Retrain model
- Check backend logs for Python errors

### Problem: Python errors in backend

**Check:**
1. Python packages installed:
   ```bash
   pip install numpy pandas scikit-learn pymongo
   ```

2. MongoDB connection string in `.env`:
   ```
   DB_URI=mongodb+srv://...
   ```

3. Backend terminal shows Python stderr output

---

## 📊 How Recommendations Are Generated

### For User Who Bought Products:

1. **CF Model looks at:**
   - Products this user purchased (weight: 5)
   - Products this user added to cart (weight: 2)
   - Products similar users bought

2. **Predicts ratings** for all products user hasn't bought yet

3. **Returns top N** products with highest predicted ratings

### Example:

```
User bought: Product A, Product B
Similar users bought: Product C, Product D
→ Recommendations: Product C, Product D (and similar)
```

---

## 🎨 Frontend Display

**Location:** `Frontend/src/components/Recommendations.tsx`

**Shows:**
- Product image
- Product name
- Price
- Predicted rating (from CF model)
- Reason: "Based on products you bought and similar users"
- "Add to Cart" button (tracks interaction)

**Only displays when:**
- User is logged in
- CF model has recommendations
- At least 1 recommendation available

---

## ✅ Verification Checklist

- [ ] Interactions saved to MongoDB Atlas when user adds to cart
- [ ] Interactions saved when user purchases
- [ ] CF model trains successfully (`curl -X POST /product/ai/retrain`)
- [ ] User can login and see `userInfo` in localStorage
- [ ] Home page shows "Personalized For You" section
- [ ] Recommendations show products user hasn't bought yet
- [ ] Recommendations are based on purchase history

---

## 🎯 Next Steps

1. **Add more interactions** - Have users add products to cart and purchase
2. **Retrain model** - After adding interactions, retrain to update recommendations
3. **Test with different users** - Each user should see different recommendations
4. **Monitor performance** - Check if recommendations are relevant

---

**Last Updated:** 2025-12-22
**Status:** ✅ Fully Integrated with MongoDB Atlas

