const { User, Role } = require('../models');
const sendEmail = require('../utils/sendEmail');

// GET all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: Role,
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// VERIFY user via link
const verifyUser = async (req, res) => {
  const { id } = req.params;
  const { action } = req.query;

  try {
    const user = await User.findByPk(id, { include: Role });
    if (!user) return res.status(404).send('User not found');

    if (action === 'accept') {
      user.isVerified = true;
      await user.save();

      await sendEmail({
        to: user.email,
        subject: 'Registration Approved',
        html: `<p>Your registration as ${user.Role.name} is approved. You can now login.</p>`
      });

      return res.send("User approved and notified.");
    }

    if (action === 'decline') {
      await sendEmail({
        to: user.email,
        subject: 'Registration Declined',
        html: `<p>Your registration was declined. Please contact admin.</p>`
      });

      await user.destroy();
      return res.send("User declined and removed.");
    }

    res.status(400).json({ message: 'Invalid action' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification error' });
  }
};

// DELETE user
const deleteUser = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// GET all roles
const getAllRoles = async (_req, res) => {
  try {
    const roles = await Role.findAll();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

// ADD new role
const addRole = async (req, res) => {
  const { name } = req.body;
  try {
    const existing = await Role.findOne({ where: { name } });
    if (existing) return res.status(400).json({ message: 'Role already exists' });

    const role = await Role.create({ name });
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add role' });
  }
};

// ADD this above the export block
const deleteRole = async (req, res) => {
  try {
    const roleId = req.params.id;

    const usersWithRole = await User.findAll({ where: { roleId } });
    if (usersWithRole.length > 0) {
      return res.status(400).json({ message: 'Cannot delete role in use by users' });
    }

    await Role.destroy({ where: { id: roleId } });
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete role' });
  }
};



// Approve user from dashboard
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { include: Role });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }
    
    user.isVerified = true;
    await user.save();
    
    // Send email notification
    await sendEmail({
      to: user.email,
      subject: 'Registration Approved',
      html: `<p>Your registration as ${user.Role?.name || 'professional'} is approved. You can now login.</p>`
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'User approved successfully and notification sent' 
    });
  } catch (error) {
    console.error('Error approving user:', error);
    return res.status(500).json({ message: 'Failed to approve user' });
  }
};

// Reject user from dashboard
const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const user = await User.findByPk(id, { include: Role });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'Cannot reject an already verified user' });
    }
    
    // Send email notification with rejection reason
    await sendEmail({
      to: user.email,
      subject: 'Registration Declined',
      html: `<p>Your registration was declined.</p><p>Reason: ${rejectionReason}</p><p>Please contact admin for further assistance.</p>`
    });
    
    // Delete the user
    await user.destroy();
    
    return res.status(200).json({ 
      success: true, 
      message: 'User rejected successfully and notification sent' 
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    return res.status(500).json({ message: 'Failed to reject user' });
  }
};

//  Export all handlers
module.exports = {
  getAllUsers,
  verifyUser,
  deleteUser,
  getAllRoles,
  addRole,
  deleteRole,
  approveUser,
  rejectUser
};
