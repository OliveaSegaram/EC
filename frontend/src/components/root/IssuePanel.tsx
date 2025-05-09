import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
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
}

const IssuePanel: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);

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

      if (response.data && response.data.issues) {
        // Filter to show only DC Approved issues
        const dcApprovedIssues = response.data.issues.filter(
          (issue: Issue) => issue.status === 'DC Approved'
        );
        setIssues(dcApprovedIssues);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleApproveIssue = async (issueId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      await axios.post(
        `http://localhost:5000/api/issues/${issueId}/approve/root`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      fetchIssues();
      toast.success('Issue approved successfully');
    } catch (error) {
      console.error('Error approving issue:', error);
      toast.error('Error approving issue');
    }
  };

  const handleRejectIssue = async (issueId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      await axios.post(
        `http://localhost:5000/api/issues/${issueId}/reject/root`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      fetchIssues();
      toast.success('Issue rejected successfully');
    } catch (error) {
      console.error('Error rejecting issue:', error);
      toast.error('Error rejecting issue');
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
    <div className="p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">DC Approved Issues</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {issue.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(issue.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveIssue(issue.id)}
                      className="text-green-600 hover:text-green-800"
                      title="Approve"
                    >
                      <FiCheckCircle size={20} />
                    </button>
                    <button
                      onClick={() => handleRejectIssue(issue.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Reject"
                    >
                      <FiXCircle size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Issue Details Modal */}
      {showModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Issue Details</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedIssue(null);
                }}
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

export default IssuePanel;
