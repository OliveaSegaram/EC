const { Issue, User, Role } = require('../../models');
const { 
  ASSIGNED,
  IN_PROGRESS,
  RESOLVED,
  REOPENED
} = require('../../constants/issueStatuses');

// Get assigned issues for Technical Officer
exports.getTechnicalOfficerAssignedIssues = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all issues assigned to this technical officer, including resolved ones
    const issues = await Issue.findAll({
      where: { 
        assignedTo: userId,
        status: [ASSIGNED, IN_PROGRESS, REOPENED, RESOLVED, 'Resolved']
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

    res.status(200).json({ issues });
  } catch (error) {
    console.error('Error fetching assigned issues:', error);
    res.status(500).json({
      message: 'Error fetching assigned issues',
      error: error.message
    });
  }
};

// Assign a technical officer to an issue
exports.assignTechnicalOfficer = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { technicalOfficerId, comment } = req.body;
    const userId = req.user.userId;

    // Find the issue
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Verify the technical officer exists and has the correct role
    const technicalOfficer = await User.findOne({
      where: { id: technicalOfficerId },
      include: [{
        model: Role,
        as: 'role',
        where: { name: 'technical_officer' },
        required: true
      }]
    });

    if (!technicalOfficer) {
      return res.status(404).json({ 
        message: 'Technical officer not found or invalid' 
      });
    }

    // Update the issue
    issue.assignedTo = technicalOfficerId;
    issue.status = ASSIGNED;
    issue.assignedAt = new Date();
    issue.assignedBy = userId;
    
    // Preserve existing comments and add assignment note
    const assignmentNote = comment || `Assigned to ${technicalOfficer.username}`;
    issue.comment = issue.comment 
      ? `${issue.comment}\n
      
${assignmentNote}`
      : assignmentNote;
      
    await issue.save();

    res.status(200).json({
      message: 'Technical officer assigned successfully',
      issue,
      technicalOfficer: {
        id: technicalOfficer.id,
        username: technicalOfficer.username,
        email: technicalOfficer.email,
        //firstName: technicalOfficer.firstName,
        //lastName: technicalOfficer.lastName
      }
    });
  } catch (error) {
    console.error('Error assigning technical officer:', error);
    res.status(500).json({
      message: 'Error assigning technical officer',
      error: error.message
    });
  }
};

// Update issue status to In Progress
exports.startWorkingOnIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Verify the user is assigned to this issue
    if (issue.assignedTo !== userId) {
      return res.status(403).json({ message: 'You are not assigned to this issue' });
    }

    // Format the new comment with timestamp and user info
    const timestamp = new Date().toISOString();
    const userInfo = req.user.username ? ` (${req.user.username})` : '';
    const statusUpdate = `Status changed to In Progress${userInfo} at ${timestamp}`;
    const newComment = comment ? `${comment}\n${statusUpdate}` : statusUpdate;
    
    // Preserve existing comments and add the new one
    issue.comment = issue.comment 
      ? `${issue.comment}\n\n${newComment}`
      : newComment;
      
    issue.status = IN_PROGRESS;
    issue.startedAt = new Date();
    await issue.save();

    res.status(200).json({
      message: 'Issue marked as In Progress',
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

// Mark issue as resolved
exports.resolveIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment, resolutionDetails } = req.body;
    const userId = req.user.userId;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Verify the user is assigned to this issue
    if (issue.assignedTo !== userId) {
      return res.status(403).json({ message: 'You are not assigned to this issue' });
    }

    // Format the new comment with timestamp and user info
    const timestamp = new Date().toISOString();
    const userInfo = req.user.username ? ` (${req.user.username})` : '';
    const statusUpdate = `Status changed to Resolved${userInfo} at ${timestamp}`;
    const newComment = comment 
      ? `${comment}\n${statusUpdate}` 
      : statusUpdate;
    
    // Preserve existing comments and add the new one
    issue.comment = issue.comment 
      ? `${issue.comment}\n\n${newComment}`
      : newComment;
      
    issue.status = RESOLVED;
    issue.resolvedAt = new Date();
    issue.resolutionDetails = resolutionDetails || '';
    await issue.save();

    res.status(200).json({
      message: 'Issue marked as Resolved',
      issue
    });
  } catch (error) {
    console.error('Error resolving issue:', error);
    res.status(500).json({
      message: 'Error resolving issue',
      error: error.message
    });
  }
};
