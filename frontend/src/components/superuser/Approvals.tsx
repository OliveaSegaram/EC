import React, { useState, useEffect } from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

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
  approvals: Array<{
    id: number;
    approvalLevel: string;
    status: string;
    approvedAt: string;
    approver: {
      username: string;
    };
  }>;
}

const Approvals = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/issues', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data || !response.data.issues) {
        console.error('Invalid response format:', response.data);
        return;
      }

      const allIssues = response.data.issues;
      setIssues(allIssues);
    } catch (error: any) {
      console.error('Error fetching issues:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  const handleApproveIssue = async (issueId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      await axios.post(`http://localhost:5000/api/issues/${issueId}/approve/superuser`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      fetchIssues();
      toast.success('Issue approved successfully');
    } catch (error: any) {
      console.error('Error approving issue:', error);
      toast.error(error.response?.data?.message || 'Error approving issue');
    }
  };

  const handleViewIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowViewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'DC Approved':
        return 'bg-blue-100 text-blue-800';
      case 'Super User Approved':
        return 'bg-green-100 text-green-800';
      case 'Super Admin Approved':
        return 'bg-purple-100 text-purple-800';
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

  return (
    <div className="p-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Pending Approvals</h2>
        <div className="overflow-x-auto bg-white shadow-md rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Device ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.filter(issue => issue.status === 'DC Approved').map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {issue.deviceId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {issue.complaintType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {issue.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(issue.priorityLevel)}`}>
                      {issue.priorityLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {issue.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(issue.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleViewIssue(issue)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleApproveIssue(issue.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Issue Modal */}
      {showViewModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Issue Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Device ID</h4>
                <p className="mt-1">{selectedIssue.deviceId}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Complaint Type</h4>
                <p className="mt-1">{selectedIssue.complaintType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1">{selectedIssue.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Priority Level</h4>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(selectedIssue.priorityLevel)}`}>
                    {selectedIssue.priorityLevel}
                  </span>
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedIssue.status)}`}>
                    {selectedIssue.status}
                  </span>
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="mt-1">{selectedIssue.location}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Submitted At</h4>
                <p className="mt-1">{new Date(selectedIssue.submittedAt).toLocaleString()}</p>
              </div>
              {selectedIssue.attachment && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Attachment</h4>
                  <a
                    href={selectedIssue.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals; 