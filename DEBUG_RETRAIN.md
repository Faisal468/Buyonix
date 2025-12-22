# 🔍 Debugging Retrain Issue

## Step 1: Check Backend Terminal

When you run:
```bash
curl -X POST http://localhost:5000/product/ai/retrain
```

**Look at your backend terminal** - you should see messages like:
```
Python stderr: 📊 Connecting to MongoDB: mongodb+srv://...
Python stderr:    Total interactions in DB: 4
```

If you see errors, they will tell us what's wrong.

---

## Step 2: Check .env File

Make sure your `Backend/.env` file has:
```
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/buyonix?retryWrites=true&w=majority
```

**Important:** No quotes around the URI!

---

## Step 3: Test Python Script Directly

Run the Python script directly to see the actual error:

```bash
cd Backend/ai_models
python cf_integration.py stats n_products=47 n_users=10 db_uri="YOUR_DB_URI_HERE"
```

Replace `YOUR_DB_URI_HERE` with your actual MongoDB Atlas connection string.

**This will show you the real error!**

---

## Step 4: Check MongoDB Connection

Test if Python can connect to MongoDB:

```python
from pymongo import MongoClient
import os

db_uri = os.getenv('DB_URI') or "YOUR_DB_URI_HERE"
client = MongoClient(db_uri, serverSelectionTimeoutMS=5000)
db = client.get_database()
count = db['interactions'].count_documents({})
print(f"Found {count} interactions")
```

---

## Common Issues:

### Issue 1: DB_URI Not Found
**Error:** `DB_URI not found! Cannot connect to MongoDB`

**Solution:** 
- Check `.env` file exists in `Backend/` folder
- Make sure `DB_URI=` line is there
- No spaces around `=`

### Issue 2: Connection Failed
**Error:** `Failed to connect to MongoDB: ...`

**Solution:**
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for testing)
- Verify username/password are correct
- Check network connection

### Issue 3: No Interactions Found
**Error:** `No interactions found in database`

**Solution:**
- Check MongoDB Compass/Atlas UI
- Verify interactions collection exists
- Make sure interactions have `userId` and `productId` fields

---

## Quick Test:

Run this and share the output:

```bash
cd Backend
node -e "require('dotenv').config(); console.log('DB_URI:', process.env.DB_URI ? 'Found' : 'NOT FOUND')"
```

This will tell us if Node.js can read the DB_URI.

