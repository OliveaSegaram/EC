module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      empId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      districtId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Districts',
          key: 'id'
        }
      },
      skillId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Skills',
          key: 'id'
        }
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      attachment: {
        type: DataTypes.STRING,
        allowNull: true
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      indexes: [
        {
          unique: true,
          fields: ['email']
        }
      ]
    });
  
    // No associations defined to avoid database schema changes
    return User;
  };
  