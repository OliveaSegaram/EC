import React from 'react';
import { 
  FiX, 
  FiCalendar, 
  FiAlertCircle, 
  FiMapPin, 
  FiTool, 
  FiClipboard, 
  FiFileText, 
  FiShield,
  FiCheckCircle,
  FiXCircle 
} from 'react-icons/fi';
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

interface IssueDetailsProps {
  selectedIssue: Issue;
  setSelectedIssue: (issue: Issue | null) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  handleApproveIssue?: (id: number) => void;
  openRejectCommentModal?: (issue: Issue) => void;
  isDashboardView?: boolean;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const IssueDetails: React.FC<IssueDetailsProps> = ({
  selectedIssue,
  showModal,
  setShowModal,
  setSelectedIssue,
  getStatusColor,  // Keeping for backward compatibility
  getPriorityColor, // Keeping for backward compatibility
  handleApproveIssue,
  openRejectCommentModal,
  isDashboardView = false
}) => {
  if (!showModal || !selectedIssue) return null;
  
  // Function to handle attachment view
  const handleViewAttachment = () => {
    if (selectedIssue.attachment) {
      window.open(`http://localhost:5000/${selectedIssue.attachment}`, '_blank');
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mt-10 mb-10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Issue #{selectedIssue.id}</h2>
              <div className="flex items-center mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${ISSUE_STATUS.getStatusColor(selectedIssue.status)}`}>
                  {ISSUE_STATUS.getDisplayName(selectedIssue.status)}
                </span>
                <span className="ml-3 text-purple-100 text-sm">
                  <FiCalendar className="inline mr-1" />
                  {formatDate(selectedIssue.submittedAt)}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedIssue(null);
              }}
              className="text-white hover:text-purple-200 transition-colors"
              aria-label="Close"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Priority and Warranty Badge */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedIssue.priorityLevel)}`}>
              <FiAlertCircle className="inline mr-1" />
              {selectedIssue.priorityLevel} Priority
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${selectedIssue.underWarranty ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <FiShield className="inline mr-1" />
              {selectedIssue.underWarranty ? 'Under Warranty' : 'Not Under Warranty'}
            </div>
          </div>



          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Issue Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Device and Location */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <FiTool className="mr-2" /> Device Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Device ID</p>
                    <p className="font-medium">{selectedIssue.deviceId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Complaint Type</p>
                    <p className="font-medium">{selectedIssue.complaintType}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-gray-500">Location</p>
                    <p className="font-medium flex items-center">
                      <FiMapPin className="mr-1 text-purple-600" />
                      {selectedIssue.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <FiFileText className="mr-2" /> Description
                </h3>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{selectedIssue.description}</p>
                </div>
              </div>

              {/* Rejection Reason (if exists) */}
              {selectedIssue.comment && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Rejection Reason</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{selectedIssue.comment}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Attachment */}
            {selectedIssue.attachment && (
              <div className="lg:col-span-1">
                <div className="bg-gray-50 p-4 rounded-lg h-full">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                    <FiClipboard className="mr-2" /> Attachments
                  </h3>
                  <button
                    onClick={handleViewAttachment}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors group"
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-purple-500" 
                           fill="none" 
                           viewBox="0 0 24 24" 
                           stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="mt-2 block text-sm font-medium text-gray-900 group-hover:text-purple-600">
                        View Attachment
                      </span>
                      <p className="mt-1 text-xs text-gray-500">
                        Click to view the attached file
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons - Only shown in Dashboard view */}
        {isDashboardView && selectedIssue.status === 'Pending' && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  if (openRejectCommentModal) {
                    openRejectCommentModal(selectedIssue);
                    setShowModal(false);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiXCircle className="-ml-1 mr-2 h-5 w-5 text-red-500" />
                Reject
              </button>
              <button
                onClick={() => {
                  if (handleApproveIssue) {
                    handleApproveIssue(selectedIssue.id);
                    setShowModal(false);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FiCheckCircle className="-ml-1 mr-2 h-5 w-5" />
                Approve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueDetails;
