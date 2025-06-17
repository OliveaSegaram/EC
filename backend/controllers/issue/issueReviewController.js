const { Issue, User } = require('../../models');
const { Op } = require('sequelize');

// Update issue status and comment by Technical Officer
exports.updateTechnicalOfficerIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status, comment } = req.body;
    const userId = req.user.userId;

    // Validate status
    const validStatuses = ['In_Progress', 'Resolved', 'Need_More_Info'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Find the issue
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Verify the issue is assigned to the current user
    if (issue.assignedTo !== userId) {
      return res.status(403).json({ 
        message: 'You are not assigned to this issue' 
      });
    }

    // If status is being set to Resolved, change it to Pending_Review for review
    const newStatus = status === 'Resolved' ? 'Pending_Review' : status;
    
    // Format the new comment with timestamp and user info
    const timestamp = new Date().toISOString();
    const userInfo = req.user.username ? ` (${req.user.username})` : '';
    const statusUpdate = `Status updated to ${status}${userInfo} at ${timestamp}`;
    const newComment = comment ? `${comment}\n${statusUpdate}` : statusUpdate;
    
    // Update the issue
    issue.status = newStatus;
    issue.comment = issue.comment 
      ? `${issue.comment}\n\n${newComment}`
      : newComment;
    issue.lastUpdatedStatus = status; // Store the original status
    
    // Set resolvedAt if status is Resolved
    if (status === 'Resolved') {
      issue.resolvedAt = new Date();
    }
    
    await issue.save();

    res.status(200).json({
      message: 'Issue updated successfully',
      issue
    });
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(500).json({
      message: 'Error updating issue status',
      error: error.message
    });
  }
};

// Get issues updated by Technical Officer for review by Super Admin
exports.getIssuesForReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    // Only Super Admin can review issues
    if (userRole !== 'super_admin' && userRole !== 'root') {
      return res.status(403).json({ 
        message: 'Access denied. Only Super Admin can review issues.' 
      });
    }
    
    // Get all issues that are pending review, resolved, or completed
    const issues = await Issue.findAll({
      where: {
        status: {
          [Op.or]: ['Pending_Review', 'Resolved', 'Completed']
        }
      },
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'assignedTechnicalOfficer',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.status(200).json({ 
      success: true, 
      issues,
      message: 'Issues fetched successfully' 
    });
  } catch (error) {
    console.error('Error fetching issues for review:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issues for review',
      error: error.message,
      issues: []
    });
  }
};

// Confirm review of an issue updated by Technical Officer
exports.confirmReview = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { isApproved, comment } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only Super Admin can confirm review
    if (userRole !== 'super_admin' && userRole !== 'root') {
      return res.status(403).json({ 
        message: 'Access denied. Only Super Admin can confirm reviews.' 
      });
    }

    // Find the issue
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Verify the issue is in a reviewable state
    if (issue.status !== 'Pending_Review' && issue.status !== 'Resolved') {
      console.log(`Issue status is: ${issue.status}, lastUpdatedStatus: ${issue.lastUpdatedStatus}`);
      return res.status(400).json({ 
        success: false,
        message: `This issue cannot be reviewed. Status: ${issue.status}`,
        issueStatus: issue.status
      });
    }

    // Update the issue based on review result
    if (isApproved) {
      // Format the approval comment with timestamp and user info
      const timestamp = new Date().toISOString();
      const reviewerTitle = req.user.role === 'root' ? 'Root Admin' : 'Super Admin';
      const approvalComment = comment || `Issue resolved and reviewed by ${reviewerTitle}`;
      const statusUpdate = `${approvalComment} (${req.user.username || 'System'}) at ${timestamp}`;
      
      // Update the issue
      issue.status = 'Completed';
      issue.comment = issue.comment 
        ? `${issue.comment}\n\n${statusUpdate}`
        : statusUpdate;
      issue.reviewedBy = userId;
      issue.reviewedAt = new Date();
      
      // Set resolvedAt if not already set
      if (!issue.resolvedAt) {
        issue.resolvedAt = new Date();
      }
      
      // Set completedAt timestamp
      issue.completedAt = new Date();
    } else {
      // Format the rejection comment with timestamp and user info
      const timestamp = new Date().toISOString();
      const rejectionComment = comment || 'Review rejected. Please check and resubmit.';
      const statusUpdate = `${rejectionComment} (${req.user.username || 'System'}) at ${timestamp}`;
      
      // Update the issue
      issue.status = 'In_Progress';
      issue.comment = issue.comment 
        ? `${issue.comment}\n\n${statusUpdate}`
        : statusUpdate;
      issue.reviewedBy = userId;
      issue.reviewedAt = new Date();
      issue.lastUpdatedStatus = null; // Clear the last updated status
    }
    
    await issue.save();

    res.status(200).json({
      success: true,
      message: `Issue ${isApproved ? 'approved' : 'rejected'} successfully`,
      issue,
      issues: [issue] // Return the updated issue in an array for consistency
    });
  } catch (error) {
    console.error('Error confirming review:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming review',
      error: error.message,
      issues: []
    });
  }
};
