import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory, userContext } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check if Gemini API key is configured
    if (!process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY === 'your-gemini-api-key-here') {
      // Fallback to smart responses if no API key
      const fallbackResponse = await generateSmartResponse(message, userContext);
      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        mode: 'fallback'
      });
    }

    // Build the system prompt with travel expertise
    const systemPrompt = `You are TripFlow AI, an expert travel assistant and advisor. You help users:

🌍 **Plan trips** - Recommend destinations, create itineraries, suggest activities
💰 **Budget planning** - Provide cost estimates, money-saving tips, budget breakdowns
🏨 **Accommodation** - Suggest hotels, hostels, Airbnbs based on preferences
✈️ **Transportation** - Advice on flights, trains, buses, car rentals
🎒 **Packing** - Weather-appropriate packing lists and travel essentials
🌐 **Translation** - Help with language barriers and communication
🛡️ **Safety** - Location-specific safety tips and travel alerts
📸 **Attractions** - Recommend must-see places and hidden gems

${userContext?.currentPage ? `The user is currently on the ${userContext.currentPage} page.` : ''}
${userContext?.userName ? `User's name: ${userContext.userName}` : ''}
${userContext?.language ? `Preferred language: ${userContext.language}` : ''}

Be friendly, enthusiastic, and helpful. Use emojis to make responses engaging. Keep responses concise but informative (2-4 paragraphs max). Provide actionable advice. If asked about booking or specific features, guide them to the relevant TripFlow page.`;

    // Build conversation history
    let conversationText = systemPrompt + '\n\n';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        conversationText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }
    conversationText += `User: ${message}\nAssistant:`;

    // Call Google Gemini API directly via REST (FREE!)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: conversationText
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error details:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    return NextResponse.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      mode: 'ai',
      model: 'gemini-pro'
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // If Gemini fails, fall back to smart responses
    try {
      const { message, userContext } = await req.json();
      const fallbackResponse = await generateSmartResponse(message, userContext);
      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        mode: 'fallback'
      });
    } catch {
      return NextResponse.json(
        { error: error.message || 'Failed to process chat' },
        { status: 500 }
      );
    }
  }
}

// Smart response generator (can be replaced with OpenAI/Anthropic API)
async function generateSmartResponse(message: string, userContext: any): Promise<string> {
  const lowerMessage = message.toLowerCase();
  const currentPage = userContext?.currentPage || '';

  // Context-aware responses based on current page
  if (currentPage.includes('/hotels') && (lowerMessage.includes('hotel') || lowerMessage.includes('book') || lowerMessage.includes('here'))) {
    return "🏨 I see you're on the Hotels page! Here's what you can do:\n\n✅ Browse curated hotels with photos\n✅ Filter by location and amenities\n✅ Book directly with one click\n✅ Save favorites for later\n\n💡 Pro tip: Hotels with high ratings and good photos tend to have the best experiences. What type of accommodation are you looking for?";
  }

  if (currentPage.includes('/itineraries') && (lowerMessage.includes('itinerary') || lowerMessage.includes('trip') || lowerMessage.includes('plan'))) {
    return "📅 Perfect! You're on the Itineraries page. Here's how to create an amazing trip:\n\n1. **Click 'New Itinerary'** to start planning\n2. **Add destinations** with dates and activities\n3. **Set your budget** for each day\n4. **Add transport and hotels** from our suggestions\n5. **Share with friends** for collaborative planning\n\n🎯 Want help planning a specific type of trip? Tell me your destination and duration!";
  }

  if (currentPage.includes('/explore') && (lowerMessage.includes('landmark') || lowerMessage.includes('recognize') || lowerMessage.includes('photo'))) {
    return "📸 You're on the Explore page! Here's what you can do:\n\n✅ **Upload a photo** of any landmark\n✅ **Paste an image URL** from the web\n✅ **Get instant recognition** with AI\n✅ **Learn about the location** and nearby attractions\n\n🌍 This is perfect for discovering places while traveling. Just snap a photo and let AI tell you all about it!";
  }

  if (currentPage.includes('/profile') && (lowerMessage.includes('profile') || lowerMessage.includes('preference') || lowerMessage.includes('settings'))) {
    return "👤 You're viewing your Profile! Here you can:\n\n✅ Upload a profile photo\n✅ Set travel preferences (budget, accommodation, transport)\n✅ Choose your interests (adventure, culture, food, etc.)\n✅ Change language settings\n✅ Manage your subscription\n\n💡 Setting your preferences helps us give you better recommendations. What would you like to update?";
  }

  // Destination recommendations
  if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('where')) {
    if (lowerMessage.includes('beach') || lowerMessage.includes('ocean') || lowerMessage.includes('sea')) {
      return "🏖️ For beach destinations, I'd recommend:\n\n1. **Maldives** - Crystal clear waters and overwater bungalows\n2. **Bali, Indonesia** - Perfect blend of beaches, culture, and affordability\n3. **Santorini, Greece** - Stunning sunsets and unique black sand beaches\n4. **Cancún, Mexico** - White sand beaches and vibrant nightlife\n\nWhat's your budget and travel dates? I can help narrow it down!";
    }
    if (lowerMessage.includes('europe') || lowerMessage.includes('city')) {
      return "🏛️ For European city breaks, here are my top picks:\n\n1. **Paris, France** - Art, cuisine, and romance\n2. **Barcelona, Spain** - Gaudí architecture and Mediterranean vibes\n3. **Rome, Italy** - Ancient history meets modern charm\n4. **Prague, Czech Republic** - Fairy-tale architecture on a budget\n\nHow many days are you planning to travel?";
    }
    if (lowerMessage.includes('adventure') || lowerMessage.includes('hiking')) {
      return "⛰️ For adventure seekers:\n\n1. **New Zealand** - Bungee jumping, hiking, and Lord of the Rings scenery\n2. **Iceland** - Glaciers, volcanoes, and Northern Lights\n3. **Costa Rica** - Zip-lining, surfing, and wildlife\n4. **Nepal** - Trekking in the Himalayas\n\nWhat's your fitness level and preferred climate?";
    }
    return "✈️ I'd love to recommend destinations! What type of trip are you looking for?\n\n- 🏖️ Beach relaxation\n- 🏛️ City exploration\n- ⛰️ Adventure & hiking\n- 🍜 Food & culture\n- 🎨 Art & history\n\nAlso, what's your budget range and travel dates?";
  }

  // Budget/planning questions
  if (lowerMessage.includes('budget') || lowerMessage.includes('cost') || lowerMessage.includes('expensive')) {
    return "💰 **Budget Travel Tips:**\n\n1. **Book in advance** - Flights and hotels are cheaper 2-3 months ahead\n2. **Travel off-season** - Save 30-50% on accommodations\n3. **Use local transport** - Skip expensive tours\n4. **Eat like locals** - Street food and local markets\n5. **Free activities** - Walking tours, parks, museums on free days\n\nWhat's your destination? I can give specific budget estimates!";
  }

  // Packing questions
  if (lowerMessage.includes('pack') || lowerMessage.includes('bring') || lowerMessage.includes('luggage')) {
    return "🎒 **Essential Packing List:**\n\n✅ Travel documents (passport, tickets, insurance)\n✅ Phone charger + power bank\n✅ Comfortable walking shoes\n✅ Weather-appropriate clothing\n✅ Toiletries (travel-size)\n✅ First aid kit & medications\n✅ Reusable water bottle\n\nWhere are you traveling? I can give destination-specific advice!";
  }

  // Translation requests
  if (lowerMessage.includes('translate') || lowerMessage.includes('translation')) {
    // Check if they provided text to translate
    const translateMatch = message.match(/translate\s+["'](.+?)["']\s+(?:to|into)\s+(\w+)/i);
    if (translateMatch) {
      const [, textToTranslate, targetLang] = translateMatch;
      return `🌐 I can help translate that! To translate "${textToTranslate}" to ${targetLang}, you can:\n\n1. Use the **Translate Voice** page in the navigation\n2. Or I can integrate translation here in future updates!\n\nFor now, visit the Translate Voice page for real-time speech and text translation.`;
    }
    return "🌐 I can help with translations! Just tell me:\n\n1. The text you want to translate\n2. From which language\n3. To which language\n\nExample: *\"Translate 'Where is the train station?' to French\"*\n\n💡 For real-time speech translation, check out the **Translate Voice** page in the navigation!";
  }

  // Hotel/accommodation
  if (lowerMessage.includes('hotel') || lowerMessage.includes('accommodation') || lowerMessage.includes('stay')) {
    return "🏨 **Finding the Best Accommodation:**\n\n**Hotels** - Full service, central locations\n**Airbnb** - Local experience, kitchen access\n**Hostels** - Budget-friendly, social atmosphere\n**Resorts** - All-inclusive relaxation\n\n💡 Tip: Check our Hotels page for curated recommendations with photos and booking options!\n\nWhat's your destination and budget per night?";
  }

  // Itinerary/planning
  if (lowerMessage.includes('itinerary') || lowerMessage.includes('plan') || lowerMessage.includes('schedule')) {
    return "📅 **Creating Your Perfect Itinerary:**\n\n1. **Day 1** - Arrive, check-in, explore neighborhood\n2. **Days 2-4** - Main attractions (mornings), local experiences (afternoons)\n3. **Day 5** - Day trip or relaxation\n4. **Last Day** - Shopping, last-minute sights, pack\n\n💡 Pro tip: Use our Itineraries page to create and save detailed trip plans!\n\nWhere are you going? I'll help customize this!";
  }

  // Safety/tips
  if (lowerMessage.includes('safe') || lowerMessage.includes('safety') || lowerMessage.includes('danger')) {
    return "🛡️ **Travel Safety Tips:**\n\n✅ Research your destination beforehand\n✅ Keep copies of important documents\n✅ Don't flash expensive items\n✅ Use hotel safes for valuables\n✅ Stay in well-lit areas at night\n✅ Trust your instincts\n✅ Share your itinerary with someone\n\nWhich destination are you concerned about? I can provide specific safety info!";
  }

  // Greeting
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.includes('hey')) {
    return `👋 Hello${userContext?.userName ? ' ' + userContext.userName : ''}! I'm your TripFlow AI assistant.\n\nI can help you with:\n\n✈️ Destination recommendations\n💰 Budget planning\n📅 Itinerary creation\n🌐 Translations\n🏨 Hotel suggestions\n🎒 Packing advice\n\nWhat would you like to know about your next trip?`;
  }

  // Default helpful response
  return `I'm here to help with your travel planning! 🌍\n\nI can assist with:\n\n✈️ **Destination recommendations** - Where should you go?\n💰 **Budget planning** - How much will it cost?\n📅 **Itinerary creation** - What should you do?\n🌐 **Translations** - Communicate anywhere\n🏨 **Accommodation tips** - Where should you stay?\n🎒 **Packing advice** - What should you bring?\n\nWhat would you like to know?`;
}
