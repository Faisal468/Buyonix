const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ChatMessage {
  message: string;
  userId?: string;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  type: 'product_help' | 'redirect' | 'error';
  productsFound?: number;
  error?: string;
  chatId?: string;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastActivity: string;
  totalMessages: number;
  productQueriesCount: number;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: Array<{
    _id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: string;
    responseType: string;
    productsFound: number;
  }>;
  lastActivity: string;
  totalMessages: number;
  productQueriesCount: number;
  createdAt: string;
  updatedAt: string;
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
  static async sendMessage(message: string, userId?: string, sessionId?: string): Promise<ChatResponse> {
    try {
      const url = `${API_BASE_URL}/chatbot/chat`;
      console.log('Sending message to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message,
          userId,
          sessionId
        }),
      });

      console.log('Chatbot response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chatbot API error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Chatbot response data:', data);
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

  /**
   * Generate or get session ID for anonymous users
   */
  static getSessionId(): string {
    const storageKey = 'buyonix_chat_session';
    let sessionId = localStorage.getItem(storageKey);
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, sessionId);
    }
    
    return sessionId;
  }

  /**
   * Get chat history for current user
   */
  static async getChatHistory(userId?: string, limit: number = 10, page: number = 1): Promise<{
    success: boolean;
    chats: ChatHistoryItem[];
    pagination?: any;
    error?: string;
  }> {
    try {
      const userIdentifier = userId || this.getSessionId();
      const response = await fetch(
        `${API_BASE_URL}/chatbot/history/${encodeURIComponent(userIdentifier)}?limit=${limit}&page=${page}`,
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
      console.error('Chat history error:', error);
      return {
        success: false,
        chats: [],
        error: error instanceof Error ? error.message : 'Failed to load chat history'
      };
    }
  }

  /**
   * Get specific chat conversation
   */
  static async getChatConversation(chatId: string): Promise<{
    success: boolean;
    chat?: ChatConversation;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/conversation/${chatId}`, {
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
      console.error('Chat conversation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load conversation'
      };
    }
  }

  /**
   * Delete a chat conversation
   */
  static async deleteChatConversation(chatId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/conversation/${chatId}`, {
        method: 'DELETE',
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
      console.error('Delete conversation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete conversation'
      };
    }
  }

  /**
   * Clear all chat history for current user
   */
  static async clearChatHistory(userId?: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const userIdentifier = userId || this.getSessionId();
      const response = await fetch(
        `${API_BASE_URL}/chatbot/history/${encodeURIComponent(userIdentifier)}`,
        {
          method: 'DELETE',
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
      console.error('Clear history error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear chat history'
      };
    }
  }
}

export default ChatbotService;