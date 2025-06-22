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
    
    // Create default skill
    console.log('Creating default skill...');
    const defaultSkill = await db.Skill.findOrCreate({
      where: { name: 'Administration' },
      defaults: { name: 'Administration' }
    });
    
    {/*// Create default district
    console.log('Creating default district...');
    const defaultDistrict = await db.District.findOrCreate({
      where: { name: 'Head Office' },
      defaults: { name: 'Head Office' }
    });*/}
    
    // Root user creation is handled in seedRootUser.js

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
      if (skillName !== 'Administration') { 
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
