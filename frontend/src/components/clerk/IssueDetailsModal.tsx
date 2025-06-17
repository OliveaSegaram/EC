import React from 'react';
import { 
  FiUser, 
  FiFile, 
  FiInfo, 
  FiCheckCircle,
  FiRefreshCw
} from 'react-icons/fi';

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
  user?: {
    username: string;
    email: string;
  };
}

interface IssueDetailsModalProps {
  issue: Issue | null;
  onClose: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  onReopen?: (issueId: number) => Promise<void>;
}

const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({
  issue,
  onClose,
  getStatusColor,
  getPriorityColor,
  onReopen,
}) => {
  if (!issue) return null;

  const handleViewAttachment = () => {
    if (issue?.attachment) {
      window.open(`http://localhost:5000/${issue.attachment}`, '_blank');
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-white">Issue Details</h3>
              <p className="text-sm text-purple-100 mt-1">ID: #{issue.id}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-purple-200 hover:text-white focus:outline-none transition-colors duration-200"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="p-6">

          {/* Status Badge */}
          <div className="mt-4">
            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
              {issue.status}
            </span>
          </div>

          {/* Main Content */}
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Device ID</h4>
                <p className="mt-1 text-sm text-gray-900">{issue.deviceId}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Complaint Type</h4>
                <p className="mt-1 text-sm text-gray-900">{issue.complaintType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(issue.priorityLevel)}`}>
                  {issue.priorityLevel}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="mt-1 text-sm text-gray-900">{issue.location}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{issue.description}</p>
              </div>

              {/* Warranty Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Warranty Status</h4>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    issue.underWarranty ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {issue.underWarranty ? 'Under Warranty' : 'Out of Warranty'}
                  </span>
                </p>
              </div>

              {/* Submission Date */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Submitted On</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(issue.submittedAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Submitted By */}
              {issue.user && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Submitted By</h4>
                  <div className="mt-1 flex items-center">
                    <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {issue.user.username || 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {/* Attachment */}
              {issue.attachment && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Attachment</h4>
                  <div className="mt-1 flex items-center">
                    <FiFile className="h-4 w-4 text-gray-400 mr-2" />
                    <button
                      onClick={handleViewAttachment}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Attachment
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status and Comment History */}
            {issue.comment && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Status History & Comments</h4>
                <div className="space-y-4">
                  {issue.comment.split('\n\n').map((commentBlock, index) => {
                    // Extract timestamp and user info if available
                    const timestampMatch = commentBlock.match(/at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
                    const timestamp = timestampMatch ? new Date(timestampMatch[1]) : null;
                    const commentText = timestamp ? commentBlock.replace(/\s*\(.*\) at \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, '') : commentBlock;
                    
                    // Check if this is a status update
                    const isStatusUpdate = commentText.includes('Status changed to') || 
                                         commentText.includes('Approved by') || 
                                         commentText.includes('Rejected by') ||
                                         commentText.includes('Assigned to');
                    
                    // Check if this is a rejection
                    const isRejection = commentText.includes('Rejected by') || 
                                      commentText.includes('rejection') ||
                                      commentText.toLowerCase().includes('reject');
                    
                    const isApproval = commentText.includes('Approved by');
                    const isAssignment = commentText.includes('Assigned to');
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border-l-4 ${
                          isRejection ? 'border-red-400 bg-red-50' : 
                          isApproval ? 'border-green-400 bg-green-50' :
                          isAssignment ? 'border-blue-400 bg-blue-50' :
                          isStatusUpdate ? 'border-purple-400 bg-purple-50' : 
                          'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            {isRejection ? (
                              <FiInfo className="h-4 w-4 text-red-500" />
                            ) : isApproval ? (
                              <FiCheckCircle className="h-4 w-4 text-green-500" />
                            ) : isAssignment ? (
                              <FiUser className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FiInfo className="h-4 w-4 text-purple-500" />
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm text-gray-800">
                              {commentText}
                            </p>
                            {timestamp && (
                              <p className="mt-1 text-xs text-gray-500">
                                {timestamp.toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-between">
            {/* Reopen button for resolved or completed issues */}
            {(issue.status === 'Resolved' || issue.status === 'Completed') && onReopen && (
              <button
                type="button"
                onClick={() => onReopen(issue.id)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200 flex items-center"
              >
                <FiRefreshCw className="mr-2" />
                Reopen Issue
              </button>
            )}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailsModal;
