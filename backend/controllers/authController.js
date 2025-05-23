const { User, Role, District, Skill } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { Op } = require('sequelize');


const register = async (req, res) => {
  console.log('Registration request body:', req.body);
  console.log('Registration request file:', req.file);
  
  // Make sure empId is properly extracted from the request body
  const empId = req.body.empId;
  console.log('Extracted empId:', empId);
  
  const schema = Joi.object({
    empId: Joi.string().required(),
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().required(),
    districtId: Joi.when('role', {
      is: Joi.valid('subject_clerk', 'dc'),
      then: Joi.number().integer().required(),
      otherwise: Joi.number().integer().optional()
    }),
    skillId: Joi.when('role', {
      is: 'technical_officer',
      then: Joi.number().integer().required(),
      otherwise: Joi.number().integer().optional()
    }),
    description: Joi.string().allow('').optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    console.log('Validation error:', error.details[0].message);
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    let { empId, username, email, password, role, description, districtId, skillId } = req.body;
    
    // For subject_clerk and dc, verify district exists
    // For other roles, find Colombo Head Office district
    let district;
    if (['subject_clerk', 'dc'].includes(role)) {
      district = await District.findByPk(districtId);
      if (!district) {
        return res.status(400).json({ message: "Invalid district" });
      }
    } else {
      // For other roles, find Colombo Head Office district
      district = await District.findOne({ where: { name: 'Colombo Head Office' } });
      if (!district) {
        // If Colombo Head Office doesn't exist, create it
        district = await District.create({ name: 'Colombo Head Office' });
      }
      districtId = district.id;
    }

    // Check if user with same email or empId already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(400).json({ message: "Email already registered" });
    
    const existingEmpId = await User.findOne({ where: { empId } });
    if (existingEmpId) return res.status(400).json({ message: "Employee ID already registered" });

    // For technical officers, verify skill exists
    let skill = null;
    if (role === 'technical_officer') {
      skill = await Skill.findByPk(skillId);
      if (!skill) {
        return res.status(400).json({ message: "Invalid skill" });
      }
    } else {
      // For non-technical roles, set a default skill ID (e.g., 'Other')
      skill = await Skill.findOne({ where: { name: 'Other' } });
      if (!skill) {
        skill = await Skill.create({ name: 'Other' });
      }
      skillId = skill.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let roleData = await Role.findOne({ where: { name: role } });
    if (!roleData) roleData = await Role.create({ name: role });

    const attachmentUrl = req.file ? req.file.path : null;

    const user = await User.create({
      empId,
      username,
      email,
      password: hashedPassword,
      roleId: roleData.id,
      isVerified: false,
      attachment: attachmentUrl,
      description,
      districtId,
      skillId
    });

    const linkAccept = `${process.env.BASE_URL}/api/auth/verify/${user.id}?action=accept`;
    const linkDecline = `${process.env.BASE_URL}/api/auth/verify/${user.id}?action=decline`;

    await sendEmail({
      to: process.env.ROOT_EMAIL,
      subject: "New Registration Request",
      html: `
        <h3>New Registration</h3>
        <p><strong>Employee ID:</strong> ${empId}</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>District:</strong> ${district.name}</p>
        <p><strong>Skill:</strong> ${skill.name}</p>
        <p><strong>Description:</strong> ${description || 'N/A'}</p>
        <p><strong>Attachment:</strong> <a href="${process.env.BASE_URL}/${attachmentUrl}">View Attachment</a></p>

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

    // Create token with the correct userId field
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.Role.name,
        district: user.district
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    console.log('Generated token with userId:', user.id);

    res.json({ 
      token, 
      role: user.Role.name,
      userId: user.id,
      district: user.district
    });
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


// Get user profile data
const getUserProfile = async (req, res) => {
  try {
    console.log('getUserProfile - req.user:', req.user);
    
    // Get userId from the request
    const userId = req.user.userId;
    
    if (!userId) {
      console.error('No userId found in request');
      return res.status(400).json({ message: 'No user ID provided' });
    }
    
    console.log('Looking up user with ID:', userId);
    
    // First get the basic user info
    const user = await User.findByPk(userId, {
      include: [
        { model: Role, attributes: ['name'] }
      ],
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] }
    });

    if (!user) {
      console.error(`User with ID ${userId} not found in database`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get district info separately
    let district = null;
    if (user.districtId) {
      district = await District.findByPk(user.districtId, {
        attributes: ['id', 'name']
      });
    }
    
    const userData = user.get({ plain: true });
    userData.district = district;
    // Also include districtId at the root level for easier access
    userData.districtId = user.districtId;
    
    console.log('User found:', { 
      id: userData.id, 
      username: userData.username, 
      district: district?.name,
      districtId: user.districtId 
    });

    // Return the user data with district
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  verifyRegistration,
  forgotPassword,
  resetPassword,
  getUserProfile
};
