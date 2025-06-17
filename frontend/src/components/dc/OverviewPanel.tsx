import React from 'react';
import { FiXCircle, FiEye, FiList, FiAlertTriangle, FiClock } from 'react-icons/fi'; // Only include used icons
import { ISSUE_STATUS } from '../../constants/issueStatuses';

interface Issue {
  id: number;
  deviceId: string;
  complaintType: string;
  description: string;
  priorityLevel: string;
  location: string;
  status: string;
  submittedAt: string;
  attachment: string | null;
  underWarranty: boolean;
  comment?: string;
}

interface OverviewPanelProps {
  issues: Issue[];
  handleApproveIssue: (issueId: number) => void;
  openRejectCommentModal: (issue: Issue) => void;
  showComment: (issue: Issue) => void;
  setSelectedIssue: (issue: Issue) => void;
  setShowModal: (show: boolean) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({
  issues,
  handleApproveIssue,
  openRejectCommentModal,
  showComment,
  setSelectedIssue,
  setShowModal,
  getStatusColor,  // Keeping for backward compatibility
  getPriorityColor // Keeping for backward compatibility
}) => {
  // Sort issues by priority: High > Medium > Low
  const sortedIssues = [...issues].sort((a, b) => {
    type Priority = 'High' | 'Medium' | 'Low';
    const priorityOrder: Record<Priority, number> = {
      'High': 1,
      'Medium': 2,
      'Low': 3
    };
    
    const getPriorityValue = (level: string): number => {
      return priorityOrder[level as Priority] || 4;
    };
    
    return getPriorityValue(a.priorityLevel) - getPriorityValue(b.priorityLevel);
  });

  // Filter issues by status
  const pendingIssues = issues.filter(issue => issue.status === ISSUE_STATUS.PENDING);
  // These variables are filtered but not used in the component
  // const inProgressIssues = issues.filter(issue => 
  //   issue.status === ISSUE_STATUS.IN_PROGRESS || 
  //   issue.status === ISSUE_STATUS.ASSIGNED
  // );
  // const resolvedIssues = issues.filter(issue => issue.status === ISSUE_STATUS.RESOLVED);
  const rejectedIssues = issues.filter(issue => issue.status === ISSUE_STATUS.DC_REJECTED);

  return (
    <div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Issues Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <FiList size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Issues</h3>
            <p className="text-2xl font-bold text-gray-800">{issues.length}</p>
            <p className="text-xs text-gray-400 mt-1">All reported issues</p>
          </div>
        </div>

        {/* Pending Issues Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
          <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
            <FiClock size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Pending Issues</h3>
            <p className="text-2xl font-bold text-yellow-600">{pendingIssues.length}</p>
            <p className="text-xs text-gray-400 mt-1">Awaiting review</p>
          </div>
        </div>

        {/* Rejected Issues Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
          <div className="bg-red-100 text-red-600 p-3 rounded-lg">
            <FiXCircle size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Rejected Issues</h3>
            <p className="text-2xl font-bold text-red-600">{rejectedIssues.length}</p>
            <p className="text-xs text-gray-400 mt-1">Requires attention</p>
          </div>
        </div>
      </div>
      {/* Recent Issues */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Recent Issues</h3>
          <div className="flex space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <FiAlertTriangle className="mr-1" /> High Priority: {issues.filter(i => i.priorityLevel === 'High').length}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <FiClock className="mr-1" /> Pending: {pendingIssues.length}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="hover:bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Issue ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Priority
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Submitted
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedIssues.slice(0, 5).map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    #{issue.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {issue.complaintType}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ISSUE_STATUS.getStatusColor(issue.status)}`}>
                        {ISSUE_STATUS.getDisplayName(issue.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      issue.priorityLevel === 'High' ? 'bg-red-100 text-red-800' :
                      issue.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.priorityLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {new Date(issue.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex">
                      <button
                        onClick={() => {
                          setSelectedIssue(issue);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full transition-colors duration-200"
                        title="View Details"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;
