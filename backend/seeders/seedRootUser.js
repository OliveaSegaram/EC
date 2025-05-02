const bcrypt = require('bcrypt');
const { User, Role } = require('../models');

const seedRootUser = async () => {
  try {
    let rootRole = await Role.findOne({ where: { name: 'root' } });
    if (!rootRole) rootRole = await Role.create({ name: 'root' });

    const rootUser = await User.findOne({ where: { roleId: rootRole.id } });
    if (rootUser) return console.log(' Root user already exists.');

    const hashedPassword = await bcrypt.hash(process.env.ROOT_PASSWORD, 10);

    await User.create({
      username: 'rootadmin',
      email: process.env.ROOT_EMAIL,
      password: hashedPassword,
      roleId: rootRole.id,
      isVerified: true
    });

    console.log('Root user seeded.');
  } catch (err) {
    console.error('Error seeding root user:', err.message);
  }
};

module.exports = seedRootUser;
