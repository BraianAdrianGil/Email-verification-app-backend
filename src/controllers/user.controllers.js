const catchError = require("../utils/catchError");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const EmailCode = require("../models/EmailCode");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const getAll = catchError(async (req, res) => {
  const results = await User.findAll();
  return res.json(results);
});

const create = catchError(async (req, res) => {
  const { email, password, firstName, lastName, country, image, frontBaseUrl } =
    req.body;
  const encriptedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: encriptedPassword,
    firstName,
    lastName,
    country,
    image,
  });

  const code = require("crypto").randomBytes(64).toString("hex");
  const link = `${frontBaseUrl}/auth/verify_email/${code}`;

  await EmailCode.create({
    code: code,
    userId: user.id,
  });

  await sendEmail({
    to: email, // Email del receptor
    subject: "Verify email for user app", // asunto
    html: `<h1>Hello ${firstName} ${lastName}</h1>
               <p>thanks for sign up in user app, verify your email clicking link below!</p>
               <a href="${link}">${link}</a>
               `,
  });

  return res.status(201).json(user);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await User.findByPk(id);
  if (!result) return res.sendStatus(404);
  return res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  await User.destroy({ where: { id } });
  return res.sendStatus(204);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, country, image } = req.body;
  const result = await User.update(
    { firstName, lastName, country, image },
    { where: { id }, returning: true }
  );
  if (result[0] === 0) return res.sendStatus(404);
  return res.json(result[1][0]);
});

const verifyCode = catchError(async (req, res) => {
  const { code } = req.params;
  const emailCode = await EmailCode.findOne({ where: { code } });
  if (!emailCode) return res.status(401).json({ message: "Invalid code" });
  const user = await User.findByPk(emailCode.userId);
  user.isVerified = true;
  await user.save();
  //   await User.update(
  //     { isVerified: true },
  //     { where: { id: emailCode.userId }, returning: true }
  //   ) esto es lo mismo que hacemos arriba pero se puede hacer con un update también;
  await emailCode.destroy();
  return res.json(user);
});

const login = catchError(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const userPassword = await bcrypt.compare(password, user.password);
  if (!userPassword)
    return res.status(401).json({ message: "Invalid credentials" });
  if (!user.isVerified)
    return res.status(401).json({ message: "Verify your account to access" });

  const token = await jwt.sign({ user }, process.env.TOKEN_SECRET, {
    expiresIn: "1d",
  });

  return res.json({ user, token });
});

const getLoggedUser = catchError(async (req, res) => {
  const user = req.user;
  return res.json(user);
  //return res.json(req.user) asi sirve también!
});

const resetPasswordEmail = catchError(async (req, res) => {
  const { email, frontBaseUrl } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) return res.status(401).json({ message: "Invalid email" });

  const code = require("crypto").randomBytes(64).toString("hex");
  const link = `${frontBaseUrl}/auth/reset_password/${code}`;

  await EmailCode.create({
    code: code,
    userId: user.id,
  });

  await sendEmail({
    to: email,
    subject: "Reset password",
    html: ` <h1>Reset password for user app</h1>
            <p>You have requested a password reset for your user in our application. <br />Please click the link below to create a new password</p>
            <br />
            <a href="${link}">${link}</a>`,
  });
});

const resetPassword = catchError(async (req, res) => {
  const { password } = req.body;
  const code = req.params;
  const encriptedPassword = await bcrypt.hash(password, 10);
  const emailCode = await EmailCode.findOne({ where: { code } });
  if (!emailCode) return res.status(401).json({ message: "Invalid code" });
  const user = await User.findByPk(emailCode.userId);
  await user.update(
    { password: encriptedPassword },
    { where: { id: emailCode.userId }, returning: true }
  );
  await emailCode.destroy();
  return res.json(user);
});

module.exports = {
  getAll,
  create,
  getOne,
  remove,
  update,
  verifyCode,
  login,
  getLoggedUser,
  resetPasswordEmail,
  resetPassword,
};
