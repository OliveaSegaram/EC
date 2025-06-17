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
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
  const [showResolved, setShowResolved] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  interface UpdateRequestData {
    comment: string;
    resolutionDetails?: string;
  }

  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchAssignedIssues();
  }, []);
  
  // Update filtered issues when issues or activeFilter changes
  useEffect(() => {
    let result = [...issues];
    
    // Apply active filter if any
    if (activeFilter === 'Resolved' || activeFilter === 'Reopened') {
      // Show both Resolved and Reopened issues
      result = result.filter(issue => 
        issue.status === 'Resolved' || issue.status === 'Reopened'
      );
    } else if (activeFilter === 'Assigned to Technician') {
      // Handle assigned issues (might be 'Assigned to Technical Officer' or similar)
      result = result.filter(issue => 
        issue.status.includes('Assigned') || issue.status.includes('assigned')
      );
    } else if (activeFilter) {
      // Show only the selected status (for other statuses like 'In Progress')
      result = result.filter(issue => issue.status === activeFilter);
    }
    
    setFilteredIssues(result);
  }, [issues, activeFilter]);
  
  // Count issues by status, normalizing status names
  const statusCounts = issues.reduce((acc, issue) => {
    let status = issue.status;
    // Normalize status names for counting
    if (status.includes('Assigned') || status.includes('assigned')) {
      status = 'Assigned to Technician';
    }
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Assigned to Technical Officer Card */}
          <div 
            className={`p-4 rounded-lg shadow cursor-pointer transition-all ${activeFilter === 'Assigned to Technician' ? 'bg-purple-100 border-l-4 border-purple-500' : 'bg-white'}`}
            onClick={() => setActiveFilter(activeFilter === 'Assigned to Technician' ? null : 'Assigned to Technician')}
          >
            <h3 className="text-gray-600 font-medium">Assigned to You</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {statusCounts['Assigned to Technician'] || 0}
            </p>
          </div>

          {/* In Progress Card */}
          <div 
            className={`p-4 rounded-lg shadow cursor-pointer transition-all ${activeFilter === 'In Progress' ? 'bg-yellow-100 border-l-4 border-yellow-500' : 'bg-white'}`}
            onClick={() => setActiveFilter(activeFilter === 'In Progress' ? null : 'In Progress')}
          >
            <h3 className="text-gray-600 font-medium">In Progress</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {statusCounts['In Progress'] || 0}
            </p>
          </div>

          {/* Resolved/Reopened Card */}
          <div 
            className={`p-4 rounded-lg shadow cursor-pointer transition-all ${activeFilter === 'Resolved' || activeFilter === 'Reopened' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-white'}`}
            onClick={() => {
              // Toggle between showing all issues and showing resolved/reopened
              if (activeFilter === 'Resolved' || activeFilter === 'Reopened') {
                setActiveFilter(null);
              } else {
                setActiveFilter('Resolved'); // This will trigger showing both statuses
              }
            }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-gray-600 font-medium">Resolved/Reopened</h3>
              <div className="flex space-x-1">
                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  {statusCounts['Resolved'] || 0} Resolved
                </span>
                <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  {statusCounts['Reopened'] || 0} Reopened
                </span>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-800">
                {(statusCounts['Resolved'] || 0) + (statusCounts['Reopened'] || 0)}
              </p>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <span>Total: {(statusCounts['Resolved'] || 0) + (statusCounts['Reopened'] || 0)}</span>
              </div>
            </div>
          </div>
        </div>

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
              {filteredIssues.map((issue) => (
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
              
              {/* Approval Comment */}
              {selectedIssue.comment && (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    {selectedIssue.status === 'Issue assigned by Super User' ? 'Assignment Note' : 'Approval Note'}
                  </h4>
                  <p className="text-sm text-gray-700">{selectedIssue.comment}</p>
                </div>
              )}
              
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
