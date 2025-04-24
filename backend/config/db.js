const { Sequelize } = require('sequelize');
require('dotenv').config();
const db = require('../models');

const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

db.sequelize.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch((err) => console.error('Database error:', err));

module.exports = sequelize;