const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const axios = require("axios");

// Token-optimized chatbot implementation
router.post("/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    console.log("Chatbot received message:", message);

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Check if message is product-related or a greeting/general query
    const productKeywords = [
      "product", "price", "buy", "purchase", "order", "shop", "item", "category", 
      "discount", "stock", "available", "search", "find", "looking for", "want", "need",
      "show", "recommend", "best", "good", "cheap", "expensive", "deal", "sale", "offer",
      "smartphone", "laptop", "electronics", "clothing", "book", "home", "garden", 
      "beauty", "health", "sports", "toys", "food", "delivery", "shipping"
    ];
    
    const greetingKeywords = [
      "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
      "what can you do", "help", "support", "how are you", "what", "who", "when", "where", "why", "how"
    ];
    
    const isProductRelated = productKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );
    
    const isGreetingOrGeneral = greetingKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    // Only redirect if it's clearly not product-related AND not a greeting/general query
    if (!isProductRelated && !isGreetingOrGeneral && message.length > 3) {
      console.log("Redirecting non-product message:", message);
      return res.json({
        success: true,
        response:
          "I'm a shopping assistant bot focused on helping you with product information, searches, and purchase queries. How can I help you find the perfect product today?",
        type: "redirect",
      });
    }
    
    console.log("Processing message with AI:", message, "Product related:", isProductRelated, "Greeting:", isGreetingOrGeneral);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
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
- Answer greetings warmly, then guide to product help
- Focus on products, prices, recommendations, availability  
- Be concise (max 100 words)
- Use available products if relevant: ${productContext || "No specific products loaded"}
- For non-shopping topics, politely redirect to shopping assistance

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
        maxOutputTokens: 150, // Limit response tokens
        temperature: 0.3, // Lower temperature for more focused responses
        topP: 0.8,
        topK: 10,
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

    res.json({
      success: true,
      response: botResponse.trim(),
      type: "product_help",
      productsFound: relevantProducts.length,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    
    // Handle axios errors specifically
    if (error.response) {
      console.error('Gemini API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    }
    
    res.status(500).json({
      success: false,
      error: "I'm having trouble right now. Please try again in a moment.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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
      "Price comparisons",
      "Stock availability checks",
      "Category browsing",
      "Deal and discount information",
      "Product specifications",
    ],
    limitations: [
      "Only responds to product and shopping queries",
      "Cannot process orders or payments",
      "Cannot access personal account information",
    ],
  });
});

module.exports = router;
