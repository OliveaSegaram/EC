import React, { useState, useEffect } from 'react';
import { FiEye } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import RejectCommentModal from './RejectCommentModal';
import { Issue } from '../../types/issue';
import { ISSUE_STATUS } from '../../constants/issueStatuses';
import RootIssueDetails from './RootIssueDetails';

const IssuePanel: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [commentIssue, setCommentIssue] = useState<Issue | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [approveComment, setApproveComment] = useState('');

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      console.log('Fetching issues for root dashboard...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/issues', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log('Issues API response:', response.data);

      if (response.data && response.data.issues) {
        // The backend now filters for DC-approved issues for root users
        setIssues(response.data.issues);
      } else {
        console.warn('No issues array in response');
        setIssues([]);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleApproveIssue = async (issue: Issue, comment: string = '') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return false;
      }

      const response = await axios.post(
        `http://localhost:5000/api/issues/${issue.id}/approve-root`,
        { comment: comment || undefined },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        await fetchIssues();
        toast.success('Issue approved successfully');
        setShowApproveModal(false);
        setShowModal(false); // Close the issue details modal
        setApproveComment('');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error approving issue:', error);
      toast.error(error?.response?.data?.message || 'Error approving issue');
      return false;
    }
  };

  const openApproveModal = (issue: Issue) => {
    setCommentIssue(issue);
    setApproveComment('');
    setShowApproveModal(true);
  };

  const handleRejectIssue = async (issueId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Make sure we have a comment
      if (!rejectComment.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }

      // Send the comment with the rejection request
      await axios.post(
        `http://localhost:5000/api/issues/${issueId}/reject-root`,
        { comment: rejectComment },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Clear form and close modals
      setRejectComment('');
      setShowCommentModal(false);
      setShowModal(false); // Close the issue details modal

      // Refresh issues to show updated status and comment
      await fetchIssues();

      toast.success('Issue rejected successfully');
    } catch (error: any) {
      console.error('Error rejecting issue:', error);
      toast.error(error?.response?.data?.message || 'Error rejecting issue');
    }
  };

  const openRejectCommentModal = (issue: Issue) => {
    setCommentIssue(issue);
    setRejectComment('');
    setShowCommentModal(true);
  };

  // Removed unused showComment function

  const getStatusColor = (status: string) => {
    switch (status) {
      case ISSUE_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ISSUE_STATUS.DC_APPROVED:
        return 'bg-blue-100 text-blue-800';
      case ISSUE_STATUS.RESOLVED:
        return 'bg-purple-100 text-purple-800';
      case ISSUE_STATUS.DC_REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
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

  // Group issues by date
  const groupIssuesByDate = (issues: Issue[]) => {
    const groups: Record<string, Issue[]> = {};

    issues.forEach(issue => {
      const date = new Date(issue.submittedAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(issue);
    });

    return Object.entries(groups);
  };

  // Sort and group the issues
  const sortedAndGroupedIssues = groupIssuesByDate(
    [...issues].sort((a, b) => {
      // Only sort for Pending or DC approved status
      const statusA = a.status;
      const statusB = b.status;
      const shouldSortA = statusA === ISSUE_STATUS.PENDING || statusA === ISSUE_STATUS.DC_APPROVED;
      const shouldSortB = statusB === ISSUE_STATUS.PENDING || statusB === ISSUE_STATUS.DC_APPROVED;

      if (!shouldSortA && !shouldSortB) return 0;
      if (!shouldSortA) return 1;
      if (!shouldSortB) return -1;

      // Priority order: High > Medium > Low
      const priorityOrder: Record<string, number> = {
        'High': 1,
        'Medium': 2,
        'Low': 3
      };

      return priorityOrder[a.priorityLevel] - priorityOrder[b.priorityLevel];
    })
  );

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">All Issues</h2>
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
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {issue.complaintType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)} whitespace-nowrap`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(issue.priorityLevel)} whitespace-nowrap`}>
                          {issue.priorityLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {issue.location}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FiEye size={18} />
                          </button>
                        </div>
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
        onClose={() => setShowCommentModal(false)}
        onSubmit={(issue) => {
          if (commentIssue) {
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
        onClose={() => setShowApproveModal(false)}
        onSubmit={async (issue) => {
          if (commentIssue) {
            const success = await handleApproveIssue(commentIssue, approveComment);
            if (success) {
              setShowApproveModal(false);
            }
          }
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
