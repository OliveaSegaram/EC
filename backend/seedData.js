const districts = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Moneragala',
  'Ratnapura',
  'Kegalle',
  'Colombo Head Office'
];

const skills = [
  'Cybersecurity',
  'Hardware Knowledge',
  'Networking & Infrastructure',
  'Operating Systems',
  'Software Support',
  'System Administration'
];

module.exports = {
  districts,
  skills,
  seedDatabase
};

async function seedDatabase() {
  const db = require('./models');
  const bcrypt = require('bcrypt');
  
  try {
    console.log('Seeding database...');
    
    // Create roles
    console.log('Creating roles...');
    const adminRole = await db.Role.findOrCreate({
      where: { name: 'admin' },
      defaults: { name: 'admin' }
    });
    
    // Create default skill for admin
    console.log('Creating default skill...');
    const defaultSkill = await db.Skill.findOrCreate({
      where: { name: 'Administration' },
      defaults: { name: 'Administration' }
    });
    
    // Create default district
    console.log('Creating default district...');
    const defaultDistrict = await db.District.findOrCreate({
      where: { name: 'Head Office' },
      defaults: { name: 'Head Office' }
    });
    
    // Create root user if not exists
    console.log('Creating root user...');
    const rootUser = await db.User.findOne({ where: { email: 'root@example.com' } });
    if (!rootUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.User.create({
        empId: 'ROOT001',
        username: 'root',
        email: 'root@example.com',
        password: hashedPassword,
        roleId: adminRole[0].id,
        skillId: defaultSkill[0].id,
        districtId: defaultDistrict[0].id,
        isVerified: true
      });
      console.log('Root user created successfully!');
    } else {
      console.log('Root user already exists');
    }

    // Create districts
    console.log('Creating districts...');
    for (const districtName of districts) {
      await db.District.findOrCreate({
        where: { name: districtName },
        defaults: { name: districtName }
      });
    }

    // Create skills
    console.log('Creating skills...');
    for (const skillName of skills) {
      if (skillName !== 'Administration') { // Skip if already created
        await db.Skill.findOrCreate({
          where: { name: skillName },
          defaults: { name: skillName }
        });
      }
    }


    console.log('Database seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
