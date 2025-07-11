const bcrypt = require('bcrypt');
const { User, Role } = require('../models');

const seedRootUser = async () => {
  try {
    let rootRole = await Role.findOne({ where: { name: 'root' } });
    if (!rootRole) rootRole = await Role.create({ name: 'root' });
  
    // Check if root user exists
    let rootUser = await User.findOne({ where: { roleId: rootRole.id } });
  
    const userData = {
      nic: process.env.ROOT_NIC,
      username: 'Super Admin',
      email: process.env.ROOT_EMAIL,
      roleId: rootRole.id,
      isVerified: true,
      districtId: null,
      skillIds: null
    };

    if (rootUser) {
      // Update existing root user if NIC or email changed
      if (rootUser.nic !== process.env.ROOT_NIC || rootUser.email !== process.env.ROOT_EMAIL) {
        await rootUser.update(userData);
        console.log('Root user updated with new NIC/email');
      } else {
        console.log('Root user already exists and is up to date');
      }
    } else {
      // Create new root user if doesn't exist
      const hashedPassword = await bcrypt.hash(process.env.ROOT_PASSWORD, 10);
      await User.create({
        ...userData,
        password: hashedPassword
      });
      console.log('New root user created');
    }
  } catch (err) {
    console.error('Error seeding root user:', err.message);
  }
};

module.exports = seedRootUser;
