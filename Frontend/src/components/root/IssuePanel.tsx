import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import type { FC, ReactElement } from 'react';
import IconMapper from '../ui/IconMapper';
import axios from 'axios';
import { toast } from 'react-toastify';
import type { Issue } from '../../types/issue';
import { ISSUE_STATUS } from '../../constants/issueStatuses';
import { AppContext } from '../../provider/AppContext';
import RootIssueDetails from './RootIssueDetails';
import RejectCommentModal from './RejectCommentModal';
import SimplePagination from '../common/SimplePagination';
import { useSimplePagination } from '../../hooks/useSimplePagination';


const IssuePanel: FC = (): ReactElement => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [commentIssue, setCommentIssue] = useState<Issue | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [approveComment, setApproveComment] = useState('');
  
  const appContext = useContext(AppContext);
  if (!appContext) throw new Error('AppContext is not available');

  const { backendUrl } = appContext;
  const { t } = useTranslation();

  // State to track when to refresh issues
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // State for status filter
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination
  const itemsPerPage = 10; // Number of items per page
  
  // Auto-refresh issues when refreshTrigger changes
  useEffect(() => {
    const fetchData = async () => {
      await fetchIssues();
    };
    
    fetchData();
    
    // Set up a refresh interval (e.g., every 30 seconds)
    const intervalId = setInterval(fetchData, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshTrigger]);
  
  // Function to trigger a refresh
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const fetchIssues = async () => {
    try {
      console.log('Fetching issues for root dashboard...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await axios.get(`${backendUrl}/issues?t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log('Issues API response:', response.data);

      if (response.data && response.data.issues) {
        // The backend now filters for DC/AC-approved issues for root users
        const newIssues = response.data.issues as Issue[];
        setIssues(prevIssues => {
          // Only update if the data has actually changed
          const shouldUpdate = JSON.stringify(prevIssues) !== JSON.stringify(newIssues);
          return shouldUpdate ? [...newIssues] : prevIssues;
        });
      } else {
        console.warn('No issues array in response');
        setIssues([]);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleApproveIssue = async (issue: Issue, comment: string = '') => {
    const toastId = toast.loading(t('approvingIssue'));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        toast.update(toastId, {
          render: t('authRequired'),
          type: 'error',
          isLoading: false,
          autoClose: 4000
        });
        return false;
      }

      // Optimistically update the UI
      setIssues(prevIssues => 
        prevIssues.map(item => 
          item.id === issue.id 
            ? { ...item, status: ISSUE_STATUS.SUPER_ADMIN_APPROVED, comment: comment || '' }
            : item
        )
      );

      const response = await axios.post(
        `${backendUrl}/issues/${issue.id}/approve-root`,
        { comment: comment || '' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          validateStatus: () => true // This ensures we handle all status codes
        }
      );

      // Handle non-2xx responses
      if (response.status >= 200 && response.status < 300) {
        // Clear the comment
        setApproveComment('');
        
        // Close the approval modal
        setShowApproveModal(false);
        
        // Close the issue details modal
        setShowModal(false);
        
        // Clear the selected issue
        setSelectedIssue(null);
        
        // Show success message
        toast.update(toastId, {
          render: response.data?.message || t('issueApprovedSuccessfully'),
          type: 'success',
          isLoading: false,
          autoClose: 3000,
          closeButton: true
        });
        
        // Force a complete refresh of the issues list
        await fetchIssues();
        
        // Trigger a refresh to ensure UI is in sync
        triggerRefresh();
        
        return true;
      } else {
        // Handle error response
        const errorMessage = response.data?.message || t('approveIssueFailed');
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error approving issue:', error);
      toast.error(error?.response?.data?.message || t('errorApprovingIssue'));
      return false;
    }
  };

  const openApproveModal = (issue: Issue | null) => {
    if (!issue) return;
    setCommentIssue(issue);
    setApproveComment('');
    setShowModal(false);
    setShowApproveModal(true);
  };

  const openRejectCommentModal = (issue: Issue | null) => {
    if (!issue) return;
    setCommentIssue(issue);
    setRejectComment('');
    setShowModal(false);
    setShowCommentModal(true);
    toast.info(t('provideReasonForRejection'), {
      autoClose: 4000
    });
  };

  const handleRejectIssue = async (issueId: number) => {
    const issueToReject = issues.find((issue) => issue.id === issueId);
    if (!issueToReject) {
      toast.error(t('issueNotFound'));
      return false;
    }
    
    const toastId = toast.loading(t('rejectingIssue'));
    
    // Optimistically update the UI
    setIssues(prevIssues => 
      prevIssues.map(item => 
        item.id === issueId 
          ? { ...item, status: ISSUE_STATUS.SUPER_ADMIN_REJECTED, comment: rejectComment }
          : item
      )
    );
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        toast.update(toastId, {
          render: t('authRequired'),
          type: 'error',
          isLoading: false,
          autoClose: 4000
        });
        return false;
      }

      // Make sure we have a comment
      if (!rejectComment.trim()) {
        toast.update(toastId, {
          render: t('provideReasonForRejection'),
          type: 'error',
          isLoading: false,
          autoClose: 4000
        });
        return false;
      }

      const response = await axios.post(
        `${backendUrl}/issues/${issueId}/reject-root`,
        { 
          comment: rejectComment,
          reason: rejectComment
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          validateStatus: () => true
        }
      );

      if (response.status >= 200 && response.status < 300) {
        // Clear form and close modals
        setRejectComment('');
        setShowCommentModal(false);
        setCommentIssue(null);
        
        // Close any open modals
        setShowModal(false);
        setSelectedIssue(null);
        
        // Show success message with server response if available
        toast.update(toastId, {
          render: response.data?.message || t('issueRejectedSuccessfully'),
          type: 'success',
          isLoading: false,
          autoClose: 3000,
          closeButton: true
        });
        
        // Force a complete refresh of the issues list
        await fetchIssues();
        
        // Trigger a refresh to ensure UI is in sync
        triggerRefresh();
        return true;
      } else {
        // Handle error response
        const errorMessage = response.data?.message || t('rejectIssueFailed');
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error rejecting issue:', error);
      
      // Revert UI on error
      setIssues(prevIssues => 
        prevIssues.map(item => 
          item.id === issueId 
            ? { ...issueToReject } // Revert to original issue data
            : item
        )
      );
      
      // Show error message
      toast.update(toastId, {
        render: error?.message || 'Error rejecting issue',
        type: 'error',
        isLoading: false,
        autoClose: 4000,
        closeButton: true
      });
      
      return false;
    }
  };


  // Helper functions for styling
  const getStatusColor = (status: string): string => {
    // Use the status color from the ISSUE_STATUS constants if available
    try {
      return ISSUE_STATUS.getStatusColor(status);
    } catch (e) {
      console.warn(`No color mapping found for status: ${status}`);
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter issues based on status
  const filteredIssues = React.useMemo(() => 
    issues.filter(issue => statusFilter === 'all' || issue.status === statusFilter)
  , [issues, statusFilter]);

  // Get unique statuses for filter options
  const statusOptions = React.useMemo(() => {
    const allStatusOptions = [
      { value: 'all', label: t('allIssues') },
      { value: ISSUE_STATUS.PENDING, label: t('pending') },
      { value: ISSUE_STATUS.DC_APPROVED, label: t('DC/AC Approved') },
      { value: ISSUE_STATUS.DC_REJECTED, label: t('DC/AC Rejected') },
      { value: ISSUE_STATUS.SUPER_ADMIN_APPROVED, label: t('approvedByAdmin') },
      { value: ISSUE_STATUS.SUPER_ADMIN_REJECTED, label: t('rejectedByAdmin') },
      { value: ISSUE_STATUS.UNDER_PROCUREMENT, label: t('underProcurement') },
      { value: ISSUE_STATUS.ASSIGNED, label: t('assigned') },
      { value: ISSUE_STATUS.IN_PROGRESS, label: t('inProgress') },
      { value: ISSUE_STATUS.RESOLVED, label: t('resolved') },
      { value: ISSUE_STATUS.COMPLETED, label: t('completed') },
      { value: ISSUE_STATUS.REOPENED, label: t('reopened') },
      { value: ISSUE_STATUS.ADD_TO_PROCUREMENT, label: t('addToProcurement') }
    ];

    // Only show statuses that exist in the current issues
    return allStatusOptions.filter(option => {
      if (option.value === 'all') return true;
      return issues.some(issue => issue.status === option.value);
    });
  }, [issues, t]);

  // Group issues by date
  const sortedAndGroupedIssues = React.useMemo(() => {
    const grouped = filteredIssues.reduce<Record<string, Issue[]>>((groups, issue) => {
      const date = new Date(issue.submittedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(issue);
      return groups;
    }, {});
    
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());
  }, [filteredIssues]);
  
  // Flatten the grouped issues for pagination
  const flattenedIssues = React.useMemo(() => {
    return sortedAndGroupedIssues.flatMap(([_, dateIssues]) => dateIssues);
  }, [sortedAndGroupedIssues]);
  
  // Pagination
  const { 
    paginatedItems, 
    currentPage, 
    totalPages, 
    handlePageChange 
  } = useSimplePagination(flattenedIssues, itemsPerPage);
  
  // Recreate the grouped structure for the current page
  const paginatedAndGroupedIssues = React.useMemo(() => {
    const paginatedGrouped: Record<string, Issue[]> = {};
    
    paginatedItems.forEach((issue) => {
      const date = new Date(issue.submittedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!paginatedGrouped[date]) {
        paginatedGrouped[date] = [];
      }
      paginatedGrouped[date].push(issue);
    });
    
    return Object.entries(paginatedGrouped)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());
  }, [paginatedItems]);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">{t('allIssues')}</h2>
        
        <div className="relative w-full sm:w-64">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconMapper iconName="FilterList" iconSize={20} />
            </div>
            <select
              id="status-filter"
              name="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
            >
              {statusOptions.map((option) => (
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
                {statusOptions.find(opt => opt.value === statusFilter)?.label}: {filteredIssues.length}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#4d1a57] bg-opacity-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                  {t('issueId')}
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                  {t('type')}
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                  {t('status')}
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                  {t('priority')}
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                  {t('location')}
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAndGroupedIssues.length > 0 ? (
                paginatedAndGroupedIssues.map(([date, dateIssues]) => (
                  <React.Fragment key={date}>
                    <tr className="bg-gray-50 sticky top-10 z-5">
                      <td colSpan={6} className="px-6 py-2 text-sm font-medium text-gray-900 bg-gray-50">
                        {date}
                      </td>
                    </tr>
                    {dateIssues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          #{issue.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {issue.complaintType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                            {ISSUE_STATUS.getDisplayName(issue.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(issue.priorityLevel)}`}>
                            {issue.priorityLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {issue.location}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setShowModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            <IconMapper iconName="Visibility" iconSize={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No issues found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4">
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      
      {/* Issue Details Modal */}
      {selectedIssue && (
        <RootIssueDetails
          selectedIssue={{
            ...selectedIssue,
            id: selectedIssue.id || 0, // Ensure id is always a number
            // Pass comment as dcRejectionReason when status is 'Rejected by DC/AC'
            ...(selectedIssue.status === ISSUE_STATUS.DC_REJECTED && {
              dcRejectionReason: selectedIssue.comment || ''
            })
          }}
          showModal={showModal}
          setShowModal={setShowModal}
          setSelectedIssue={setSelectedIssue}
          handleApproveIssue={() => selectedIssue && openApproveModal(selectedIssue)}
          openRejectCommentModal={() => selectedIssue && openRejectCommentModal(selectedIssue)}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />
      )}

      {/* Reject Comment Modal */}
      <RejectCommentModal
        isOpen={showCommentModal}
        onClose={() => {
          setShowCommentModal(false);
          setCommentIssue(null);
        }}
        onSubmit={async (issue: Issue) => {
          const success = await handleRejectIssue(issue.id);
          if (success) {
            setShowCommentModal(false);
            setCommentIssue(null);
          }
          if (commentIssue) {
            setShowApproveModal(false); 
            handleRejectIssue(issue.id);
            setShowCommentModal(false);
          }
        }}
        comment={rejectComment}
        setComment={setRejectComment}
        issueId={commentIssue?.id}
        title={t('rejectIssue')}
        submitButtonText={t('rejectIssue')}
        isReject={true}
        isOptional={false}
      />

      {/* Approve Comment Modal */}
      <RejectCommentModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setApproveComment('');
        }}
        onSubmit={async () => {
          if (commentIssue) {
            const success = await handleApproveIssue(commentIssue, approveComment);
            if (success) {
              setShowApproveModal(false);
              setApproveComment('');
              setShowModal(false);
              setSelectedIssue(null);
            }
            return success;
          }
          return false;
        }}
        comment={approveComment}
        setComment={setApproveComment}
        issueId={commentIssue?.id}
        title={t('approveIssue')}
        submitButtonText={t('approve')}
        isReject={false}
        isOptional={true}
      />
    </div>
  );
};

export default IssuePanel;
