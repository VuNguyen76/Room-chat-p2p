const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    sessionRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    },
    content: {
        type: String,
        required: true
    },
    userSnapshot: {
        displayName: {
            type: String,
            required: true
        },
        avatarUrl: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
}, {
    timestamps: false
});

// Indexes (roomRef and sessionRef already have index: true in schema)
messageSchema.index({ roomRef: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
