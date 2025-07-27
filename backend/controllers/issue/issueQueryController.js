const { Issue, District, User, Role } = require('../../models');
const { Op } = require('sequelize');

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
      
      // For Colombo Head Office users, filter by branch if specified
      if (userRole === 'super_admin' || userRole === 'super_user' || userRole === 'technical_officer') {
        const user = await User.findByPk(userId);
        if (user && user.branch) {
          whereClause = {
            [Op.or]: [
              { location: { [Op.like]: `Colombo Head Office - ${user.branch}%` } },
              { location: 'Colombo Head Office', branch: user.branch }
            ]
          };
          console.log(`${userRole} user: Fetching issues for branch: ${user.branch}`);
        }
      }
    } 
    // For subject_clerk and dc, filter by district
    else if (['subject_clerk', 'dc'].includes(userRole) && userDistrictId) {
      whereClause = {
        districtId: userDistrictId
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
          as: 'district',
          attributes: ['id', 'name'],
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
      
      // If location is already formatted (from issue creation), use it
      if (issueJson.location && issueJson.location.includes('Colombo Head Office - ')) {
        // Location is already formatted with branch, keep it as is
        console.log(`Using pre-formatted location: ${issueJson.location}`);
      }
      // Otherwise, format the location based on district and branch
      else {
        // Handle location - prefer district name if available, otherwise use the location field
        issueJson.location = issueJson.district ? 
          issueJson.district.name : 
          (issueJson.location || 'Location not specified');
        
        // If this is a Colombo Head Office issue, format with branch
        if (issueJson.location === 'Colombo Head Office') {
          const branch = issueJson.branch || issueJson.user?.branch || 'Main Branch';
          issueJson.location = `Colombo Head Office - ${branch}`;
          console.log(`Formatted location with branch: ${issueJson.location}`);
        }
      }
      
      // Ensure comment is included (might be null/undefined)
      issueJson.comment = issueJson.comment || '';
      
      // Keep the district object for reference but don't send nested user data
      if (issueJson.user) {
        delete issueJson.user.district;
      }
      
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
    
    const issue = await Issue.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedTechnicalOfficer',
          attributes: ['id', 'username', 'email', 'branch']
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'email', 'branch']
        },
        {
          model: District,
          as: 'districtInfo',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    const issueJson = issue.toJSON();
    
    // Handle location - prefer district name if available, otherwise use the location field
    issueJson.location = issueJson.districtInfo ? issueJson.districtInfo.name : (issueJson.location || 'Location not specified');
    
    // If this is a Colombo Head Office issue, format the location with branch
    if (issueJson.location === 'Colombo Head Office') {
      const branch = issueJson.branch || issueJson.user?.branch || 'Main Branch';
      issueJson.location = `Colombo Head Office - ${branch}`;
    }
    
    // Ensure comment is included (might be null/undefined)
    issueJson.comment = issueJson.comment || '';
    
    // Clean up the response
    delete issueJson.districtInfo;
    if (issueJson.user) {
      delete issueJson.user.district;
    }

    res.status(200).json({ issue: issueJson });
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
