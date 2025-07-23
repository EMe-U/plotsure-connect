const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database models
const db = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const inquiryRoutes = require('./routes/inquiries');
const contactRoutes = require('./routes/contact');

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disable CSP for development
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX), // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve admin files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Make sure plotsure_frontend assets are accessible from any route
app.use('/plotsure_frontend', express.static(path.join(__dirname, '../plotsure_frontend')));

// Also add this specific route for the dashboard
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});
// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        await db.sequelize.authenticate();
        res.status(200).json({
            success: true,
            message: 'PlotSure Connect API is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            database: 'Connected'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Serve static files from the root directory where index.html is located
app.use(express.static(path.join(__dirname, '..')));
app.use('/plotsure_frontend', express.static(path.join(__dirname, '../plotsure_frontend')));

// API 404 handler - must come before the catch-all route
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Catch-all route to serve index.html for frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors
        });
    }
    
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry error',
            field: err.errors[0].path
        });
    }
    
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Foreign key constraint error'
        });
    }
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        await db.sequelize.authenticate();
        console.log('📦 MySQL Database Connected Successfully');
        
        // Sync database models (use { force: true } to recreate tables)
        await db.sequelize.sync({ alter: true });
        console.log('📋 Database Models Synchronized');
        
        app.listen(PORT, () => {
            console.log(`🚀 PlotSure Connect API Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🌐 Frontend URL: http://localhost:${PORT}`);
            console.log(`📁 Serving frontend from: ${path.join(__dirname, '..')}`);
            console.log(`📄 Index.html location: ${path.join(__dirname, '../index.html')}`);
        });
    } catch (error) {
        console.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};

startServer();