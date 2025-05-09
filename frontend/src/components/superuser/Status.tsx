import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiLayers, FiMoreVertical, FiThumbsUp } from 'react-icons/fi';
import { CiCircleList, CiWallet, CiClock1 } from 'react-icons/ci';
import axios from 'axios';

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

const Status = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [overviewStats, setOverviewStats] = useState({
    totalIssues: 0,
    dcApprovedIssues: 0,
    superUserApprovedIssues: 0,
  });

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
      
      // Update overview stats
      setOverviewStats({
        totalIssues: allIssues.length,
        dcApprovedIssues: allIssues.filter((issue: Issue) => issue.status === 'DC Approved').length,
        superUserApprovedIssues: allIssues.filter((issue: Issue) => issue.status === 'Super User Approved').length,
      });
    } catch (error: any) {
      console.error('Error fetching issues:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
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
      <div className="p-4">
  {/* Overview Stats */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex items-center space-x-4">
      <div className="bg-blue-100 text-blue-600 p-2 rounded-md">
        <FiLayers size={24} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700">Total Issues</h3>
        <p className="text-xl font-bold text-blue-600">{overviewStats.totalIssues}</p>
      </div>
    </div>

    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex items-center space-x-4">
      <div className="bg-yellow-100 text-yellow-600 p-2 rounded-md">
        <FiCheckCircle size={24} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700">DC Approved</h3>
        <p className="text-xl font-bold text-yellow-600">{overviewStats.dcApprovedIssues}</p>
      </div>
    </div>

    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex items-center space-x-4">
      <div className="bg-green-100 text-green-600 p-2 rounded-md">
        <FiThumbsUp size={24} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700">Super User Approved</h3>
        <p className="text-xl font-bold text-green-600">{overviewStats.superUserApprovedIssues}</p>
      </div>
    </div>
  </div>
</div>

      {/* Issues Table */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">All Issues</h2>
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
              {issues.map((issue) => (
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
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
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

export default Status; 