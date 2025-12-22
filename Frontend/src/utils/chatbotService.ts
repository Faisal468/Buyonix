const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ChatMessage {
  message: string;
  userId?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  type: 'product_help' | 'redirect';
  productsFound?: number;
  error?: string;
}

export interface ProductSearchResult {
  success: boolean;
  products: Array<{
    _id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
    discount: number;
    images?: string[];
  }>;
  count: number;
  error?: string;
}

export interface ChatbotCapabilities {
  success: boolean;
  capabilities: string[];
  limitations: string[];
}

class ChatbotService {
  /**
   * Send a message to the chatbot and get AI-powered response
   */
  static async sendMessage(message: string, userId?: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message,
          userId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chatbot service error:', error);
      return {
        success: false,
        response: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        type: 'redirect',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search for products using the chatbot's search endpoint
   */
  static async searchProducts(query: string, limit: number = 5): Promise<ProductSearchResult> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/chatbot/products/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Product search error:', error);
      return {
        success: false,
        products: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Get chatbot capabilities and limitations
   */
  static async getCapabilities(): Promise<ChatbotCapabilities> {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/capabilities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Capabilities fetch error:', error);
      return {
        success: false,
        capabilities: [],
        limitations: ['Service temporarily unavailable']
      };
    }
  }

  /**
   * Check if a message is likely product-related (client-side pre-filter)
   */
  static isProductRelated(message: string): boolean {
    const productKeywords = [
      'product', 'price', 'buy', 'purchase', 'order', 'shop', 'item', 
      'category', 'discount', 'stock', 'available', 'search', 'find', 
      'looking for', 'recommend', 'best', 'cheap', 'expensive', 'deal',
      'sale', 'offer', 'smartphone', 'laptop', 'electronics', 'clothing',
      'book', 'home', 'garden', 'beauty', 'health', 'sports', 'toys'
    ];
    
    const lowerMessage = message.toLowerCase();
    return productKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Format product information for display in chat
   */
  static formatProductInfo(product: any): string {
    const discountText = product.discount > 0 ? ` (${product.discount}% off!)` : '';
    const stockText = product.stock > 0 ? 'In Stock' : 'Out of Stock';
    
    return `**${product.name}**\n` +
           `💰 $${product.price}${discountText}\n` +
           `📂 ${product.category}\n` +
           `📦 ${stockText}`;
  }

  /**
   * Get user ID from authentication context (if available)
   */
  static async getUserId(): Promise<string | undefined> {
    try {
      // This would typically come from your auth context
      // For now, return undefined to work without authentication
      return undefined;
    } catch (error) {
      return undefined;
    }
  }
}

export default ChatbotService;