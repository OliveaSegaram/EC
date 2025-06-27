const { Issue, District, sequelize } = require('../models');
const { Op } = require('sequelize');

// Generate reports based on type and date range
exports.generateReport = async (req, res) => {
  console.log('generateReport function called');
  console.log('Request query:', req.query);
  try {
    const { type, startDate, endDate } = req.query;

    // Validate required fields
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report type, start date, and end date are required' 
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }

    // Parse dates and add time for full day coverage
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999); // End of the day

    // Common where clause for date range
    const dateRangeCondition = {
      submittedAt: {
        [Op.between]: [startDateTime, endDateTime]
      }
    };

    let reportData;

    switch (type) {
      case 'by_status':
        // Group by status
        const statusCounts = await Issue.findAll({
          where: dateRangeCondition,
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('Issue.id')), 'count']
          ],
          group: ['Issue.status'],
          raw: true,
          order: [[sequelize.literal('count'), 'DESC']]
        });
        
        // Convert to array of {key, label, value} for frontend
        reportData = statusCounts
          .filter(({ status }) => status) // Filter out null/undefined statuses
          .map(({ status, count }) => {
            const countValue = parseInt(count, 10);
            return {
              key: status,
              label: status, // Will be converted to display name in frontend
              value: countValue
            };
          });
        
        console.log('Status report data:', JSON.stringify(reportData, null, 2));
        break;

      case 'by_district':
        // First, get all districts to ensure we include those with no issues
        const allDistricts = await District.findAll({
          attributes: ['id', 'name'],
          raw: true
        });

        // Then get issue counts by district and complaint type
        const districtIssueCounts = await Issue.findAll({
          where: dateRangeCondition,
          include: [{
            model: District,
            as: 'districtInfo',
            attributes: ['id', 'name'],
            required: true
          }],
          attributes: [
            [sequelize.col('districtInfo.name'), 'districtName'],
            'complaintType',
            [sequelize.fn('COUNT', sequelize.col('Issue.id')), 'count']
          ],
          group: ['districtInfo.id', 'districtInfo.name', 'complaintType'],
          raw: true,
          order: [
            [sequelize.literal('count'), 'DESC'],
            ['districtInfo.name', 'ASC']
          ]
        });

        // Initialize district groups with all districts
        const districtGroups = allDistricts.reduce((acc, district) => {
          const districtName = district.name.trim();
          acc[districtName] = {
            key: districtName,
            label: districtName,
            value: 0,
            breakdown: {}
          };
          return acc;
        }, {});

        // Process the counts
        districtIssueCounts.forEach(({ districtName, complaintType, count }) => {
          if (!districtName) return;
          
          const districtKey = districtName.trim();
          const countValue = parseInt(count, 10);
          
          if (districtGroups[districtKey]) {
            if (complaintType) {
              districtGroups[districtKey].breakdown[complaintType] = countValue;
              districtGroups[districtKey].value += countValue;
            }
          }
        });
        
        // Convert to array, filter out districts with no issues, and sort by total count
        reportData = Object.values(districtGroups)
          .filter(district => district.value > 0)
          .sort((a, b) => b.value - a.value);
          
        console.log('District report data:', JSON.stringify(reportData, null, 2));
          
        console.log('District report data with breakdown:', JSON.stringify(reportData, null, 2));
        break;

      case 'by_issue_type':
        // Group by issue type with status breakdown
        const issueTypeStatusCounts = await Issue.findAll({
          where: dateRangeCondition,
          attributes: [
            'complaintType',
            'status',
            [sequelize.fn('COUNT', sequelize.col('Issue.id')), 'count']
          ],
          group: ['complaintType', 'status'],
          raw: true,
          order: [
            [sequelize.literal('count'), 'DESC'],
            ['complaintType', 'ASC']
          ]
        });

        // Group by issue type and include status breakdown
        const issueTypeGroups = issueTypeStatusCounts.reduce((acc, { complaintType, status, count }) => {
          if (!complaintType) return acc;
          
          if (!acc[complaintType]) {
            acc[complaintType] = {
              key: complaintType,
              label: complaintType,
              value: 0,
              breakdown: {}
            };
          }
          
          if (status) {
            acc[complaintType].breakdown[status] = parseInt(count, 10);
            acc[complaintType].value += parseInt(count, 10);
          }
          
          return acc;
        }, {});
        
        // Convert to array and sort by total count
        reportData = Object.values(issueTypeGroups)
          .sort((a, b) => b.value - a.value);
          
        console.log('Issue type report data with status breakdown:', JSON.stringify(reportData, null, 2));
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid report type' 
        });
    }

    const responseData = Array.isArray(reportData) ? reportData : [];
    console.log('Sending response data:', JSON.stringify(responseData, null, 2));
    
    // Send the report data
    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate report',
      error: error.message 
    });
  }
};
