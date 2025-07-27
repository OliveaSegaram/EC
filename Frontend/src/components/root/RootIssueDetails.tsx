import React, { useContext } from 'react';
import {
  FiCalendar, 
  FiAlertCircle, 
  FiMapPin, 
  FiTool, 
  FiFileText, 
  FiShield,
  FiCheckCircle,
  FiXCircle 
} from 'react-icons/fi';
import Button from '../ui/buttons/Button';

import type { Issue } from '../../types/issue';
import { ISSUE_STATUS } from '../../constants/issueStatuses';
import { AppContext } from '../../provider/AppContext';
import { useTranslation } from 'react-i18next';

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
  
  const { t } = useTranslation();
  const appContext = useContext(AppContext);
  if (!appContext) throw new Error('AppContext is not available');
  const { backendUrl } = appContext;

  // Function to handle attachment view
  const handleViewAttachment = () => {
    if (selectedIssue.attachment) {
      window.open(`${backendUrl}/${selectedIssue.attachment}`, '_blank');
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl my-10 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
        {/* Header */}
        {/* Header */}
        <div className="bg-[#4d1a57] p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{t('issue')} #{selectedIssue.id}</h2>
              <div className="flex items-center mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedIssue.status)}`}>
                  {t(selectedIssue.status)}
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
              className="text-white hover:text-purple-200 transition-colors p-1 -mr-1"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Priority and Warranty Badge */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedIssue.priorityLevel)}`}>
              <FiAlertCircle className="inline mr-1" />
              {t(selectedIssue.priorityLevel.toLowerCase())} {t('priority')}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${selectedIssue.underWarranty ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <FiShield className="inline mr-1" />
              {selectedIssue.underWarranty ? t('Under Warranty') : t('Not UnderWarranty')}
            </div>
          </div>

          {/* Show status-related comments */}
          <div className="space-y-4 mb-6">
            {/* DC/AC's Rejection Reason */}
            {selectedIssue.status === ISSUE_STATUS.DC_REJECTED && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r">
                <h4 className="text-sm font-medium text-red-800 mb-2">{t('Verifying Officer Rejection Reason')}</h4>
                <div className="bg-white p-3 rounded border border-red-100">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {selectedIssue.comment || t('No Reason Provided')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Super Admin's Rejection Reason */}
            {selectedIssue.status === ISSUE_STATUS.SUPER_ADMIN_REJECTED && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r">
                <h4 className="text-sm font-medium text-red-800 mb-2">{t('Super Admin Rejection Reason')}</h4>
                <div className="bg-white p-3 rounded border border-red-100">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {selectedIssue.comment || t('No Reason Provided')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Super Admin's Approval Comment */}
            {(selectedIssue.status === ISSUE_STATUS.SUPER_ADMIN_APPROVED || selectedIssue.status === ISSUE_STATUS.RESOLVED) && selectedIssue.comment && (
              <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  {selectedIssue.status === ISSUE_STATUS.RESOLVED ? t('Approval Note') : t('Super Admin Approval Note')}
                </h4>
                <div className="bg-white p-3 rounded border border-green-100">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {selectedIssue.comment}
                  </p>
                </div>
              </div>
            )}
            
            {/* Verifying Officer's Approval Status */}
            {selectedIssue.status === ISSUE_STATUS.DC_APPROVED && (
              <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r">
                <h4 className="text-sm font-medium text-green-800 mb-2">{t('Verifying Officer Approval Status')}</h4>
                <div className="bg-white p-3 rounded border border-green-100">
                  <p className="text-sm text-gray-700 flex items-center">
                    <FiCheckCircle className="text-green-500 mr-2" />
                    {t('Approved by Verifying Officer')}
                  </p>
                </div>
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
                  <FiTool className="mr-2" /> {t('deviceInformation')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{t('deviceId')}</p>
                    <p className="font-medium">{selectedIssue.deviceId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">{t('complaintType')}</p>
                    <p className="font-medium">{selectedIssue.complaintType}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-gray-500">{t('location')}</p>
                    <p className="font-medium flex items-center">
                      <FiMapPin className="mr-1 text-purple-600" />
                      {selectedIssue.location?.includes('Colombo Head Office') && selectedIssue.branch 
                        ? `Colombo Head Office - ${selectedIssue.branch}`
                        : selectedIssue.location || t('locationNotSpecified')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <FiFileText className="mr-2" /> {t('description')}
                </h3>
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-line">{selectedIssue.description}</p>
                </div>
              </div>

              {/* Attachment */}
              {selectedIssue.attachment && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">{t('attachment')}</h3>
                  <Button
                    buttonText={t('viewAttachment')}
                    buttonStyle={1}
                    textColor="#3B82F6"
                    onClick={handleViewAttachment}
                    className="text-sm hover:underline p-0 h-auto"
                  />
                </div>
              )}
            </div>

            {/* Right Column - Status and Actions */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-3">{t('statusTimeline')}</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100">
                        <FiCalendar className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{t('reported')}</p>
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
                        <p className="text-sm font-medium text-gray-900">{t('Approved By Verifying Officer')}</p>
                        <p className="text-xs text-gray-500">{t('Waiting For Final Approval')}</p>
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
                        <p className="text-sm font-medium text-gray-900">{t('rejected')}</p>
                        <p className="text-xs text-gray-500">{t('Issue Has Been Rejected')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions - Only show for DC/AC approved issues */}
              {(selectedIssue.status === ISSUE_STATUS.DC_APPROVED) && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="text-sm font-medium text-gray-500">{t('actions')}</h3>
                  <div className="space-y-2">
                    <Button
                      buttonText={t('approveIssue')}
                      buttonColor="#3B0043" // Dark purple color
                      buttonStyle={2}
                      textColor="white"
                      iconName="CheckCircle"
                      iconSize={16}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (handleApproveIssue) {
                          handleApproveIssue(selectedIssue);
                        }
                      }}
                      className="w-full hover:bg-[#3B0043]"
                    />
                    <Button
                      buttonText={t('rejectIssue')}
                      buttonColor="#3B0043" 
                      buttonStyle={1} 
                      textColor="#3B0043"
                      iconName="XCircle"
                      iconSize={16}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (openRejectCommentModal) {
                          openRejectCommentModal(selectedIssue);
                        }
                      }}
                      className="w-full hover:bg-white" 
                    />
                  </div>
                </div>
              )}
              
              {/* Show message for rejected issues */}
              {selectedIssue.status === ISSUE_STATUS.DC_REJECTED && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800">{t('IssueRejectedBy Verifying Officer')}</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    {selectedIssue.comment || t('noReasonForRejection')}
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
