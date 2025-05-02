module.exports = (sequelize, DataTypes) => {
  const Issue = sequelize.define('Issue', {
    deviceId: { 
      type: DataTypes.STRING,
      allowNull: false,
    },
    complaintType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priorityLevel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    attachment: {
      type: DataTypes.STRING,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    underWarranty: {
      type: DataTypes.BOOLEAN, 
      defaultValue: false,
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  return Issue;
};
