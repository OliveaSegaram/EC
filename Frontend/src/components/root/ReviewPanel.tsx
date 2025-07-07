import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FiEye, 
  FiCheck, 
  FiX, 
  FiCalendar, 
  FiClock,
  FiPaperclip,
  FiCheckCircle,
  FiFilter,
  FiMessageSquare,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { AppContext } from '../../provider/AppContext';

interface AssignedUser {
  id: number;
  username: string;
  email: string;
}

interface ReviewIssue {
  id: number;
  deviceId: string;
  complaintType: string;
  issueType?: string;
  status: string;
  priorityLevel: string;
  location: string;
  comment: string;
  attachment: string | null;
  details: string;
  submittedAt: string;
  updatedAt: string;
  assignedTo: AssignedUser | null;
  lastUpdatedStatus?: string;
}


const ReviewPanel: React.FC = () => {
  const appContext = useContext(AppContext);
  if (!appContext) throw new Error('AppContext is not available');
  
  const { backendUrl } = appContext;
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<ReviewIssue[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'completed', 'resolved'
  
  // Filter options with icons and labels
  const filterOptions = [
    { value: 'all', label: t('allIssues') },
    { value: 'completed', label: t('completed') },
    { value: 'resolved', label: t('resolved') }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending_Review':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> {t('pendingReview')}
          </span>
        );
      case 'Resolved':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1" /> {t('resolved')}
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            <FiCheck className="mr-1" /> {t('completed')}
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status?.replace(/_/g, ' ') || t('unknown')}
          </span>
        );
    }
  };

  const fetchIssues = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Get and verify user data
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found. Please log in again.');
      }
      
      let user;
      try {
        user = JSON.parse(userData);
        console.log('Current user role:', user.role);
        
        // Check if user has required role
        if (!['super_admin', 'root'].includes(user.role)) {
          throw new Error(`Access Denied. Your role (${user.role}) does not have permission to access this page.`);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        throw new Error('Invalid user data. Please log in again.');
      }
      
      const url = `${backendUrl}/reviews/review`;
      console.log('Fetching issues from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies for session
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      // Get response text first to handle both JSON and HTML responses
      const responseText = await response.text();
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      console.log('Response text (first 500 chars):', responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON. Full response:', responseText);
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html>')) {
          throw new Error('Received HTML instead of JSON. The server might be returning an error page.');
        } else {
          throw new Error(`Received invalid JSON response: ${responseText.substring(0, 100)}...`);
        }
      }
      
      if (!response.ok) {
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: Object.fromEntries([...response.headers.entries()])
        });
        
        if (response.status === 403) {
          const userData = localStorage.getItem('user');
          let userRole = 'unknown';
          try {
            const user = userData ? JSON.parse(userData) : null;
            userRole = user?.role || 'not found';
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
          
          throw new Error(`Access Denied (403). Your role is: ${userRole}. This action requires 'super_admin' or 'root' role.`);
        }
        
        throw new Error(data?.message || `Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Handle case where no issues are found
      if (data?.message === 'Issue not found') {
        console.log('No issues found for review');
        setIssues([]);
        return [];
      }
      
      const issues = Array.isArray(data?.issues) ? data.issues : [];
      
      if (issues.length > 0 || data?.success) {
        console.log('Fetched issues:', issues.length);
        setIssues(issues);
        return issues;
      } else {
        console.log('No issues found in response');
        setIssues([]);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching issues:', error);
      const errorMessage = error.message || 'Failed to fetch issues for review';
      toast.error(errorMessage);
      setIssues([]);
      throw error;
    }
  }, []);

  // Filter issues based on status
  useEffect(() => {
    let filtered = [...issues];
    
    if (statusFilter === 'completed') {
      filtered = filtered.filter(issue => 
        issue.status === 'Completed' || 
        issue.status === 'COMPLETED' ||
        issue.status === 'SUPER_ADMIN_APPROVED' ||
        issue.status === 'SUPER_ADMIN_REJECTED'
      );
    } else if (statusFilter === 'resolved') {
      filtered = filtered.filter(issue => 
        issue.status === 'Resolved' || 
        issue.status === 'RESOLVED' ||
        issue.status === 'Resolved_By_Technical_Officer' ||
        issue.status === 'RESOLVED_BY_TECHNICAL_OFFICER'
      );
    }
    
    setFilteredIssues(filtered);
  }, [issues, statusFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Refresh is handled by the refresh button in the UI

  const handleConfirm = async (issueId: number) => {
    if (!selectedIssue) return;
    
    setIsConfirming(true);
    try {
      console.log('Confirming review for issue:', issueId, 'with status:', selectedIssue.status);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${backendUrl}/reviews/${issueId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isApproved: true,
          comment: comment || ''
        })
      });

      const data = await response.json();
      console.log('Review confirmation response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm review');
      }
      
      toast.success(data.message || 'Issue confirmed successfully');
      setShowModal(false);
      setSelectedIssue(null);
      setComment('');
      
      // Refresh the issues list
      await fetchIssues();
    } catch (error: any) {
      console.error('Error confirming review:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to confirm review';
      
      // If the issue status is not in a reviewable state, refresh the list
      if (error.message.includes('status is not in a reviewable state')) {
        toast.warning(errorMessage);
        await fetchIssues();
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">{t('technicalOfficerUpdates')}</h2>
          
          <div className="relative w-full sm:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-12 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 sm:text-sm rounded-md bg-white appearance-none text-gray-700"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {statusFilter !== 'all' && (
              <div className="mt-2 text-sm text-gray-600 flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  {filterOptions.find(opt => opt.value === statusFilter)?.label}: {filteredIssues.length}
                </span>
                <button 
                  onClick={() => setStatusFilter('all')}
                  className="ml-2 text-sm text-purple-600 hover:text-purple-800 flex items-center"
                >
                  {t('clear')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#4d1a57] bg-opacity-100">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('issueId')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('type')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('status')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('lastUpdated')}</th>
              <th className="px-6 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider">{t('action')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                  {issues.length === 0 ? t('noIssuesToReview') : t('noIssuesMatchFilter')}
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => (
                <tr key={issue.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{issue.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.complaintType || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(issue.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiClock className="mr-1.5 h-4 w-4 text-gray-400" />
                      {new Date(issue.updatedAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => { setSelectedIssue(issue); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <FiEye size={20} color="#6e2f74" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal for issue details */}
      {showModal && selectedIssue && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center py-8">
          <div className="relative border w-11/12 max-w-3xl shadow-lg rounded-lg bg-white overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-[#4d1a57] text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">{t('issueDetails')}</h3>
                  <p className="text-xs text-purple-100 mt-0.5">{t('id')}: #{selectedIssue.id}</p>
                </div>
                <button 
                  onClick={() => { setShowModal(false); setSelectedIssue(null); }}
                  className="text-purple-200 hover:text-white focus:outline-none transition-colors duration-200 p-1"
                >
                  <span className="sr-only">Close</span>
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20">
                  {getStatusBadge(selectedIssue.status)}
                </span>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('deviceId')}</h4>
                  <p className="mt-1 text-gray-900 font-medium">{selectedIssue.deviceId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('issueType')}</h4>
                  <p className="mt-1 text-gray-900">{selectedIssue.complaintType || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('submittedAt')}</h4>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <FiCalendar className="mr-2" />
                    {new Date(selectedIssue.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('lastUpdated')}</h4>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <FiClock className="mr-2" />
                    {new Date(selectedIssue.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">{t('activityLog')}</h4>
                    <span className="text-xs text-gray-500">
                      {selectedIssue.updatedAt && `${t('lastUpdated')}: ${new Date(selectedIssue.updatedAt).toLocaleString()}`}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                    {selectedIssue.comment ? (
                      <div className="space-y-4">
                        {selectedIssue.comment.split('\n\n').filter(block => block.trim() !== '').map((commentBlock, blockIndex) => {
                          // Extract timestamp from the end of the comment (format: at 2025-06-22T06:04:50.143Z)
                          const timestampMatch = commentBlock.match(/at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z)$/);
                          let timestamp = null;
                          let commentText = commentBlock;
                          
                          if (timestampMatch) {
                            timestamp = new Date(timestampMatch[1] || timestampMatch[0].substring(3)); // Remove 'at ' prefix
                            commentText = commentBlock.substring(0, timestampMatch.index).trim();
                          }
                          
                          // Check if this is a status update
                          const isStatusUpdate = commentText.toLowerCase().includes('status updated to');
                          const statusMatch = commentText.match(/status updated to ([^\s]+)/i);
                          const status = statusMatch ? statusMatch[1] : null;
                          
                          return (
                            <div 
                              key={blockIndex} 
                              className={`flex gap-3 ${isStatusUpdate ? 'items-center' : 'items-start'}`}
                            >
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                isStatusUpdate ? 'bg-blue-500' : 'bg-purple-500'
                              }`}>
                                {isStatusUpdate ? (
                                  <FiRefreshCw size={16} />
                                ) : (
                                  <FiMessageSquare size={16} />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      {isStatusUpdate ? 'Status Update' : 'Comment'}
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
                                    {timestamp && (
                                      <span className="absolute bottom-0 right-0 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 px-1 rounded">
                                        {new Date(timestamp).toLocaleString('en-US', {
                                          month: 'numeric',
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          second: '2-digit',
                                          hour12: true
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
                    ) : (
                      <div className="text-center py-8">
                        <FiMessageSquare className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-2 text-sm text-gray-500">{t('noActivityYet')}</p>
                        <p className="text-xs text-gray-400 mt-1">{t('updatesWillAppearHere')}</p>
                      </div>
                    )}
                  </div>
                </div>
                {selectedIssue.attachment && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">{t('attachment')}</h4>
                    <a 
                      href={selectedIssue.attachment.startsWith('http') 
                        ? selectedIssue.attachment 
                        : `${backendUrl}${selectedIssue.attachment.startsWith('/') ? '' : '/'}${selectedIssue.attachment}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FiPaperclip className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                      {t('viewAttachment')}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-3 border-t border-gray-200">
                <div className="flex justify-center">
                  <button
                    onClick={() => handleConfirm(selectedIssue.id)}
                    className={`flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900 rounded-lg transition-all shadow-md hover:shadow-lg py-2.5 px-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isConfirming ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={isConfirming}
                  >
                    <FiCheck className="mr-2 h-5 w-5" />
                    <span className="font-medium">{isConfirming ? t('confirming') : t('confirmReview')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPanel;
