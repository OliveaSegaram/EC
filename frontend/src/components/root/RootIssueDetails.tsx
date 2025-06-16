import React from 'react';
import {
  FiX, 
  FiCalendar, 
  FiAlertCircle, 
  FiMapPin, 
  FiTool, 
  FiFileText, 
  FiShield,
  FiCheckCircle,
  FiXCircle 
} from 'react-icons/fi';

import { Issue } from '../../types/issue';
import { ISSUE_STATUS } from '../../constants/issueStatuses';

interface RootIssueDetailsProps {
  selectedIssue: Issue | null;
  setSelectedIssue: (issue: Issue | null) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  handleApproveIssue?: (issue: Issue) => void;
  openRejectCommentModal?: (issue: Issue) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const RootIssueDetails: React.FC<RootIssueDetailsProps> = ({
  selectedIssue,
  showModal,
  setShowModal,
  setSelectedIssue,
  getStatusColor,
  getPriorityColor,
  handleApproveIssue,
  openRejectCommentModal,
}) => {
  // Early return if no issue is selected
  if (!selectedIssue) return null;
  if (!showModal) return null;
  
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl my-10 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
        {/* Header */}
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Issue #{selectedIssue.id}</h2>
              <div className="flex items-center mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedIssue.status)}`}>
                  {selectedIssue.status}
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
        <div className="p-6 overflow-y-auto flex-1">
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

          {/* Show status-related comments */}
          <div className="space-y-4 mb-6">
            {/* DC's Rejection Reason */}
            {selectedIssue.status === ISSUE_STATUS.DC_REJECTED && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r">
                <h4 className="text-sm font-medium text-red-800 mb-1">DC's Rejection Reason</h4>
                <p className="text-sm text-gray-700">
                  {selectedIssue.comment || 'No reason provided'}
                </p>
              </div>
            )}
            
            {/* Super Admin's Rejection Reason */}
            {selectedIssue.status === 'Rejected by Super Admin' && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r">
                <h4 className="text-sm font-medium text-red-800 mb-1">Super Admin's Rejection Reason</h4>
                <p className="text-sm text-gray-700">
                  {selectedIssue.comment || 'No reason provided'}
                </p>
              </div>
            )}
            
            {/* Super Admin's Approval Comment */}
            {selectedIssue.status === 'Issue approved by Super Admin' && selectedIssue.comment && (
              <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r">
                <h4 className="text-sm font-medium text-green-800 mb-1">Approval Note</h4>
                <p className="text-sm text-gray-700">{selectedIssue.comment}</p>
              </div>
            )}
            
            {/* DC's Approval Status */}
            {selectedIssue.status === ISSUE_STATUS.DC_APPROVED && (
              <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                <h4 className="text-sm font-medium text-blue-800 mb-1">DC Approval Status</h4>
                <p className="text-sm text-gray-700">This issue has been approved by DC and is pending further action.</p>
              </div>
            )}
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
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-line">{selectedIssue.description}</p>
                </div>
              </div>

              {/* Attachment */}
              {selectedIssue.attachment && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Attachment</h3>
                  <button
                    onClick={handleViewAttachment}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    View Attachment
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Status and Actions */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Status Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100">
                        <FiCalendar className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Reported</p>
                      <p className="text-xs text-gray-500">{formatDate(selectedIssue.submittedAt)}</p>
                    </div>
                  </div>
                  
                  {selectedIssue.status === ISSUE_STATUS.DC_APPROVED && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100">
                          <FiCheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Approved by DC</p>
                        <p className="text-xs text-gray-500">Waiting for final approval</p>
                      </div>
                    </div>
                  )}

                  {selectedIssue.status === ISSUE_STATUS.DC_REJECTED && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-red-100">
                          <FiXCircle className="h-4 w-4 text-red-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Rejected</p>
                        <p className="text-xs text-gray-500">Issue has been rejected</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions - Only show for DC approved issues */}
              {(selectedIssue.status === ISSUE_STATUS.DC_APPROVED) && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="text-sm font-medium text-gray-500">Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (handleApproveIssue) {
                          handleApproveIssue(selectedIssue);
                        }
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FiCheckCircle className="mr-2" size={16} />
                      Approve Issue
                    </button>
                    <button
                      onClick={() => {
                        if (openRejectCommentModal) {
                          openRejectCommentModal(selectedIssue);
                        }
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FiXCircle className="mr-2" size={16} />
                      Reject Issue
                    </button>
                  </div>
                </div>
              )}
              
              {/* Show message for rejected issues */}
              {selectedIssue.status === ISSUE_STATUS.DC_REJECTED && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800">This issue has been rejected by DC</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    {selectedIssue.comment || 'No reason provided for rejection.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RootIssueDetails;
