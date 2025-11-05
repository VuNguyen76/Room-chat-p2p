const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Skip if already connected
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        return conn;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        // Don't exit in test environment
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
        throw error;
    }
};

module.exports = connectDB;
