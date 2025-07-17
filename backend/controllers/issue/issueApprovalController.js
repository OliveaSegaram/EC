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

    // Format the approval comment with timestamp and user info
    const timestamp = new Date().toISOString();
    const userInfo = req.user.username ? ` (${req.user.username})` : '';
    const approvalNote = comment || 'Approved by Verifying Officer';
    const statusUpdate = `${approvalNote}${userInfo} at ${timestamp}`;
    
    // Update the issue
    issue.status = DC_APPROVED;
    issue.comment = issue.comment 
      ? `${issue.comment}\n\n${statusUpdate}`
      : statusUpdate;
    issue.dcApprovedAt = new Date();
    issue.dcApprovedBy = userId;
    await issue.save();

    res.status(200).json({
      message: 'Issue approved by Verifying Officer successfully',
      issue
    });
  } catch (error) {
    console.error('Error approving issue by DC:', error);
    res.status(500).json({
      message: 'Error approving issue by Verifying Officer',
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

    // Format the rejection comment with timestamp and user info
    const timestamp = new Date().toISOString();
    const userInfo = req.user.username ? ` (${req.user.username})` : '';
    const rejectionNote = comment || 'Rejected by Verifying Officer';
    const statusUpdate = `${rejectionNote}${userInfo} at ${timestamp}`;
    
    // Update the issue
    issue.status = DC_REJECTED;
    issue.comment = issue.comment 
      ? `${issue.comment}\n\n${statusUpdate}`
      : statusUpdate;
    issue.rejectedAt = new Date();
    issue.rejectedBy = userId;
    await issue.save();

    res.status(200).json({
      message: 'Issue rejected by Verifying Officer successfully',
      issue
    });
  } catch (error) {
    console.error('Error rejecting issue by Verifying Officer:', error);
    res.status(500).json({
      message: 'Error rejecting issue by Verifying Officer',
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

    // Format the approval comment with timestamp and user info
    const timestamp = new Date().toISOString();
    const userInfo = req.user.username ? ` (${req.user.username})` : '';
    const approvalNote = comment || 'Approved by Super Admin';
    const statusUpdate = `${approvalNote}${userInfo} at ${timestamp}`;
    
    // Update the issue
    issue.status = SUPER_ADMIN_APPROVED;
    issue.comment = issue.comment 
      ? `${issue.comment}\n\n${statusUpdate}`
      : statusUpdate;
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

    // Format the approval comment with timestamp and user info
    const timestamp = new Date().toISOString();
    const userInfo = req.user.username ? ` (${req.user.username})` : '';
    const approvalNote = comment || 'Approved by Super Admin';
    const statusUpdate = `${approvalNote}${userInfo} at ${timestamp}`;
    
    // Update the issue
    issue.status = SUPER_ADMIN_APPROVED;
    issue.comment = issue.comment 
      ? `${issue.comment}\n\n${statusUpdate}`
      : statusUpdate;
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

    // Format the approval comment with timestamp and user info
    const timestamp = new Date().toISOString();
    const userInfo = req.user.username ? ` (${req.user.username})` : '';
    const approvalNote = comment || 'Approved by Root';
    const statusUpdate = `${approvalNote}${userInfo} at ${timestamp}`;
    
    // Update the issue
    issue.status = SUPER_ADMIN_APPROVED;
    issue.comment = issue.comment 
      ? `${issue.comment}\n\n${statusUpdate}`
      : statusUpdate;
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

    // Format the rejection comment with timestamp and user info
    const timestamp = new Date().toISOString();
    const userInfo = req.user.username ? ` (${req.user.username})` : '';
    const rejectionNote = comment || 'Rejected by Root';
    const statusUpdate = `${rejectionNote}${userInfo} at ${timestamp}`;
    
    // Update the issue
    issue.status = SUPER_ADMIN_REJECTED;
    issue.comment = issue.comment 
      ? `${issue.comment}\n\n${statusUpdate}`
      : statusUpdate;
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
