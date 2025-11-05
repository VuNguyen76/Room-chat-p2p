require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const config = require('./config');
const initializeSocket = require('./socket');

const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Connect to database and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start server
        server.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`);
            console.log(`Environment: ${config.nodeEnv}`);
            console.log(`Socket.io initialized`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

startServer();

module.exports = server;
