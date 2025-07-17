// Standardized issue statuses
module.exports = {
  // Initial status when issue is created
  PENDING: 'Pending',
  
  // Verifying Officer related statuses
  DC_APPROVED: 'Approved by Verifying Officer',
  DC_REJECTED: 'Rejected by Verifying Officer',
  
  // Super Admin related statuses
  SUPER_ADMIN_APPROVED: 'Approved by Super Admin',
  SUPER_ADMIN_REJECTED: 'Rejected by Super Admin',
  
  // Assignment and progress statuses
  ASSIGNED: 'Assigned to Technician',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  REOPENED: 'Reopened',
  
  // Get all statuses for validation
  getAll: function() {
    return [
      this.PENDING,
      this.DC_APPROVED,
      this.DC_REJECTED,
      this.SUPER_ADMIN_APPROVED,
      this.SUPER_ADMIN_REJECTED,
      this.ASSIGNED,
      this.IN_PROGRESS,
      this.RESOLVED,
      this.REOPENED
    ];
  },
  
  // Check if a status is valid
  isValid: function(status) {
    return this.getAll().includes(status);
  },
  
  // Get status display names
  getDisplayName: function(status) {
    const displayNames = {
      [this.PENDING]: 'Pending',
      [this.DC_APPROVED]: 'Approved by Verifying Officer',
      [this.DC_REJECTED]: 'Rejected by Verifying Officer',
      [this.SUPER_ADMIN_APPROVED]: 'Approved by Super Admin',
      [this.SUPER_ADMIN_REJECTED]: 'Rejected by Super Admin',
      [this.ASSIGNED]: 'Assigned to Technician',
      [this.IN_PROGRESS]: 'In Progress',
      [this.RESOLVED]: 'Resolved',
      [this.REOPENED]: 'Reopened',
      // Backward compatibility with old status names
      'Approved by DC/AC': 'Approved by Verifying Officer',
      'Rejected by DC/AC': 'Rejected by Verifying Officer'
    };
    
    return displayNames[status] || status;
  }
};
