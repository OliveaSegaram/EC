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
          raw: true
        });
        
        // Convert to object format for frontend
        reportData = statusCounts.reduce((acc, { status, count }) => ({
          ...acc,
          [status]: parseInt(count, 10)
        }), {});
        break;

      case 'by_district':
        // Group by district and issue type
        const districtData = await Issue.findAll({
          where: dateRangeCondition,
          include: [{
            model: District,
            as: 'districtInfo',
            attributes: ['name']
          }],
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('Issue.id')), 'count'],
            'complaintType'
          ],
          group: ['districtInfo.name', 'Issue.complaintType'],
          raw: true
        });

        // Transform to the required format
        reportData = districtData.reduce((acc, { 'districtInfo.name': district, complaintType, count }) => {
          if (!district) return acc; // Skip if no district
          return {
            ...acc,
            [district]: {
              ...(acc[district] || {}),
              [complaintType]: parseInt(count, 10)
            }
          };
        }, {});
        break;

      case 'by_issue_type':
        // Group by issue type
        const issueTypeCounts = await Issue.findAll({
          where: dateRangeCondition,
          attributes: [
            'complaintType',
            [sequelize.fn('COUNT', sequelize.col('Issue.id')), 'count']
          ],
          group: ['Issue.complaintType'],
          raw: true
        });

        // Convert to object format for frontend
        reportData = issueTypeCounts.reduce((acc, { complaintType, count }) => ({
          ...acc,
          [complaintType]: parseInt(count, 10)
        }), {});
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid report type' 
        });
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating report',
      error: error.message 
    });
  }
};
