require('dotenv').config();

module.exports = {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    mongoUri: process.env.MONGODB_URI,
    corsOrigin: process.env.CORS_ORIGIN,
    gracePeriodMs: process.env.GRACE_PERIOD_MS ? parseInt(process.env.GRACE_PERIOD_MS, 10) : undefined,
    turnUrl: process.env.TURN_URL,
    turnUser: process.env.TURN_USER,
    turnPass: process.env.TURN_PASS,
};
