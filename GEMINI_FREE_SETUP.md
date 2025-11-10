# 🆓 Get Your FREE Google Gemini API Key

## Why Gemini?
- ✅ **Completely FREE** (no credit card needed!)
- ✅ **60 requests per minute** (very generous)
- ✅ **Unlimited usage** for free tier
- ✅ **Fast responses** (1-2 seconds)
- ✅ **High quality** (comparable to GPT-4)

## Step 1: Get Your FREE API Key (2 minutes)

1. **Visit**: https://aistudio.google.com/app/apikey

2. **Sign in** with your Google account (Gmail, etc.)

3. **Click** "Create API Key"

4. **Select** "Create API key in new project"

5. **Copy** your API key (starts with `AIza...`)

## Step 2: Add to TripFlow

1. Open `.env.local` in your project

2. Find this line:
   ```bash
   GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
   ```

3. Replace with your actual key:
   ```bash
   GOOGLE_GEMINI_API_KEY=AIzaSyAbc123...your-actual-key
   ```

4. Save the file

## Step 3: Restart Server

```bash
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

## Step 4: Test It! 🎉

1. Open http://localhost:3001
2. Click the chat bubble
3. Look for the green "Gemini" badge
4. Ask: **"Plan a 3-day trip to Tokyo"**
5. Get an amazing AI response!

## ✨ What You Get (ALL FREE!)

### Free Tier Limits:
- **60 requests per minute**
- **1,500 requests per day**
- **1 million requests per month**
- **NO CREDIT CARD REQUIRED**

### That Means:
- ✅ ~50,000 conversations per day
- ✅ ~1.5 million conversations per month
- ✅ Perfect for development AND production
- ✅ Absolutely FREE forever!

## 🚀 Usage Examples

Once configured, users can ask:

**"I have $2000 for a 7-day trip. Where should I go?"**
→ Gets detailed budget breakdown with destinations

**"Create a romantic 3-day itinerary for Paris"**
→ Gets day-by-day plan with restaurants and activities

**"What should I pack for Iceland in winter?"**
→ Gets complete packing list with weather tips

**"Best beaches for families in Thailand?"**
→ Gets specific recommendations with reasons

## 💡 Pro Tips

### If You Hit Rate Limits:
The free tier is VERY generous, but if you somehow exceed:
- Requests reset every minute (60/min)
- Daily limit resets at midnight UTC
- Automatic fallback mode activates

### Monitor Usage:
Visit https://aistudio.google.com/app/apikey to see:
- Current usage
- Remaining quota
- Request statistics

## 🎯 Comparison

| Feature | Google Gemini (FREE) | OpenAI GPT-4 (Paid) |
|---------|---------------------|---------------------|
| **Cost** | $0 | ~$0.60 per 1000 chats |
| **Requests/min** | 60 | Depends on tier |
| **Daily limit** | 1,500 | Depends on credits |
| **Credit card** | Not needed | Required |
| **Quality** | Excellent | Excellent |
| **Speed** | 1-2 seconds | 1-3 seconds |

## ✅ That's It!

**Total time**: 2 minutes
**Total cost**: $0 FOREVER
**API Key lifetime**: Permanent

Your TripFlow AI is now powered by Google's latest AI model - completely free! 🎉

---

**Stuck?** The chatbot works without ANY API key using smart fallback mode. Add Gemini later when you're ready!
