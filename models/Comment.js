const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    edited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index on post for fast comment retrieval
commentSchema.index({ post: 1 });

module.exports = mongoose.model('Comment', commentSchema);