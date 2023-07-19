const catchError = require("../utils/catchError");
const EmailCode = require("../models/EmailCode");

const getAll = catchError(async (req, res) => {
  const emailCode = await EmailCode.findAll();
  return res.json(emailCode);
});

module.exports = {
  getAll,
};
