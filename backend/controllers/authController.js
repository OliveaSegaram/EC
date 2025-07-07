const { User, Role, District, Skill } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const path = require('path');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { Op } = require('sequelize');


const register = async (req, res) => {
  console.log('Registration request body:', req.body);
  console.log('Registration request file:', req.file);
  
  const schema = Joi.object({
    nic: Joi.string()
      .required()
      .pattern(/^(\d{9}[vVxX]|\d{12})$/)
      .message('NIC must be either 9 digits followed by V/X or exactly 12 digits'),
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
      then: Joi.alternatives().try(
        Joi.number().integer(),
        Joi.string(),
        Joi.array().items(Joi.number().integer())
      ).required(),
      otherwise: Joi.any().optional()
    }),
    description: Joi.string().allow('').optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    console.log('Validation error:', error.details[0].message);
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    let { nic, username, email, password, role, description, districtId, skillId } = req.body;
    
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

    // Process skill IDs first since we need them for both new and updated users
    let skillIdsValue = [];
    if (role === 'technical_officer') {
      // Convert skillId to an array if it's a string (comma-separated) or a single number
      if (typeof skillId === 'string') {
        skillIdsValue = skillId.split(',').map(id => id.trim());
      } else if (Array.isArray(skillId)) {
        skillIdsValue = skillId;
      } else if (skillId) {
        skillIdsValue = [skillId];
      }

      if (skillIdsValue.length === 0) {
        return res.status(400).json({ message: "At least one skill is required for technical officers" });
      }

      // Verify each skill exists
      for (const id of skillIdsValue) {
        const skillIdNum = parseInt(id, 10);
        if (isNaN(skillIdNum)) {
          return res.status(400).json({ message: `Invalid skill ID: ${id}` });
        }
        
        const skill = await Skill.findByPk(skillIdNum);
        if (!skill) {
          return res.status(400).json({ message: `Skill with ID ${id} not found` });
        }
      }
    } else {
      // For non-technical roles, set a default skill ID (1 for 'Other')
      skillIdsValue = ['1'];
    }

    // Check if there's a rejected user with the same email or NIC
    const rejectedUser = await User.findOne({
      where: {
        [Op.or]: [
          { email, status: 'rejected' },
          { nic, status: 'rejected' }
        ]
      }
    });

    // If we found a rejected user, we'll update it instead of creating a new one
    if (rejectedUser) {
      // Save the previous rejection reason before updating
      const previousRejectionReason = rejectedUser.rejectionReason;
      
      // Get the role ID
      let roleData = await Role.findOne({ where: { name: role } });
      if (!roleData) roleData = await Role.create({ name: role });
      
      // Update the user with new details but keep the rejection reason
      await rejectedUser.update({
        username,
        email,
        password: await bcrypt.hash(password, 10),
        roleId: roleData.id,
        description,
        districtId,
        skillIds: skillIdsValue.join(','),
        status: 'pending', // Reset status to pending
        isVerified: false,
        rejectionReason: previousRejectionReason, // Keep the old rejection reason
        attachment: req.file ? req.file.path : null
      });

      return res.status(200).json({ 
        message: "Registration updated successfully. Please wait for admin approval.",
        user: {
          id: rejectedUser.id,
          email: rejectedUser.email,
          status: 'pending',
          previousRejectionReason: previousRejectionReason
        }
      });
    }

    // Check if user with same email or nic already exists
    const existingUser = await User.findOne({ 
      attributes: [
        'id', 'nic', 'username', 'email', 'password', 'description', 
        'districtId', 'isVerified', 'attachment', 'resetToken', 
        'resetTokenExpiry', 'createdAt', 'updatedAt', 'roleId', 'skillIds'
      ],
      where: { 
        [Op.or]: [
          { email },
          { nic }
        ]
      } 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already registered" });
      }
      if (existingUser.nic === nic) {
        return res.status(400).json({ message: "NIC already registered" });
      }
    }



    const hashedPassword = await bcrypt.hash(password, 10);
    let roleData = await Role.findOne({ where: { name: role } });
    if (!roleData) roleData = await Role.create({ name: role });

    const attachmentUrl = req.file ? req.file.path : null;

    // Create the user with skillIds
    const user = await User.create({
      nic,
      username,
      email,
      password: hashedPassword,
      roleId: roleData.id,
      isVerified: false,
      attachment: attachmentUrl,
      description,
      districtId,
      skillIds: skillIdsValue.join(',')
    }, {
      fields: [
        'nic', 'username', 'email', 'password', 'roleId', 
        'isVerified', 'attachment', 'description', 'districtId', 'skillIds'
      ]
    });

    // Get skill names for email
    const skillNames = [];
    for (const id of skillIdsValue) {
      }

    // Auto-approve the user but keep the rejection reason for reference
    user.status = 'approved';
    user.isVerified = true;
    await user.save();

    // Get the updated user with all fields including rejectionReason
    const updatedUser = await User.findByPk(user.id, {
      attributes: [
        'id', 'username', 'email', 'status', 'rejectionReason',
        'nic', 'description', 'attachment', 'createdAt', 'updatedAt'
      ],
      include: [
        { model: Role, attributes: ['id', 'name'] },
        { model: District, as: 'district', attributes: ['id', 'name'] },
        { model: Skill, as: 'skills', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    res.status(201).json({ 
      message: "Registration successful. You can now log in.",
      user: updatedUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal error" });
  }
};


const login = async (req, res) => {
  const { nic, password } = req.body;

  if (!nic) {
    return res.status(400).json({ message: 'NIC is required' });
  }

  try {
    const user = await User.findOne({ where: { nic }, include: Role });

    if (!user) return res.status(404).json({ message: 'Invalid NIC or password' });
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
      username: user.username, // Include the username in the response
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
      // Update both isVerified and status fields
      await user.update({ 
        isVerified: true,
        status: 'approved'
      });

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
      // Update both isVerified and status fields
      await user.update({ 
        isVerified: false,
        status: 'rejected',
        rejectionReason: req.body.reason || 'Registration declined by administrator'
      });

      await sendEmail({
        to: user.email,
        subject: "Registration Declined",
        html: `
          <h3>Registration Declined</h3>
          <p>Hi ${user.username}, unfortunately your registration was declined.</p>
          ${req.body.reason ? `<p>Reason: ${req.body.reason}</p>` : ''}
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
  const { nic } = req.body;

  if (!nic) {
    return res.status(400).json({ message: 'NIC is required' });
  }

  try {
    const user = await User.findOne({ where: { nic } });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this NIC' });
    }
    
    if (!user.email) {
      return res.status(400).json({ message: 'No email associated with this account' });
    }
    
    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 30; // 30 minutes
    await user.save();
    
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Reset Password',
      html: `
        <h3>Password Reset Request</h3>
        <p>You requested a password reset for your account with NIC: ${nic}</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 30 minutes.</p>
      `
    });

    res.json({ message: 'Password reset link has been sent to your email' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
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
