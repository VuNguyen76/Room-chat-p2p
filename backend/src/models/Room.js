const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        trim: true
    },
    maxParticipants: {
        type: Number,
        default: 6,
        min: 2,
        max: 10
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    memberCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastMessageAt: Date
}, {
    timestamps: true
});

// Indexes (roomId already has index: true, unique: true in schema)
roomSchema.index({ lastMessageAt: -1 });
roomSchema.index({ memberCount: -1 });

module.exports = mongoose.model('Room', roomSchema);
