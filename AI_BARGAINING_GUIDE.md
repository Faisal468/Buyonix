# 🤖 AI-Powered Smart Bargaining System - Setup Guide

## Overview
Your Smart Bargaining system is now powered by **Google Gemini AI** for intelligent, natural price negotiations!

---

## 🎯 Features

### ✨ What's New:
- **Real AI Conversations**: Natural, context-aware responses using Gemini 1.5 Flash
- **Smart Negotiation**: AI considers product value, user offers, and bargaining history
- **Personality**: Friendly, engaging responses with emojis and enthusiasm
- **Dynamic Pricing**: Intelligent price adjustments (12-15% discount range)
- **Conversation Memory**: AI remembers the entire negotiation history
- **Fallback System**: Works even if API fails (graceful degradation)

---

## 📋 Setup Instructions

### Step 1: Get Your FREE Gemini API Key

1. **Visit**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Sign in** with your Google account
3. **Click** "Create API Key"
4. **Copy** your API key

### Step 2: Add API Key to Your Project

1. Open: `Backend/.env`
2. Find the line: `GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE`
3. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key
4. Save the file

**Example:**
```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Restart Your Backend Server

The backend server will automatically reload (nodemon), but if not:
1. Stop the backend (Ctrl+C)
2. Run: `npm start` in the Backend directory

---

## 🎮 How It Works

### For Users (Customers):
1. Add a product to cart
2. Go to Checkout page
3. Click **"Smart Bargaining"** button
4. Enter your price offer
5. AI negotiates with you (3 attempts)
6. Get the best deal!

### AI Negotiation Logic:
- **Original Price**: Listed product price
- **Target Price**: 12% discount (88% of original)
- **Minimum Price**: 15% discount (85% of original)
- **Attempts**: 3 chances to negotiate

### Example Conversation:
```
User: $50
AI: That's a bit low for me. How about we meet around $88? 🤝

User: $80
AI: Great! I can accept your offer of $80. You've got yourself a deal! 🎉
```

---

## 🔧 Technical Details

### Backend API Endpoint
**URL**: `POST http://localhost:5000/bargain/negotiate`

**Request Body**:
```json
{
  "productName": "Product Name",
  "originalPrice": 100,
  "userOffer": 85,
  "attemptNumber": 1,
  "conversationHistory": []
}
```

**Response**:
```json
{
  "success": true,
  "aiResponse": "Great! I can accept your offer...",
  "accepted": true,
  "finalPrice": 85,
  "originalPrice": 100,
  "discountPercentage": "15.0",
  "attemptsRemaining": 2
}
```

### AI Model Configuration
- **Model**: Gemini 1.5 Flash (fast & free)
- **Temperature**: 0.9 (creative responses)
- **Max Tokens**: 150 (concise responses)
- **Context**: Full conversation history

---

## 💡 Why Gemini API is Best for This

### ✅ Advantages:
1. **FREE Tier**: 15 requests/minute, 1500/day (perfect for FYP)
2. **Fast**: ~1-2 second response time
3. **Smart**: Understands context and negotiation nuances
4. **Natural**: Human-like conversation
5. **Reliable**: Google's infrastructure
6. **Easy**: Simple SDK integration

### 📊 Comparison with Alternatives:

| Feature | Gemini | ChatGPT | Claude |
|---------|--------|---------|--------|
| Free Tier | ✅ Generous | ❌ Limited | ❌ Very Limited |
| Speed | ⚡ Very Fast | 🐢 Slower | 🐢 Slower |
| Cost | 💰 FREE | 💰 $0.002/1K | 💰 $0.008/1K |
| Setup | ✅ Easy | ⚠️ Medium | ⚠️ Medium |

---

## 🎨 Customization Options

### Adjust Discount Range
Edit `Backend/routes/bargain.js`:
```javascript
const minAcceptablePrice = originalPrice * 0.85; // Change 0.85 (15% off)
const targetPrice = originalPrice * 0.88; // Change 0.88 (12% off)
```

### Change AI Personality
Edit the `systemPrompt` in `Backend/routes/bargain.js`:
```javascript
PERSONALITY GUIDELINES:
- Be friendly, enthusiastic, and conversational
- Use emojis occasionally (💰, 🎉, 🤝, ✨)
// Add your own personality traits here!
```

### Adjust Number of Attempts
Edit `Frontend/src/pages/Checkout.tsx`:
```javascript
setBargainAttempts(3); // Change to 5, 10, etc.
```

---

## 🧪 Testing Your AI Bargaining

### Test Scenarios:

1. **High Offer (≥ Original Price)**
   - Offer: $100 (Product: $100)
   - Expected: Immediate acceptance

2. **Good Offer (≥ 88% of price)**
   - Offer: $88 (Product: $100)
   - Expected: Acceptance with celebration

3. **Low Offer (< 88% of price)**
   - Offer: $70 (Product: $100)
   - Expected: Counter-offer suggestion

4. **Last Attempt**
   - Offer: Any amount on 3rd attempt
   - Expected: Acceptance at minimum price ($85)

---

## 🐛 Troubleshooting

### Problem: "Bargaining failed" error
**Solution**: 
- Check if Gemini API key is correct in `.env`
- Verify backend server is running
- Check console for error messages
- Fallback logic will still work!

### Problem: AI responses are too generic
**Solution**:
- Increase temperature in `bargain.js` (0.9 → 1.0)
- Add more personality guidelines
- Provide more context in the prompt

### Problem: API rate limit exceeded
**Solution**:
- Free tier: 15 requests/minute
- Wait 1 minute or upgrade to paid tier
- Fallback logic activates automatically

---

## 📱 For Your FYP Presentation

### Key Points to Highlight:
1. ✅ **AI Integration**: Real Google Gemini AI, not fake/mock
2. ✅ **Natural Conversations**: Context-aware, personality-driven
3. ✅ **Smart Pricing**: Dynamic discount calculation
4. ✅ **User Experience**: Engaging, fun, interactive
5. ✅ **Fallback System**: Graceful error handling
6. ✅ **Scalable**: Easy to customize and extend

### Demo Script:
1. Show a product ($100)
2. Click "Smart Bargaining"
3. Try low offer ($60) → AI counters
4. Try medium offer ($85) → AI accepts
5. Show discount applied
6. Explain the AI logic

---

## 🚀 Future Enhancements

### Ideas to Extend:
- [ ] User bargaining history tracking
- [ ] Seller-specific discount rules
- [ ] Time-based dynamic pricing
- [ ] Multi-language support
- [ ] Voice-based bargaining
- [ ] Sentiment analysis
- [ ] Product category-specific strategies

---

## 📚 Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **API Key Dashboard**: https://aistudio.google.com/app/apikey
- **Pricing**: https://ai.google.dev/pricing
- **Examples**: https://ai.google.dev/examples

---

## ✅ Checklist

- [ ] Got Gemini API key
- [ ] Added key to `.env` file
- [ ] Restarted backend server
- [ ] Tested bargaining feature
- [ ] Customized AI personality (optional)
- [ ] Prepared demo for FYP

---

## 🎉 You're All Set!

Your Smart Bargaining system is now powered by real AI! Test it out and impress your FYP evaluators! 🚀

**Need help?** Check the troubleshooting section or review the code comments in:
- `Backend/routes/bargain.js`
- `Frontend/src/pages/Checkout.tsx`
