import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEdit } from 'react-icons/fi';

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
}

const AssignedTasks = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchAssignedIssues();
  }, []);

  const fetchAssignedIssues = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/issues/technicalofficer/assigned', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIssues(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch assigned tasks');
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
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/issues/${selectedIssue.id}/technicalofficer/update`,
        { status, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status updated successfully');
      setShowModal(false);
      fetchAssignedIssues();
    } catch (error: any) {
      toast.error('Failed to update status');
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
