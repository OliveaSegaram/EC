// Standardized issue statuses for frontend
export const ISSUE_STATUS = {
  // Initial status when issue is created
  PENDING: 'Pending',
  
  // DC related statuses
  DC_APPROVED: 'Approved by DC',
  DC_REJECTED: 'Rejected by DC',
  
  // Super Admin related statuses
  SUPER_ADMIN_APPROVED: 'Approved by Super Admin',
  SUPER_ADMIN_REJECTED: 'Rejected by Super Admin',
  
  // Assignment and progress statuses
  ASSIGNED: 'Assigned to Technician',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  REOPENED: 'Reopened',
  
  // Status groups
  getPendingApproval: () => [
    ISSUE_STATUS.PENDING,
    ISSUE_STATUS.DC_APPROVED,
    ISSUE_STATUS.DC_REJECTED
  ],
  
  getActiveStatuses: () => [
    ISSUE_STATUS.ASSIGNED,
    ISSUE_STATUS.IN_PROGRESS,
    ISSUE_STATUS.REOPENED
  ],
  
  getCompletedStatuses: () => [
    ISSUE_STATUS.RESOLVED,
    ISSUE_STATUS.SUPER_ADMIN_APPROVED,
    ISSUE_STATUS.SUPER_ADMIN_REJECTED
  ],
  
  // Status display names
  getDisplayName: (status: string): string => {
    const displayNames: Record<string, string> = {
      [ISSUE_STATUS.PENDING]: 'Pending',
      [ISSUE_STATUS.DC_APPROVED]: 'Approved by DC',
      [ISSUE_STATUS.DC_REJECTED]: 'Rejected by DC',
      [ISSUE_STATUS.SUPER_ADMIN_APPROVED]: 'Approved by Super Admin',
      [ISSUE_STATUS.SUPER_ADMIN_REJECTED]: 'Rejected by Super Admin',
      [ISSUE_STATUS.ASSIGNED]: 'Assigned to Technician',
      [ISSUE_STATUS.IN_PROGRESS]: 'In Progress',
      [ISSUE_STATUS.RESOLVED]: 'Resolved',
      [ISSUE_STATUS.REOPENED]: 'Reopened'
    };
    
    return displayNames[status] || status;
  },
  
  // Status colors for UI
  getStatusColor: (status: string): string => {
    const colors: Record<string, string> = {
      [ISSUE_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ISSUE_STATUS.DC_APPROVED]: 'bg-blue-100 text-blue-800',
      [ISSUE_STATUS.DC_REJECTED]: 'bg-red-100 text-red-800',
      [ISSUE_STATUS.SUPER_ADMIN_APPROVED]: 'bg-green-100 text-green-800',
      [ISSUE_STATUS.SUPER_ADMIN_REJECTED]: 'bg-red-100 text-red-800',
      [ISSUE_STATUS.ASSIGNED]: 'bg-purple-100 text-purple-800',
      [ISSUE_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [ISSUE_STATUS.RESOLVED]: 'bg-green-100 text-green-800',
      [ISSUE_STATUS.REOPENED]: 'bg-orange-100 text-orange-800'
    };
    
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
} as const;
