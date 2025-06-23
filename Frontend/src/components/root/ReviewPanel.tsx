import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  FiEye, 
  FiCheck, 
  FiX, 
  FiCalendar, 
  FiClock,
  FiPaperclip,
  FiCheckCircle,
  FiRefreshCw,
  FiMessageSquare
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

// Component to handle text truncation with read more/less
const TruncatedText: React.FC<{ text: string; maxLength: number }> = ({ text, maxLength }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const needsTruncation = text.length > maxLength;
  
  if (!needsTruncation) {
    return <span>{text}</span>;
  }
  
  return (
    <div className="break-words">
      {isExpanded ? (
        <>
          {text}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="text-blue-600 hover:text-blue-800 ml-1 text-xs"
          >
            Show less
          </button>
        </>
      ) : (
        <>
          {`${text.substring(0, maxLength)}...`}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="text-blue-600 hover:text-blue-800 ml-1 text-xs"
          >
            Read more
          </button>
        </>
      )}
    </div>
  );
};

const ReviewPanel: React.FC = () => {
  const appContext = useContext(AppContext);
  if (!appContext) throw new Error('AppContext is not available');
  
  const { backendUrl } = appContext;
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending_Review':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> Pending Review
          </span>
        );
      case 'Resolved':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1" /> Resolved
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            <FiCheck className="mr-1" /> Completed
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status?.replace(/_/g, ' ') || 'Unknown'}
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
        console.error('API Error:', data);
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

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

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
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Technical Officer Updates - Review</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issues.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-400">No issues to review</td>
              </tr>
            )}
            {issues.map((issue) => (
              <tr key={issue.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{issue.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.complaintType || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(issue.status)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs">
                    <TruncatedText text={issue.comment || 'No comment'} maxLength={50} />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => { setSelectedIssue(issue); setShowModal(true); }}
                    className="text-blue-600 hover:text-blue-800"
                    title="View Details"
                  >
                    <FiEye size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for issue details */}
      {showModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center py-8">
          <div className="relative border w-11/12 max-w-3xl shadow-lg rounded-lg bg-white overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Issue Details</h3>
                  <p className="text-xs text-purple-100 mt-0.5">ID: #{selectedIssue.id}</p>
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
                  <h4 className="text-sm font-medium text-gray-500">Device ID</h4>
                  <p className="mt-1 text-gray-900 font-medium">{selectedIssue.deviceId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Issue Type</h4>
                  <p className="mt-1 text-gray-900">{selectedIssue.complaintType || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Submitted At</h4>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <FiCalendar className="mr-2" />
                    {new Date(selectedIssue.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <FiClock className="mr-2" />
                    {new Date(selectedIssue.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Activity Log</h4>
                    <span className="text-xs text-gray-500">
                      {selectedIssue.updatedAt && `Last updated: ${new Date(selectedIssue.updatedAt).toLocaleString()}`}
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
                        <p className="mt-2 text-sm text-gray-500">No activity yet</p>
                        <p className="text-xs text-gray-400 mt-1">Updates will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
                {selectedIssue.attachment && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Attachment</h4>
                    <a 
                      href={`${backendUrl}/${selectedIssue.attachment.replace(/^uploads\//, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FiPaperclip className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                      View Attachment
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
                    <span className="font-medium">{isConfirming ? 'Confirming...' : 'Confirm Review'}</span>
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
