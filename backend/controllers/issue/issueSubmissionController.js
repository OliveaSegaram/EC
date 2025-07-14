const { Issue, User, District } = require('../../models');
const { Op } = require('sequelize');
const { PENDING } = require('../../constants/issueStatuses');

// Submit a new issue
exports.submitIssue = async (req, res) => {
  try {
    console.log('Submit issue request body:', req.body);
    console.log('Submit issue auth user:', req.user);
    
    const {
      deviceId,
      complaintType,
      description,
      priorityLevel,
      //location,
      underWarranty
    } = req.body;

    // Make sure we have the required fields
    if (!deviceId || !complaintType || !description || !priorityLevel) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get the user's district ID from their profile
    const userId = req.user.userId;
    let districtId = null;
    let issueLocation = 'Not specified';
    let isHeadOffice = false;
    
    if (userId) {
      console.log('Looking up user with ID:', userId);
      
      try {
        // First get the user with districtId
        const user = await User.findByPk(userId, {
          attributes: ['id', 'districtId']
        });
        
        if (user && user.districtId) {
          districtId = user.districtId;
          
          // If we need to show the district name in logs, we can fetch it
          const district = await District.findByPk(districtId);
          
          if (district) {
            isHeadOffice = district.name === 'Colombo Head Office';
            
            // If the user is from Colombo Head Office and branch is provided, format the location
            if (isHeadOffice && req.body.branch) {
              issueLocation = `Colombo Head Office - ${req.body.branch}`;
            } else {
              // Store just the district ID in the location field
              issueLocation = districtId.toString();
            }
            console.log(`Using district ID: ${districtId} (${district.name}) for issue location`);
          } else {
            console.log(`District not found for ID: ${districtId}`);
            // Still store the district ID even if we couldn't find the district details
            issueLocation = districtId.toString();
          }
        } else {
          console.log(`User or district ID not found for user ID ${userId}, using default location`);
        }
      } catch (error) {
        console.error('Error fetching user district:', error);
        // If there was an error but we have a districtId, still use it
        if (districtId) {
          issueLocation = districtId.toString();
        }
      }
    }

    // Create the issue
    let attachmentPath = null;
    if (req.file) {
      // Extract just the filename from the path
      const filename = req.file.filename;
      // Store the path relative to the uploads directory
      attachmentPath = `uploads/${filename}`;
    }

    const issue = await Issue.create({
      deviceId,
      complaintType,
      description,
      priorityLevel,
      location: issueLocation,
      branch: isHeadOffice ? req.body.branch : null, // Save branch for Colombo Head Office
      underWarranty: underWarranty === 'true',
      status: PENDING,
      submittedAt: new Date(),
      attachment: attachmentPath,
      userId: userId 
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

// Update issue details
exports.updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      description, 
      priorityLevel, 
      location, 
      underWarranty,
      comment,
      deviceId,
      complaintType
    } = req.body;

    // Find the issue
    const issue = await Issue.findByPk(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Handle comment update with timestamp and user info
    if (comment) {
      const timestamp = new Date().toISOString();
      const userInfo = req.user?.username ? ` (${req.user.username})` : '';
      const statusUpdate = `${comment}${userInfo} at ${timestamp}`;
      
      issue.comment = issue.comment 
        ? `${issue.comment}\n\n${statusUpdate}`
        : statusUpdate;
    }
    
    // Update all fields including status if provided
    issue.deviceId = deviceId || issue.deviceId;
    issue.complaintType = complaintType || issue.complaintType;
    issue.description = description || issue.description;
    issue.priorityLevel = priorityLevel || issue.priorityLevel;
    issue.location = location || issue.location;
    issue.underWarranty = underWarranty !== undefined ? underWarranty : issue.underWarranty;
    
    // Update status if provided
    console.log('Current issue status:', issue.status);
    console.log('Requested status update to:', status);
    if (status) {
      issue.status = status;
      console.log('Status updated to:', issue.status);
    }

    // Handle file upload if present
    if (req.file) {
      // If there was a previous attachment, you might want to delete it here
      if (issue.attachment) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', '..', issue.attachment);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // Store the new file path relative to the uploads directory
      issue.attachment = `uploads/${req.file.filename}`;
    } else if (req.body.keepExistingAttachment !== 'true') {
      // If no new file is provided and we're not explicitly keeping the existing one, clear the attachment
      if (issue.attachment) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', '..', issue.attachment);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      issue.attachment = null;
    }

    // Save the updated issue with all fields including status
    console.log('Saving issue with status:', issue.status);
    const updatedIssue = await issue.save({
      fields: ['deviceId', 'complaintType', 'description', 'priorityLevel', 
               'location', 'underWarranty', 'attachment', 'comment', 'status']
    });
    
    console.log('Issue saved successfully. New status:', updatedIssue.status);

    res.status(200).json({
      message: 'Issue updated successfully',
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({
      message: 'Error updating issue',
      error: error.message
    });
  }
};

// Delete an issue
exports.deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the issue
    const issue = await Issue.findByPk(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    // Delete the issue
    await issue.destroy();
    
    res.status(200).json({
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({
      message: 'Error deleting issue',
      error: error.message
    });
  }
};

// Reopen issue (for Subject Clerk)
exports.reopenIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    // Find the issue
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Only allow reopening if the issue is in 'Completed' status
    if (issue.status !== 'Completed') {
      return res.status(400).json({ 
        message: `Only completed issues can be reopened. Current status: ${issue.status}` 
      });
    }

    // Format the reopen comment with timestamp and user info
    const timestamp = new Date().toISOString();
    const userInfo = req.user.username ? ` (${req.user.username})` : '';
    const reopenComment = comment || 'Issue reopened and sent for DC approval';
    const statusUpdate = `WORKFLOW RESTARTED: ${reopenComment}${userInfo} at ${timestamp}`;
    
    // Update the issue to restart the workflow
    issue.status = 'Pending';
    issue.comment = issue.comment 
      ? `${issue.comment}\n\n${statusUpdate}`
      : statusUpdate;
    issue.reopenedAt = new Date();
    issue.reopenedBy = userId;
    
    // Reset approval fields to restart the workflow
    issue.approvedBy = null;
    issue.approvedAt = null;
    issue.rejectedBy = null;
    issue.rejectedAt = null;
    issue.rejectionReason = null;
    issue.completedBy = null;
    issue.completedAt = null;
    issue.assignedTo = null;
    issue.assignedAt = null;
    
    await issue.save();

    res.status(200).json({
      message: 'Issue reopened successfully and sent for DC approval',
      issue
    });
  } catch (error) {
    console.error('Error reopening issue:', error);
    res.status(500).json({
      message: 'Error reopening issue',
      error: error.message
    });
  }
};
