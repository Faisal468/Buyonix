const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        enum: ['user', 'bot'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    responseType: {
        type: String,
        enum: ['product_help', 'redirect', 'error'],
        default: 'product_help'
    },
    productsFound: {
        type: Number,
        default: 0
    }
});

const chatSchema = new Schema({
    // User identification - can be userId or sessionId
    userId: {
        type: String,
        required: true,
        index: true
    },
    
    // Session identifier for anonymous users
    sessionId: {
        type: String,
        index: true
    },
    
    // Conversation messages
    messages: [messageSchema],
    
    // Chat metadata
    title: {
        type: String,
        default: 'Shopping Assistant Chat'
    },
    
    // Active status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Last activity timestamp
    lastActivity: {
        type: Date,
        default: Date.now
    },
    
    // User agent and IP for analytics (optional)
    userAgent: String,
    ipAddress: String,
    
    // Chat statistics
    totalMessages: {
        type: Number,
        default: 0
    },
    
    productQueriesCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Indexes for better query performance
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ sessionId: 1, createdAt: -1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ isActive: 1, lastActivity: -1 });

// Update lastActivity on message addition
chatSchema.pre('save', function(next) {
    if (this.messages && this.messages.length > 0) {
        this.lastActivity = new Date();
        this.totalMessages = this.messages.length;
        this.productQueriesCount = this.messages.filter(msg => 
            msg.sender === 'user' && msg.responseType === 'product_help'
        ).length;
    }
    next();
});

// Static method to find or create a chat session
chatSchema.statics.findOrCreateSession = async function(userId, sessionId = null) {
    try {
        // First try to find an active chat session
        let chat = await this.findOne({ 
            userId, 
            isActive: true 
        }).sort({ lastActivity: -1 });
        
        // If no active session or last activity was more than 24 hours ago, create new one
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (!chat || chat.lastActivity < oneDayAgo) {
            chat = new this({
                userId,
                sessionId: sessionId || new mongoose.Types.ObjectId().toString(),
                messages: [],
                title: 'Shopping Assistant Chat'
            });
            await chat.save();
        }
        
        return chat;
    } catch (error) {
        console.error('Error in findOrCreateSession:', error);
        throw error;
    }
};

// Instance method to add a message
chatSchema.methods.addMessage = async function(text, sender, responseType = 'product_help', productsFound = 0) {
    this.messages.push({
        text,
        sender,
        responseType,
        productsFound,
        timestamp: new Date()
    });
    
    // Generate a title from the first user message if it's still the default
    if (this.title === 'Shopping Assistant Chat' && sender === 'user' && this.messages.length <= 2) {
        // Create a title from the first few words of the first user message
        const words = text.split(' ').slice(0, 5);
        this.title = words.join(' ') + (text.split(' ').length > 5 ? '...' : '');
    }
    
    return await this.save();
};

// Instance method to get recent messages (for context)
chatSchema.methods.getRecentMessages = function(limit = 10) {
    return this.messages.slice(-limit);
};

// Static method to cleanup old inactive chats (utility for maintenance)
chatSchema.statics.cleanupOldChats = async function(daysOld = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return await this.deleteMany({ 
        lastActivity: { $lt: cutoffDate },
        isActive: false 
    });
};

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;