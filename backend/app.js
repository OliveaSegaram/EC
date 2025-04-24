const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = require('./models');
const seedRootUser = require('./seeders/seedRootUser');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/root', require('./routes/rootRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));

db.sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Database synced');

    
    await seedRootUser();

    
    app.listen(5000, () => {
      console.log('Server running on http://localhost:5000');
    });
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });
