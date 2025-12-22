const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Chat = require("../models/chat");
const axios = require("axios");

// Token-optimized chatbot implementation
router.post("/chat", async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;
    
    console.log("Chatbot received message:", message, "userId:", userId, "sessionId:", sessionId);

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Create user identifier (userId if logged in, or sessionId for anonymous)
    const userIdentifier = userId || sessionId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Find or create chat session
    let chatSession;
    try {
      chatSession = await Chat.findOrCreateSession(userIdentifier, sessionId);
    } catch (chatError) {
      console.error("Error managing chat session:", chatError);
      // Continue without saving if database error (non-critical)
    }

    // Save user message
    if (chatSession) {
      try {
        await chatSession.addMessage(message, 'user');
      } catch (saveError) {
        console.error("Error saving user message:", saveError);
      }
    }

    // Check if message is product-related or a greeting/general query
    const productKeywords = [
      "product", "price", "buy", "purchase", "order", "shop", "item", "category", 
      "discount", "stock", "available", "search", "find", "looking for", "want", "need",
      "show", "recommend", "best", "good", "cheap", "expensive", "deal", "sale", "offer",
      "smartphone", "laptop", "electronics", "clothing", "book", "home", "garden", 
      "beauty", "health", "sports", "toys", "food", "delivery", "shipping",
      // Quality and evaluation related terms
      "quality", "review", "rating", "feedback", "opinion", "experience", "recommend",
      "worth", "value", "compare", "comparison", "versus", "vs", "better", "worse",
      "durability", "reliable", "warranty", "guarantee", "return", "refund",
      "specification", "spec", "feature", "brand", "model", "size", "color",
      "material", "dimension", "weight", "performance", "efficiency"
    ];
    
    const greetingKeywords = [
      "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
      "what can you do", "help", "support", "how are you", "what", "who", "when", "where", "why", "how",
      "thanks", "thank you", "please", "can you", "could you", "would you"
    ];
    
    const isProductRelated = productKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );
    
    const isGreetingOrGeneral = greetingKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    // Define clearly off-topic keywords
    const offTopicKeywords = [
      "weather", "politics", "sports news", "recipe", "cooking", "movie", "music", "travel",
      "medical advice", "legal advice", "homework", "school", "university", "job", "career",
      "relationship", "dating", "personal problem", "news", "current events", "celebrity"
    ];

    const isClearlyOffTopic = offTopicKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    // Only redirect if it's clearly off-topic AND not product-related AND not a greeting/general query
    if (isClearlyOffTopic && !isProductRelated && !isGreetingOrGeneral && message.length > 10) {
      console.log("Redirecting clearly off-topic message:", message);
      
      const redirectResponse = "I can only talk about products, shopping, prices, and helping you find the perfect items to buy. What product are you looking for today? 🛍️";
      
      // Save bot response
      if (chatSession) {
        try {
          await chatSession.addMessage(redirectResponse, 'bot', 'redirect', 0);
        } catch (saveError) {
          console.error("Error saving bot redirect message:", saveError);
        }
      }
      
      return res.json({
        success: true,
        response: redirectResponse,
        type: "redirect",
        chatId: chatSession?._id
      });
    }
    
    console.log("Processing message with AI:", message, "Product related:", isProductRelated, "Greeting:", isGreetingOrGeneral);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured in environment variables");
      const fallbackResponse = "I'm currently experiencing technical difficulties. Please contact our support team for assistance. In the meantime, you can browse our products on the shop page!";
      
      // Save fallback response
      if (chatSession) {
        try {
          await chatSession.addMessage(fallbackResponse, 'bot', 'error', 0);
        } catch (saveError) {
          console.error("Error saving fallback message:", saveError);
        }
      }
      
      return res.json({
        success: true,
        response: fallbackResponse,
        type: "error",
        chatId: chatSession?._id
      });
    }

    // Fetch relevant products for context (limited to reduce tokens)
    const searchTerms = extractSearchTerms(message);
    let relevantProducts = [];

    if (searchTerms.length > 0) {
      relevantProducts = await Product.find({
        $or: [
          { name: { $regex: searchTerms.join("|"), $options: "i" } },
          { category: { $regex: searchTerms.join("|"), $options: "i" } },
          { description: { $regex: searchTerms.join("|"), $options: "i" } },
        ],
      })
        .select("name price category stock discount")
        .limit(5);
    } else {
      // Get some popular/recent products if no specific search
      relevantProducts = await Product.find()
        .select("name price category stock discount")
        .sort({ createdAt: -1 })
        .limit(3);
    }

    // Create compact product context for AI
    const productContext = relevantProducts
      .map(
        (p) =>
          `${p.name} - $${p.price} (${p.category}) ${
            p.stock > 0 ? "In Stock" : "Out of Stock"
          }${p.discount > 0 ? ` ${p.discount}% off` : ""}`
      )
      .join("\n");

    // Token-optimized system prompt
    const systemPrompt = `You are a helpful shopping assistant for Buyonix online store. 

Rules:
- Answer all product-related questions including quality, reviews, comparisons, specifications
- Help with product searches, recommendations, pricing, and availability
- Provide helpful information about products even if not specifically in our database
- For greetings, respond warmly and offer shopping assistance
- Be conversational and helpful (max 150 words)
- Available products context: ${productContext || "No specific products loaded - but still help with general product questions"}
- Only redirect to shopping topics if user asks about completely unrelated topics like weather, politics, or personal issues

User: ${message}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 250, // Increased for more detailed responses
        temperature: 0.5, // Slightly higher for more natural responses
        topP: 0.9,
        topK: 20,
      },
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 second timeout
    });

    const data = response.data;
    const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("AI response received:", botResponse);

    if (!botResponse) {
      throw new Error("No response from Gemini API");
    }

    const trimmedResponse = botResponse.trim();
    
    // Save bot response
    if (chatSession) {
      try {
        await chatSession.addMessage(trimmedResponse, 'bot', 'product_help', relevantProducts.length);
      } catch (saveError) {
        console.error("Error saving bot response:", saveError);
      }
    }

    res.json({
      success: true,
      response: trimmedResponse,
      type: "product_help",
      productsFound: relevantProducts.length,
      chatId: chatSession?._id
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    
    // Handle axios errors specifically
    if (error.response) {
      console.error('Gemini API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    
    const errorMessage = "I can only help you with shopping and product questions. What would you like to know about our products?";
    
    // Save error response if we have a chat session
    const { userId, sessionId } = req.body;
    const userIdentifier = userId || sessionId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let errorChatSession = null;
    try {
      errorChatSession = await Chat.findOrCreateSession(userIdentifier, sessionId);
      if (errorChatSession) {
        await errorChatSession.addMessage(errorMessage, 'bot', 'error', 0);
      }
    } catch (chatError) {
      console.error("Error saving error message to chat:", chatError);
    }
    
    res.json({
      success: true,
      response: errorMessage,
      type: "error_redirect",
      chatId: errorChatSession?._id || null
    });
  }
});

// Quick product search endpoint for chatbot
router.get("/products/search", async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    })
      .select("name price category stock discount images")
      .limit(parseInt(limit));

    res.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Product search error:", error);
    res.status(500).json({
      success: false,
      error: "Search failed",
    });
  }
});

// Helper function to extract search terms from user message
function extractSearchTerms(message) {
  const words = message.toLowerCase().split(" ");
  const stopWords = [
    "i",
    "am",
    "looking",
    "for",
    "a",
    "an",
    "the",
    "want",
    "need",
    "find",
    "show",
    "me",
    "some",
    "any",
  ];
  return words
    .filter(
      (word) =>
        word.length > 2 &&
        !stopWords.includes(word) &&
        !["product", "products", "item", "items"].includes(word)
    )
    .slice(0, 3); // Limit to 3 search terms to reduce API tokens
}

// Get chatbot capabilities
router.get("/capabilities", (req, res) => {
  res.json({
    success: true,
    capabilities: [
      "Product search and recommendations",
      "Product quality assessments and reviews",
      "Price comparisons and value analysis",
      "Stock availability checks",
      "Product specifications and features",
      "Brand and model comparisons",
      "Category browsing and suggestions",
      "Deal and discount information",
      "Shopping advice and guidance",
      "Conversation history storage"
    ],
    limitations: [
      "Only responds to shopping and product-related queries",
      "Cannot process orders or payments directly",
      "Cannot access personal account information",
      "Does not provide medical, legal, or personal advice"
    ],
  });
});

// Get chat history for a user
router.get('/history/:userIdentifier', async (req, res) => {
    try {
        const { userIdentifier } = req.params;
        const { limit = 10, page = 1 } = req.query;
        
        const chats = await Chat.find({ 
            userId: userIdentifier,
            isActive: true 
        })
        .sort({ lastActivity: -1 })
        .limit(parseInt(limit) * parseInt(page))
        .skip((parseInt(page) - 1) * parseInt(limit));
        
        const totalChats = await Chat.countDocuments({ 
            userId: userIdentifier,
            isActive: true 
        });
        
        res.json({
            success: true,
            chats: chats.map(chat => ({
                id: chat._id,
                title: chat.title,
                lastActivity: chat.lastActivity,
                totalMessages: chat.totalMessages,
                productQueriesCount: chat.productQueriesCount,
                createdAt: chat.createdAt
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalChats,
                pages: Math.ceil(totalChats / parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('Error retrieving chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve chat history'
        });
    }
});

// Get specific chat conversation
router.get('/conversation/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found'
            });
        }
        
        res.json({
            success: true,
            chat: {
                id: chat._id,
                title: chat.title,
                messages: chat.messages,
                lastActivity: chat.lastActivity,
                totalMessages: chat.totalMessages,
                productQueriesCount: chat.productQueriesCount,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt
            }
        });
        
    } catch (error) {
        console.error('Error retrieving conversation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve conversation'
        });
    }
});

// Delete a chat conversation
router.delete('/conversation/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found'
            });
        }
        
        chat.isActive = false;
        await chat.save();
        
        res.json({
            success: true,
            message: 'Chat conversation deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete conversation'
        });
    }
});

// Clear all chat history for a user
router.delete('/history/:userIdentifier', async (req, res) => {
    try {
        const { userIdentifier } = req.params;
        
        await Chat.updateMany(
            { userId: userIdentifier },
            { isActive: false }
        );
        
        res.json({
            success: true,
            message: 'Chat history cleared successfully'
        });
        
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear chat history'
        });
    }
});

module.exports = router;
