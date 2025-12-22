import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext, type CartItem } from '../context/CartContextType';
import { FaTrash, FaArrowLeft, FaHeart } from 'react-icons/fa';
import Recommendations from '../components/Recommendations';

interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  images?: (string | { url?: string })[];
  addedAt?: string;
}

const Checkout: React.FC = () => {
  const cartContext = useContext(CartContext);
  const navigate = useNavigate();
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [tryOnInputImage, setTryOnInputImage] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false);
  const [isBargainOpen, setIsBargainOpen] = useState(false);
  const [bargainAttempts, setBargainAttempts] = useState(3);
  const [offerInput, setOfferInput] = useState('');
  const [bargainMessages, setBargainMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [isProcessingOffer, setIsProcessingOffer] = useState(false);

  // Get the first item in cart (main product display)
  const mainProduct = cartContext?.cartItems?.[0];

  // Track bargained products in localStorage
  const BARGAINED_PRODUCTS_KEY = 'buyonix_bargained_products';

  // Track wishlist in localStorage
  const WISHLIST_KEY = 'buyonix_wishlist';

  const [isBargainCompleted, setIsBargainCompleted] = useState(() => {
    if (!mainProduct) return false;
    try {
      const bargainedProducts = localStorage.getItem(BARGAINED_PRODUCTS_KEY);
      if (bargainedProducts) {
        const productIds = JSON.parse(bargainedProducts);
        return productIds.includes(mainProduct._id);
      }
    } catch (error) {
      console.error('Error loading bargained products:', error);
    }
    return false;
  });

  const [isInWishlist, setIsInWishlist] = useState(() => {
    if (!mainProduct) return false;
    try {
      const wishlist = localStorage.getItem(WISHLIST_KEY);
      if (wishlist) {
        const wishlistItems: WishlistItem[] = JSON.parse(wishlist);
        return wishlistItems.some((item: WishlistItem) => item._id === mainProduct._id);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
    return false;
  });

  // Update bargain completed state when product changes
  useEffect(() => {
    if (!mainProduct) {
      setIsBargainCompleted(false);
      return;
    }

    try {
      const bargainedProducts = localStorage.getItem(BARGAINED_PRODUCTS_KEY);
      if (bargainedProducts) {
        const productIds = JSON.parse(bargainedProducts);
        setIsBargainCompleted(productIds.includes(mainProduct._id));
      } else {
        setIsBargainCompleted(false);
      }
    } catch (error) {
      console.error('Error checking bargained products:', error);
      setIsBargainCompleted(false);
    }

    // Also check wishlist when product changes
    try {
      const wishlist = localStorage.getItem(WISHLIST_KEY);
      if (wishlist) {
        const wishlistItems: WishlistItem[] = JSON.parse(wishlist);
        setIsInWishlist(wishlistItems.some((item: WishlistItem) => item._id === mainProduct._id));
      } else {
        setIsInWishlist(false);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
      setIsInWishlist(false);
    }
  }, [mainProduct]);


  if (!cartContext) {
    return null;
  }

  const { cartItems, removeFromCart, updateQuantity, updatePrice } = cartContext;

  // Helper function to mark product as bargained
  const markProductAsBargained = (productId: string) => {
    try {
      const bargainedProducts = localStorage.getItem(BARGAINED_PRODUCTS_KEY);
      const productIds: string[] = bargainedProducts ? JSON.parse(bargainedProducts) : [];

      if (!productIds.includes(productId)) {
        productIds.push(productId);
        localStorage.setItem(BARGAINED_PRODUCTS_KEY, JSON.stringify(productIds));
      }

      setIsBargainCompleted(true);
    } catch (error) {
      console.error('Error saving bargained product:', error);
    }
  };

  // Helper function to check if a product is bargained
  const isProductBargained = (productId: string): boolean => {
    try {
      const bargainedProducts = localStorage.getItem(BARGAINED_PRODUCTS_KEY);
      if (bargainedProducts) {
        const productIds: string[] = JSON.parse(bargainedProducts);
        return productIds.includes(productId);
      }
    } catch (error) {
      console.error('Error checking bargained products:', error);
    }
    return false;
  };

  // Helper function to check if a product is in wishlist
  const isProductInWishlist = (productId: string): boolean => {
    try {
      const wishlist = localStorage.getItem(WISHLIST_KEY);
      if (wishlist) {
        const wishlistItems: WishlistItem[] = JSON.parse(wishlist);
        return wishlistItems.some((item: WishlistItem) => item._id === productId);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
    return false;
  };

  // Helper function to toggle wishlist for any product
  const toggleWishlistForProduct = (product: CartItem) => {
    try {
      const wishlist = localStorage.getItem(WISHLIST_KEY);
      let wishlistItems: WishlistItem[] = wishlist ? JSON.parse(wishlist) : [];
      const isInWishlist = isProductInWishlist(product._id);

      if (isInWishlist) {
        // Remove from wishlist
        wishlistItems = wishlistItems.filter(item => item._id !== product._id);
        alert('✓ Removed from Wishlist');
      } else {
        // Add to wishlist
        wishlistItems.push({
          _id: product._id,
          name: product.name,
          price: product.price,
          images: product.images,
          addedAt: new Date().toISOString()
        });
        alert('✓ Added to Wishlist!');
      }

      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems));
      
      // Update state for main product if it's the one being toggled
      if (mainProduct && product._id === mainProduct._id) {
        setIsInWishlist(!isInWishlist);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      alert('Error updating wishlist');
    }
  };

  // Helper function to add/remove from wishlist (for main product - kept for compatibility)
  const toggleWishlist = () => {
    if (!mainProduct) return;
    toggleWishlistForProduct(mainProduct);
  };

  const handleVirtualTryOnClick = () => {
    setIsTryOnOpen(true);
    setTryOnResult(null);
  };

  const handleTryOnPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setTryOnInputImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateVirtualTryOn = () => {
    if (!tryOnInputImage) {
      alert('Please upload your photo to generate the try-on preview.');
      return;
    }
    setIsGeneratingTryOn(true);

    // Frontend-only mock generation
    setTimeout(() => {
      setTryOnResult(tryOnInputImage);
      setIsGeneratingTryOn(false);
    }, 1500);
  };

  // Store the current product being bargained
  const [currentBargainProduct, setCurrentBargainProduct] = useState<CartItem | null>(null);

  const handleSmartBargainingClick = (product: CartItem) => {
    if (!product) return;
    
    // Store the product being bargained
    setCurrentBargainProduct(product);
    setIsBargainOpen(true);
    setBargainAttempts(3);
    setOfferInput('');
    setIsProcessingOffer(false);
    setBargainMessages([
      {
        sender: 'ai',
        text: "Try your offer, let's see if the AI agrees!",
      },
    ]);
  };

  const closeBargainModal = () => {
    setIsBargainOpen(false);
    setOfferInput('');
    setIsProcessingOffer(false);
  };

  const handleSendOffer = async () => {
    const product = currentBargainProduct || mainProduct;
    if (!product || isProcessingOffer) return;
    if (bargainAttempts <= 0) {
      alert('No bargaining attempts left. Please try again later.');
      return;
    }

    const offerValue = parseFloat(offerInput);
    if (Number.isNaN(offerValue) || offerValue <= 0) {
      alert('Please enter a valid amount in $.');
      return;
    }

    // Add user message to chat
    setBargainMessages((prev) => [...prev, { sender: 'user', text: `$${offerValue.toFixed(2)}` }]);
    setOfferInput('');
    setIsProcessingOffer(true);

    try {
      // Call AI bargaining API
      const response = await fetch('http://localhost:5000/bargain/negotiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: product.name,
          originalPrice: product.price,
          userOffer: offerValue,
          attemptNumber: 4 - bargainAttempts, // Convert remaining to attempt number
          conversationHistory: bargainMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }))
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add AI response to chat
        setBargainMessages((prev) => [...prev, { sender: 'ai', text: data.aiResponse }]);

        // Update attempts
        if (data.accepted) {
          setBargainAttempts(0);
          markProductAsBargained(product._id); // Lock bargaining and save to localStorage

          // Update the product price in cart if deal accepted
          if (data.finalPrice && data.finalPrice < product.price) {
            // Update the price in the cart
            updatePrice(product._id, data.finalPrice);

            // Show success message
            setTimeout(() => {
              alert(`🎉 Congratulations! Price updated to $${data.finalPrice.toFixed(2)} (${data.discountPercentage}% off)`);
            }, 500);
          }
        } else {
          setBargainAttempts((prev) => Math.max(0, prev - 1));
        }
      } else {
        throw new Error(data.error || 'Bargaining failed');
      }
    } catch (error) {
      console.error('Bargaining error:', error);

      // Fallback to tiered discount logic if API fails
      let maxDiscountPercent;
      let targetDiscountPercent;

      if (product.price < 50) {
        maxDiscountPercent = 0.05;
        targetDiscountPercent = 0.03;
      } else if (product.price >= 50 && product.price <= 100) {
        maxDiscountPercent = 0.10;
        targetDiscountPercent = 0.07;
      } else {
        maxDiscountPercent = 0.15;
        targetDiscountPercent = 0.12;
      }

      const targetPrice = product.price * (1 - targetDiscountPercent);
      const minPrice = product.price * (1 - maxDiscountPercent);
      let aiResponse = '';
      let accepted = false;
      let finalPrice = product.price;

      if (offerValue >= product.price) {
        aiResponse = 'Great! Your offer matches the listing price. Deal accepted. 🎉';
        accepted = true;
        finalPrice = offerValue;
      } else if (offerValue >= targetPrice) {
        aiResponse = `Deal accepted! You can buy it for $${offerValue.toFixed(2)}. 🤝`;
        accepted = true;
        finalPrice = offerValue;
      } else if (bargainAttempts - 1 <= 0) {
        aiResponse = `Looks like we can only go as low as $${minPrice.toFixed(2)}. Offer accepted at that price. ✨`;
        accepted = true;
        finalPrice = minPrice;
      } else {
        aiResponse = `Hmm, that's a bit low. Can you try something closer to $${targetPrice.toFixed(2)}? 💰`;
      }

      setBargainMessages((prev) => [...prev, { sender: 'ai', text: aiResponse }]);
      setBargainAttempts((prev) => (accepted ? 0 : Math.max(0, prev - 1)));

      // Update price in fallback mode too
      if (accepted && finalPrice < product.price) {
        markProductAsBargained(product._id); // Lock bargaining and save to localStorage
        updatePrice(product._id, finalPrice);
        setTimeout(() => {
          const discount = ((product.price - finalPrice) / product.price * 100).toFixed(1);
          alert(`🎉 Congratulations! Price updated to $${finalPrice.toFixed(2)} (${discount}% off)`);
        }, 500);
      }
    } finally {
      setIsProcessingOffer(false);
    }
  };

  // Redirect to home if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add items to proceed to checkout</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* All Cart Items - Equal Size Display */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</h2>
          
          <div className="space-y-4">
            {cartItems.map((item) => (
              <React.Fragment key={item._id}>
                <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                  <div className="flex gap-5 items-center">
                    {/* Product Image - Equal Size for All */}
                    <div className="flex-shrink-0">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={typeof item.images[0] === 'string' ? item.images[0] : (item.images[0] as { url?: string })?.url || ''}
                          alt={item.name}
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded-lg border border-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.name}</h3>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-teal-600 font-bold text-xl">${item.price.toFixed(2)}</span>
                            <span className="text-sm text-gray-500">each</span>
                          </div>
                        </div>
                        
                        {/* Remove Button - Top Right */}
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Remove from cart"
                        >
                          <FaTrash className="text-lg" />
                        </button>
                      </div>

                      {/* Quantity Controls and Total */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Quantity:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                          <button
                            onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="px-5 py-2 font-medium border-l border-r border-gray-300 min-w-[3.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <div className="ml-auto">
                          <span className="text-sm text-gray-600">Subtotal: </span>
                          <span className="font-bold text-teal-600 text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Bargained and Wishlist Buttons for Each Item */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSmartBargainingClick(item)}
                            disabled={isProductBargained(item._id)}
                            className={`px-4 py-2 border text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${isProductBargained(item._id)
                              ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'border-teal-600 text-teal-600 hover:bg-teal-50'
                              }`}
                          >
                            {isProductBargained(item._id) ? '✓ Bargained' : 'Smart Bargaining'}
                          </button>
                          <button
                            onClick={() => toggleWishlistForProduct(item)}
                            className={`px-4 py-2 border text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${isProductInWishlist(item._id)
                              ? 'border-red-300 bg-red-50 text-red-600'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                              }`}
                          >
                            <FaHeart style={{ fill: isProductInWishlist(item._id) ? 'currentColor' : 'none' }} /> 
                            {isProductInWishlist(item._id) ? 'Saved' : 'Wishlist'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
          
          {/* Single Buy Now Button - Below Entire Cart */}
          <div className="mt-6">
            <button
              onClick={() => {
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                if (!isLoggedIn) {
                  localStorage.setItem('redirectAfterLogin', '/buy-now');
                  alert('Please login or create an account to place an order.');
                  navigate('/login');
                } else {
                  navigate('/buy-now');
                }
              }}
              className="w-full bg-teal-600 text-white font-bold py-4 rounded-lg hover:bg-teal-700 transition-colors text-lg"
            >
              Buy Now
            </button>
          </div>
        </div>

        {/* Personalized Recommendations (Same as Home Page) */}
        <Recommendations />
      </div>
      {isTryOnOpen && mainProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-10">
          <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b bg-gradient-to-r from-white to-teal-50">
              <div>
                <p className="text-sm uppercase tracking-widest text-gray-400 font-semibold">Virtual Try-On Experience</p>
                <h3 className="text-2xl font-bold text-gray-900">Upload Your Photo & See How It Looks On You!</h3>
              </div>
              <button
                onClick={() => setIsTryOnOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xl"
                aria-label="Close virtual try-on"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-8 py-10 bg-gray-50">
              {/* Upload Photo */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-3xl text-teal-500 mb-4">
                  ⬆️
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Upload Your Photo</h4>
                <p className="text-sm text-gray-500 mb-6">Upload a clear photo of yourself</p>
                <label className="w-full">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleTryOnPhotoUpload}
                  />
                  <span className="inline-flex w-full justify-center rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-teal-600 font-medium cursor-pointer hover:bg-teal-100">
                    Choose Photo
                  </span>
                </label>
                {tryOnInputImage && (
                  <div className="mt-4 w-full">
                    <p className="text-xs text-gray-500 mb-2 text-left">Selected photo:</p>
                    <div className="w-full h-44 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                      <img src={tryOnInputImage} alt="Uploaded preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Item */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Selected Item</h4>
                <div className="rounded-2xl overflow-hidden border border-gray-50 bg-gray-100 mb-4">
                  {mainProduct.images && mainProduct.images.length > 0 ? (
                    <img
                      src={typeof mainProduct.images[0] === 'string'
                        ? mainProduct.images[0]
                        : (mainProduct.images[0] as { url?: string })?.url || ''}
                      alt={mainProduct.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-gray-400 text-sm">
                      No preview image
                    </div>
                  )}
                </div>
                <p className="text-base font-semibold text-gray-800">{mainProduct.name}</p>
                <p className="text-sm text-gray-500">$ {mainProduct.price.toFixed(2)}</p>
              </div>

              {/* AI Result */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-3xl text-emerald-500 mb-4">
                  ✨
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">AI Generated Result</h4>
                <p className="text-sm text-gray-500 mb-6">Your virtual try-on will appear here</p>
                <div className="w-full h-48 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center bg-gray-50 mb-6 overflow-hidden">
                  {isGeneratingTryOn ? (
                    <div className="flex flex-col items-center text-sm text-gray-500">
                      <span className="w-10 h-10 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mb-3" />
                      Generating preview...
                    </div>
                  ) : tryOnResult ? (
                    <img src={tryOnResult} alt="Virtual try-on result" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 text-sm px-4">
                      Upload your photo and click generate to preview the product virtually.
                    </div>
                  )}
                </div>
                <button
                  onClick={handleGenerateVirtualTryOn}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-400 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  {isGeneratingTryOn ? 'Generating...' : 'Generate Virtual Try-On'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isBargainOpen && currentBargainProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-10">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b bg-gradient-to-r from-white to-emerald-50">
              <div>
                <p className="text-sm uppercase tracking-widest text-gray-400 font-semibold">Bargain with AI</p>
                <h3 className="text-2xl font-bold text-gray-900">Let's Make a Deal - Smart Pricing Just for You!</h3>
              </div>
              <button
                onClick={closeBargainModal}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xl"
                aria-label="Close bargaining modal"
              >
                ×
              </button>
            </div>

            <div className="px-8 py-8 space-y-6 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100">
                    {currentBargainProduct.images && currentBargainProduct.images.length > 0 ? (
                      <img
                        src={typeof currentBargainProduct.images[0] === 'string'
                          ? currentBargainProduct.images[0]
                          : (currentBargainProduct.images[0] as { url?: string })?.url || ''}
                        alt={currentBargainProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Product ID: {currentBargainProduct._id}</p>
                    <h4 className="text-xl font-semibold text-gray-900">{currentBargainProduct.name}</h4>
                    <p className="text-sm text-gray-500">Original Price</p>
                    <p className="text-2xl font-bold text-teal-600">$ {currentBargainProduct.price.toFixed(0)}</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">Bargaining Attempts</p>
                  <div className="flex items-center justify-center gap-3">
                    {Array.from({ length: 3 }).map((_, index) => {
                      const attemptAvailable = bargainAttempts >= 3 - index;
                      return (
                        <span
                          key={index}
                          className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xl ${attemptAvailable ? 'border-teal-500 text-teal-500' : 'border-gray-200 text-gray-300'
                            }`}
                        >
                          ✓
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {bargainAttempts > 0 ? `${bargainAttempts} attempt(s) left` : 'Bargain locked in'}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="h-64 overflow-y-auto space-y-4">
                  {bargainMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.sender === 'ai'
                          ? 'bg-gray-100 text-gray-700 rounded-bl-none'
                          : 'bg-teal-600 text-white rounded-br-none'
                          }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {bargainMessages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm">Start bargaining to see messages here.</div>
                  )}
                </div>
                <div className="mt-6 flex flex-col md:flex-row gap-3">
                  <input
                    type="number"
                    placeholder="Enter your offer in $..."
                    value={offerInput}
                    onChange={(e) => setOfferInput(e.target.value)}
                    disabled={bargainAttempts === 0}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                  />
                  <button
                    onClick={handleSendOffer}
                    disabled={bargainAttempts === 0 || isProcessingOffer}
                    className="w-full md:w-40 bg-teal-500 text-white font-semibold rounded-xl px-4 py-3 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {isProcessingOffer ? 'Processing...' : 'Send Offer'}
                  </button>
                </div>
                {bargainAttempts === 0 && (
                  <p className="mt-3 text-xs text-gray-500">Offer accepted or attempts exhausted. Close the assistant to restart.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
