const cron = require('node-cron');
const logger = require('../utils/logger');

class SchedulerService {
    constructor() {
        this.tasks = [];
        this.isInitialized = false;
    }

    /**
     * Initialize the scheduler service
     */
    initialize() {
        if (this.isInitialized) {
            logger.warn('Scheduler service already initialized');
            return;
        }

        logger.info('Initializing scheduler service');
        
        // Schedule daily tasks at 6:00 AM
        this.scheduleDailyTasks();
        
        // Schedule hourly health checks
        this.scheduleHealthChecks();
        
        this.isInitialized = true;
        logger.info('Scheduler service initialized successfully');
    }

    /**
     * Schedule daily maintenance tasks
     */
    scheduleDailyTasks() {
        // Run at 6:00 AM every day
        const dailyTask = cron.schedule('0 6 * * *', () => {
            logger.info('Running daily maintenance tasks');
            this.runDailyMaintenance();
        }, {
            scheduled: true,
            timezone: 'America/New_York'
        });

        this.tasks.push(dailyTask);
        logger.info('Daily tasks scheduled for 6:00 AM');
    }

    /**
     * Schedule health checks
     */
    scheduleHealthChecks() {
        // Run every 30 minutes
        const healthTask = cron.schedule('*/30 * * * *', () => {
            logger.info('Running system health check');
            this.runHealthCheck();
        });

        this.tasks.push(healthTask);
        logger.info('Health checks scheduled every 30 minutes');
    }

    /**
     * Run daily maintenance tasks
     */
    async runDailyMaintenance() {
        try {
            // Add your daily maintenance logic here
            logger.info('Daily maintenance completed');
        } catch (error) {
            logger.error('Error in daily maintenance:', error);
        }
    }

    /**
     * Run system health check
     */
    async runHealthCheck() {
        try {
            // Add health check logic here
            logger.info('System health check completed');
        } catch (error) {
            logger.error('Error in health check:', error);
        }
    }

    /**
     * Stop all scheduled tasks
     */
    stopAll() {
        this.tasks.forEach(task => task.stop());
        this.tasks = [];
        this.isInitialized = false;
        logger.info('All scheduled tasks stopped');
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            activeTasks: this.tasks.length,
            tasks: this.tasks.map((task, index) => ({
                id: index,
                running: task.getStatus() === 'scheduled'
            }))
        };
    }
}

module.exports = new SchedulerService();
