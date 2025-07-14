module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      nic: {
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
        // Removed unique constraint from email
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
      skillIds: {
        type: DataTypes.STRING,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('skillIds');
          return rawValue ? rawValue.split(',').map(id => parseInt(id.trim(), 10)) : [];
        },
        set(value) {
          if (Array.isArray(value)) {
            this.setDataValue('skillIds', value.join(','));
          } else if (value) {
            this.setDataValue('skillIds', value);
          } else {
            this.setDataValue('skillIds', null);
          }
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
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      branch: {
        type: DataTypes.STRING,
        allowNull: true
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      indexes: [
        {
          unique: true,
          fields: ['nic']
        }
      ]
    });
  
    User.associate = function(models) {
    User.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role'
    });
    
    // Add District association
    User.belongsTo(models.District, {
      foreignKey: 'districtId',
      as: 'district',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  
    
    // Skill association is now handled through the skillIds field
  };

  return User;

};

