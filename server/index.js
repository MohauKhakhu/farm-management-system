require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Import middleware and utilities
const { rateLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const logger = require('./utils/logger');
const db = require('./config/database');

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const farmRoutes = require('./routes/farms');
const animalRoutes = require('./routes/animals');
const breedingRoutes = require('./routes/breeding');
const inventoryRoutes = require('./routes/inventory');
const feedRoutes = require('./routes/feed');
const healthRoutes = require('./routes/health');
const fieldRoutes = require('./routes/fields');
const iotRoutes = require('./routes/iot');
const financialRoutes = require('./routes/financial');
const workforceRoutes = require('./routes/workforce');
const sustainabilityRoutes = require('./routes/sustainability');
const blockchainRoutes = require('./routes/blockchain');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');

// Import services
const { initializeIoTServices } = require('./services/iotService');
const { initializeBlockchainService } = require('./services/blockchainService');
const { initializeScheduler } = require('./services/schedulerService');
const { initializeAIService } = require('./services/aiService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(rateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/farms', authenticateToken, farmRoutes);
app.use('/api/animals', authenticateToken, animalRoutes);
app.use('/api/breeding', authenticateToken, breedingRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/feed', authenticateToken, feedRoutes);
app.use('/api/health', authenticateToken, healthRoutes);
app.use('/api/fields', authenticateToken, fieldRoutes);
app.use('/api/iot', authenticateToken, iotRoutes);
app.use('/api/financial', authenticateToken, financialRoutes);
app.use('/api/workforce', authenticateToken, workforceRoutes);
app.use('/api/sustainability', authenticateToken, sustainabilityRoutes);
app.use('/api/blockchain', authenticateToken, blockchainRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  
  socket.on('join_farm', (farmId) => {
    socket.join(`farm_${farmId}`);
    logger.info(`Socket ${socket.id} joined farm ${farmId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize services and start server
async function startServer() {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    logger.info('Database connected successfully');
    
    // Initialize services
    await initializeIoTServices(io);
    await initializeBlockchainService();
    await initializeScheduler();
    await initializeAIService();
    
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

startServer();

module.exports = app;