import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiAlertCircle, FiLogOut, FiBell, FiMapPin, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import axios from 'axios';
import userAvatar from '../../assets/icons/login/User.svg';

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

const DCDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'issues'>('overview');
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
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/issues', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.issues) {
        setIssues(response.data.issues);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleApproveIssue = async (issueId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      await axios.post(`http://localhost:5000/api/issues/${issueId}/approve/dc`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchIssues();
      alert('Issue approved successfully');
    } catch (error) {
      console.error('Error approving issue:', error);
      alert('Error approving issue');
    }
  };

  const handleRejectIssue = async (issueId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      await axios.post(`http://localhost:5000/api/issues/${issueId}/reject/dc`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchIssues();
      alert('Issue rejected successfully');
    } catch (error) {
      console.error('Error rejecting issue:', error);
      alert('Error rejecting issue');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'DC Approved':
        return 'bg-blue-100 text-blue-800';
      //case 'Super User Approved':
        //return 'bg-green-100 text-green-800';
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r shadow-lg fixed left-0 top-0 bottom-0 flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center space-x-2 px-4 py-4 border-b">
          <FiMapPin className="text-purple-700" size={24} />
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-900">Issue Tracker</span>
        </div>
        {/* Sidebar Navigation */}
        <nav className="flex flex-col space-y-3 px-2 py-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
              activeTab === 'overview'
                ? 'bg-purple-100 text-purple-700 font-semibold'
                : 'hover:bg-purple-200 text-gray-700'
            }`}
          >
            <FiHome className="mr-2" size={20} /> Overview
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
              activeTab === 'issues'
                ? 'bg-purple-100 text-purple-700 font-semibold'
                : 'hover:bg-purple-200 text-gray-700'
            }`}
          >
            <FiAlertCircle className="mr-2" size={20} /> Issues
          </button>
        </nav>
        {/* Sidebar Footer */}
        <div className="mt-auto px-4 py-4 border-t flex justify-between items-center">
          <span className="text-gray-500 text-sm">DC</span>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-gray-500 hover:text-red-600"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Top Navbar */}
      <div className="fixed top-4 left-60 right-4 bg-white shadow-lg z-10 py-3 px-6 rounded-xl">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-900">
            DC Dashboard
          </h1>
          <div className="flex items-center space-x-3">
            <FiBell className="text-gray-700 cursor-pointer" size={18} />
            <span className="text-gray-700 text-sm">DC</span>
            <img
              src={userAvatar}
              alt="User Avatar"
              className="rounded-full w-8 h-8"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-56 pt-20 px-4">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Overview</h2>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Total Issues</h3>
                <p className="text-3xl font-bold text-blue-600">{issues.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Pending Issues</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {issues.filter(issue => issue.status === 'Pending').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Approved Issues</h3>
                <p className="text-3xl font-bold text-green-600">
                  {issues.filter(issue => issue.status === 'DC Approved').length}
                </p>
              </div>
            </div>
            {/* Recent Issues */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Issues</h3>
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {issues.slice(0, 5).map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {issue.deviceId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(issue.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">All Issues</h2>
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
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
                        {issue.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleApproveIssue(issue.id)}
                              className="text-green-600 hover:text-green-800 flex items-center"
                              title="Approve"
                            >
                              <FiCheckCircle size={20} />
                            </button>
                            <button
                              onClick={() => handleRejectIssue(issue.id)}
                              className="text-red-600 hover:text-red-800 flex items-center"
                              title="Reject"
                            >
                              <FiXCircle size={20} />
                            </button>
                          </>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(issue.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

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

export default DCDashboard; 