'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the UserSkills join table
    await queryInterface.createTable('UserSkills', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      skillId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Skills',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add a unique constraint to prevent duplicate user-skill associations
    await queryInterface.addConstraint('UserSkills', {
      fields: ['userId', 'skillId'],
      type: 'unique',
      name: 'unique_user_skill'
    });

    // Migrate existing skillId data to the join table
    const users = await queryInterface.sequelize.query(
      'SELECT id, "skillId" FROM "Users" WHERE "skillId" IS NOT NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const user of users) {
      if (user.skillId) {
        await queryInterface.bulkInsert('UserSkills', [{
          userId: user.id,
          skillId: user.skillId,
          createdAt: new Date(),
          updatedAt: new Date()
        }]);
      }
    }

    // Remove the skillId column from Users table
    await queryInterface.removeColumn('Users', 'skillId');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the skillId column to Users table
    await queryInterface.addColumn('Users', 'skillId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Skills',
        key: 'id'
      }
    });

    // Migrate data back from join table
    const userSkills = await queryInterface.sequelize.query(
      'SELECT * FROM "UserSkills"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const userSkill of userSkills) {
      await queryInterface.sequelize.query(
        'UPDATE "Users" SET "skillId" = :skillId WHERE id = :userId',
        {
          replacements: { skillId: userSkill.skillId, userId: userSkill.userId },
          type: queryInterface.sequelize.QueryTypes.UPDATE
        }
      );
    }

    // Remove the join table
    await queryInterface.dropTable('UserSkills');
  }
};
