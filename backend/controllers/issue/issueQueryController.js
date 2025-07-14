const { Issue, District, User, Role } = require('../../models');
const { Op } = require('sequelize');

// Get all issues (filtered by user's role, district, and branch)
exports.getAllIssues = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userDistrictId = req.query.userDistrict;
    const userRole = req.user.role;
    
    let whereClause = {};
    
    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Define admin roles that can see all issues
    const adminRoles = ['super_admin', 'super_user', 'technical_officer', 'root'];
    
    // For subject_clerk: Only show issues they've submitted
    if (userRole === 'subject_clerk') {
      whereClause = { submittedBy: userId };
      console.log(`Subject clerk (${userId}): Fetching only their submitted issues`);
    } 
    // For DC: Show issues from their district
    else if (userRole === 'dc' && userDistrictId) {
      whereClause = { location: userDistrictId.toString() };
      console.log(`DC user (${userId}): Fetching issues for district ID: ${userDistrictId}`);
    }
    // For Colombo Head Office users: Show issues from their branch
    else if (['super_admin', 'super_user', 'technical_officer'].includes(userRole) && user.branch) {
      whereClause = {
        [Op.or]: [
          { location: { [Op.like]: `Colombo Head Office - ${user.branch}%` } },
          { 
            [Op.and]: [
              { location: 'Colombo Head Office' },
              { branch: user.branch }
            ]
          }
        ]
      };
      console.log(`${userRole} user: Fetching issues for branch: ${user.branch}`);
    } 
    // For other admin roles: Show all issues
    else if (adminRoles.includes(userRole)) {
      console.log(`${userRole} user: Fetching all issues`);
      // No additional filters needed for these roles
    } 
    // No access for other roles
    else {
      console.error('No access rules defined for this user role');
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
        },
        {
          model: User,
          as: 'submitter',
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
    const userRole = req.user.role;
    
    const include = [
      {
        model: User,
        as: 'assignedToUser',
        attributes: ['id', 'username', 'email']
      },
      {
        model: User,
        as: 'submittedByUser',
        attributes: ['id', 'username', 'email']
      },
      {
        model: District,
        as: 'district',
        attributes: ['id', 'name']
      }
    ];

    const issue = await Issue.findByPk(id, {
      include: include
    });

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.status(200).json({ issue });
  } catch (error) {
    console.error('Error fetching issue details:', error);
    return res.status(500).json({ message: 'Error fetching issue details', error: error.message });
  }
};

// Get all technical officers
exports.getTechnicalOfficers = async (req, res) => {
  try {
    // First, find the technical officer role ID
    const techOfficerRole = await Role.findOne({
      where: { name: 'technical_officer' },
      attributes: ['id']
    });

    if (!techOfficerRole) {
      return res.status(404).json({ message: 'Technical officer role not found' });
    }

    // Then find all users with that role ID
    const technicalOfficers = await User.findAll({
      where: { roleId: techOfficerRole.id },
      attributes: ['id', 'username', 'email', 'nic']
    });

    res.status(200).json({ technicalOfficers });
  } catch (error) {
    console.error('Error fetching technical officers:', error);
    res.status(500).json({
      message: 'Error fetching technical officers',
      error: error.message
    });
  }
};
