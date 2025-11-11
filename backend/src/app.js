const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const roomsRouter = require('./routes/rooms');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'okla', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/rooms', roomsRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Route not found'
    });
});

// Error handler
app.use(errorHandler);

module.exports = app;
