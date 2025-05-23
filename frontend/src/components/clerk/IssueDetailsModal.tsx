import React from 'react';
import { FiX, FiDownload, FiCalendar, FiHardDrive, FiAlertCircle, FiMapPin, FiCheckCircle, FiClock, FiTag, FiUser, FiFile, FiInfo } from 'react-icons/fi';

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
}

const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({
  issue,
  onClose,
  getStatusColor,
  getPriorityColor,
}) => {
  if (!issue) return null;

  const handleViewAttachment = () => {
    if (issue.attachment) {
      window.open(`http://localhost:5000/${issue.attachment}`, '_blank');
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <FiAlertCircle className="text-red-500" />;
      case 'medium':
        return <FiClock className="text-yellow-500" />;
      case 'low':
        return <FiTag className="text-blue-500" />;
      default:
        return <FiTag className="text-gray-500" />;
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

            {/* Rejection Comment - Only show if status indicates rejection and comment exists */}
            {(issue.status.includes('Rejected') || issue.status === 'DC Rejected' || issue.status === 'Rejected by DC' || issue.status === 'Rejected by Super Admin') && issue.comment && (
              <div className="mt-4">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiInfo className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Rejection Reason</h3>
                      <div className="mt-1 text-sm text-red-700">
                        <p>{issue.comment}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailsModal;
