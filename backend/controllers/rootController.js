const { User, Role } = require('../models');
const sendEmail = require('../utils/sendEmail');

exports.getAllUsers = async (req, res) => {
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

exports.verifyUser = async (req, res) => {
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

      return res.send(" User approved and notified.");
    }

    if (action === 'decline') {
      await sendEmail({
        to: user.email,
        subject: 'Registration Declined',
        html: `<p>Your registration was declined. Please contact admin.</p>`
      });

      await user.destroy();
      return res.send(" User declined and removed.");
    }

    res.status(400).json({ message: 'Invalid action' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification error' });
  }
};
