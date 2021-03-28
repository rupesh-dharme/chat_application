const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { create } = require("../models/User");
const maxAge = 5 * 24 * 60 * 60;
const createJWT = (id) => {
  return jwt.sign({ id }, "chatroom secret", {
    expiresIn: maxAge,
  });
};
const alertError = (err) => {
  let errors = { name: "", email: "", password: "" };
  if (err.message == "Invalid email") {
    errors.email = "Email not found";
  }
  if (err.message == "Invalid Password") {
    errors.password = "Password Incorrect";
  }
  if (err.code === 11000) {
    errors.email = "This email already registered";
    return errors;
  }
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};
module.exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.create({ name, email, password });
    const token = createJWT(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).json({ user });
  } catch (error) {
    let errors = alertError(error);
    res.status(400).json({ errors });
  }
};
module.exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = createJWT(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).json({ user });
  } catch (error) {
    let errors = alertError(error);
    res.status(400).json({ errors });
  }
};
module.exports.logout = (req, res) => {
  res.send("logout");
};
