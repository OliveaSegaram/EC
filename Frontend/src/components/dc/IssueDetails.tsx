import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../provider/AppContext';
import IconMapper from '../ui/IconMapper';
import Button from '../ui/buttons/Button';
import { ISSUE_STATUS } from '../../constants/issueStatuses';
import { toast } from 'react-toastify';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  createdBy: {
    id: number;
    username: string;
    role: string;
  };
  type: 'COMMENT' | 'REJECTION' | 'APPROVAL';
}

interface Issue {
  id: number;
  deviceId: string;
  complaintType: string;
  description: string;
  priorityLevel: string;
  location: string;
  status: string;
  submittedAt: string;
  updatedAt?: string;
  attachment: string | null;
  underWarranty: boolean;
  comment?: string;
  comments?: Comment[];
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
  getPriorityColor, 
  handleApproveIssue,
  openRejectCommentModal,
  isDashboardView = false
}) => {
  if (!showModal || !selectedIssue) return null;
  
  const { backendUrl } = useContext(AppContext);
  const { t } = useTranslation();

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIssue(null);
    toast.dismiss(); // Clear any active toasts when closing modal
  };

  // Function to handle attachment view
  const handleViewAttachment = () => {
    if (selectedIssue.attachment) {
      window.open(`${backendUrl}/${selectedIssue.attachment}`, '_blank');
    }
  };

  // Format date for display
  const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateString) return 'N/A';
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options || defaultOptions);
  };

  // Get all unique comments for the issue
  const getAllUserComments = () => {
    const commentMap = new Map<number, Comment>();
    const seenContent = new Set<string>();

    // Add the main comment if it exists
    if (selectedIssue.comment?.trim()) {
      const mainComment = {
        id: -1,
        content: selectedIssue.comment,
        createdAt: selectedIssue.submittedAt,
        createdBy: { id: -1, username: 'System', role: 'System' },
        type: 'COMMENT' as const
      };
      commentMap.set(-1, mainComment);
      seenContent.add(selectedIssue.comment.trim());
    }

    // Process all comments from the comments array
    if (selectedIssue.comments?.length) {
      selectedIssue.comments.forEach(comment => {
        // Skip if we've already seen this exact content
        const trimmedContent = comment.content.trim();
        if (seenContent.has(trimmedContent)) return;
        
        // Add to seen content and map
        seenContent.add(trimmedContent);
        commentMap.set(comment.id, comment);
      });
    }

    // Handle rejection case - ensure we have a rejection comment if status is rejected
    if (selectedIssue.status === ISSUE_STATUS.DC_REJECTED && 
        !Array.from(commentMap.values()).some(c => c.type === 'REJECTION') &&
        selectedIssue.comment?.trim()) {
      const rejectionComment = {
        id: -2,
        content: selectedIssue.comment,
        createdAt: selectedIssue.updatedAt || selectedIssue.submittedAt,
        createdBy: { id: -1, username: 'User', role: 'User' },
        type: 'REJECTION' as const
      };
      
      // Only add if we don't already have this exact content
      if (!seenContent.has(selectedIssue.comment.trim())) {
        commentMap.set(-2, rejectionComment);
      }
    }

    // Convert map values to array and sort by creation date
    return Array.from(commentMap.values()).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };
  
  const allComments = getAllUserComments();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4 transition-opacity duration-200">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mt-10 mb-10 overflow-hidden">
        {/* Header */}
        <div className="bg-[#4d1a57] text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{t('issue')} #{selectedIssue.id}</h2>
              <div className="flex items-center mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${ISSUE_STATUS.getStatusColor(selectedIssue.status)}`}>
                  {ISSUE_STATUS.getDisplayName(selectedIssue.status)}
                </span>
                <span className="ml-3 text-purple-100 text-sm flex items-center">
                  <IconMapper iconName="Calendar" iconSize={14} iconColor="#E9D5FF" className="inline mr-1.5" />
                  {formatDate(selectedIssue.submittedAt)}
                </span>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-2 rounded-full hover:bg-transparent focus:outline-none"
              aria-label="Close"
            >
              <IconMapper iconName="Close" iconSize={20} iconColor="#FFFFFF" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Priority and Warranty Badge */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedIssue.priorityLevel)}`}>
              <IconMapper iconName="Warning" iconSize={16} className="inline mr-1" />
              {selectedIssue.priorityLevel} {t('priority')}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${selectedIssue.underWarranty ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <IconMapper iconName="Lock" iconSize={16} className="inline mr-1" />
              {selectedIssue.underWarranty ? t('underWarranty') : t('notUnderWarranty')}
            </div>
          </div>



          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Issue Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Device and Location */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <IconMapper iconName="Settings" iconSize={16} className="mr-2" /> {t('deviceInformation')}
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
                      <IconMapper iconName="Home" iconSize={16} className="mr-1 text-purple-600" />
                      {selectedIssue.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <IconMapper iconName="File" iconSize={16} className="mr-2" /> {t('description')}
                </h3>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{selectedIssue.description}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Attachment */}
            {selectedIssue.attachment && (
              <div className="lg:col-span-1">
                <div className="bg-gray-50 p-4 rounded-lg h-full">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                    <IconMapper iconName="Paperclip" iconSize={16} className="mr-2" /> {t('attachments')}
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
                        {t('viewAttachment')}
                      </span>
                      <p className="mt-1 text-xs text-gray-500">
                        {t('clickToViewAttachment')}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Activity Log Section */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">{t('activityLog')}</h4>
            <span className="text-xs text-gray-500">
              {selectedIssue.updatedAt && `${t('lastUpdated')}: ${formatDate(selectedIssue.updatedAt)}`}
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
            {allComments.length > 0 ? (
              <div className="space-y-4">
                {allComments.map((comment: Comment) => {
                  // Extract timestamp from the end of the comment (format: at 2025-06-22T06:04:50.143Z)
                  const timestampMatch = comment.content.match(/at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z)$/);
                  let commentText = comment.content;
                  
                  if (timestampMatch) {
                    // Remove the timestamp from the comment text
                    commentText = comment.content.substring(0, timestampMatch.index).trim();
                  }
                  
                  // Check if this is a status update
                  const isStatusUpdate = commentText.toLowerCase().includes('status updated to');
                  const statusMatch = commentText.match(/status updated to ([^\s]+)/i);
                  const status = statusMatch ? statusMatch[1] : null;
                  
                  // Determine icon and styling based on comment type
                  let iconName, iconColor, bgColor;
                  if (isStatusUpdate) {
                    iconName = 'RefreshCw';
                    iconColor = 'text-blue-500';
                    bgColor = 'bg-blue-100';
                  } else if (comment.type === 'REJECTION') {
                    iconName = 'X';
                    iconColor = 'text-red-500';
                    bgColor = 'bg-red-100';
                  } else if (comment.type === 'APPROVAL') {
                    iconName = 'Check';
                    iconColor = 'text-green-500';
                    bgColor = 'bg-green-100';
                  } else {
                    iconName = 'MessageSquare';
                    iconColor = 'text-gray-700';
                    bgColor = 'bg-gray-100';
                  }
                  
                  return (
                    <div 
                      key={comment.id} 
                      className={`flex gap-3 ${isStatusUpdate ? 'items-center' : 'items-start'}`}
                    >
                      <div className={`flex-shrink-0 flex items-center justify-center p-1.5 rounded-lg ${bgColor}`}>
                        <IconMapper iconName={iconName} iconSize={20} className={iconColor} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {isStatusUpdate ? t('statusUpdate') : 
                               comment.type === 'REJECTION' ? t('rejection') :
                               comment.type === 'APPROVAL' ? t('approval') :
                               comment.createdBy?.username || t('user')}
                            </span>
                            
                            {status && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {status}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="relative group">
                          <div className="text-sm text-gray-700 whitespace-pre-wrap break-words pr-2">
                            {commentText}
                            <span className="absolute bottom-0 right-0 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 px-1 rounded">
                              {formatDate(comment.createdAt || selectedIssue.submittedAt, {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto mb-3">
                  <IconMapper iconName="MessageSquare" iconSize={40} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">{t('noActivityYet')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('updatesWillAppearHere')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Only shown in Dashboard view */}
        {isDashboardView && selectedIssue.status === 'Pending' && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
            <div className="flex justify-end space-x-3">
              <Button
                buttonText={t('reject')}
                buttonColor="#DC2626"
                buttonStyle={1}
                textColor="#DC2626"
                iconName="FiX"
                onClick={() => {
                  if (openRejectCommentModal) {
                    openRejectCommentModal(selectedIssue);
                    handleCloseModal();
                  } else {
                    handleCloseModal();
                  }
                }}
                className="px-4 py-2"
              />
              <Button
                buttonText={t('approve')}
                buttonColor="#3B0043"
                buttonStyle={2}
                textColor="white"
                iconName="FiCheck"
                onClick={() => {
                  if (handleApproveIssue) {
                    handleApproveIssue(selectedIssue.id);
                    toast.success(t('issueApprovedSuccessfully'));
                  }
                  handleCloseModal();
                }}
                className="shadow-md hover:shadow-lg transition-shadow"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueDetails;
