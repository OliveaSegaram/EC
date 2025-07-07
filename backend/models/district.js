module.exports = (sequelize, DataTypes) => {
  const District = sequelize.define('District', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    timestamps: false
  });

  District.associate = function(models) {
    District.hasMany(models.User, {
      foreignKey: 'districtId',
      as: 'users'
    });
  };

  return District;
};
