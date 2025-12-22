const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Chat = require("../models/chat");
const axios = require("axios");

// Token-optimized chatbot implementation
router.post("/chat", async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;

    console.log(
      "Chatbot received message:",
      message,
      "userId:",
      userId,
      "sessionId:",
      sessionId
    );

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Create user identifier (userId if logged in, or sessionId for anonymous)
    const userIdentifier =
      userId ||
      sessionId ||
      `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
        await chatSession.addMessage(message, "user");
      } catch (saveError) {
        console.error("Error saving user message:", saveError);
      }
    }

    // Check if message is product-related or a greeting/general query
    const productKeywords = [
      "product",
      "price",
      "buy",
      "purchase",
      "order",
      "shop",
      "item",
      "category",
      "discount",
      "stock",
      "available",
      "search",
      "find",
      "looking for",
      "want",
      "need",
      "show",
      "recommend",
      "best",
      "good",
      "cheap",
      "expensive",
      "deal",
      "sale",
      "offer",
      "smartphone",
      "laptop",
      "electronics",
      "clothing",
      "book",
      "home",
      "garden",
      "beauty",
      "health",
      "sports",
      "toys",
      "food",
      "delivery",
      "shipping",
      // Quality and evaluation related terms
      "quality",
      "review",
      "rating",
      "feedback",
      "opinion",
      "experience",
      "recommend",
      "worth",
      "value",
      "compare",
      "comparison",
      "versus",
      "vs",
      "better",
      "worse",
      "durability",
      "reliable",
      "warranty",
      "guarantee",
      "return",
      "refund",
      "specification",
      "spec",
      "feature",
      "brand",
      "model",
      "size",
      "color",
      "material",
      "dimension",
      "weight",
      "performance",
      "efficiency",
    ];

    const greetingKeywords = [
      "hi",
      "hello",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "what can you do",
      "help",
      "support",
      "how are you",
      "what",
      "who",
      "when",
      "where",
      "why",
      "how",
      "thanks",
      "thank you",
      "please",
      "can you",
      "could you",
      "would you",
    ];

    const isProductRelated = productKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    const isGreetingOrGeneral = greetingKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    // Define clearly off-topic keywords
    const offTopicKeywords = [
      "weather",
      "politics",
      "sports news",
      "recipe",
      "cooking",
      "movie",
      "music",
      "travel",
      "medical advice",
      "legal advice",
      "homework",
      "school",
      "university",
      "job",
      "career",
      "relationship",
      "dating",
      "personal problem",
      "news",
      "current events",
      "celebrity",
    ];

    const isClearlyOffTopic = offTopicKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    // Only redirect if it's clearly off-topic AND not product-related AND not a greeting/general query
    if (
      isClearlyOffTopic &&
      !isProductRelated &&
      !isGreetingOrGeneral &&
      message.length > 10
    ) {
      console.log("Redirecting clearly off-topic message:", message);

      const redirectResponse =
        "I can only talk about products, shopping, prices, and helping you find the perfect items to buy. What product are you looking for today? 🛍️";

      // Save bot response
      if (chatSession) {
        try {
          await chatSession.addMessage(redirectResponse, "bot", "redirect", 0);
        } catch (saveError) {
          console.error("Error saving bot redirect message:", saveError);
        }
      }

      return res.json({
        success: true,
        response: redirectResponse,
        type: "redirect",
        chatId: chatSession?._id,
      });
    }

    console.log(
      "Processing message with AI:",
      message,
      "Product related:",
      isProductRelated,
      "Greeting:",
      isGreetingOrGeneral
    );

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Fetch relevant products for context (limited to reduce tokens)
    const searchTerms = extractSearchTerms(message);
    let relevantProducts = [];

    if (searchTerms.length > 0) {
      if (searchTerms.includes("all")) {
        // User asking for available products - show variety from different categories
        relevantProducts = await Product.find({ status: "active" })
          .select("name price category stock discount")
          .sort({ createdAt: -1 })
          .limit(8); // Show more products for general queries
      } else {
        // Specific search terms
        relevantProducts = await Product.find({
          $or: [
            { name: { $regex: searchTerms.join("|"), $options: "i" } },
            { category: { $regex: searchTerms.join("|"), $options: "i" } },
            { description: { $regex: searchTerms.join("|"), $options: "i" } },
          ],
          status: "active",
        })
          .select("name price category stock discount")
          .limit(6);
      }
    } else {
      // Get some popular/recent products if no specific search
      relevantProducts = await Product.find({ status: "active" })
        .select("name price category stock discount")
        .sort({ createdAt: -1 })
        .limit(4);
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
    // Token-optimized system prompt
    const isShowingProducts =
      searchTerms.includes("all") ||
      message.toLowerCase().includes("available") ||
      message.toLowerCase().includes("what products");

    const systemPrompt = `You are a helpful shopping assistant for Buyonix online store.

Rules:
- Answer all product-related questions including quality, reviews, comparisons, specifications
- Help with product searches, recommendations, pricing, and availability
- For greetings, respond warmly and offer shopping assistance
- Be conversational and helpful (max 200 words)
- When user asks about "available products" or "what products", showcase the products listed below
- For quality questions about specific products (like iPhone), provide detailed helpful information
- Always be helpful and informative

${
  isShowingProducts && relevantProducts.length > 0
    ? `Here are our available products to showcase:\n${productContext}\n\nPresent these products in a friendly, organized way.`
    : `Available products for reference: ${
        productContext || "General product knowledge available"
      }`
}

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
        maxOutputTokens: 800, // Significantly increased for complete responses
        temperature: 0.7, // More natural and conversational
        topP: 0.9,
        topK: 20,
        stopSequences: [], // Don't stop early
        candidateCount: 1, // Request only one candidate for consistency
      },
    };

    // Add retry logic for API calls
    let apiResponse;
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`API call attempt ${attempts + 1}/${maxAttempts}`);
        apiResponse = await axios.post(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 20000, // Increased to 20 seconds
          validateStatus: function (status) {
            return status < 500; // Accept any status code less than 500
          }
        });
        
        // If we got a response, break out of retry loop
        if (apiResponse.data && apiResponse.data.candidates && apiResponse.data.candidates[0]) {
          break;
        }
        
        // If response is incomplete, try again
        console.log('Incomplete response, retrying...');
        attempts++;
        
      } catch (error) {
        attempts++;
        console.log(`API call failed, attempt ${attempts}:`, error.message);
        
        if (attempts >= maxAttempts) {
          throw error; // Re-throw the error if we've exhausted retries
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const data = apiResponse.data;

    // Better error handling for Gemini API response
    if (!data.candidates || !data.candidates[0]) {
      console.error(
        "Invalid Gemini API response structure:",
        JSON.stringify(data, null, 2)
      );
      throw new Error("Invalid response structure from Gemini API");
    }

    const candidate = data.candidates[0];
    if (
      candidate.finishReason === "SAFETY" ||
      candidate.finishReason === "RECITATION"
    ) {
      console.warn(
        "Response filtered by Gemini safety filters:",
        candidate.finishReason
      );
      throw new Error("Response was filtered by safety measures");
    }

    const botResponse = candidate.content?.parts?.[0]?.text;

    console.log("AI response received:", botResponse);
    console.log("Finish reason:", candidate.finishReason);

    if (!botResponse) {
      console.error(
        "No response text in Gemini API response:",
        JSON.stringify(candidate, null, 2)
      );
      throw new Error("No response from Gemini API");
    }

    const trimmedResponse = botResponse.trim();

    // Save bot response
    if (chatSession) {
      try {
        await chatSession.addMessage(
          trimmedResponse,
          "bot",
          "product_help",
          relevantProducts.length
        );
      } catch (saveError) {
        console.error("Error saving bot response:", saveError);
      }
    }

    res.json({
      success: true,
      response: trimmedResponse,
      type: "product_help",
      productsFound: relevantProducts.length,
      chatId: chatSession?._id,
    });
  } catch (error) {
    console.error("Chatbot error:", error);

    // Handle axios errors specifically
    if (error.response) {
      console.error(
        "Gemini API Error:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error("Network Error:", error.message);
    }

    const errorMessage =
      "I can only help you with shopping and product questions. What would you like to know about our products?";

    // Save error response if we have a chat session
    const { userId, sessionId } = req.body;
    const userIdentifier =
      userId ||
      sessionId ||
      `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const chatSession = await Chat.findOrCreateSession(
        userIdentifier,
        sessionId
      );
      if (chatSession) {
        await chatSession.addMessage(errorMessage, "bot", "error", 0);
      }
    } catch (chatError) {
      console.error("Error saving error message to chat:", chatError);
    }

    res.json({
      success: true,
      response: errorMessage,
      type: "error_redirect",
      chatId: chatSession?._id,
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
    "what",
    "is",
    "are",
    "of",
    "do",
    "does",
    "can",
    "you",
  ];

  // Handle specific cases for general product queries
  if (
    message.toLowerCase().includes("available") ||
    message.toLowerCase().includes("products") ||
    message.toLowerCase().includes("what do you have") ||
    message.toLowerCase().includes("show me")
  ) {
    return ["all"]; // Special term to indicate show all products
  }

  return words
    .filter(
      (word) =>
        word.length > 1 && // Allow numbers like "13", "14" etc.
        !stopWords.includes(word) &&
        !["product", "products", "item", "items"].includes(word)
    )
    .slice(0, 5); // Increased to 5 terms to capture more context
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
      "Conversation history storage",
    ],
    limitations: [
      "Only responds to shopping and product-related queries",
      "Cannot process orders or payments directly",
      "Cannot access personal account information",
      "Does not provide medical, legal, or personal advice",
    ],
  });
});

// Get chat history for a user
router.get("/history/:userIdentifier", async (req, res) => {
  try {
    const { userIdentifier } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const chats = await Chat.find({
      userId: userIdentifier,
      isActive: true,
    })
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit) * parseInt(page))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalChats = await Chat.countDocuments({
      userId: userIdentifier,
      isActive: true,
    });

    res.json({
      success: true,
      chats: chats.map((chat) => ({
        id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
        totalMessages: chat.totalMessages,
        productQueriesCount: chat.productQueriesCount,
        createdAt: chat.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalChats,
        pages: Math.ceil(totalChats / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error retrieving chat history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve chat history",
    });
  }
});

// Get specific chat conversation
router.get("/conversation/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: "Chat not found",
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
        updatedAt: chat.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving conversation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve conversation",
    });
  }
});

// Delete a chat conversation
router.delete("/conversation/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: "Chat not found",
      });
    }

    chat.isActive = false;
    await chat.save();

    res.json({
      success: true,
      message: "Chat conversation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete conversation",
    });
  }
});

// Clear all chat history for a user
router.delete("/history/:userIdentifier", async (req, res) => {
  try {
    const { userIdentifier } = req.params;

    await Chat.updateMany({ userId: userIdentifier }, { isActive: false });

    res.json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear chat history",
    });
  }
});

module.exports = router;