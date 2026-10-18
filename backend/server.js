const path = require('path');
// Load environment variables hierarchically: backend/.env, .env.local, .env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
process.env.PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be configured in production.');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Catch any unexpected exceptions to keep the server running reliably
process.on('uncaughtException', (err) => {
  console.error('Unhandled Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const app = express();

// Initialize DB Connection
connectDB();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting for API calls
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// CORS - credentialed requests must use an explicitly configured frontend.
// In production this fails closed when neither variable is set.
const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(configuredOrigins);
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://127.0.0.1:3000');
}
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('CORS origin is not allowed'));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Favicon handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve uploaded assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve Public Assets directly
const publicPath = path.join(__dirname, '../public');
app.use('/public', express.static(publicPath));
app.use('/public/assets', express.static(path.join(publicPath, 'assets')));
app.use('/images', express.static(path.join(publicPath, 'images')));
app.use(express.static(publicPath));

// Serve Frontend Static Files directly (with html extension resolution)
const frontendPath = path.join(__dirname, '../frontend');
app.use('/assets', express.static(path.join(publicPath, 'assets')));
app.use('/assets', express.static(path.join(frontendPath, 'assets')));
app.use(express.static(frontendPath, { extensions: ['html', 'htm'] }));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/activity-logs', require('./routes/activityLogs'));
app.use('/api/pincode', require('./routes/pincode'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/ai', require('./routes/aiChat'));
app.use('/api/flash-sales', require('./routes/flashSales'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/settings', require('./routes/storeSettings'));
app.use('/api/email', require('./routes/email'));
app.use('/api/cms', require('./routes/cms'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/media', require('./routes/media'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/newsletter', require('./routes/newsletter'));


// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NUTRATEIN API is online!',
    database: global.USE_MONGODB ? 'MongoDB Connected' : 'Embedded Memory Store (Active)',
    version: '1.0.0'
  });
});

// API 404 Handler (Express 5 safe)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: `API endpoint not found: ${req.originalUrl}` });
  }
  next();
});

// Clean URL Aliases
app.get('/login', (req, res) => res.sendFile(path.join(frontendPath, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(frontendPath, 'register.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(frontendPath, 'admin/index.html')));
app.get('/account', (req, res) => res.sendFile(path.join(frontendPath, 'account.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(frontendPath, 'shop.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(frontendPath, 'cart.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(frontendPath, 'checkout.html')));
app.get('/tracking', (req, res) => res.sendFile(path.join(frontendPath, 'tracking.html')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// SPA / Frontend fallback for client-side navigation
app.use((req, res) => {
  if (req.path === '/admin/login' || req.path === '/admin/login/') {
    return res.sendFile(path.join(frontendPath, 'admin/login.html'));
  }
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(frontendPath, 'admin/index.html'));
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});


// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║               NUTRATEIN STORE IS RUNNING                  ║
  ║                                                           ║
  ║  🛒 Storefront URL:  http://localhost:${PORT}                 ║
  ║  ⚡ Admin Panel URL: http://localhost:${PORT}/admin/index.html   ║
  ║  🛡️ API Health Check: http://localhost:${PORT}/api/health     ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});

// Remove or comment out your app.listen block:
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export app for server runtime:
module.exports = app;
