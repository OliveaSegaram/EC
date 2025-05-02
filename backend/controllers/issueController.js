const { Issue } = require('../models');

// Submit a new issue
exports.submitIssue = async (req, res) => {
  try {
    const { deviceId, complaintType, description, priorityLevel, location, underWarranty } = req.body;
    const attachment = req.file ? req.file.path : null;

    // Validate required fields
    if (!deviceId || !complaintType || !description || !priorityLevel || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create a new issue record in the database
    const newIssue = await Issue.create({
      deviceId,
      complaintType,
      description,
      priorityLevel,
      location,
      attachment,
      underWarranty,
    });

    return res.status(201).json({ message: 'Issue submitted successfully', issue: newIssue });
  } catch (error) {
    console.error('Error processing issue submission:', error);
    return res.status(500).json({ message: 'Error submitting issue', error: error.message });
  }
};

// Get all issues
exports.getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.findAll();
    return res.status(200).json({ issues });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return res.status(500).json({ message: 'Error fetching issues', error: error.message });
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
