import React, { useState, useRef } from 'react';
import { FaTimes, FaCamera, FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface Product {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  images?: Array<string | { url?: string }>;
  sellerId?: string | { _id?: string; storeName?: string };
  rating?: number;
  reviewCount?: number;
  similarity?: number;
  matchedImage?: string;
}

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VisualSearchModal: React.FC<VisualSearchModalProps> = ({ isOpen, onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [found, setFound] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      alert('Please select an image first');
      return;
    }

    const file = fileInputRef.current.files[0];
    setLoading(true);
    setMessage(null);
    setProducts([]);
    setFound(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:5000/product/visual-search', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setFound(data.found);
        setMessage(data.message);
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        }
      } else {
        setFound(false);
        setMessage(data.message || 'Error performing visual search');
      }
    } catch (error) {
      console.error('Visual search error:', error);
      setFound(false);
      setMessage('Failed to perform visual search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setProducts([]);
    setMessage(null);
    setFound(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImageUrl = (images: Array<string | { url?: string }> | undefined): string => {
    if (!images || images.length === 0) return 'https://via.placeholder.com/300';
    const firstImage = images[0];
    return typeof firstImage === 'string' ? firstImage : firstImage.url || 'https://via.placeholder.com/300';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Visual Search</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Image Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Product Image
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 transition-colors"
              >
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <FaCamera className="text-3xl text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">Click to upload</span>
                  </div>
                )}
              </label>
              <div className="flex-1">
                <button
                  onClick={handleSearch}
                  disabled={!selectedImage || loading}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
                {selectedImage && (
                  <button
                    onClick={handleReset}
                    className="ml-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              found ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
            }`}>
              <p className="font-medium">{message}</p>
            </div>
          )}

          {/* Products Grid */}
          {products.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Similar Products ({products.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => {
                  const imageUrl = getImageUrl(product.images);
                  const discountPercent = product.discount && product.discount > 0 
                    ? `-${product.discount}%` 
                    : null;

                  return (
                    <Link
                      key={product._id}
                      to={`/product/${product._id}`}
                      onClick={onClose}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative h-48 bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {discountPercent && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            {discountPercent}
                          </div>
                        )}
                        {product.similarity && (
                          <div className="absolute top-2 right-2 bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded">
                            {Math.round(product.similarity)}% match
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {product.category && (
                          <div className="text-xs text-gray-500 mb-1 capitalize">
                            {product.category}
                          </div>
                        )}
                        <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                          {product.name}
                        </h4>
                        {product.rating && (
                          <div className="flex items-center mb-2">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-600 ml-1">
                              {product.rating.toFixed(1)} ({product.reviewCount || 0})
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-gray-900">
                              ${product.price?.toFixed(2) || 'N/A'}
                            </span>
                            {product.originalPrice && product.originalPrice > (product.price || 0) && (
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {found === false && products.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Product Not Available
              </h3>
              <p className="text-gray-600">
                We couldn't find this product in our store. Try uploading a different image or search by name.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualSearchModal;

