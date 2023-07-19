const { getAll } = require("../controllers/emailCode.controller");
const express = require("express");

const emailRouter = express.Router();

emailRouter.route("/").get(getAll);

module.exports = emailRouter;
