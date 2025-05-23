const db = require('./models');

async function initDB() {
  try {
    // Sync all models
    console.log('Syncing database...');
    await db.sequelize.sync({ force: true }); // This will drop all tables and recreate them
    console.log('Database synced!');
    
    // Run the seed data
    console.log('Seeding initial data...');
    require('./seedData');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDB();
