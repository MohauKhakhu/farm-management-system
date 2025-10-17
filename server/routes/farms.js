const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { checkFarmAccess } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schema
const farmSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().optional(),
  location: Joi.string().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  totalArea: Joi.number().positive().optional(),
  areaUnit: Joi.string().default('hectares'),
  contactInfo: Joi.object().optional()
});

// Get all farms for current user
router.get('/', async (req, res) => {
  try {
    const farms = await db('farms')
      .join('farm_users', 'farms.id', 'farm_users.farm_id')
      .leftJoin('users as owner', 'farms.owner_id', 'owner.id')
      .select(
        'farms.*',
        'farm_users.role as user_role',
        'owner.first_name as owner_first_name',
        'owner.last_name as owner_last_name'
      )
      .where('farm_users.user_id', req.user.id)
      .orderBy('farms.name');

    // Get basic stats for each farm
    const farmsWithStats = await Promise.all(
      farms.map(async (farm) => {
        const [animalCount] = await db('animals')
          .where({ farm_id: farm.id, status: 'active' })
          .count('* as count');

        const [fieldCount] = await db('fields')
          .where({ farm_id: farm.id, is_active: true })
          .count('* as count');

        const [employeeCount] = await db('employees')
          .where({ farm_id: farm.id, status: 'active' })
          .count('* as count');

        return {
          ...farm,
          stats: {
            animals: parseInt(animalCount.count),
            fields: parseInt(fieldCount.count),
            employees: parseInt(employeeCount.count)
          }
        };
      })
    );

    res.json(farmsWithStats);
  } catch (error) {
    logger.error('Error fetching farms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single farm
router.get('/:id', checkFarmAccess, async (req, res) => {
  try {
    const farm = await db('farms')
      .leftJoin('users as owner', 'farms.owner_id', 'owner.id')
      .select(
        'farms.*',
        'owner.first_name as owner_first_name',
        'owner.last_name as owner_last_name',
        'owner.email as owner_email'
      )
      .where('farms.id', req.params.id)
      .first();

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    // Get farm users
    const farmUsers = await db('farm_users')
      .join('users', 'farm_users.user_id', 'users.id')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email',
        'farm_users.role'
      )
      .where('farm_users.farm_id', req.params.id);

    // Get detailed stats
    const stats = await Promise.all([
      db('animals').where({ farm_id: req.params.id, status: 'active' }).count('* as count'),
      db('fields').where({ farm_id: req.params.id, is_active: true }).count('* as count'),
      db('employees').where({ farm_id: req.params.id, status: 'active' }).count('* as count'),
      db('inventory_items').where({ farm_id: req.params.id, is_active: true }).count('* as count'),
      db('sensors').where({ farm_id: req.params.id, status: 'active' }).count('* as count')
    ]);

    res.json({
      ...farm,
      users: farmUsers,
      stats: {
        animals: parseInt(stats[0][0].count),
        fields: parseInt(stats[1][0].count),
        employees: parseInt(stats[2][0].count),
        inventoryItems: parseInt(stats[3][0].count),
        sensors: parseInt(stats[4][0].count)
      }
    });
  } catch (error) {
    logger.error('Error fetching farm:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new farm
router.post('/', async (req, res) => {
  try {
    const { error, value } = farmSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const farmId = uuidv4();
    const farmData = {
      id: farmId,
      name: value.name,
      description: value.description,
      location: value.location,
      latitude: value.latitude,
      longitude: value.longitude,
      total_area: value.totalArea,
      area_unit: value.areaUnit,
      owner_id: req.user.id,
      contact_info: value.contactInfo ? JSON.stringify(value.contactInfo) : null
    };

    const [farm] = await db('farms')
      .insert(farmData)
      .returning('*');

    // Add user as owner in farm_users
    await db('farm_users').insert({
      farm_id: farmId,
      user_id: req.user.id,
      role: 'owner'
    });

    logger.info(`New farm created: ${value.name} by user ${req.user.id}`);

    res.status(201).json(farm);
  } catch (error) {
    logger.error('Error creating farm:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update farm
router.put('/:id', checkFarmAccess, async (req, res) => {
  try {
    // Check if user has owner or manager role
    if (req.farmRole !== 'owner' && req.farmRole !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions to update farm' });
    }

    const { error, value } = farmSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updateData = {
      name: value.name,
      description: value.description,
      location: value.location,
      latitude: value.latitude,
      longitude: value.longitude,
      total_area: value.totalArea,
      area_unit: value.areaUnit,
      contact_info: value.contactInfo ? JSON.stringify(value.contactInfo) : null,
      updated_at: new Date()
    };

    const [farm] = await db('farms')
      .where('id', req.params.id)
      .update(updateData)
      .returning('*');

    logger.info(`Farm updated: ${value.name} by user ${req.user.id}`);

    res.json(farm);
  } catch (error) {
    logger.error('Error updating farm:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete farm
router.delete('/:id', checkFarmAccess, async (req, res) => {
  try {
    // Only owner can delete farm
    if (req.farmRole !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only farm owner can delete the farm' });
    }

    // Check if farm has animals
    const [{ count: animalCount }] = await db('animals')
      .where('farm_id', req.params.id)
      .count('* as count');

    if (animalCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete farm with animals. Please remove all animals first.' 
      });
    }

    await db('farms')
      .where('id', req.params.id)
      .del();

    logger.info(`Farm deleted: ${req.params.id} by user ${req.user.id}`);

    res.json({ message: 'Farm deleted successfully' });
  } catch (error) {
    logger.error('Error deleting farm:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add user to farm
router.post('/:id/users', checkFarmAccess, async (req, res) => {
  try {
    // Only owner and manager can add users
    if (req.farmRole !== 'owner' && req.farmRole !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions to add users' });
    }

    const { email, role = 'worker' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await db('users')
      .where({ email, is_active: true })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already in farm
    const existingFarmUser = await db('farm_users')
      .where({ farm_id: req.params.id, user_id: user.id })
      .first();

    if (existingFarmUser) {
      return res.status(400).json({ error: 'User is already a member of this farm' });
    }

    await db('farm_users').insert({
      farm_id: req.params.id,
      user_id: user.id,
      role
    });

    logger.info(`User ${email} added to farm ${req.params.id} by ${req.user.email}`);

    res.status(201).json({ 
      message: 'User added to farm successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role
      }
    });
  } catch (error) {
    logger.error('Error adding user to farm:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role in farm
router.put('/:id/users/:userId', checkFarmAccess, async (req, res) => {
  try {
    // Only owner can update roles
    if (req.farmRole !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only farm owner can update user roles' });
    }

    const { role } = req.body;

    if (!['owner', 'manager', 'worker', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updated = await db('farm_users')
      .where({ farm_id: req.params.id, user_id: req.params.userId })
      .update({ role });

    if (!updated) {
      return res.status(404).json({ error: 'User not found in farm' });
    }

    logger.info(`User role updated in farm ${req.params.id} by ${req.user.email}`);

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    logger.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove user from farm
router.delete('/:id/users/:userId', checkFarmAccess, async (req, res) => {
  try {
    // Only owner can remove users (except themselves)
    if (req.farmRole !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only farm owner can remove users' });
    }

    // Cannot remove farm owner
    const farmUser = await db('farm_users')
      .where({ farm_id: req.params.id, user_id: req.params.userId })
      .first();

    if (!farmUser) {
      return res.status(404).json({ error: 'User not found in farm' });
    }

    if (farmUser.role === 'owner' && req.params.userId !== req.user.id) {
      return res.status(400).json({ error: 'Cannot remove farm owner' });
    }

    await db('farm_users')
      .where({ farm_id: req.params.id, user_id: req.params.userId })
      .del();

    logger.info(`User removed from farm ${req.params.id} by ${req.user.email}`);

    res.json({ message: 'User removed from farm successfully' });
  } catch (error) {
    logger.error('Error removing user from farm:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;