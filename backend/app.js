const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Import models and seed functions
const db = require('./models');
const seedRootUser = require('./seeders/seedRootUser');
const { seedDatabase } = require('./seedData');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/root', require('./routes/rootRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/assignments', require('./routes/issueAssignmentRoutes'));
app.use('/api/reviews', require('./routes/issueReviewRoutes'));
app.use('/api/updates', require('./routes/issueUpdateRoutes'));
app.use('/api', require('./routes/dataRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Initialize database and start server
async function startServer() {
  try {
    // Sync models with database (only creates tables if they don't exist)
    console.log('Syncing database...');
    await db.sequelize.sync();
    console.log(' Database synced');
    
    // Seed initial data (districts, skills, etc.)
    console.log('Seeding initial data...');
    await seedDatabase();
    console.log('Initial data seeded');
    
    // Seed root user if it doesn't exist
    console.log('Seeding root user...');
    await seedRootUser();
    console.log('Root user seeded');
    
    // Start the server
    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();
