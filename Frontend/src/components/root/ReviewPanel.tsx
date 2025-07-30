import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import SimplePagination from '../common/SimplePagination';
import { useSimplePagination } from '../../hooks/useSimplePagination';
import { useAuth } from '../../provider/AuthProvider';
import IconMapper from '../ui/IconMapper';
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
  branch?: string;
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
  
  // Pagination
  const itemsPerPage = 5;
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedIssues,
    handlePageChange
  } = useSimplePagination(filteredIssues, itemsPerPage);
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
            <IconMapper iconName="Clock" iconSize={14} className="mr-1" /> {t('pendingReview')}
          </span>
        );
      case 'Resolved':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <IconMapper iconName="CheckCircle" iconSize={14} className="mr-1" /> {t('resolved')}
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            <IconMapper iconName="Check" iconSize={14} className="mr-1" /> {t('completed')}
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

  const { token, user } = useAuth();
  
  const fetchIssues = useCallback(async () => {
    try {
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Check if user data is available
      if (!user) {
        throw new Error('User data not found. Please log in again.');
      }
      
      console.log('Current user in ReviewPanel:', user);
      
      // Check if user has required role
      const userRole = user.role?.toLowerCase();
      console.log('User role in ReviewPanel:', userRole);
      
      if (!userRole) {
        throw new Error('User role not found. Please log in again.');
      }
      
      if (!['super_admin', 'root'].includes(userRole)) {
        throw new Error(`Access Denied. Your role (${userRole}) does not have permission to access this page.`);
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
                <IconMapper iconName="Filter" iconSize={16} className="text-gray-400" />
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
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('location')}</th>
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
              paginatedIssues.map((issue) => (
                <tr key={issue.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{issue.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.complaintType || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <IconMapper iconName="MapPin" iconSize={16} className="mr-1.5 text-gray-400" />
                      {issue.location}
                      {issue.location === 'Colombo Head Office' && issue.branch && (
                        <span className="ml-1 text-xs text-gray-500">({issue.branch})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(issue.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <IconMapper iconName="Clock" iconSize={16} className="mr-1.5 text-gray-400" />
                      {new Date(issue.updatedAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => { setSelectedIssue(issue); setShowModal(true); }}
                      className="group relative text-[#6e2f74] hover:text-[#4d1a57] transition-colors duration-200"
                      title="View Details"
                    >
                      <div className="flex flex-col items-center">
                        <IconMapper iconName="Eye" iconSize={24} iconColor="currentColor" className="mb-0.5" />
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#6e2f74] group-hover:w-full transition-all duration-200"></span>
                      </div>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {filteredIssues.length > itemsPerPage && (
          <div className="flex justify-end mt-4 px-6 py-3 border-t border-gray-200">
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
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
                  <IconMapper iconName="X" iconSize={20} iconColor="white" />
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
                  <h4 className="text-sm font-medium text-gray-500">{t('location')}</h4>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <IconMapper iconName="MapPin" iconSize={16} className="mr-2" />
                    {selectedIssue.location}
                    {selectedIssue.location === 'Colombo Head Office' && selectedIssue.branch && (
                      <span className="ml-1 text-sm text-gray-600">({selectedIssue.branch} Branch)</span>
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('issueType')}</h4>
                  <p className="mt-1 text-gray-900">{selectedIssue.complaintType || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('submittedAt')}</h4>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <IconMapper iconName="Calendar" iconSize={16} className="mr-2" />
                    {new Date(selectedIssue.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('lastUpdated')}</h4>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <IconMapper iconName="Clock" iconSize={16} className="mr-2" />
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
                                isStatusUpdate ? 'bg-blue-500' : 'bg-[#7b3582]'
                              }`}>
                                {isStatusUpdate ? (
                                  <IconMapper iconName="RefreshCw" iconSize={16} iconColor="white" />
                                ) : (
                                  <IconMapper iconName="MessageSquare" iconSize={16} iconColor="white" />
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
                        <IconMapper iconName="MessageSquare" iconSize={40} className="mx-auto text-gray-300" />
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
                      className="mt-2 inline-flex items-center px-4 py-2 border border-[#6e2f74] text-sm font-medium rounded-md text-[#6e2f74] bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                      <IconMapper iconName="Paperclip" iconSize={16} className="mr-2 text-[#6e2f74]" />
                      <span className="font-medium">{t('viewAttachment')}</span>
                    </a>
                  </div>
                )}
              </div>
              
              {selectedIssue.status !== 'Completed' && (
                <div className="mt-6 pt-3 border-t border-gray-200">
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleConfirm(selectedIssue.id)}
                      className={`flex items-center justify-center bg-[#4d1a57] hover:bg-[#3a1340] text-white rounded-lg transition-all py-2.5 px-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isConfirming ? 'opacity-70 cursor-not-allowed' : ''}`}
                      disabled={isConfirming}
                    >
                      <IconMapper iconName="Check" iconSize={18} className="mr-2" />
                      <span className="font-medium">{isConfirming ? t('confirming') : t('confirmReview')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPanel;
