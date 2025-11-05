const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    roomRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    socketId: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['host', 'member'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    leftAt: Date,
    disconnectedAt: Date,
    userSnapshot: {
        displayName: {
            type: String,
            required: true
        },
        avatarUrl: String
    },
    mediaState: {
        audio: {
            type: Boolean,
            default: true
        },
        video: {
            type: Boolean,
            default: true
        },
        screen: {
            type: Boolean,
            default: false
        }
    },
    deviceInfo: {
        userAgent: String,
        platform: String
    }
}, {
    timestamps: true
});

// Indexes
sessionSchema.index({ roomRef: 1, leftAt: 1 });
sessionSchema.index({ roomRef: 1, disconnectedAt: 1 });
sessionSchema.index({ socketId: 1 });

module.exports = mongoose.model('Session', sessionSchema);
