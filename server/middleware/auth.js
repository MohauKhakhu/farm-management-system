const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Authenticate token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    // Update last login
    await db('users')
      .where({ id: user.id })
      .update({ last_login: new Date() });

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Check permissions middleware
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const userRole = req.user.role;

    // Admin has all permissions
    if (userRole === 'admin') {
      return next();
    }

    // Check if user has specific permission
    if (userPermissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Insufficient permissions',
      required: requiredPermission 
    });
  };
};

// Check farm access middleware
const checkFarmAccess = async (req, res, next) => {
  try {
    const farmId = req.params.farmId || req.body.farmId || req.query.farmId;
    
    if (!farmId) {
      return res.status(400).json({ error: 'Farm ID required' });
    }

    // Check if user has access to this farm
    const farmAccess = await db('farm_users')
      .where({
        farm_id: farmId,
        user_id: req.user.id
      })
      .first();

    if (!farmAccess && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this farm' });
    }

    req.farmId = farmId;
    req.farmRole = farmAccess ? farmAccess.role : 'admin';
    next();
  } catch (error) {
    logger.error('Farm access check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  authenticateToken,
  checkPermission,
  checkFarmAccess
};