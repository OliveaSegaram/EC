const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const path = require('path');

app.use(cors());
app.use(express.json());



const db = require('./models'); 
const seedRootUser = require('./seeders/seedRootUser');
seedRootUser();


db.sequelize.authenticate()
  .then(() => console.log(' Database connected successfully'))
  .catch(err => console.error(' Database connection failed:', err));

app.use('/api/auth', require('./routes/authRoutes'));   
app.use('/api/root', require('./routes/rootRoutes'));   
app.use('/api/roles', require('./routes/roleRoutes'));  
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


db.sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('Database synced');
    app.listen(5000, () => {
      console.log(' Server running on http://localhost:5000');
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });
