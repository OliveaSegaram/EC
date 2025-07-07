const express = require('express');
const router = express.Router();
const { District, Skill } = require('../models');
const districtController = require('../controllers/districtController');

// Get all districts
router.get('/districts', async (req, res) => {
  try {
    const districts = await District.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    res.json(districts);
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ message: 'Error fetching districts' });
  }
});

// Get districts by IDs
router.get('/districts/by-ids', districtController.getDistrictsByIds);

// Get all skills
router.get('/skills', async (req, res) => {
  try {
    const skills = await Skill.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Error fetching skills' });
  }
});

module.exports = router;
