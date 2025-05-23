const { Issue, User, Role, District, sequelize } = require('../models');
const { Op, where } = require('sequelize'); // Add Sequelize operators for complex queries

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
      location,
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
    const issue = await Issue.create({
      deviceId,
      complaintType,
      description,
      priorityLevel,
      location: issueLocation,
      underWarranty: underWarranty === 'true',
      status: 'Pending',
      submittedAt: new Date(),
      attachment: req.file ? req.file.path : null,
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

// Get all issues (filtered by user's role and district if applicable)
exports.getAllIssues = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userDistrictId = req.query.userDistrict;
    const userRole = req.user.role;
    
    let whereClause = {};
    
    // Define roles that can see all issues
    const adminRoles = ['super_admin', 'super_user', 'technical_officer', 'root'];
    
    // If user has admin role, show all issues
    if (adminRoles.includes(userRole)) {
      console.log(`${userRole} user: Fetching all issues`);
      // No additional where clause needed, will return all issues
    } 
    // For subject_clerk and dc, filter by district
    else if (['subject_clerk', 'dc'].includes(userRole) && userDistrictId) {
      whereClause = {
        [Op.or]: [
          { location: userDistrictId.toString() },
          { location: { [Op.like]: 'Colombo Head Office%' } }
        ]
      };
      console.log(`${userRole} user: Fetching issues for district ID: ${userDistrictId}`);
    } else {
      console.error('No district filtering rules apply for this user role');
      return res.status(403).json({ message: 'Access denied' });
    }
    
    console.log('Searching for issues with filter:', whereClause);

    const issues = await Issue.findAll({
      where: whereClause,
      order: [['submittedAt', 'DESC']],
      include: [
        {
          model: District,
          as: 'districtInfo',
          attributes: ['name'],
          required: false // LEFT JOIN
        }
      ]
    });
    
    // Process the issues to include the district name
    const processedIssues = issues.map(issue => {
      const issueJson = issue.toJSON();
      // If we have district info, use the district name, otherwise use the location as is
      issueJson.location = issueJson.districtInfo ? issueJson.districtInfo.name : issueJson.location;
      // Remove the nested districtInfo object
      delete issueJson.districtInfo;
      return issueJson;
    });
    
    console.log(`Found ${processedIssues.length} issues`);

    res.json({ issues: processedIssues });
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
    const { 
      status, 
      description, 
      priorityLevel, 
      location, 
      resolutionDetails,
      deviceId,
      complaintType,
      underWarranty
    } = req.body;

    // Check if any updatable field is provided
    const hasUpdates = [
      'status', 'description', 'priorityLevel', 'location',
      'resolutionDetails', 'deviceId', 'complaintType', 'underWarranty'
    ].some(field => field in req.body);

    if (!hasUpdates && !req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No valid fields provided to update' 
      });
    }

    const updateData = {};
    
    // Add fields to update if they exist in the request
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (priorityLevel !== undefined) updateData.priorityLevel = priorityLevel;
    if (location !== undefined) updateData.location = location;
    if (resolutionDetails !== undefined) updateData.resolutionDetails = resolutionDetails;
    if (deviceId !== undefined) updateData.deviceId = deviceId;
    if (complaintType !== undefined) updateData.complaintType = complaintType;
    if (underWarranty !== undefined) updateData.underWarranty = underWarranty === 'true' || underWarranty === true;
    
    // Handle file upload if present
    if (req.file) {
      updateData.attachment = req.file.path;
    }

    console.log('Updating issue with data:', updateData);

    const [updatedCount] = await Issue.update(updateData, {
      where: { id },
      returning: true
    });

    if (updatedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Issue not found or no changes made' 
      });
    }

    // Fetch the updated issue to return
    const updatedIssue = await Issue.findByPk(id);

    return res.status(200).json({ 
      success: true, 
      message: 'Issue updated successfully',
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error updating issue', 
      error: error.message 
    });
  }
};

// Delete an issue
exports.deleteIssue = async (req, res) => {
  console.log('[DELETE] /api/issues/:id called');
  console.log('Params:', req.params);
  try {
    const { id } = req.params;  
    const deletedIssue = await Issue.destroy({ where: { id } });
    console.log('Delete result:', deletedIssue);
    if (deletedIssue === 0) {
      console.log('Issue not found for deletion:', id);
      return res.status(404).json({ message: 'Issue not found' });
    }

    console.log('Issue deleted successfully:', id);
    return res.status(200).json({ success: true, message: 'Issue deleted successfully' });
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
    if (issue.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending issues can be approved by DC' });
    }
    await issue.update({ status: 'Issue approved by DC' });
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
    const { comment } = req.body;
    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Update issue status and add comment
    await issue.update({ 
      status: 'Rejected by DC',
      comment: comment || null
    });

    res.json({ message: 'Issue rejected by DC successfully' });
  } catch (error) {
    console.error('Error rejecting issue:', error);
    res.status(500).json({
      message: 'Error rejecting issue',
      error: error.message
    });
  }
};

// Super User assign issue
exports.approveBySuperUser = async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    if (issue.status !== 'Issue approved by Super Admin') {
      return res.status(400).json({ message: 'Only issues approved by Super Admin can be assigned by Super User' });
    }
    await issue.update({ status: 'Issue assigned by Super User' });
    res.json({ message: 'Issue assigned by Super User successfully' });
  } catch (error) {
    console.error('Error assigning issue:', error);
    res.status(500).json({
      message: 'Error assigning issue',
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
    if (issue.status !== 'Issue approved by DC') {
      return res.status(400).json({ message: 'Only issues approved by DC can be approved by Super Admin' });
    }
    await issue.update({ status: 'Issue approved by Super Admin' });
    res.json({ message: 'Issue approved by Super Admin successfully' });
  } catch (error) {
    console.error('Error approving issue:', error);
    res.status(500).json({
      message: 'Error approving issue',
      error: error.message
    });
  }
};

// Get approved issues for Superuser Dashboard
exports.getSuperAdminApprovedIssues = async (req, res) => {
    try {
        // Get the user's role
        const userId = req.user.userId;
        const user = await User.findByPk(userId, {
            include: [{ model: Role, attributes: ['name'] }]
        });

        if (!user) {
            console.error(`User with ID ${userId} not found in database`);
            return res.status(404).json({ message: 'User not found' });
        }

        // Get the user's role and district
        const userRole = user.Role?.name || 'unknown';
        const userDistrict = user.district || '';
        const requestedDistrict = req.query.userDistrict;
        
        console.log('SuperUser - User role:', userRole, 'District:', userDistrict, 'Requested District:', requestedDistrict, 'UserId:', userId);

        // Base where clause - only show 'Issue approved by Super Admin' status
        const whereClause = {
            status: 'Issue approved by Super Admin'
        };

        // Add district filtering if requested, but show all districts by default for root/super_admin
        if (requestedDistrict) {
            if (requestedDistrict === 'Colombo Head Office') {
                whereClause.location = {
                    [Op.like]: 'Colombo Head Office%'
                };
                console.log('Filtering approved issues for Colombo Head Office branches');
            } else {
                whereClause.location = requestedDistrict;
                console.log('Filtering approved issues for district:', requestedDistrict);
            }
        } else if (userRole !== 'root' && userRole !== 'super_admin' && userDistrict) {
            // For non-root/admin users, filter by their district
            if (userDistrict === 'Colombo Head Office') {
                whereClause.location = {
                    [Op.like]: 'Colombo Head Office%'
                };
                console.log('Non-admin user - showing approved issues from Colombo Head Office branches');
            } else {
                whereClause.location = userDistrict;
                console.log('Non-admin user - showing approved issues from district:', userDistrict);
            }
        } else {
            console.log('Root/Super Admin - showing all approved issues across all districts');
        }

        // First get the issues with user information
        const issues = await Issue.findAll({
            where: whereClause,
            order: [['submittedAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'username', 'email'],
                    required: false
                },
                {
                    model: User,
                    as: 'assignedTo',
                    attributes: ['id', 'username', 'email'],
                    required: false
                },
                {
                    model: District,
                    as: 'districtInfo',
                    attributes: ['name'],
                    required: false
                }
            ]
        });
        
        // Format the response
        const formattedIssues = issues.map(issue => {
            // Get location from districtInfo if available, otherwise use the location field
            const location = issue.districtInfo ? issue.districtInfo.name : issue.location;
            
            return {
                id: issue.id,
                deviceId: issue.deviceId,
                complaintType: issue.complaintType,
                description: issue.description,
                priorityLevel: issue.priorityLevel,
                status: issue.status,
                location: location,
                submittedAt: issue.submittedAt,
                updatedAt: issue.updatedAt,
                userId: issue.userId,
                user: issue.reporter ? {
                    id: issue.reporter.id,
                    username: issue.reporter.username,
                    email: issue.reporter.email
                } : { id: issue.userId, username: 'Unknown', email: '' },
                assignedTo: issue.assignedTo || null
            };
        });
        
        res.json(formattedIssues);
    } catch (error) {
        console.error('Error fetching approved issues:', error);
        res.status(500).json({ 
            message: 'Error fetching approved issues', 
            error: error.message 
        });
    }
};

// Get assigned issues for Technical Officer
exports.getTechnicalOfficerAssignedIssues = async (req, res) => {
  try {
    // Fetch issues assigned to technical officer or that have been updated by them
    const assignedIssues = await Issue.findAll({
      where: {
        status: ['Issue assigned by Super User', 'In Progress', 'Resolved']
      },
      order: [['updatedAt', 'DESC']]
    });
    res.json(assignedIssues);
  } catch (error) {
    console.error('Error fetching assigned issues:', error);
    res.status(500).json({ message: 'Error fetching assigned issues', error: error.message });
  }
};

// Update issue status and comment by Technical Officer
exports.updateTechnicalOfficerIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status, comment } = req.body;
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    // Allow only valid status updates
    if (![ 'In Progress', 'Resolved' ].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }
    // Update the issue with needsReview flag to indicate it needs to be reviewed by Super Admin
    await issue.update({ 
      status, 
      comment,
      needsReview: true 
    });
    res.json({ message: 'Issue updated successfully' });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ message: 'Error updating issue', error: error.message });
  }
};

// Get issues updated by Technical Officer for review by Super Admin
exports.getIssuesForReview = async (req, res) => {
  try {
    // Fetch issues that have been updated by Technical Officer and need review
    const issues = await Issue.findAll({
      where: { 
        needsReview: true,
        status: ['In Progress', 'Resolved'] // Only get issues updated by Technical Officer
      },
      order: [['updatedAt', 'DESC']]
    });
    
    // Format the issues for the review panel
    const formattedIssues = issues.map(issue => ({
      id: issue.id,
      deviceId: issue.deviceId,
      issueType: issue.complaintType,
      lastUpdatedStatus: issue.status,
      comment: issue.comment || 'No comment provided',
      attachment: issue.attachment,
      details: issue.description
    }));
    
    res.json({ issues: formattedIssues });
  } catch (error) {
    console.error('Error fetching issues for review:', error);
    res.status(500).json({ 
      message: 'Error fetching issues for review', 
      error: error.message 
    });
  }
};

// Confirm review of an issue updated by Technical Officer
exports.confirmReview = async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findByPk(issueId);
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    // Mark the issue as reviewed
    await issue.update({ needsReview: false });
    
    res.json({ message: 'Issue review confirmed successfully' });
  } catch (error) {
    console.error('Error confirming review:', error);
    res.status(500).json({ 
      message: 'Error confirming review', 
      error: error.message 
    });
  }
};

// Approve by Root (Super Admin)
exports.approveByRoot = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    const issue = await Issue.findByPk(issueId);
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    // Match strict workflow: only allow if status is 'Issue approved by DC'
    if (issue.status !== 'Issue approved by DC') {
      return res.status(400).json({ message: 'Only issues approved by DC can be approved by Super Admin' });
    }
    
    // Prepare update data
    const updateData = {
      status: 'Issue approved by Super Admin'
    };

    // If there's a comment, include it in the update
    if (comment) {
      updateData.comment = comment;
    } else {
      updateData.comment = 'Approved by Super Admin';
    }
    
    // Update the issue
    await issue.update(updateData);
    
    // Refresh the issue to get the updated data
    const updatedIssue = await Issue.findByPk(issueId);
    
    res.json({ 
      success: true,
      message: 'Issue approved by Super Admin successfully',
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Error approving issue:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error approving issue', 
      error: error.message 
    });
  }
};

// Reject by Root
exports.rejectByRoot = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ 
        success: false,
        message: 'Rejection comment is required' 
      });
    }
    
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ 
        success: false,
        message: 'Issue not found' 
      });
    }
    
    if (issue.status !== 'Issue approved by DC') {
      return res.status(400).json({ 
        success: false,
        message: 'Only issues approved by DC can be rejected by Super Admin' 
      });
    }
    
    // Update issue status and add comment
    await issue.update({ 
      status: 'Rejected by Super Admin',
      comment: comment
    });
    
    // Refresh the issue to get the updated data
    const updatedIssue = await Issue.findByPk(issueId);
    
    res.json({ 
      success: true,
      message: 'Issue rejected by Super Admin successfully',
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Error rejecting issue:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error rejecting issue', 
      error: error.message 
    });
  }
};
