const { DataTypes } = require("sequelize");
const sequelize = require("../utils/connection");

const EmailCode = sequelize.define("modelName", {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  //userId => relación en index.js
});

module.exports = EmailCode;
