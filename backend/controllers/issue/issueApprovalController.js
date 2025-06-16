const { Issue, User } = require('../../models');
const { 
  PENDING,
  DC_APPROVED, 
  DC_REJECTED, 
  SUPER_ADMIN_APPROVED, 
  SUPER_ADMIN_REJECTED,
  ASSIGNED
} = require('../../constants/issueStatuses');

// DC approve issue
exports.approveByDC = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update the issue
    issue.status = DC_APPROVED;
    issue.comment = comment || 'Approved by DC';
    issue.dcApprovedAt = new Date();
    issue.dcApprovedBy = userId;
    await issue.save();

    res.status(200).json({
      message: 'Issue approved by DC successfully',
      issue
    });
  } catch (error) {
    console.error('Error approving issue by DC:', error);
    res.status(500).json({
      message: 'Error approving issue by DC',
      error: error.message
    });
  }
};

// DC reject issue
exports.rejectByDC = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update the issue
    issue.status = DC_REJECTED;
    issue.comment = comment || 'Rejected by DC';
    issue.rejectedAt = new Date();
    issue.rejectedBy = userId;
    await issue.save();

    res.status(200).json({
      message: 'Issue rejected by DC successfully',
      issue
    });
  } catch (error) {
    console.error('Error rejecting issue by DC:', error);
    res.status(500).json({
      message: 'Error rejecting issue by DC',
      error: error.message
    });
  }
};

// Super Admin approve issue
exports.approveBySuperAdmin = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update the issue
    issue.status = SUPER_ADMIN_APPROVED;
    issue.comment = comment || 'Approved by Super Admin';
    issue.superAdminApprovedAt = new Date();
    issue.superAdminApprovedBy = userId;
    await issue.save();

    res.status(200).json({
      message: 'Issue approved by Super Admin successfully',
      issue
    });
  } catch (error) {
    console.error('Error approving issue by Super Admin:', error);
    res.status(500).json({
      message: 'Error approving issue by Super Admin',
      error: error.message
    });
  }
};

// Super User approve issue 
exports.approveBySuperUser = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update the issue
    issue.status = SUPER_ADMIN_APPROVED;
    issue.comment = comment || 'Approved by Super User';
    issue.superAdminApprovedAt = new Date();
    issue.superAdminApprovedBy = userId;
    await issue.save();

    res.status(200).json({
      message: 'Issue approved by Super User successfully',
      issue
    });
  } catch (error) {
    console.error('Error approving issue by Super User:', error);
    res.status(500).json({
      message: 'Error approving issue by Super User',
      error: error.message
    });
  }
};

// Approve by Root (Super Admin)
exports.approveByRoot = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update the issue
    issue.status = SUPER_ADMIN_APPROVED; // Use the constant for Super Admin approval
    issue.comment = comment || 'Approved by Root';
    issue.superAdminApprovedAt = new Date();
    issue.superAdminApprovedBy = userId;
    await issue.save();

    res.status(200).json({
      message: 'Issue approved by Root successfully',
      issue
    });
  } catch (error) {
    console.error('Error approving issue by Root:', error);
    res.status(500).json({
      message: 'Error approving issue by Root',
      error: error.message
    });
  }
};

// Reject by Root
exports.rejectByRoot = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update the issue
    issue.status = SUPER_ADMIN_REJECTED; 
    issue.comment = comment || 'Rejected by Root';
    issue.rejectedAt = new Date();
    issue.rejectedBy = userId;
    await issue.save();

    res.status(200).json({
      message: 'Issue rejected by Root successfully',
      issue
    });
  } catch (error) {
    console.error('Error rejecting issue by Root:', error);
    res.status(500).json({
      message: 'Error rejecting issue by Root',
      error: error.message
    });
  }
};
