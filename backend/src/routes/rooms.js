const express = require('express');
const router = express.Router();
const { Room, Message, Event } = require('../models');
const { nanoid } = require('nanoid');
const { validateCreateRoom, validateRoomId, validateMessageQuery } = require('../middleware/validation');
const { apiLimiter, createRoomLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to all routes
router.use(apiLimiter);

// POST /api/rooms - Create new room
router.post('/', createRoomLimiter, validateCreateRoom, async (req, res, next) => {
    try {
        const { title, maxParticipants, createdBy } = req.body;

        // Validate createdBy
        if (!createdBy || !createdBy.displayName) {
            return res.status(400).json({
                error: 'BAD_REQUEST',
                message: 'createdBy.displayName is required'
            });
        }

        // Generate unique roomId
        const roomId = nanoid(10);

        const room = await Room.create({
            roomId,
            title: title || `Room ${roomId}`,
            maxParticipants: maxParticipants || 6,
            memberCount: 0
        });

        res.status(201).json({
            roomId: room.roomId,
            title: room.title,
            maxParticipants: room.maxParticipants,
            createdBy,
            createdAt: room.createdAt
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/rooms - Get list of rooms
router.get('/', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const sortBy = req.query.sortBy || 'lastMessageAt';

        const rooms = await Room.find({})
            .sort({ [sortBy]: -1 })
            .limit(limit)
            .select('roomId title memberCount isLocked lastMessageAt createdAt');

        res.json(rooms);
    } catch (error) {
        next(error);
    }
});

// GET /api/rooms/:roomId - Get room info
router.get('/:roomId', validateRoomId, async (req, res, next) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findOne({ roomId }).select(
            'roomId title maxParticipants memberCount isLocked createdAt'
        );

        if (!room) {
            return res.status(404).json({
                error: 'ROOM_NOT_FOUND',
                message: 'Room not found'
            });
        }

        res.json(room);
    } catch (error) {
        next(error);
    }
});

// GET /api/rooms/:roomId/messages - Get paginated messages
router.get('/:roomId/messages', validateRoomId, validateMessageQuery, async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const before = req.query.before;
        const after = req.query.after;

        // Validate room exists
        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({
                error: 'ROOM_NOT_FOUND',
                message: 'Room not found'
            });
        }

        // Build query
        const query = { roomRef: room._id };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        } else if (after) {
            query.createdAt = { $gt: new Date(after) };
        }

        // Get messages (always sort descending for pagination)
        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .select('content userSnapshot createdAt type');

        // Check if has more
        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop();
        }

        // Reverse to show oldest first
        messages.reverse();

        res.json({
            messages: messages.map(m => ({
                id: m._id,
                content: m.content,
                userSnapshot: m.userSnapshot,
                createdAt: m.createdAt,
                type: m.type
            })),
            hasMore
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/rooms/:roomId/events - Get activity log
router.get('/:roomId/events', validateRoomId, validateMessageQuery, async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const before = req.query.before;
        const after = req.query.after;

        // Validate room exists
        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({
                error: 'ROOM_NOT_FOUND',
                message: 'Room not found'
            });
        }

        // Build query
        const query = { roomRef: room._id };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        } else if (after) {
            query.createdAt = { $gt: new Date(after) };
        }

        // Get events (always sort descending for pagination)
        const events = await Event.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .select('eventType userSnapshot sessionRef metadata createdAt');

        // Check if has more
        const hasMore = events.length > limit;
        if (hasMore) {
            events.pop();
        }

        // Reverse to show oldest first
        events.reverse();

        res.json({
            events: events.map(e => ({
                eventType: e.eventType,
                userSnapshot: e.userSnapshot,
                sessionRef: e.sessionRef.toString(),
                metadata: e.metadata,
                createdAt: e.createdAt
            })),
            hasMore
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
