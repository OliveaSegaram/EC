const { seedDatabase } = require('./seedData');
const db = require('./models');

async function initializeDatabase() {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log('Dropping existing tables...');
    // Drop tables in the correct order to avoid foreign key constraints
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
    
    // Drop tables in reverse order of dependencies
    await db.sequelize.query('DROP TABLE IF EXISTS `user_skills`', { transaction });
    await db.sequelize.query('DROP TABLE IF EXISTS `Users`', { transaction });
    await db.sequelize.query('DROP TABLE IF EXISTS `Districts`', { transaction });
    await db.sequelize.query('DROP TABLE IF EXISTS `Skills`', { transaction });
    await db.sequelize.query('DROP TABLE IF EXISTS `Roles`', { transaction });
    
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    
    console.log('Creating tables...');
    await db.sequelize.sync({ force: false, transaction });
    
    console.log('Seeding database...');
    await seedDatabase();
    
    await transaction.commit();
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
