const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

console.log("Loaded Dialect from .env:", process.env.DB_DIALECT);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT.trim(), 
    logging: false
  }
);

// Initialize db object
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user')(sequelize, DataTypes);
db.Role = require('./role')(sequelize, DataTypes);
db.Issue = require('./issue')(sequelize, DataTypes);

// Define associations
db.Role.hasMany(db.User, { 
  foreignKey: 'roleId',
  onDelete: 'RESTRICT'
});
db.User.belongsTo(db.Role, { 
  foreignKey: 'roleId'
});

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
