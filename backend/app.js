const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line to handle form data
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = require('./models');
const seedRootUser = require('./seeders/seedRootUser');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/root', require('./routes/rootRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/assignments', require('./routes/issueAssignmentRoutes'));
app.use('/api/reviews', require('./routes/issueReviewRoutes')); // Add review routes
app.use('/api', require('./routes/dataRoutes')); // Add data routes

// Set force to false to prevent dropping tables
const syncOptions = { alter: false };

// Function to initialize the database and start the server
async function initializeDatabase() {
  try {
    // First, check if we need to add the empId column to existing users
    const [results] = await db.sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'empId'"
    );
    
    if (results.length === 0) {
      console.log('The empId column does not exist yet. Adding it to existing users...');
      
      // Get all existing users
      const [users] = await db.sequelize.query('SELECT id FROM Users');
      
      if (users.length > 0) {
        console.log(`Found ${users.length} existing users that need empId values`);
        
        // Add empId column without constraints first
        await db.sequelize.query(
          "ALTER TABLE Users ADD COLUMN empId VARCHAR(255) DEFAULT 'TEMP'"
        );
        
        // Update each user with a unique empId
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          const tempEmpId = `EMP${user.id.toString().padStart(5, '0')}`;
          
          await db.sequelize.query(
            "UPDATE Users SET empId = ? WHERE id = ?",
            {
              replacements: [tempEmpId, user.id]
            }
          );
        }
        
        // Now add the unique constraint
        await db.sequelize.query(
          "ALTER TABLE Users MODIFY COLUMN empId VARCHAR(255) NOT NULL UNIQUE"
        );
        
        console.log('Successfully added empId column with unique values');
      }
    } else {
      console.log('empId column already exists');
    }
    
    // Now sync the database normally
    await db.sequelize.sync(syncOptions);
    console.log('Database synced');
    
    // Seed the root user
    await seedRootUser();
    
    // Start the server
    app.listen(5000, () => {
      console.log('Server running on http://localhost:5000');
    });
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Initialize the database and start the server
const startServer = (port = 5000) => {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API Documentation: http://localhost:${port}/api-docs`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

initializeDatabase()
  .then(() => startServer(process.env.PORT || 5000))
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
