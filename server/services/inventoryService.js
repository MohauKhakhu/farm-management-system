const logger = require('../utils/logger');

class Service {
    constructor() {
        logger.info('inventoryService initialized');
    }

    async getAll() {
        return [];
    }

    async getById(id) {
        return { id, message: 'inventoryService record' };
    }

    async create(data) {
        return { id: Date.now(), ...data };
    }

    async update(id, data) {
        return { id, ...data };
    }

    async delete(id) {
        return { message: 'inventoryService record deleted', id };
    }
}

module.exports = new Service();
