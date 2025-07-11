// Standardized issue statuses for frontend
export const ISSUE_STATUS = {
  // Initial status when issue is created
  PENDING: 'Pending',
  
  // DC/AC related statuses
  DC_APPROVED: 'Approved by DC/AC',
  DC_REJECTED: 'Rejected by DC/AC',
  
  // Super Admin related statuses
  SUPER_ADMIN_APPROVED: 'Approved by Super Admin',
  SUPER_ADMIN_REJECTED: 'Rejected by Super Admin',
  
  // Assignment and progress statuses
  ASSIGNED: 'Assigned to Technician',
  IN_PROGRESS: 'In Progress',
  UNDER_PROCUREMENT: 'Under Procurement',
  RESOLVED: 'Resolved',
  COMPLETED: 'Completed',
  REOPENED: 'Reopened',
  ADD_TO_PROCUREMENT: 'Add_To_Procurement',
  
  // Status groups
  getPendingApproval: () => [
    ISSUE_STATUS.PENDING,
    ISSUE_STATUS.DC_APPROVED,
    ISSUE_STATUS.DC_REJECTED
  ],
  
  getActiveStatuses: () => [
    ISSUE_STATUS.ASSIGNED,
    ISSUE_STATUS.IN_PROGRESS,
    ISSUE_STATUS.UNDER_PROCUREMENT,
    ISSUE_STATUS.REOPENED,
    ISSUE_STATUS.ADD_TO_PROCUREMENT
  ],
  
  getCompletedStatuses: () => [
    ISSUE_STATUS.RESOLVED,
    ISSUE_STATUS.COMPLETED,
    ISSUE_STATUS.SUPER_ADMIN_APPROVED,
    ISSUE_STATUS.SUPER_ADMIN_REJECTED
  ],
  
  // Status display names
  getDisplayName: (status: string): string => {
    const statusMap: Record<string, string> = {
      [ISSUE_STATUS.PENDING]: 'Pending',
      [ISSUE_STATUS.DC_APPROVED]: 'Approved by DC/AC',
      [ISSUE_STATUS.DC_REJECTED]: 'Rejected by DC/AC',
      [ISSUE_STATUS.SUPER_ADMIN_APPROVED]: 'Approved by Super Admin',
      [ISSUE_STATUS.SUPER_ADMIN_REJECTED]: 'Rejected by Super Admin',
      [ISSUE_STATUS.ASSIGNED]: 'Assigned',
      [ISSUE_STATUS.IN_PROGRESS]: 'In Progress',
      [ISSUE_STATUS.UNDER_PROCUREMENT]: 'Under Procurement',
      [ISSUE_STATUS.RESOLVED]: 'Resolved',
      [ISSUE_STATUS.COMPLETED]: 'Completed',
      [ISSUE_STATUS.REOPENED]: 'Reopened',
      [ISSUE_STATUS.ADD_TO_PROCUREMENT]: 'Add to Procurement',
    };
    return statusMap[status] || status;
  },
  
  // Status colors for UI
  getStatusColor: (status: string): string => {
    const colorMap: Record<string, string> = {
      [ISSUE_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ISSUE_STATUS.DC_APPROVED]: 'bg-blue-100 text-blue-800',
      [ISSUE_STATUS.DC_REJECTED]: 'bg-red-100 text-red-800',
      [ISSUE_STATUS.SUPER_ADMIN_APPROVED]: 'bg-green-100 text-green-800',
      [ISSUE_STATUS.SUPER_ADMIN_REJECTED]: 'bg-red-100 text-red-800',
      [ISSUE_STATUS.ASSIGNED]: 'bg-purple-100 text-purple-800',
      [ISSUE_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [ISSUE_STATUS.UNDER_PROCUREMENT]: 'bg-indigo-100 text-indigo-1000',
      [ISSUE_STATUS.RESOLVED]: 'bg-green-100 text-green-800',
      [ISSUE_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
      [ISSUE_STATUS.REOPENED]: 'bg-yellow-100 text-yellow-800',
      [ISSUE_STATUS.ADD_TO_PROCUREMENT]: 'bg-indigo-100 text-indigo-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }
} as const;
