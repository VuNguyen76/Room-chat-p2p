require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    gracePeriodMs: parseInt(process.env.GRACE_PERIOD_MS) || 5000,
    turnUrl: process.env.TURN_URL,
    turnUser: process.env.TURN_USER,
    turnPass: process.env.TURN_PASS,
};
