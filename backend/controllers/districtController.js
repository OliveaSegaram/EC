const { District } = require('../models');

// Get districts by IDs
exports.getDistrictsByIds = async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ message: 'No district IDs provided' });
    }

    const districtIds = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (districtIds.length === 0) {
      return res.status(400).json({ message: 'Invalid district IDs' });
    }

    const districts = await District.findAll({
      where: { id: districtIds },
      attributes: ['id', 'name']
    });

    res.json({ districts });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ message: 'Error fetching districts' });
  }
};
