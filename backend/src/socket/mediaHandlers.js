const { Session, Event } = require('../models');
const { validateMediaEvent } = require('./validation');

module.exports = (io, socket) => {
    // Media state change
    socket.on('event:media', async (data, callback) => {
        try {
            const { roomId, type, metadata } = data;
            const sessionId = socket.data.sessionId;

            // Validate input
            const validationErrors = validateMediaEvent(data);
            if (validationErrors.length > 0) {
                return callback({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid media event data',
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

            // Update media state
            switch (type) {
                case 'mute':
                    session.mediaState.audio = false;
                    break;
                case 'unmute':
                    session.mediaState.audio = true;
                    break;
                case 'video-off':
                    session.mediaState.video = false;
                    break;
                case 'video-on':
                    session.mediaState.video = true;
                    break;
                case 'screen-on':
                    session.mediaState.screen = true;
                    break;
                case 'screen-off':
                    session.mediaState.screen = false;
                    break;
            }
            await session.save();

            // Create event
            const event = await Event.create({
                roomRef: session.roomRef,
                sessionRef: session._id,
                eventType: type,
                metadata,
                userSnapshot: session.userSnapshot
            });

            // Broadcast to room (including sender)
            io.to(roomId).emit('event:created', {
                eventType: type,
                userSnapshot: session.userSnapshot,
                sessionRef: session._id.toString(),
                metadata,
                createdAt: event.createdAt
            });

            callback({ success: true, eventId: event._id });
        } catch (error) {
            console.error('Error in event:media:', error);
            callback({
                error: 'INTERNAL_ERROR',
                message: error.message
            });
        }
    });
};
