import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiEdit } from 'react-icons/fi';
import api from '../../services/api';

interface Issue {
  id: number;
  deviceId: string;
  complaintType: string;
  description: string;
  priorityLevel: string;
  location: string;
  status: string;
  submittedAt: string;
  comment?: string;
  attachment?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  issues?: T[];
  [key: string]: any;
}

const AssignedTasks = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
  interface UpdateRequestData {
    comment: string;
    resolutionDetails?: string;
  }

  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchAssignedIssues();
  }, []);

  const fetchAssignedIssues = async () => {
    try {
      const response = await api.get('/assignments/my-issues');
      console.log('Assigned tasks response:', response.data);
      setIssues(response.data.issues || []);
    } catch (error) {
      console.error('Error fetching assigned tasks:', error);
      // Error is already handled by the API interceptor
    }
  };

  const handleOpenModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setComment(issue.comment || '');
    setStatus(issue.status);
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedIssue) return;

    try {
      let endpoint = '';
      let requestData: UpdateRequestData = { comment };
      
      // Determine which endpoint to use based on status
      if (status === 'In Progress') {
        endpoint = `/assignments/${selectedIssue.id}/start`;
      } else if (status === 'Resolved') {
        endpoint = `/assignments/${selectedIssue.id}/resolve`;
        requestData = { ...requestData, resolutionDetails: comment };
      } else {
        throw new Error('Invalid status');
      }

      console.log('Sending request to:', endpoint);
      console.log('Request data:', requestData);

      const response = await api.post<ApiResponse<Issue>>(endpoint, requestData);
      
      console.log('Update response:', response.data);
      toast.success(response.data.message || 'Status updated successfully');
      setShowModal(false);
      fetchAssignedIssues();
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        
        if (error.response.status === 401 || error.response.status === 403) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        
        const errorMessage = error.response.data?.message || 
                           error.response.statusText || 
                           'Failed to update status';
        toast.error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        toast.error(error.message || 'Failed to update status');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Issue assigned by Super User':
        return 'bg-purple-100 text-purple-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Assigned Tasks</h2>
        <div className="overflow-x-auto bg-white shadow-md rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Issue ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">#{issue.id}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{issue.complaintType}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{issue.description}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">{issue.priorityLevel}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(issue.status)}`}>{issue.status}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{issue.location}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenModal(issue)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                      title="Update Status"
                    >
                      <FiEdit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal for status update */}
      {showModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Update Task Status</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 text-gray-700">{selectedIssue.description}</p>
              </div>
              {selectedIssue.attachment && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Attachment</h4>
                  <a 
                    href={`http://localhost:5000/${selectedIssue.attachment}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    View Attachment
                  </a>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Comment</h4>
                <textarea
                  className="w-full border rounded-md px-3 py-2 mt-1"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your comment"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded-md border ${status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-400' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                  onClick={() => setStatus('In Progress')}
                >
                  In Progress
                </button>
                <button
                  className={`px-4 py-2 rounded-md border ${status === 'Resolved' ? 'bg-green-100 text-green-800 border-green-400' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                  onClick={() => setStatus('Resolved')}
                >
                  Resolved
                </button>
              </div>
              <button
                className="w-full mt-4 bg-purple-700 text-white py-2 rounded-md hover:bg-purple-800 transition"
                onClick={handleUpdateStatus}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedTasks;
