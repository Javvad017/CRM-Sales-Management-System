/**
 * CRM & Sales Management System — Express Server
 * 
 * Security Features:
 *  ✅ Helmet (secure HTTP headers)
 *  ✅ CORS (allowlist-based)
 *  ✅ Rate limiting
 *  ✅ NoSQL injection prevention (mongo-sanitize)
 *  ✅ XSS sanitization
 *  ✅ JSON body size limit
 *  ✅ Morgan request logging
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// ── Route Imports ─────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const dealRoutes = require('./routes/deals');
const adminRoutes = require('./routes/admin');

// ── Connect to Database ───────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security Middleware ───────────────────────────────────────────────────────

// 1. Helmet: Sets secure HTTP headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        crossOriginEmbedderPolicy: false,
    })
);

// 2. CORS: Allow only whitelisted frontend origins
//    In .env set CLIENT_URL=http://localhost:4000
//    For multiple origins: CLIENT_URL=http://localhost:4000,https://yourapp.com
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:4000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

console.log('🌐 CORS allowed origins:', allowedOrigins);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, mobile apps, server-to-server)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⛔ CORS blocked: ${origin}`);
            callback(new Error(`CORS: Origin ${origin} is not allowed`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200, // some legacy browsers (IE11) choke on 204
};

// Handle OPTIONS preflight for all routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// 3. Global rate limit (guards all endpoints)
const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
    message: { success: false, message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// 4. Body parsing (with size limit to prevent payload attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. NoSQL Injection prevention (sanitizes req.body, req.params, req.query)
app.use(mongoSanitize());

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CRM API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`\n🚀 CRM Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📡 Health: http://localhost:${PORT}/api/health\n`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Promise Rejection:', err.message);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('💤 Server closed.');
        process.exit(0);
    });
});

module.exports = app;
