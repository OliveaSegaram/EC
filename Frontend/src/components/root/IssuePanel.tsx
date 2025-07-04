import React, { useState, useEffect, useContext } from 'react';
import type { FC, ReactElement } from 'react';
import { FiEye, FiFilter } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import type { Issue } from '../../types/issue';
import { ISSUE_STATUS } from '../../constants/issueStatuses';
import { AppContext } from '../../provider/AppContext';
import RootIssueDetails from './RootIssueDetails';
import RejectCommentModal from './RejectCommentModal';


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

  // State to track when to refresh issues
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // State for status filter
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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
        // The backend now filters for DC-approved issues for root users
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
    const toastId = toast.loading('Approving issue...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        toast.update(toastId, {
          render: 'Authentication required. Please log in again.',
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
          render: response.data?.message || 'Issue approved successfully',
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
        const errorMessage = response.data?.message || 'Failed to approve issue';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error approving issue:', error);
      toast.error(error?.response?.data?.message || 'Error approving issue');
      return false;
    }
  };

  const openApproveModal = (issue: Issue) => {
    setCommentIssue(issue);
    setApproveComment('');
    // Close the details modal and open approve modal
    setShowModal(false);
    setShowApproveModal(true);
  };
  
  // openRejectCommentModal is now defined below in the code

  const handleRejectIssue = async (issueId: number) => {
    const issueToReject = issues.find(issue => issue.id === issueId);
    if (!issueToReject) {
      toast.error('Issue not found');
      return false;
    }
    
    const toastId = toast.loading('Rejecting issue...');
    
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
          render: 'Authentication required. Please log in again.',
          type: 'error',
          isLoading: false,
          autoClose: 4000
        });
        return false;
      }

      // Make sure we have a comment
      if (!rejectComment.trim()) {
        toast.update(toastId, {
          render: 'Please provide a reason for rejection',
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

      // Handle non-2xx responses
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
          render: response.data?.message || 'Issue rejected successfully',
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
        const errorMessage = response.data?.message || 'Failed to reject issue';
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

  const openRejectCommentModal = (issue: Issue) => {
    setCommentIssue(issue);
    setRejectComment('');
    setShowCommentModal(true);
    
    // Show info toast about the action
    toast.info('Please provide a reason for rejection', {
      autoClose: 4000
    });
  };

  // Helper functions for styling
  const getStatusColor = (status: string): string => {
    switch (status) {
      case ISSUE_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ISSUE_STATUS.DC_APPROVED:
        return 'bg-blue-100 text-blue-800';
      case ISSUE_STATUS.DC_REJECTED:
        return 'bg-red-100 text-red-800';
      case ISSUE_STATUS.SUPER_ADMIN_APPROVED:
        return 'bg-green-100 text-green-800';
      case ISSUE_STATUS.SUPER_ADMIN_REJECTED:
        return 'bg-red-100 text-red-800';
      default:
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
  const filteredIssues = issues.filter(issue => {
    if (statusFilter === 'all') return true;
    return issue.status === statusFilter;
  });

  // Get unique statuses for filter options
  const statusOptions = [
    { value: 'all', label: 'All Issues' },
    { value: ISSUE_STATUS.PENDING, label: 'Pending' },
    { value: ISSUE_STATUS.DC_APPROVED, label: 'DC Approved' },
    { value: ISSUE_STATUS.DC_REJECTED, label: 'DC Rejected' },
    { value: ISSUE_STATUS.SUPER_ADMIN_APPROVED, label: 'Approved by Admin' },
    { value: ISSUE_STATUS.SUPER_ADMIN_REJECTED, label: 'Rejected by Admin' },
  ].filter(option => {
    // Only show statuses that exist in the current issues
    if (option.value === 'all') return true;
    return issues.some(issue => issue.status === option.value);
  });

  // Group and sort issues by date
  const sortedAndGroupedIssues = Object.entries(
    filteredIssues.reduce<Record<string, Issue[]>>((groups, issue) => {
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
    }, {})
  ).sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">All Issues</h2>
        
        <div className="relative w-full sm:w-64">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 sm:text-sm rounded-md bg-white appearance-none text-gray-700"
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
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Issue ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndGroupedIssues.map(([date, dateIssues]) => (
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
                          {issue.status}
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
                          <FiEye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Details Modal */}
      {selectedIssue && (
        <RootIssueDetails
          selectedIssue={{
            ...selectedIssue,
            // Pass comment as dcRejectionReason when status is 'Rejected by DC'
            ...(selectedIssue.status === ISSUE_STATUS.DC_REJECTED && {
              dcRejectionReason: selectedIssue.comment
            })
          }}
          setSelectedIssue={setSelectedIssue}
          showModal={showModal}
          setShowModal={setShowModal}
          handleApproveIssue={() => openApproveModal(selectedIssue)}
          openRejectCommentModal={() => openRejectCommentModal(selectedIssue)}
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
        title="Reject Issue"
        submitButtonText="Reject Issue"
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
        title="Approve Issue"
        submitButtonText="Approve"
        isReject={false}
        isOptional={true}
      />
    </div>
  );
};

export default IssuePanel;
