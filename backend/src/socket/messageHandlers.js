const { Room, Session, Message } = require('../models');
const { validateMessage } = require('./validation');

module.exports = (io, socket) => {
    // New message
    socket.on('message:new', async (data, callback) => {
        try {
            const { roomId, content } = data;
            const sessionId = socket.data.sessionId;

            // Validate input
            const validationErrors = validateMessage(data);
            if (validationErrors.length > 0) {
                return callback({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid message data',
                    details: validationErrors
                });
            }

            // Validate session
            if (!sessionId) {
                return callback({
                    error: 'NOT_IN_ROOM',
                    message: 'You are not in a room'
                });
            }

            // Find session
            const session = await Session.findById(sessionId);
            if (!session || session.leftAt) {
                return callback({
                    error: 'SESSION_NOT_FOUND',
                    message: 'Session not found or already left'
                });
            }

            // Create message
            const message = await Message.create({
                roomRef: session.roomRef,
                sessionRef: session._id,
                content: content.trim(),
                type: 'text',
                userSnapshot: session.userSnapshot
            });

            // Update room lastMessageAt
            await Room.findByIdAndUpdate(session.roomRef, {
                lastMessageAt: message.createdAt
            });

            // Broadcast to room (including sender)
            io.to(roomId).emit('message:created', {
                id: message._id,
                sessionRef: session._id.toString(),
                content: message.content,
                userSnapshot: message.userSnapshot,
                createdAt: message.createdAt,
                type: message.type
            });

            callback({ success: true, messageId: message._id });
        } catch (error) {
            console.error('Error in message:new:', error);
            callback({
                error: 'INTERNAL_ERROR',
                message: error.message
            });
        }
    });
};
