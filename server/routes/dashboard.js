const express = require('express');
const db = require('../config/database');
const { checkFarmAccess } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get dashboard overview for a farm
router.get('/farm/:farmId', checkFarmAccess, async (req, res) => {
  try {
    const farmId = req.farmId;

    // Get basic counts
    const [
      animalStats,
      fieldStats,
      inventoryStats,
      healthStats,
      financialStats,
      taskStats
    ] = await Promise.all([
      // Animal statistics
      db('animals')
        .where('farm_id', farmId)
        .select('status')
        .count('* as count')
        .groupBy('status'),
      
      // Field statistics
      db('fields')
        .where('farm_id', farmId)
        .select('is_active')
        .count('* as count')
        .groupBy('is_active'),
      
      // Inventory alerts (low stock)
      db('inventory_items')
        .where('farm_id', farmId)
        .whereRaw('current_stock <= minimum_stock')
        .count('* as low_stock_count'),
      
      // Recent health records
      db('animal_health_records')
        .join('animals', 'animal_health_records.animal_id', 'animals.id')
        .where('animals.farm_id', farmId)
        .where('animal_health_records.record_date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .select('record_type')
        .count('* as count')
        .groupBy('record_type'),
      
      // Financial summary (last 30 days)
      db('transactions')
        .where('farm_id', farmId)
        .where('transaction_date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .select('type')
        .sum('total_amount as total')
        .groupBy('type'),
      
      // Task statistics
      db('tasks')
        .where('farm_id', farmId)
        .select('status')
        .count('* as count')
        .groupBy('status')
    ]);

    // Get recent alerts
    const recentAlerts = await db('sensor_alerts')
      .join('sensors', 'sensor_alerts.sensor_id', 'sensors.id')
      .where('sensors.farm_id', farmId)
      .where('sensor_alerts.alert_timestamp', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .where('sensor_alerts.resolved', false)
      .select(
        'sensor_alerts.*',
        'sensors.name as sensor_name',
        'sensors.location'
      )
      .orderBy('sensor_alerts.alert_timestamp', 'desc')
      .limit(10);

    // Get upcoming tasks
    const upcomingTasks = await db('tasks')
      .leftJoin('employees', 'tasks.assigned_to', 'employees.id')
      .leftJoin('users', 'employees.user_id', 'users.id')
      .where('tasks.farm_id', farmId)
      .where('tasks.status', 'pending')
      .where('tasks.due_date', '>=', new Date())
      .where('tasks.due_date', '<=', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      .select(
        'tasks.*',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('tasks.due_date')
      .limit(10);

    // Get recent animal births
    const recentBirths = await db('births')
      .join('animals as offspring', 'births.offspring_id', 'offspring.id')
      .join('animals as mother', 'births.mother_id', 'mother.id')
      .where('offspring.farm_id', farmId)
      .where('births.birth_date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .select(
        'births.*',
        'offspring.tag_id as offspring_tag',
        'offspring.name as offspring_name',
        'mother.tag_id as mother_tag',
        'mother.name as mother_name'
      )
      .orderBy('births.birth_date', 'desc')
      .limit(5);

    // Get weather data (mock for now)
    const weatherData = {
      temperature: 22,
      humidity: 65,
      windSpeed: 12,
      conditions: 'Partly Cloudy',
      forecast: [
        { date: new Date().toISOString().split('T')[0], high: 25, low: 18, conditions: 'Sunny' },
        { date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], high: 23, low: 16, conditions: 'Cloudy' },
        { date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0], high: 21, low: 14, conditions: 'Rain' }
      ]
    };

    // Format response
    const dashboard = {
      animals: {
        total: animalStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
        byStatus: animalStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {})
      },
      fields: {
        total: fieldStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
        active: fieldStats.find(stat => stat.is_active)?.count || 0
      },
      inventory: {
        lowStockItems: parseInt(inventoryStats[0]?.low_stock_count || 0)
      },
      health: {
        recentRecords: healthStats.reduce((acc, stat) => {
          acc[stat.record_type] = parseInt(stat.count);
          return acc;
        }, {})
      },
      financial: {
        monthlyIncome: financialStats.find(stat => stat.type === 'income')?.total || 0,
        monthlyExpenses: financialStats.find(stat => stat.type === 'expense')?.total || 0
      },
      tasks: {
        byStatus: taskStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {})
      },
      alerts: recentAlerts,
      upcomingTasks,
      recentBirths,
      weather: weatherData
    };

    res.json(dashboard);
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get animal performance metrics
router.get('/farm/:farmId/animal-performance', checkFarmAccess, async (req, res) => {
  try {
    const farmId = req.farmId;
    const { period = '30' } = req.query; // days
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Weight gain trends
    const weightGains = await db('animal_weights')
      .join('animals', 'animal_weights.animal_id', 'animals.id')
      .where('animals.farm_id', farmId)
      .where('animal_weights.weigh_date', '>=', startDate)
      .select(
        'animals.id',
        'animals.tag_id',
        'animals.name',
        db.raw('AVG(animal_weights.weight) as avg_weight'),
        db.raw('MAX(animal_weights.weight) - MIN(animal_weights.weight) as weight_gain')
      )
      .groupBy('animals.id', 'animals.tag_id', 'animals.name')
      .having(db.raw('COUNT(animal_weights.id)'), '>', 1)
      .orderBy('weight_gain', 'desc')
      .limit(10);

    // Health incidents by type
    const healthIncidents = await db('animal_health_records')
      .join('animals', 'animal_health_records.animal_id', 'animals.id')
      .where('animals.farm_id', farmId)
      .where('animal_health_records.record_date', '>=', startDate)
      .select('record_type')
      .count('* as count')
      .groupBy('record_type')
      .orderBy('count', 'desc');

    // Breeding success rate
    const breedingStats = await db('breeding_events')
      .join('animals', 'breeding_events.female_id', 'animals.id')
      .where('animals.farm_id', farmId)
      .where('breeding_events.breeding_date', '>=', startDate)
      .select(
        db.raw('COUNT(*) as total_breedings'),
        db.raw("COUNT(CASE WHEN pregnancy_status = 'confirmed' THEN 1 END) as confirmed_pregnancies"),
        db.raw("COUNT(CASE WHEN pregnancy_status = 'completed' THEN 1 END) as completed_pregnancies")
      )
      .first();

    res.json({
      weightGains,
      healthIncidents,
      breedingStats: {
        ...breedingStats,
        pregnancyRate: breedingStats.total_breedings > 0 
          ? (breedingStats.confirmed_pregnancies / breedingStats.total_breedings * 100).toFixed(1)
          : 0,
        birthRate: breedingStats.total_breedings > 0 
          ? (breedingStats.completed_pregnancies / breedingStats.total_breedings * 100).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    logger.error('Error fetching animal performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get financial overview
router.get('/farm/:farmId/financial-overview', checkFarmAccess, async (req, res) => {
  try {
    const farmId = req.farmId;
    const { period = '12' } = req.query; // months
    
    // Monthly financial data
    const monthlyData = await db('transactions')
      .where('farm_id', farmId)
      .where('transaction_date', '>=', new Date(Date.now() - parseInt(period) * 30 * 24 * 60 * 60 * 1000))
      .select(
        db.raw("DATE_TRUNC('month', transaction_date) as month"),
        'type',
        db.raw('SUM(total_amount) as total')
      )
      .groupBy(db.raw("DATE_TRUNC('month', transaction_date)"), 'type')
      .orderBy('month');

    // Cost center breakdown
    const costCenterData = await db('transactions')
      .join('transaction_entries', 'transactions.id', 'transaction_entries.transaction_id')
      .join('accounts', 'transaction_entries.account_id', 'accounts.id')
      .leftJoin('cost_centers', 'accounts.id', 'cost_centers.id') // Simplified join
      .where('transactions.farm_id', farmId)
      .where('transactions.transaction_date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .select(
        'cost_centers.name as cost_center',
        db.raw('SUM(transaction_entries.debit_amount - transaction_entries.credit_amount) as net_amount')
      )
      .groupBy('cost_centers.name')
      .orderBy('net_amount', 'desc');

    // Profitability by module
    const profitabilityData = await db('profitability_analysis')
      .join('cost_centers', 'profitability_analysis.cost_center_id', 'cost_centers.id')
      .where('profitability_analysis.farm_id', farmId)
      .where('profitability_analysis.period_start', '>=', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .select(
        'cost_centers.name as module',
        'cost_centers.type',
        db.raw('AVG(profitability_analysis.profit_margin_percentage) as avg_profit_margin'),
        db.raw('SUM(profitability_analysis.total_revenue) as total_revenue'),
        db.raw('SUM(profitability_analysis.net_profit) as total_profit')
      )
      .groupBy('cost_centers.name', 'cost_centers.type')
      .orderBy('total_profit', 'desc');

    res.json({
      monthlyData,
      costCenterData,
      profitabilityData
    });
  } catch (error) {
    logger.error('Error fetching financial overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;