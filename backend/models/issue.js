module.exports = (sequelize, DataTypes) => {
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
      allowNull: false
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
    ]
  });

  return Issue;
};
