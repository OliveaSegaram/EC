// controllers/issueController.js
const { Issue } = require('../models'); // Ensure this path is correct

exports.submitIssue = async (req, res) => {
  try {
    const { deviceId, complaintType, description, priorityLevel, location, username, underWarranty } = req.body;
    const attachment = req.file ? req.file.path : null; // Save attachment if any

    // Validate required fields
    if (!deviceId || !complaintType || !description || !priorityLevel || !location || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create a new issue record in the database
    const newIssue = await Issue.create({
      deviceId,
      complaintType,
      description,
      priorityLevel,
      location,
      username,
      attachment,
      underWarranty,
    });

    return res.status(201).json({ message: 'Issue submitted successfully', issue: newIssue });
  } catch (error) {
    console.error('Error processing issue submission:', error);
    return res.status(500).json({ message: 'Error submitting issue', error: error.message });
  }
};
