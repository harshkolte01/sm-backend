const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    commentsCount: {
        type: Number,
        default: 0
    },
    edited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index on createdAt (descending sort)
postSchema.index({ createdAt: -1 });

// Index on user for user-specific queries
postSchema.index({ user: 1 });

module.exports = mongoose.model('Post', postSchema);