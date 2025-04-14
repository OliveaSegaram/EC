const { Role } = require('../models');
//this is for super user need to check
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ attributes: ['id', 'name'] });
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching roles' });
  }
};

exports.addRole = async (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ message: 'Role name is required' });

  try {
    const existing = await Role.findOne({ where: { name } });
    if (existing) return res.status(409).json({ message: 'Role already exists' });

    const role = await Role.create({ name });
    res.status(201).json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating role' });
  }
};
