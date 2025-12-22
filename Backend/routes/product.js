const router = require("express").Router();
const Product = require('../models/product');
const User = require('../models/User');
const Seller = require('../models/seller');
const Interaction = require('../models/interaction');
const CFRecommender = require('../utils/cfRecommender');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const imageHash = require('image-hash');
const crypto = require('crypto');
const axios = require('axios');

// Initialize CF recommender
const cfRecommender = new CFRecommender();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all products (for frontend home page) with pagination
router.get("/", async (req, res) => {
    try {
        // Get page and limit from query parameters, with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        // Validate parameters
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: "Invalid page or limit parameters"
            });
        }
        
        // Calculate skip value
        const skip = (page - 1) * limit;
        
        // Get total count of active products
        const totalProducts = await Product.countDocuments({ status: 'active' });
        
        // Fetch products with pagination
        const products = await Product.find({ status: 'active' })
            .populate('sellerId', 'storeName businessName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        // Calculate total pages
        const totalPages = Math.ceil(totalProducts / limit);
        
        res.status(200).json({
            success: true,
            products: products,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalProducts: totalProducts,
                limit: limit,
                hasNextPage: page < totalPages
            }
        });
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching products"
        });
    }
});

// Get products by seller
router.get("/seller/:sellerId", async (req, res) => {
    try {
        const { sellerId } = req.params;
        const products = await Product.find({ sellerId })
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            products: products
        });
    } catch (error) {
        console.error("Get seller products error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching seller products"
        });
    }
});

// Get single product by ID
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('sellerId', 'storeName businessName');
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        res.status(200).json({
            success: true,
            product: product
        });
    } catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching product"
        });
    }
});

// Create new product
router.post("/", async (req, res) => {
    try {
        const {
            sellerId,
            name,
            description,
            category,
            price,
            originalPrice,
            discount,
            stock,
            images
        } = req.body;
        
        // Verify seller exists and is approved
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller not found"
            });
        }
        
        if (seller.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: "Seller account must be approved to add products"
            });
        }
        
        // Calculate discount if originalPrice is provided
        let calculatedDiscount = discount || 0;
        if (originalPrice && originalPrice > price) {
            calculatedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
        }
        
        const product = new Product({
            sellerId,
            name,
            description,
            category,
            price,
            originalPrice: originalPrice || price,
            discount: calculatedDiscount,
            stock,
            images: images || [],
            status: stock > 0 ? 'active' : 'out_of_stock'
        });
        
        await product.save();
        
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: product
        });
    } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error creating product"
        });
    }
});

// Update product
router.put("/:id", async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            price,
            originalPrice,
            discount,
            stock,
            images,
            status
        } = req.body;
        
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        // Update fields
        if (name) product.name = name;
        if (description) product.description = description;
        if (category) product.category = category;
        if (price !== undefined) product.price = price;
        if (originalPrice !== undefined) product.originalPrice = originalPrice;
        if (discount !== undefined) product.discount = discount;
        if (stock !== undefined) {
            product.stock = stock;
            // Auto-update status based on stock only if status is not explicitly provided
            if (status === undefined) {
                if (stock === 0 && product.status === 'active') {
                    product.status = 'out_of_stock';
                } else if (stock > 0 && product.status === 'out_of_stock') {
                    product.status = 'active';
                }
            }
        }
        if (images) product.images = images;
        if (status !== undefined) product.status = status;
        
        // Recalculate discount if prices changed
        if (originalPrice && price && originalPrice > price) {
            product.discount = Math.round(((originalPrice - price) / originalPrice) * 100);
        }
        
        await product.save();
        
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: product
        });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating product"
        });
    }
});

// Delete product
router.delete("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting product"
        });
    }
});

// Get AI-powered personalized recommendations for a user
// Uses Collaborative Filtering (Matrix Factorization)
router.get("/recommendations/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const numRecommendations = parseInt(req.query.num) || 5;

        // Initialize CF model on first call
        if (!cfRecommender.modelReady) {
            await cfRecommender.initialize();
        }

        // Get recommendations from CF model
        if (!cfRecommender.modelReady) {
            // CF model not available, return popular products as fallback
            const popularProducts = await Product.find({ status: 'active' })
                .populate('sellerId', 'storeName businessName')
                .sort({ rating: -1 })
                .limit(numRecommendations);
            
            return res.json({
                success: true,
                recommendations: popularProducts,
                source: 'popular_products_fallback'
            });
        }

        // Get CF recommendations (based on user's purchase/cart history from MongoDB Atlas)
        const cfRecs = await cfRecommender.recommendForUser(userId, numRecommendations);
        
        // Fetch actual product details from database
        const recommendations = [];
        
        for (const rec of cfRecs) {
            // Find product by ID (these are real MongoDB ObjectIds from interactions)
            const product = await Product.findById(rec.productId)
                .populate('sellerId', 'storeName businessName');
            
            if (product) {
                recommendations.push({
                    ...product.toObject(),
                    predictedRating: rec.predictedRating,
                    reason: rec.reason || 'Based on products you bought and similar users'
                });
            }
        }

        // If CF didn't return enough recommendations, fill with popular products
        if (recommendations.length < numRecommendations) {
            const existingIds = new Set(recommendations.map(r => r._id.toString()));
            const popularProducts = await Product.find({ 
                status: 'active',
                _id: { $nin: Array.from(existingIds) }
            })
                .populate('sellerId', 'storeName businessName')
                .sort({ rating: -1, createdAt: -1 })
                .limit(numRecommendations - recommendations.length);
            
            popularProducts.forEach(product => {
                recommendations.push({
                    ...product.toObject(),
                    reason: 'Popular products you might like'
                });
            });
        }

        res.json({
            success: true,
            count: recommendations.length,
            recommendations,
            source: recommendations.length > cfRecs.length ? 'collaborative_filtering_ai_with_fallback' : 'collaborative_filtering_ai'
        });

    } catch (error) {
        console.error("Get recommendations error:", error);
        res.status(500).json({
            success: false,
            message: "Error getting recommendations",
            error: error.message
        });
    }
});

// Get model statistics (for debugging/reporting)
router.get("/ai/model-stats", async (req, res) => {
    try {
        if (!cfRecommender.modelReady) {
            await cfRecommender.initialize();
        }

        const stats = await cfRecommender.getModelStats();

        res.json({
            success: true,
            model: {
                type: 'Collaborative Filtering (SVD)',
                status: cfRecommender.modelReady ? 'ready' : 'not_ready',
                ...stats
            }
        });

    } catch (error) {
        console.error("Get model stats error:", error);
        res.status(500).json({
            success: false,
            message: "Error getting model statistics"
        });
    }
});

// Debug endpoint to check model training status and actual user/product counts
router.get("/ai/debug", async (req, res) => {
    try {
        // Get actual counts from database
        const actualUserCount = await User.countDocuments({});
        const actualProductCount = await Product.countDocuments({ status: 'active' });
        
        // Get model stats
        let modelStats = {};
        try {
            modelStats = await cfRecommender.getModelStats();
        } catch (error) {
            modelStats = { error: error.message };
        }

        res.json({
            success: true,
            debug: {
                // Actual database counts
                database: {
                    actualUsers: actualUserCount,
                    actualProducts: actualProductCount
                },
                // Model status
                model: {
                    isReady: cfRecommender.modelReady,
                    ...modelStats
                },
                // Comparison
                comparison: {
                    userCountMatch: actualUserCount === modelStats.n_users,
                    productCountMatch: actualProductCount === modelStats.n_products,
                    modelNeedsRetraining: actualUserCount !== modelStats.n_users || actualProductCount !== modelStats.n_products,
                    message: actualUserCount === modelStats.n_users && actualProductCount === modelStats.n_products 
                        ? '✅ Model is in sync with database' 
                        : '⚠️ Model needs retraining - counts don\'t match!'
                },
                // File status
                modelFile: {
                    exists: fs.existsSync(path.join(__dirname, '..', 'ai_models', 'cf_model.pkl')),
                    path: path.join(__dirname, '..', 'ai_models', 'cf_model.pkl')
                }
            }
        });

    } catch (error) {
        console.error("Get debug info error:", error);
        res.status(500).json({
            success: false,
            message: "Error getting debug information",
            error: error.message
        });
    }
});

// Get related products for checkout page based on user history
// Returns products similar to what the user has interacted with
router.get("/related/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const numProducts = parseInt(req.query.num) || 5;

        // Initialize CF model on first call
        if (!cfRecommender.modelReady) {
            await cfRecommender.initialize();
        }

        // Get personalized recommendations from CF model
        let relatedProducts = [];
        
        if (cfRecommender.modelReady) {
            try {
                // Get recommendations from CF model
                const cfRecs = await cfRecommender.recommendForUser(userId, numProducts);
                
                // Fetch actual product details from database
                for (const rec of cfRecs) {
                    const product = await Product.findById(rec.productId)
                        .populate('sellerId', 'storeName businessName');
                    
                    if (product) {
                        relatedProducts.push({
                            ...product.toObject(),
                            predictedRating: rec.predictedRating,
                            reason: 'Based on your shopping history'
                        });
                    }
                }
            } catch (cfError) {
                console.warn('CF model error, falling back to category-based:', cfError.message);
            }
        }

        // If CF didn't work or returned few results, add category-based recommendations
        if (relatedProducts.length < numProducts) {
            try {
                const categoryProducts = await Product.find({ status: 'active' })
                    .populate('sellerId', 'storeName businessName')
                    .sort({ rating: -1, createdAt: -1 })
                    .limit(numProducts - relatedProducts.length);
                
                // Avoid duplicates
                const existingIds = new Set(relatedProducts.map(p => p._id.toString()));
                const newProducts = categoryProducts.filter(p => !existingIds.has(p._id.toString()));
                
                relatedProducts = relatedProducts.concat(newProducts.map(p => ({
                    ...p.toObject(),
                    reason: 'Popular in your preferred categories'
                })));
            } catch (error) {
                console.warn('Error fetching category-based products:', error.message);
            }
        }

        res.json({
            success: true,
            count: relatedProducts.length,
            relatedProducts,
            source: cfRecommender.modelReady ? 'collaborative_filtering_ai' : 'popularity_based'
        });

    } catch (error) {
        console.error("Get related products error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching related products",
            error: error.message
        });
    }
});

/**
 * POST /product/ai/retrain
 * Manually retrain the AI recommendation model
 * Perfect for FYP demo - examiner can see model being retrained in real-time
 * 
 * Usage:
 * curl -X POST http://localhost:5000/product/ai/retrain
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Model retrained with current database counts",
 *   "stats": {
 *     "n_users": 10,
 *     "n_products": 47,
 *     "training_date": "2025-12-21T16:30:00.000000"
 *   }
 * }
 */
router.post("/ai/retrain", async (req, res) => {
    try {
        console.log(' Retrain request received');
        const result = await cfRecommender.retrain();
        
        res.status(200).json({
            success: true,
            message: " Model retrained successfully",
            timestamp: new Date().toISOString(),
            stats: result.stats
        });
    } catch (error) {
        console.error(' Retrain failed:', error.message);
        res.status(500).json({
            success: false,
            message: "Failed to retrain model",
            error: error.message
        });
    }
});

/**
 * POST /product/:productId/view
 * Track when a user views a product
 * 
 * Body: { userId: "user_id" }
 * This is used by CF algorithm to learn user preferences
 */
router.post("/:productId/view", async (req, res) => {
    try {
        const { productId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }
        
        // Create interaction record
        const interaction = new Interaction({
            userId: userId,
            productId: productId,
            action: 'view',
            weight: 1
        });
        
        await interaction.save();
        
        res.status(200).json({
            success: true,
            message: "Product view tracked",
            interaction: {
                action: 'view',
                weight: 1
            }
        });
    } catch (error) {
        console.error('Error tracking product view:', error);
        res.status(500).json({
            success: false,
            message: "Error tracking product view",
            error: error.message
        });
    }
});

/**
 * POST /product/:productId/cart
 * Track when a user adds product to cart
 * Weight: 2 points (stronger signal than view)
 */
router.post("/:productId/cart", async (req, res) => {
    try {
        const { productId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }
        
        const interaction = new Interaction({
            userId: userId,
            productId: productId,
            action: 'cart',
            weight: 2
        });
        
        await interaction.save();
        
        res.status(200).json({
            success: true,
            message: "Cart interaction tracked",
            interaction: {
                action: 'cart',
                weight: 2
            }
        });
    } catch (error) {
        console.error('Error tracking cart interaction:', error);
        res.status(500).json({
            success: false,
            message: "Error tracking cart interaction",
            error: error.message
        });
    }
});

/**
 * POST /product/:productId/save
 * Track when a user saves/likes a product
 * Weight: 3 points (strong signal of interest)
 */
router.post("/:productId/save", async (req, res) => {
    try {
        const { productId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }
        
        const interaction = new Interaction({
            userId: userId,
            productId: productId,
            action: 'save',
            weight: 3
        });
        
        await interaction.save();
        
        res.status(200).json({
            success: true,
            message: "Save interaction tracked",
            interaction: {
                action: 'save',
                weight: 3
            }
        });
    } catch (error) {
        console.error('Error tracking save interaction:', error);
        res.status(500).json({
            success: false,
            message: "Error tracking save interaction",
            error: error.message
        });
    }
});

/**
 * POST /product/:productId/purchase
 * Track when a user purchases a product and leaves a rating
 * Weight: 5 + rating*2 (strongest signal)
 * 
 * Body: { userId: "user_id", rating: 4 }
 * Rating is optional (1-5 stars)
 */
router.post("/:productId/purchase", async (req, res) => {
    try {
        const { productId } = req.params;
        const { userId, rating } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }
        
        let weight = 5;
        if (rating) {
            weight += rating * 2; // Rating 5 = +10 bonus
        }
        
        const interaction = new Interaction({
            userId: userId,
            productId: productId,
            action: 'purchase',
            rating: rating || null,
            weight: weight
        });
        
        await interaction.save();
        
        res.status(200).json({
            success: true,
            message: "Purchase interaction tracked",
            interaction: {
                action: 'purchase',
                rating: rating || null,
                weight: weight
            }
        });
    } catch (error) {
        console.error('Error tracking purchase:', error);
        res.status(500).json({
            success: false,
            message: "Error tracking purchase",
            error: error.message
        });
    }
});

/**
 * GET /product/interactions/summary
 * Get summary of all interactions (for admin/debugging)
 * Shows total interactions by type
 */
router.get("/interactions/summary", async (req, res) => {
    try {
        const summary = await Interaction.aggregate([
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 },
                    avgWeight: { $avg: '$weight' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        const totalInteractions = await Interaction.countDocuments();
        const uniqueUsers = await Interaction.distinct('userId');
        const uniqueProducts = await Interaction.distinct('productId');
        
        res.status(200).json({
            success: true,
            summary: {
                totalInteractions,
                uniqueUsers: uniqueUsers.length,
                uniqueProducts: uniqueProducts.length,
                byAction: summary,
                // Include actual user IDs for testing
                userIds: uniqueUsers.map(id => id.toString()).slice(0, 10) // First 10 user IDs
            }
        });
    } catch (error) {
        console.error('Error getting interaction summary:', error);
        res.status(500).json({
            success: false,
            message: "Error getting interaction summary",
            error: error.message
        });
    }
});

/**
 * POST /product/visual-search
 * Visual search endpoint - accepts image upload and finds similar products
 * Uses perceptual hashing to compare images
 */
router.post("/visual-search", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    // Process uploaded image with sharp first (resize and normalize)
    let processedImageBuffer;
    try {
      processedImageBuffer = await sharp(req.file.buffer)
        .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (error) {
      // If sharp fails, use original buffer
      processedImageBuffer = req.file.buffer;
    }

    // Generate hash for uploaded image
    // Save buffer to temp file for image-hash library (it requires file path)
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);
    fs.writeFileSync(tempFilePath, processedImageBuffer);

    const uploadedImageHash = await new Promise((resolve, reject) => {
      imageHash.imageHash(tempFilePath, 16, true, (error, hash) => {
        // Clean up temp file
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (cleanupError) {
          console.warn('Error cleaning up temp file:', cleanupError);
        }

        if (error) {
          console.error('Error generating hash for uploaded image:', error);
          reject(error);
        } else {
          resolve(hash);
        }
      });
    });

    // Get all active products with images
    const products = await Product.find({ 
      status: 'active',
      images: { $exists: true, $ne: [] }
    }).populate('sellerId', 'storeName businessName');

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products available in store",
        products: [],
        found: false
      });
    }

    // Calculate similarity for each product
    const productMatches = [];
    
    for (const product of products) {
      if (!product.images || product.images.length === 0) continue;

      let bestMatch = null;
      let bestSimilarity = 0;

      // Compare with all product images
      for (const imageUrl of product.images) {
        try {
          let imageBuffer;
          
          // Handle base64 images or URLs
          if (imageUrl.startsWith('data:image')) {
            // Base64 image
            const base64Data = imageUrl.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else {
            // URL image - fetch it
            const imageResponse = await axios.get(imageUrl, {
              responseType: 'arraybuffer',
              timeout: 5000
            });
            imageBuffer = Buffer.from(imageResponse.data);
          }

          // Process product image with sharp first
          let processedProductBuffer;
          try {
            processedProductBuffer = await sharp(imageBuffer)
              .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 90 })
              .toBuffer();
          } catch (error) {
            // If sharp fails, use original buffer
            processedProductBuffer = imageBuffer;
          }

          // Save buffer to temp file for image-hash library (it requires file path)
          const tempDir = path.join(__dirname, '..', 'temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          const productTempFilePath = path.join(tempDir, `product_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);
          fs.writeFileSync(productTempFilePath, processedProductBuffer);

          // Generate hash for product image
          const productImageHash = await new Promise((resolve, reject) => {
            imageHash.imageHash(productTempFilePath, 16, true, (error, hash) => {
              // Clean up temp file
              try {
                if (fs.existsSync(productTempFilePath)) {
                  fs.unlinkSync(productTempFilePath);
                }
              } catch (cleanupError) {
                console.warn('Error cleaning up temp file:', cleanupError);
              }

              if (error) {
                console.warn('Error generating hash for product image:', error);
                reject(error);
              } else {
                resolve(hash);
              }
            });
          });

          // Calculate Hamming distance (lower = more similar)
          const hammingDistance = calculateHammingDistance(uploadedImageHash, productImageHash);
          
          // Convert to similarity score (0-100, higher = more similar)
          // For 16-bit hash, max distance is 16
          const similarity = Math.max(0, (1 - hammingDistance / 16) * 100);

          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = {
              product: product.toObject(),
              similarity: similarity,
              matchedImage: imageUrl
            };
          }
        } catch (error) {
          // Skip images that can't be fetched
          console.warn(`Could not process image ${imageUrl}:`, error.message);
          continue;
        }
      }

      if (bestMatch && bestSimilarity > 25) { // Threshold: 25% similarity (lowered for better results)
        productMatches.push(bestMatch);
      }
    }

    // Sort by similarity (highest first)
    productMatches.sort((a, b) => b.similarity - a.similarity);

    // Return top 10 matches
    const topMatches = productMatches.slice(0, 10);

    if (topMatches.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Product not available in our store",
        products: [],
        found: false
      });
    }

    res.status(200).json({
      success: true,
      message: `Found ${topMatches.length} similar product(s)`,
      products: topMatches.map(m => ({
        ...m.product,
        similarity: Math.round(m.similarity),
        matchedImage: m.matchedImage
      })),
      found: true
    });

  } catch (error) {
    console.error("Visual search error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing visual search",
      error: error.message
    });
  }
});

/**
 * Helper function to calculate Hamming distance between two hashes
 */
function calculateHammingDistance(hash1, hash2) {
  if (hash1.length !== hash2.length) {
    return Math.max(hash1.length, hash2.length);
  }
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

module.exports = router;



