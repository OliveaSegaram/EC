import React, { useState, useEffect } from 'react';
import { 
  FiEye, 
  FiCheck, 
  FiX, 
  FiClock, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiPaperclip
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Get the backend URL from environment variables
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

interface AssignedUser {
  id: number;
  username: string;
  email: string;
}

interface ReviewIssue {
  id: number;
  deviceId: string;
  issueType: string;
  status: string;
  priorityLevel: string;
  location: string;
  comment: string;
  attachment: string | null;
  details: string;
  submittedAt: string;
  updatedAt: string;
  assignedTo: AssignedUser | null;
  lastUpdatedStatus?: string; // For backward compatibility
}

const ReviewPanel: React.FC = () => {
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Use the centralized API service
      const response = await api.get('/reviews/review');
      
      // Handle different response formats
      const issues = Array.isArray(response.data?.issues) 
        ? response.data.issues 
        : response.data?.data?.issues || [];
      
      if (issues.length > 0 || response.data?.success) {
        setIssues(issues);
        return issues;
      } else {
        throw new Error(response.data?.message || 'No issues found for review');
      }
    } catch (error: any) {
      console.error('Error fetching issues:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch issues for review';
      toast.error(errorMessage);
      setIssues([]);
      throw error;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const handleRefresh = async () => {
    try {
      await fetchIssues(false);
      toast.success('Issues refreshed successfully');
    } catch (error) {
      // Error already handled in fetchIssues
    }
  };

  const handleConfirm = async (issueId: number) => {
    if (!selectedIssue) return;
    
    setIsConfirming(true);
    try {
      console.log('Confirming review for issue:', issueId, 'with status:', selectedIssue.status);
      
      const response = await api.post(
        `/reviews/${issueId}/confirm`,
        { 
          isApproved: true,
          comment: comment || undefined 
        }
      );

      console.log('Review confirmation response:', response.data);
      
      if (response.data.success) {
        toast.success(response.data.message || 'Issue confirmed successfully');
        setShowModal(false);
        setSelectedIssue(null);
        setComment('');
        
        // Refresh the issues list
        await fetchIssues();
      } else {
        throw new Error(response.data.message || 'Failed to confirm review');
      }
    } catch (error: any) {
      console.error('Error confirming review:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to confirm review';
      
      // If the issue status is not in a reviewable state, refresh the list
      if (error.response?.status === 400) {
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.issueType}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(issue.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.comment || 'No comment'}</td>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-0 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white overflow-hidden">
            {/* Header with gradient background */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold">Issue #{selectedIssue.id}</h3>
                <span className="ml-3 px-3 py-1 rounded-full text-xs bg-white bg-opacity-20">
                  {getStatusBadge(selectedIssue.status)}
                </span>
              </div>
              <button
                onClick={() => { setShowModal(false); setSelectedIssue(null); }}
                className="text-white hover:text-gray-200 text-xl font-semibold"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Device ID</h4>
                  <p className="mt-1 text-gray-900 font-medium">{selectedIssue.deviceId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Issue Type</h4>
                  <p className="mt-1 text-gray-900">{selectedIssue.issueType}</p>
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
                  <h4 className="text-sm font-medium text-gray-500">Comment</h4>
                  <p className="mt-1 text-gray-900 p-3 bg-gray-50 rounded">
                    {selectedIssue.comment || 'No comment provided'}
                  </p>
                </div>
                {selectedIssue.attachment && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Attachment</h4>
                    <a 
                      href={`${BACKEND_URL}/uploads/${selectedIssue.attachment}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <FiPaperclip className="mr-2" />
                      View / Download Attachment
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="flex justify-center">
                  <button
                    onClick={() => handleConfirm(selectedIssue.id)}
                    className={`flex items-center justify-center bg-purple-600 text-white hover:bg-purple-700 rounded-md transition-all shadow-sm hover:shadow py-2 px-6 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${isConfirming ? 'opacity-50 cursor-not-allowed' : ''}`}
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
