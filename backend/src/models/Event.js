const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    roomRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    sessionRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    eventType: {
        type: String,
        enum: ['join', 'leave', 'mute', 'unmute', 'video-off', 'video-on', 'screen-on', 'screen-off'],
        required: true,
        index: true
    },
    metadata: mongoose.Schema.Types.Mixed,
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

// Indexes (roomRef and eventType already have index: true in schema)
eventSchema.index({ roomRef: 1, createdAt: -1 });

module.exports = mongoose.model('Event', eventSchema);
