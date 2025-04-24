const { User, Role } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { Op } = require('sequelize');


const register = async (req, res) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().required(),
    description: Joi.string().allow('').optional()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const { username, email, password, role, description } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    let roleData = await Role.findOne({ where: { name: role } });
    if (!roleData) roleData = await Role.create({ name: role });

    const attachmentUrl = req.file ? req.file.path : null;

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      roleId: roleData.id,
      isVerified: false,
      attachment: attachmentUrl,
      description
    });

    const linkAccept = `${process.env.BASE_URL}/api/auth/verify/${user.id}?action=accept`;
    const linkDecline = `${process.env.BASE_URL}/api/auth/verify/${user.id}?action=decline`;

    await sendEmail({
      to: process.env.ROOT_EMAIL,
      subject: "New Registration Request",
      html: `
        <h3>New Registration</h3>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Description:</strong> ${description || 'N/A'}</p>
         <p><strong>Attachment:</strong><a href="${process.env.BASE_URL}/${attachmentUrl}"></p>

        <p><a href="${linkAccept}">Accept</a> | <a href="${linkDecline}"> Decline</a></p>
      `
    });

    res.status(201).json({ message: "Registration submitted for approval" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal error" });
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email }, include: Role });

    if (!user) return res.status(404).json({ message: 'Invalid email or password' });
    if (!user.password || typeof password !== 'string') {
      return res.status(500).json({ message: 'Password data is invalid' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid password' });

    if (!user.isVerified) return res.status(403).json({ message: 'Account not verified yet' });

    const token = jwt.sign(
      { userId: user.id, role: user.Role.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: user.Role.name });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const verifyRegistration = async (req, res) => {
  const { userId } = req.params;
  const { action } = req.query;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (action === 'accept') {
      user.isVerified = true;
      await user.save();

      await sendEmail({
        to: user.email,
        subject: "Registration Approved",
        html: `
          <h3>Registration Approved</h3>
          <p>Hi ${user.username}, your account has been approved. You can now log in.</p>
        `
      });

      return res.send("User approved and notified");
    } else if (action === 'decline') {
      user.isVerified = false;
      await user.save();

      await sendEmail({
        to: user.email,
        subject: "Registration Declined",
        html: `
          <h3>Registration Declined</h3>
          <p>Hi ${user.username}, unfortunately your registration was declined.</p>
        `
      });

      return res.send("User declined and notified");
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const token = crypto.randomBytes(20).toString('hex');
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 1000 * 60 * 30; 
  await user.save();

  const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset Password',
    html: `<a href="${link}">Reset your password</a>`
  });

  res.json({ message: 'Reset link sent' });
};


const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    where: {
      resetToken: token,
      resetTokenExpiry: { [Op.gt]: Date.now() }
    }
  });

  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  res.json({ message: 'Password updated successfully' });
};


module.exports = {
  register,
  login,
  verifyRegistration,
  forgotPassword,
  resetPassword
};
