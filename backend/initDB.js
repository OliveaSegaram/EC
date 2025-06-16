const db = require('./models');

async function initDB() {
  try {
    // Sync all models
    console.log('Syncing database...');
    await db.sequelize.sync({ force: true }); 
    console.log('Database synced!');
    
    // Run the seed data
    console.log('Seeding initial data...');
    const { seedDatabase } = require('./seedData');
    await seedDatabase();
    
    // Seed root user
    console.log('Seeding root user...');
    const seedRootUser = require('./seeders/seedRootUser');
    await seedRootUser();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDB();
