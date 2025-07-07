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
const User = require('./user')(sequelize, DataTypes);
const District = require('./district')(sequelize, DataTypes);
const Skill = require('./skill')(sequelize, DataTypes);
const Role = require('./role')(sequelize, DataTypes);
const Issue = require('./issue')(sequelize, DataTypes);

// Define relationships
User.belongsTo(District, { foreignKey: 'districtId' });
User.belongsTo(Skill, { foreignKey: 'skillId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

// Add models to db object
db.User = User;
db.District = District;
db.Skill = Skill;
db.Role = Role;
db.Issue = Issue;

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
