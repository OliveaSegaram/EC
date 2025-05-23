const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line to handle form data
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = require('./models');
const seedRootUser = require('./seeders/seedRootUser');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/root', require('./routes/rootRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
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
initializeDatabase();
