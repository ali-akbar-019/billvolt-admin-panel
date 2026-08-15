const app = require('../src/app');
const connectDB = require('../src/config/db');

let dbConnectionPromise = null;

const handler = async (req, res) => {
    console.log(`[vercel] ${req.method} ${req.url}`);

    try {
        if (!dbConnectionPromise) {
            console.log('[vercel] Connecting to MongoDB...');
            dbConnectionPromise = connectDB();
        }

        await dbConnectionPromise;

        console.log('[vercel] MongoDB ready. Passing request to Express.');

        return app(req, res);
    } catch (error) {
        console.error('[vercel] MongoDB connection failed:', error);

        dbConnectionPromise = null;

        return res.status(500).json({
            error: 'Database connection failed',
        });
    }
};

module.exports = handler;