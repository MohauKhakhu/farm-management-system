const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

// Test connection
db.raw('SELECT 1')
  .then(() => {
    console.log('Database connection established');
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });

module.exports = db;