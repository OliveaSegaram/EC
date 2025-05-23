module.exports = (sequelize, DataTypes) => {
  // Define the model with all fields
  const Issue = sequelize.define('Issue', {
    deviceId: { 
      type: DataTypes.STRING,
      allowNull: false
    },
    complaintType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priorityLevel: {
      type: DataTypes.STRING,
      allowNull: false
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    underWarranty: {
      type: DataTypes.BOOLEAN, 
      defaultValue: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
      allowNull: false
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    needsReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // We'll use the existing comment field for approval comments
    // This is a virtual getter for backward compatibility
    approvalComment: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('comment');
      },
      set(value) {
        // Store the approval comment in the comment field
        this.setDataValue('comment', value);
      }
    }
  }, {
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['deviceId']
      },
      {
        fields: ['submittedAt']
      }
    ],
    // Add a hook to handle the case where the approvalComment column doesn't exist
    hooks: {
      beforeFind: (options) => {
        // If we're selecting specific attributes, make sure to include approvalComment
        if (options.attributes && Array.isArray(options.attributes)) {
          if (!options.attributes.includes('approvalComment') && 
              !options.attributes.some(attr => 
                Array.isArray(attr) && attr[0] === 'approvalComment'
              )) {
            options.attributes.push('approvalComment');
          }
        }
        return options;
      }
    }
  });

  // Add a method to safely get the approval comment
  Issue.prototype.getApprovalComment = function() {
    try {
      return this.getDataValue('approvalComment') || null;
    } catch (e) {
      return null;
    }
  };

  // Define association with District
  Issue.associate = function(models) {
    Issue.belongsTo(models.District, {
      foreignKey: 'location',
      targetKey: 'id',
      as: 'districtInfo'
    });
  };

  return Issue;
};