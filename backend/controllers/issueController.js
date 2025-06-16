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
        },
        {
          model: User,
          as: 'assignedTechnicalOfficer',
          attributes: ['id', 'username', 'email'],
          required: false // LEFT JOIN
        }
      ]
    });
    
    // Process the issues to include the district name and ensure comment is included
    const processedIssues = issues.map(issue => {
      const issueJson = issue.toJSON();
      // If we have district info, use the district name, otherwise use the location as is
      issueJson.location = issueJson.districtInfo ? issueJson.districtInfo.name : issueJson.location;
      // Ensure comment is included (might be null/undefined)
      issueJson.comment = issueJson.comment || '';
      // Remove the nested objects
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
                comment: issue.comment,  
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
    console.log('\n=== Fetching assigned issues ===');
    console.log('Technical officer ID:', req.user.userId);
    
    // Get the current user's details
    const currentUser = await User.findByPk(req.user.userId, {
      attributes: ['id', 'username', 'email'],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }],
      raw: true,
      nest: true
    });
    
    if (!currentUser) {
      console.error('Technical officer user not found');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('👤 Current user:', currentUser.username, `(Role: ${currentUser.role?.name || 'unknown'})`);
    
    // Check if user has permission to view assigned issues
    const allowedRoles = ['technical_officer', 'admin', 'super_admin', 'root'];
    if (!allowedRoles.includes(currentUser.role?.name)) {
      console.log('User does not have permission to view assigned issues');
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to view assigned issues' 
      });
    }
    
    // Get all issues assigned to this technical officer
    const assignedIssues = await Issue.findAll({
      where: {
        assignedTo: currentUser.id,
        status: {
          [Op.in]: ['Assigned to Technician', 'In Progress', 'Resolved', 'Pending Review']
        }
      },
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: District,
          as: 'districtInfo',
          attributes: ['name'],
          required: false
        },
        {
          model: User,
          as: 'assignedTechnicalOfficer',
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ]
    });
    
    console.log(`Found ${assignedIssues.length} issues assigned to ${currentUser.username}`);
    
    // Process the issues to include the district name
    const processedIssues = assignedIssues.map(issue => {
      const issueJson = issue.toJSON();
      // If we have district info, use the district name, otherwise use the location as is
      issueJson.location = issueJson.districtInfo ? issueJson.districtInfo.name : issueJson.location;
      // Ensure comment is included (might be null/undefined)
      issueJson.comment = issueJson.comment || '';
      // Remove the nested objects
      delete issueJson.districtInfo;
      return issueJson;
    });
    
    console.log('\n=== End of assigned issues fetch ===\n');
    res.json(processedIssues);
  } catch (error) {
    console.error('Error fetching assigned issues:', error);
    res.status(500).json({ 
      message: 'Error fetching assigned issues', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update issue status and comment by Technical Officer
exports.updateTechnicalOfficerIssue = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { issueId } = req.params;
    const { status, comment } = req.body;
    
    // Find the issue within a transaction
    const issue = await Issue.findByPk(issueId, { transaction });
    
    if (!issue) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Issue not found' 
      });
    }
    
    // Verify the issue is assigned to the current user
    if (issue.assignedTo !== req.user.userId) {
      await transaction.rollback();
      return res.status(403).json({ 
        success: false,
        message: 'You are not assigned to this issue' 
      });
    }
    
    // Allow only valid status updates
    if (!['In Progress', 'Resolved', 'Pending Review'].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status update' 
      });
    }
    
    // Update the issue with needsReview flag to indicate it needs to be reviewed by Super Admin
    await issue.update({ 
      status: status === 'Resolved' ? 'Pending Review' : status,
      comment,
      needsReview: status === 'Resolved' 
    }, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    // Get the updated issue with the assigned technical officer details
    const updatedIssue = await Issue.findByPk(issueId, {
      include: [
        {
          model: User,
          as: 'assignedTechnicalOfficer',
          attributes: ['id', 'username', 'email']
        }
      ]
    });
    
    res.json({ 
      success: true,
      message: 'Issue updated successfully',
      issue: updatedIssue 
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ message: 'Error updating issue', error: error.message });
  }
};

// Get issues updated by Technical Officer for review by Super Admin
exports.getIssuesForReview = async (req, res) => {
  try {
    // Check if user has permission to review issues
    const allowedRoles = ['admin', 'super_admin', 'root'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to review issues' 
      });
    }
    
    // Fetch issues that have been updated by Technical Officer and need review
    const issues = await Issue.findAll({
      where: { 
        needsReview: true,
        status: ['Pending Review'] // Only get issues that are pending review
      },
      include: [
        {
          model: User,
          as: 'assignedTechnicalOfficer',
          attributes: ['id', 'username', 'email'],
          required: false
        },
        {
          model: District,
          as: 'districtInfo',
          attributes: ['name'],
          required: false
        }
      ],
      order: [['updatedAt', 'DESC']]
    });
    
    // Format the issues for the review panel
    const formattedIssues = issues.map(issue => {
      const issueJson = issue.toJSON();
      return {
        id: issueJson.id,
        deviceId: issueJson.deviceId,
        issueType: issueJson.complaintType,
        status: issueJson.status,
        priorityLevel: issueJson.priorityLevel,
        location: issueJson.districtInfo ? issueJson.districtInfo.name : issueJson.location,
        comment: issueJson.comment || 'No comment provided',
        attachment: issueJson.attachment,
        details: issueJson.description,
        submittedAt: issueJson.submittedAt,
        updatedAt: issueJson.updatedAt,
        assignedTo: issueJson.assignedTechnicalOfficer
          ? {
              id: issueJson.assignedTechnicalOfficer.id,
              username: issueJson.assignedTechnicalOfficer.username,
              email: issueJson.assignedTechnicalOfficer.email
            }
          : null
      };
    });
    
    res.json({ 
      success: true,
      issues: formattedIssues 
    });
  } catch (error) {
    console.error('Error fetching issues for review:', error);
    res.status(500).json({ 
      message: 'Error fetching issues for review', 
      error: error.message 
    });
  }
};

// Assign a technical officer to an issue
exports.assignTechnicalOfficer = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { issueId } = req.params;
    const { technicalOfficerId } = req.body;

    // Validate input
    if (!technicalOfficerId) {
      return res.status(400).json({
        success: false,
        message: 'Technical officer ID is required'
      });
    }

    // Check if the issue exists
    const issue = await Issue.findByPk(issueId, { transaction });
    if (!issue) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Get the technical officer's details
    const technicalOfficer = await User.findByPk(technicalOfficerId, {
      attributes: ['id', 'username', 'email', 'roleId'],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }],
      transaction
    });
    
    if (!technicalOfficer) {
      await transaction.rollback();
      console.error('Technical officer not found with ID:', technicalOfficerId);
      return res.status(404).json({
        success: false,
        message: 'Technical officer not found'
      });
    }

    // Verify the user has a technical role
    if (!['technical_officer', 'admin', 'super_admin', 'root'].includes(technicalOfficer.role?.name)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'The specified user is not a technical officer'
      });
    }
    
    console.log(` Assigning issue ${issue.id} to technical officer ${technicalOfficer.username}`);
    
    // Store the assignment in the assignedTo field and update status
    const timestamp = new Date().toISOString();
    const previousAssignee = issue.assignedTo;
    
    // Update the issue
    await issue.update({
      assignedTo: technicalOfficerId,
      status: 'Assigned to Technician',
      comment: `[ASSIGNED] Assigned to ${technicalOfficer.username} at ${timestamp}`
    }, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    console.log(`Successfully assigned issue ${issue.id} to ${technicalOfficer.username}`);

    // Get the updated issue with the assigned technical officer details
    const updatedIssue = await Issue.findByPk(issueId, {
      include: [
        {
          model: User,
          as: 'assignedTechnicalOfficer',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: `Issue assigned to ${technicalOfficer.username} successfully`,
      issue: updatedIssue
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error assigning technical officer:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning technical officer',
      error: error.message
    });
  }
};

// Get all technical officers
exports.getTechnicalOfficers = async (req, res) => {
  try {
    console.log('Fetching technical officers...');
    
    // First, find the technical officer role
    const techOfficerRole = await Role.findOne({
      where: { name: 'technical_officer' }
    });

    if (!techOfficerRole) {
      console.log('Technical officer role not found');
      return res.status(404).json({
        success: false,
        message: 'Technical officer role not found'
      });
    }

    console.log('Found technical officer role with ID:', techOfficerRole.id);
    
    // Find all users with the technical_officer role
    const technicalOfficers = await User.findAll({
      where: { roleId: techOfficerRole.id },
      attributes: ['id', 'username', 'email']
    });

    console.log('Found technical officers:', technicalOfficers);

    res.status(200).json({
      success: true,
      technicalOfficers
    });
  } catch (error) {
    console.error('Error fetching technical officers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching technical officers',
      error: error.message,
      stack: error.stack
    });
  }
};

// Confirm review of an issue updated by Technical Officer
exports.confirmReview = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { issueId } = req.params;
    const { action } = req.body; 
    const { comment } = req.body; 
    
    // Check if user has permission to review issues
    const allowedRoles = ['admin', 'super_admin', 'root'];
    if (!allowedRoles.includes(req.user.role)) {
      await transaction.rollback();
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to review issues' 
      });
    }
    
    // Find the issue within a transaction
    const issue = await Issue.findByPk(issueId, { transaction });
    
    if (!issue) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Issue not found' 
      });
    }
    
    // Check if the issue is in a reviewable state
    if (!issue.needsReview) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'This issue does not require review'
      });
    }
    
    // Update the issue based on the action
    if (action === 'approve') {
      // Mark the issue as completed
      await issue.update({ 
        status: 'Completed',
        needsReview: false,
        comment: comment 
          ? `[APPROVED] ${comment}` 
          : 'Issue resolved and approved'
      }, { transaction });
    } else if (action === 'reject') {
      // Return the issue to the technical officer for further action
      await issue.update({ 
        status: 'In Progress',
        needsReview: false,
        comment: comment 
          ? `[REJECTED] ${comment}` 
          : 'Returned for further action'
      }, { transaction });
    } else {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be either "approve" or "reject"'
      });
    }
    
    // Commit the transaction
    await transaction.commit();
    
    // Get the updated issue with the assigned technical officer details
    const updatedIssue = await Issue.findByPk(issueId, {
      include: [
        {
          model: User,
          as: 'assignedTechnicalOfficer',
          attributes: ['id', 'username', 'email']
        }
      ]
    });
    
    res.json({ 
      success: true,
      message: `Issue ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      issue: updatedIssue
    });
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

// Reopen issue (for Subject Clerk)
exports.reopenIssue = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { issueId } = req.params;
        const { comment } = req.body;
        const userId = req.user.userId;

        // Find the issue within transaction
        const issue = await Issue.findByPk(issueId, { transaction });
        if (!issue) {
            await transaction.rollback();
            return res.status(404).json({ 
                success: false,
                message: 'Issue not found' 
            });
        }

        // Check if the issue is in a state that can be reopened
        if (!['Resolved', 'Completed'].includes(issue.status)) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false,
                message: 'Only resolved or completed issues can be reopened' 
            });
        }

        // Get the current user's details for the comment
        const user = await User.findByPk(userId, { 
            attributes: ['username'],
            transaction 
        });

        const username = user ? user.username : 'System';
        const updatedComment = `[REOPENED by ${username}] ${comment || 'Issue reopened'}`;
        
        // Update the issue status and add a comment
        await issue.update({
            status: 'Reopened',
            comment: updatedComment,
            needsReview: true,
            assignedTo: null // Reset assignedTo so it can be reassigned
        }, { transaction });

        // Commit the transaction
        await transaction.commit();

        // Get the updated issue with all necessary associations
        const updatedIssue = await Issue.findByPk(issueId, {
            include: [
                {
                    model: User,
                    as: 'assignedTechnicalOfficer',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: District,
                    as: 'districtInfo',
                    attributes: ['name']
                }
            ]
        });

        res.json({ 
            success: true,
            message: 'Issue reopened successfully',
            issue: updatedIssue
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error reopening issue:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error reopening issue',
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
