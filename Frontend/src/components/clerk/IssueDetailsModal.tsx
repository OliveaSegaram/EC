import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import IconMapper from '../ui/IconMapper';
import Button from '../ui/buttons/Button';
import { toast } from 'react-toastify';
import { AppContext } from '../../provider/AppContext';
import 'react-toastify/dist/ReactToastify.css';

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
  const { t } = useTranslation();
  const appContext = useContext(AppContext);
  if (!appContext) throw new Error('AppContext is not available');
  const { backendUrl } = appContext;
  if (!issue) return null;

  const handleViewAttachment = () => {
    if (issue.attachment) {
      try {
        window.open(`${backendUrl}/${issue.attachment}`, '_blank');
      } catch (error) {
        toast.error(t('Failed to open attachment. Please try again.'));
        console.error('Error opening attachment:', error);
      }
    } else {
      toast.info(t('No attachment available for this issue.'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#4d1a57] text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-white">{t('Issue Details')}</h3>
              <p className="text-sm text-purple-100 mt-1">{t('ID:')} #{issue.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/10 p-1 rounded text-xl"
              aria-label="Close"
            >
              ×
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
                <h4 className="text-sm font-medium text-gray-500">{t('Device ID')}</h4>
                <p className="mt-1 text-sm text-gray-900">{issue.deviceId}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t('Complaint Type')}</h4>
                <p className="mt-1 text-sm text-gray-900">{issue.complaintType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t('Priority')}</h4>
                <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(issue.priorityLevel)}`}>
                  {issue.priorityLevel}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t('Location')}</h4>
                <p className="mt-1 text-sm text-gray-900">{issue.location}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500">{t('Description')}</h4>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{issue.description}</p>
              </div>

              {/* Warranty Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t('Warranty Status')}</h4>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    issue.underWarranty ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {issue.underWarranty ? t('Under Warranty') : t('Out of Warranty')}
                  </span>
                </p>
              </div>

              {/* Submission Date */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t('Submitted On')}</h4>
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
                  <h4 className="text-sm font-medium text-gray-500">{t('Submitted By')}</h4>
                  <div className="mt-1 flex items-center">
                    <IconMapper iconName="User" iconSize={16} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {issue.user.username || 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {/* Attachment */}
              {issue.attachment && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{t('Attachment')}</h4>
                  <div 
                    onClick={handleViewAttachment}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  >
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                      <IconMapper iconName="FileText" iconSize={20} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {issue.attachment.split('/').pop()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('Click to view')}
                      </p>
                    </div>
                    <IconMapper iconName="ExternalLink" iconSize={16} className="text-gray-400 ml-2" />
                  </div>
                </div>
              )}
            </div>

            {/* Status and Comment History */}
            {issue.comment && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">{t('Status History & Comments')}</h4>
                <div className="space-y-4">
                  {issue.comment.split('\n\n').map((commentBlock, index) => {
                    // Extract timestamp if it exists at the end of the comment
                    let displayText = commentBlock;
                    let timestamp = null;
                    
                    // Match the timestamp at the end of the comment
                    const timestampMatch = commentBlock.match(/(.*?)(?:\s+at\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z))?$/);
                    
                    if (timestampMatch && timestampMatch[2]) {
                      displayText = timestampMatch[1].trim();
                      timestamp = new Date(timestampMatch[2]);
                    }
                    
                    // Check if this is a status update
                    const isStatusUpdate = displayText.includes('Status changed to') || 
                                         displayText.includes('Approved by') || 
                                         displayText.includes('Rejected by') ||
                                         displayText.includes('Assigned to');
                    
                    // Check if this is a rejection
                    const isRejection = displayText.includes('Rejected by') || 
                                      displayText.includes('rejection') ||
                                      displayText.toLowerCase().includes('reject');
                    
                    const isApproval = displayText.includes('Approved by');
                    const isAssignment = displayText.includes('Assigned to');
                    
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
                              <IconMapper iconName="Info" iconSize={16} className="text-red-500" />
                            ) : isApproval ? (
                              <IconMapper iconName="CheckCircle" iconSize={16} className="text-green-500" />
                            ) : isAssignment ? (
                              <IconMapper iconName="User" iconSize={16} className="text-blue-500" />
                            ) : (
                              <IconMapper iconName="Info" iconSize={16} className="text-purple-500" />
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-800 whitespace-pre-line">
                                {displayText}
                              </p>
                              {timestamp && (
                                <span className="text-xs text-gray-500 mt-1 self-end">
                                  {timestamp.toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
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
            {/* Reopen button for completed issues only */}
            {issue.status === 'Completed' && onReopen && (
              <Button
                buttonText={t('Reopen Issue')}
                buttonColor="#b45309"
                buttonStyle={2}
                textColor="white"
                iconName="RefreshCw"
                onClick={async () => {
                  try {
                    await onReopen(issue.id);
                    toast.success(t('Issue has been reopened successfully'));
                  } catch (error) {
                    // Error toast is handled in the parent component
                    console.error('Error reopening issue:', error);
                  }
                }}
                className="hover:bg-yellow-700 focus:ring-yellow-500"
              />
            )}
            
            <div className="flex space-x-3">
              <Button
                buttonText={t('Close')}
                buttonColor="#3B0043"
                buttonStyle={2}
                textColor="white"
                onClick={onClose}
                className="shadow-md hover:shadow-lg transition-shadow"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailsModal;
