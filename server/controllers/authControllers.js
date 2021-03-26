const User = require("../models/User");
const alertError = (err) => {
  let errors = { name: "", email: "", password: "" };
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};
module.exports.signup = async (req, res) => {
  console.log("request:", req.body);
  const { name, email, password } = req.body;
  try {
    const user = await User.create({ name, email, password });
    res.status("201").json(user);
  } catch (error) {
    let errors = alertError(error);
    if (error.code === 11000) {
      errors.email = "This email already exists";
    }
    res.status(400).json({ errors });
  }
};
module.exports.login = (req, res) => {
  res.send("login");
};
module.exports.logout = (req, res) => {
  res.send("logout");
};