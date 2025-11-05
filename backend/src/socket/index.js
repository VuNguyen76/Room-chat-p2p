const { Server } = require('socket.io');
const config = require('../config');
const roomHandlers = require('./roomHandlers');
const messageHandlers = require('./messageHandlers');
const mediaHandlers = require('./mediaHandlers');
const signalingHandlers = require('./signalingHandlers');

function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: config.corsOrigin,
            credentials: true
        }
    });

    // Middleware
    io.use((socket, next) => {
        // Add any authentication middleware here
        next();
    });

    // Connection handler
    io.on('connection', (socket) => {
        // Register handlers
        roomHandlers(io, socket);
        messageHandlers(io, socket);
        mediaHandlers(io, socket);
        signalingHandlers(io, socket);

        // Disconnect handler
        socket.on('disconnect', () => {
            // Handled in roomHandlers
        });
    });

    return io;
}

module.exports = initializeSocket;
