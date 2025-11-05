const mongoose = require('mongoose');
const { Room, Session, Event } = require('../models');
const config = require('../config');
const { validateJoinRoom } = require('./validation');

// Store grace period timers
const gracePeriodTimers = new Map();

// Export function to clear all timers (for testing)
const clearAllTimers = () => {
    gracePeriodTimers.forEach(timer => clearTimeout(timer));
    gracePeriodTimers.clear();
};

module.exports = (io, socket) => {
    // Join room
    socket.on('join-room', async (data, callback) => {
        try {
            const { roomId, displayName, avatarUrl, deviceInfo } = data;

            // Validate input
            const validationErrors = validateJoinRoom(data);
            if (validationErrors.length > 0) {
                return callback({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: validationErrors
                });
            }

            // Find room
            const room = await Room.findOne({ roomId });
            if (!room) {
                return callback({
                    error: 'ROOM_NOT_FOUND',
                    message: 'Room not found'
                });
            }

            // Check if room is locked
            if (room.isLocked) {
                return callback({
                    error: 'ROOM_LOCKED',
                    message: 'Room is locked'
                });
            }

            // Check room capacity
            const activeSessions = await Session.countDocuments({
                roomRef: room._id,
                leftAt: null
            });

            if (activeSessions >= room.maxParticipants) {
                return callback({
                    error: 'ROOM_FULL',
                    message: 'Room is full'
                });
            }

            // Check for reconnection (grace period)
            const recentSession = await Session.findOne({
                roomRef: room._id,
                socketId: socket.id,
                leftAt: null,
                disconnectedAt: { $ne: null }
            });

            let session;
            let isReconnect = false;

            if (recentSession) {
                // Reconnect - reuse session
                session = recentSession;
                session.disconnectedAt = undefined;
                session.socketId = socket.id;
                await session.save();
                isReconnect = true;

                // Clear grace period timer
                const timerKey = `${room._id}-${session._id}`;
                if (gracePeriodTimers.has(timerKey)) {
                    clearTimeout(gracePeriodTimers.get(timerKey));
                    gracePeriodTimers.delete(timerKey);
                }
            } else {
                // New session
                session = await Session.create({
                    roomRef: room._id,
                    socketId: socket.id,
                    role: activeSessions === 0 ? 'host' : 'member',
                    userSnapshot: {
                        displayName,
                        avatarUrl
                    },
                    deviceInfo,
                    joinedAt: new Date()
                });

                // Increment member count
                await Room.findByIdAndUpdate(room._id, {
                    $inc: { memberCount: 1 }
                });

                // Create join event
                await Event.create({
                    roomRef: room._id,
                    sessionRef: session._id,
                    eventType: 'join',
                    userSnapshot: {
                        displayName,
                        avatarUrl
                    }
                });
            }

            // Join socket room
            socket.join(roomId);

            // Store session info in socket
            socket.data.sessionId = session._id.toString();
            socket.data.roomId = roomId;

            // Get other peers in room
            const peers = await Session.find({
                roomRef: room._id,
                leftAt: null,
                _id: { $ne: session._id }
            }).select('socketId userSnapshot mediaState');

            // Send response to joiner
            callback({
                success: true,
                self: {
                    sessionId: session._id,
                    socketId: socket.id,
                    role: session.role
                },
                peers: peers.map(p => ({
                    socketId: p.socketId,
                    sessionId: p._id,
                    userSnapshot: p.userSnapshot,
                    mediaState: p.mediaState
                })),
                room: {
                    roomId: room.roomId,
                    title: room.title,
                    maxParticipants: room.maxParticipants,
                    memberCount: room.memberCount
                }
            });

            // Broadcast to others
            socket.to(roomId).emit(isReconnect ? 'user-reconnected' : 'user-joined', {
                socketId: socket.id,
                sessionId: session._id,
                userSnapshot: session.userSnapshot,
                mediaState: session.mediaState
            });
        } catch (error) {
            console.error('Error in join-room:', error);
            callback({
                error: 'INTERNAL_ERROR',
                message: error.message
            });
        }
    });

    // Leave room
    socket.on('leave-room', async (data, callback) => {
        try {
            const { roomId } = data;
            const sessionId = socket.data.sessionId;

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

            // Update session
            session.leftAt = new Date();
            await session.save();

            // Decrement member count (ensure not negative)
            const room = await Room.findById(session.roomRef);
            if (room && room.memberCount > 0) {
                room.memberCount -= 1;
                await room.save();
            }

            // Create leave event
            await Event.create({
                roomRef: session.roomRef,
                sessionRef: session._id,
                eventType: 'leave',
                userSnapshot: session.userSnapshot
            });

            // Leave socket room
            socket.leave(roomId);

            // Clear socket data
            delete socket.data.sessionId;
            delete socket.data.roomId;

            // Broadcast to others
            socket.to(roomId).emit('user-left', {
                socketId: socket.id,
                sessionId: session._id
            });

            callback({ success: true });
        } catch (error) {
            console.error('Error in leave-room:', error);
            callback({
                error: 'INTERNAL_ERROR',
                message: error.message
            });
        }
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
        try {
            const sessionId = socket.data.sessionId;
            const roomId = socket.data.roomId;

            if (!sessionId) return;

            // Find session
            const session = await Session.findById(sessionId);
            if (!session || session.leftAt) return;

            // Mark as disconnected
            session.disconnectedAt = new Date();
            await session.save();

            // Start grace period timer
            const timerKey = `${session.roomRef}-${session._id}`;
            const timer = setTimeout(async () => {
                try {
                    // Check if mongoose is still connected
                    if (mongoose.connection.readyState !== 1) {
                        gracePeriodTimers.delete(timerKey);
                        return;
                    }

                    // Check if still disconnected
                    const currentSession = await Session.findById(sessionId);
                    if (!currentSession || currentSession.leftAt || !currentSession.disconnectedAt) {
                        gracePeriodTimers.delete(timerKey);
                        return;
                    }

                    // Grace period expired - mark as left
                    currentSession.leftAt = currentSession.disconnectedAt;
                    currentSession.disconnectedAt = undefined;
                    await currentSession.save();

                    // Decrement member count (ensure not negative)
                    const room = await Room.findById(currentSession.roomRef);
                    if (room && room.memberCount > 0) {
                        room.memberCount -= 1;
                        await room.save();
                    }

                    // Create leave event
                    await Event.create({
                        roomRef: currentSession.roomRef,
                        sessionRef: currentSession._id,
                        eventType: 'leave',
                        userSnapshot: currentSession.userSnapshot,
                        metadata: { reason: 'disconnect_timeout' }
                    });

                    // Broadcast user left
                    io.to(roomId).emit('user-left', {
                        socketId: socket.id,
                        sessionId: currentSession._id
                    });
                } catch (error) {
                    // Only log if not a connection error
                    if (error.name !== 'MongoNotConnectedError' && error.name !== 'DocumentNotFoundError') {
                        console.error('Error in grace period timeout:', error);
                    }
                } finally {
                    gracePeriodTimers.delete(timerKey);
                }
            }, config.gracePeriodMs);

            gracePeriodTimers.set(timerKey, timer);
        } catch (error) {
            // Only log unexpected errors (not test cleanup errors)
            if (error.name !== 'DocumentNotFoundError' && error.name !== 'MongoNotConnectedError') {
                console.error('Error in disconnect handler:', error);
            }
        }
    });
};

// Export clearAllTimers for testing
module.exports.clearAllTimers = clearAllTimers;
