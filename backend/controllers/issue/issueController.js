// Import all issue controllers
const submissionController = require('./issueSubmissionController');
const queryController = require('./issueQueryController');
//const queryController = require('../../backend/controllers/issue/issueQueryController');
const approvalController = require('./issueApprovalController');
const assignmentController = require('./issueAssignmentController');
const reviewController = require('./issueReviewController');

// Export all controllers
module.exports = {
  // From submission controller
  submitIssue: submissionController.submitIssue,
  updateIssue: submissionController.updateIssue,
  deleteIssue: submissionController.deleteIssue,
  reopenIssue: submissionController.reopenIssue,
  
  // From query controller
  getAllIssues: queryController.getAllIssues,
  getIssueDetails: queryController.getIssueDetails,
  getTechnicalOfficers: queryController.getTechnicalOfficers,
  
  // From approval controller
  approveByDC: approvalController.approveByDC,
  rejectByDC: approvalController.rejectByDC,
  // Use approveBySuperUser for both superuser and superadmin roles
  approveBySuperUser: approvalController.approveBySuperUser,
  // Map approveBySuperAdmin to approveBySuperUser since they're the same
  approveBySuperAdmin: approvalController.approveBySuperUser,
  approveByRoot: approvalController.approveByRoot,
  // Use rejectByRoot for both root and superadmin rejections
  rejectByRoot: approvalController.rejectByRoot,
  
  // From assignment controller
  getTechnicalOfficerAssignedIssues: assignmentController.getTechnicalOfficerAssignedIssues,
  assignTechnicalOfficer: assignmentController.assignTechnicalOfficer,
  startWorkingOnIssue: assignmentController.startWorkingOnIssue,
  resolveIssue: assignmentController.resolveIssue,
  
  // From review controller
  updateTechnicalOfficerIssue: reviewController.updateTechnicalOfficerIssue,
  getIssuesForReview: reviewController.getIssuesForReview,
  confirmReview: reviewController.confirmReview
};
