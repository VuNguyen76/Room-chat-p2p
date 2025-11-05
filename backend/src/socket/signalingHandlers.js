const { validateSignaling } = require('./validation');

module.exports = (io, socket) => {
    // WebRTC Offer
    socket.on('offer', (data) => {
        const { to, sdp } = data;

        const validationErrors = validateSignaling(data, true);
        if (validationErrors.length > 0) {
            return socket.emit('room-error', {
                error: 'VALIDATION_ERROR',
                message: 'Invalid offer data',
                details: validationErrors
            });
        }

        // Forward to target peer
        io.to(to).emit('offer', {
            from: socket.id,
            sdp
        });
    });

    // WebRTC Answer
    socket.on('answer', (data) => {
        const { to, sdp } = data;

        const validationErrors = validateSignaling(data, true);
        if (validationErrors.length > 0) {
            return socket.emit('room-error', {
                error: 'VALIDATION_ERROR',
                message: 'Invalid answer data',
                details: validationErrors
            });
        }

        // Forward to target peer
        io.to(to).emit('answer', {
            from: socket.id,
            sdp
        });
    });

    // ICE Candidate
    socket.on('ice-candidate', (data) => {
        const { to, candidate } = data;

        const validationErrors = validateSignaling(data, false);
        if (validationErrors.length > 0) {
            return socket.emit('room-error', {
                error: 'VALIDATION_ERROR',
                message: 'Invalid ICE candidate data',
                details: validationErrors
            });
        }

        // Forward to target peer
        io.to(to).emit('ice-candidate', {
            from: socket.id,
            candidate
        });
    });
};
