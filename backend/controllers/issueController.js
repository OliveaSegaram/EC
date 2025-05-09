const { Issue } = require('../models');

// Submit a new issue
exports.submitIssue = async (req, res) => {
  try {
    const {
      deviceId,
      complaintType,
      description,
      priorityLevel,
      location,
      underWarranty
    } = req.body;

    // Create the issue
    const issue = await Issue.create({
      deviceId,
      complaintType,
      description,
      priorityLevel,
      location,
      underWarranty: underWarranty === 'true',
      status: 'Pending',
      submittedAt: new Date(),
      attachment: req.file ? req.file.path : null
    });

    res.status(201).json({
      message: 'Issue submitted successfully',
      issue
    });
  } catch (error) {
    console.error('Error submitting issue:', error);
    res.status(500).json({
      message: 'Error submitting issue',
      error: error.message
    });
  }
};

// Get all issues
exports.getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.findAll({
      order: [['submittedAt', 'DESC']]
    });

    res.json({ issues });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      message: 'Error fetching issues',
      error: error.message
    });
  }
};

// Get issue details by ID
exports.getIssueDetails = async (req, res) => {
  try {
    const { id } = req.params;  
    const issue = await Issue.findOne({ where: { id } });  

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    return res.status(200).json({ issue });
  } catch (error) {
    console.error('Error fetching issue details:', error);
    return res.status(500).json({ message: 'Error fetching issue details', error: error.message });
  }
};

// Update issue details (status, description, etc.)
exports.updateIssue = async (req, res) => {
  try {
    const { id } = req.params;  
    const { status, description, priorityLevel, location, resolutionDetails } = req.body;

    if (!status && !description && !priorityLevel && !location && !resolutionDetails) {
      return res.status(400).json({ message: 'No fields provided to update' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (description) updateData.description = description;
    if (priorityLevel) updateData.priorityLevel = priorityLevel;
    if (location) updateData.location = location;
    if (resolutionDetails) updateData.resolutionDetails = resolutionDetails;

    const updatedIssue = await Issue.update(updateData, {
      where: { id }  
    });

    if (updatedIssue[0] === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    return res.status(200).json({ message: 'Issue updated successfully' });
  } catch (error) {
    console.error('Error updating issue:', error);
    return res.status(500).json({ message: 'Error updating issue', error: error.message });
  }
};

// Delete an issue
exports.deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;  
    const deletedIssue = await Issue.destroy({ where: { id } });

    if (deletedIssue === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    return res.status(200).json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return res.status(500).json({ message: 'Error deleting issue', error: error.message });
  }
};

// DC approve issue
exports.approveByDC = async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update issue status
    await issue.update({ status: 'DC Approved' });

    res.json({ message: 'Issue approved by DC successfully' });
  } catch (error) {
    console.error('Error approving issue:', error);
    res.status(500).json({
      message: 'Error approving issue',
      error: error.message
    });
  }
};

// DC reject issue
exports.rejectByDC = async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update issue status
    await issue.update({ status: 'Rejected by DC' });

    res.json({ message: 'Issue rejected by DC successfully' });
  } catch (error) {
    console.error('Error rejecting issue:', error);
    res.status(500).json({
      message: 'Error rejecting issue',
      error: error.message
    });
  }
};

// Super User approve issue
exports.approveBySuperUser = async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if DC has approved
    if (issue.status !== 'DC Approved') {
      return res.status(400).json({ message: 'Issue must be approved by DC first' });
    }

    // Update issue status
    await issue.update({ status: 'Super User Approved' });

    res.json({ message: 'Issue approved by Super User successfully' });
  } catch (error) {
    console.error('Error approving issue:', error);
    res.status(500).json({
      message: 'Error approving issue',
      error: error.message
    });
  }
};

// Super Admin approve issue
exports.approveBySuperAdmin = async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if Super User has approved
    if (issue.status !== 'Super User Approved') {
      return res.status(400).json({ message: 'Issue must be approved by Super User first' });
    }

    // Update issue status
    await issue.update({ status: 'Super Admin Approved' });

    res.json({ message: 'Issue approved by Super Admin successfully' });
  } catch (error) {
    console.error('Error approving issue:', error);
    res.status(500).json({
      message: 'Error approving issue',
      error: error.message
    });
  }
};

// Approve by Root
exports.approveByRoot = async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findByPk(issueId);
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    if (issue.status !== 'DC Approved') {
      return res.status(400).json({ message: 'Issue must be DC Approved first' });
    }
    
    await issue.update({ status: 'Root Approved' });
    res.json({ message: 'Issue approved by Root successfully' });
  } catch (error) {
    console.error('Error approving issue:', error);
    res.status(500).json({ message: 'Error approving issue', error: error.message });
  }
};

// Reject by Root
exports.rejectByRoot = async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findByPk(issueId);
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    if (issue.status !== 'DC Approved') {
      return res.status(400).json({ message: 'Issue must be DC Approved first' });
    }
    
    await issue.update({ status: 'Rejected by Root' });
    res.json({ message: 'Issue rejected by Root successfully' });
  } catch (error) {
    console.error('Error rejecting issue:', error);
    res.status(500).json({ message: 'Error rejecting issue', error: error.message });
  }
};
