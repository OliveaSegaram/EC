const { Issue } = require('../models'); // Ensure this path is correct

// Handle issue submission
exports.submitIssue = async (req, res) => {
  try {
    const { complaintType, description, priorityLevel, location, username } = req.body;
    const attachment = req.file ? req.file.path : null;

    // Validate required fields
    if (!complaintType || !description || !priorityLevel || !location || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create a new issue record in the database
    const newIssue = await Issue.create({
      complaintType,
      description,
      priorityLevel,
      attachment,
      location,
      username,
    });

    return res.status(201).json({ message: 'Issue submitted successfully', issue: newIssue });
  } catch (error) {
    console.error('Error processing issue submission:', error);
    return res.status(500).json({ message: 'Error submitting issue', error: error.message });
  }
};