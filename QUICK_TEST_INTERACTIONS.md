# 🧪 Quick Test - See Interactions in Database

## Before You Test

Make sure you have:
1. ✅ Backend running (`npm start` in Backend folder)
2. ✅ Frontend running (`npm run dev` in Frontend folder)
3. ✅ MongoDB running and connected

---

## Test Steps (Copy-Paste Ready)

### **Step 1: Set Test User ID**

Open **browser console** (F12) and paste:

```javascript
// Set a test user ID
localStorage.setItem('user', JSON.stringify({
  _id: '655abcdef1234567890abc0',
  email: 'testuser@test.com',
  name: 'Test User'
}))

console.log('✓ User ID set')
```

### **Step 2: Get Real Product ID from Database**

Open **MongoDB Compass** or **terminal**:

```bash
# In MongoDB shell or Compass
use buyonix
db.products.findOne()
# Copy the _id field (e.g., 655xyz123abc)
```

### **Step 3: View a Product**

In **browser**, click any product in Shop page.

**Expected**: Browser console shows:
```
✓ Product view tracked: 655xyz123abc
```

### **Step 4: Add to Cart**

In **browser**, click "Add to cart" button.

**Expected**: Browser console shows:
```
✓ Cart addition tracked: 655xyz123abc
```

### **Step 5: Check Database**

In **terminal** or **MongoDB Compass**:

```bash
use buyonix
db.interactions.find({ action: { $in: ["view", "cart"] } }).pretty()
```

**Expected output**:
```json
[
  {
    "_id": ObjectId("..."),
    "userId": ObjectId("655abcdef1234567890abc0"),
    "productId": ObjectId("655xyz123abc"),
    "action": "view",
    "weight": 1,
    "timestamp": ISODate("2025-12-21T16:45:00Z")
  },
  {
    "_id": ObjectId("..."),
    "userId": ObjectId("655abcdef1234567890abc0"),
    "productId": ObjectId("655xyz123abc"),
    "action": "cart",
    "weight": 2,
    "timestamp": ISODate("2025-12-21T16:45:10Z")
  }
]
```

**If empty?** Check these:
- ❌ User not logged in? → Set localStorage (Step 1)
- ❌ Product ID wrong? → Check Step 2
- ❌ Backend not running? → `npm start` in Backend
- ❌ Network error? → Check browser console for errors

---

## Test Purchase Tracking

### **Step 6: Complete a Real Purchase**

1. **Login** with a real account (if you have one)
2. **Click a product** → Add to cart
3. **Proceed to checkout** → Fill shipping info
4. **Complete payment** (use test card: 4242 4242 4242 4242)

### **Step 7: Check Purchase in Database**

```bash
db.interactions.find({ action: "purchase" }).pretty()
```

**Expected**:
```json
{
  "userId": ObjectId("..."),
  "productId": ObjectId("..."),
  "action": "purchase",
  "weight": 5,
  "rating": null,
  "timestamp": ISODate("...")
}
```

---

## Summary Check

Run this in **browser console** to see a summary:

```javascript
fetch('http://localhost:5000/product/interactions/summary')
  .then(r => r.json())
  .then(d => {
    console.log('📊 Interaction Summary:');
    console.log('Total:', d.summary.totalInteractions);
    console.log('Users:', d.summary.uniqueUsers);
    console.log('Products:', d.summary.uniqueProducts);
    console.log('By action:', d.summary.byAction);
  })
```

**Expected output**:
```
📊 Interaction Summary:
Total: 3
Users: 1
Products: 1
By action: [
  { _id: 'view', count: 1, avgWeight: 1 },
  { _id: 'cart', count: 1, avgWeight: 2 },
  { _id: 'purchase', count: 1, avgWeight: 5 }
]
```

---

## Troubleshooting

### **"User not logged in" messages in console?**

The tracking functions check if user is logged in. Set the test user ID (Step 1) before testing.

### **Interactions not showing in database?**

1. Check backend console for errors
2. Verify MongoDB is running: `mongosh` or MongoDB Compass
3. Check correct database: `use buyonix`

### **Console shows fetch errors?**

Check backend is running:
```bash
cd Backend
npm start
# Should show: Server is running on port 5000
```

---

## Once You See Data in Database ✅

You're ready to:
1. Retrain the model on real data
2. Get AI-powered recommendations
3. Show your examiner how it works!

Next: [REAL_INTERACTION_TRACKING_GUIDE.md](REAL_INTERACTION_TRACKING_GUIDE.md)
