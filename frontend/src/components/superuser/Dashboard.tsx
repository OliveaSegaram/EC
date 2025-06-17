import React, { useState, useEffect, useRef } from 'react';
import { FiCheckCircle, FiLayers, FiThumbsUp, FiEye, FiUser, FiChevronDown } from 'react-icons/fi'; // Added back FiUser and FiChevronDown as they are used in JSX
import axios from 'axios';
import { ISSUE_STATUS } from '../../constants/issueStatuses';

interface TechnicalOfficer {
  id: number;
  username: string;
  email: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

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
  user: User;
  assignedTo: User | null;
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

const Dashboard = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [technicalOfficers, setTechnicalOfficers] = useState<TechnicalOfficer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<TechnicalOfficer | null>(null);
  const [showOfficerDropdown, setShowOfficerDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [overviewStats, setOverviewStats] = useState({
    totalIssues: 0,
    dcApprovedIssues: 0,
    superUserApprovedIssues: 0,
  });

  useEffect(() => {
    fetchIssues();
    fetchTechnicalOfficers();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOfficerDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const fetchTechnicalOfficers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await axios.get('http://localhost:5000/api/issues/technical-officers/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Technical officers response:', response.data);
      
      if (response.data && response.data.technicalOfficers) {
        setTechnicalOfficers(response.data.technicalOfficers);
      }
    } catch (error) {
      console.error('Error fetching technical officers:', error);
    }
  };

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // First get user profile to get district
      const userProfile = await axios.get('http://localhost:5000/api/auth/user-profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const userDistrict = userProfile.data?.district || '';
      console.log('User district from profile:', userDistrict);

      // Fetch issues with district filter
      const response = await axios.get('http://localhost:5000/api/issues', {
        params: { userDistrict },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data || !response.data.issues) {
        console.error('Invalid response format:', response.data);
        return;
      }

      // Filter issues to show only approved by Super Admin in the overview
      const approvedIssues = response.data.issues.filter((issue: Issue) => 
        issue.status === ISSUE_STATUS.SUPER_ADMIN_APPROVED
      );
      
      setIssues(approvedIssues);
      
      // Update overview stats
      const allIssues = response.data.issues;
      setOverviewStats({
        totalIssues: allIssues.length,
        dcApprovedIssues: allIssues.filter((issue: Issue) => issue.status === ISSUE_STATUS.DC_APPROVED).length,
        superUserApprovedIssues: allIssues.filter((issue: Issue) => 
          issue.status === ISSUE_STATUS.SUPER_ADMIN_APPROVED || 
          issue.status === ISSUE_STATUS.ASSIGNED
        ).length,
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

  const handleAssignIssue = async (issueId: number) => {
    try {
      if (!selectedOfficer) {
        alert('Please select a technical officer');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Show confirmation dialog
      if (!window.confirm(`Are you sure you want to assign this issue to ${selectedOfficer.username}?`)) {
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/issues/${issueId}/assign-technician`,
        { technicalOfficerId: selectedOfficer.id },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Update the issue in the local state
        setIssues(issues.map(issue => 
          issue.id === issueId 
            ? { 
                ...issue, 
                status: 'Assigned to Technician',
                assignedTo: selectedOfficer
              } 
            : issue
        ));
        
        // Close the modal and reset selection
        setShowViewModal(false);
        setSelectedOfficer(null);
        
        // Show success message
        alert(`Issue assigned to ${selectedOfficer.username} successfully`);
      }
    } catch (error) {
      console.error('Error assigning issue:', error);
      alert('Failed to assign issue. Please try again.');
    }
  };
  
  const handleOfficerSelect = (officer: TechnicalOfficer) => {
    setSelectedOfficer(officer);
    setShowOfficerDropdown(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'DC Approved':
      case 'Issue approved by Super Admin':
      case 'Super User Approved':
      case 'Super Admin Approved':
        return 'bg-green-100 text-green-800';
      case 'Assigned to Technician':
      case 'In Progress':
      case 'Under Repair':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
      case 'Rejected by DC':
      case 'Issue rejected by Super Admin':
      case 'Rejected by Super Admin':
        return 'bg-red-100 text-red-800';
      case 'Completed':
      case 'Resolved':
        return 'bg-purple-100 text-purple-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
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
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">
                  Location
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
                    #{issue.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {issue.complaintType}
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
                    <button
                      onClick={() => handleViewIssue(issue)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                      title="View Details"
                    >
                      <FiEye size={18} />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white">Issue Details</h3>
                  <p className="text-sm text-purple-100 mt-1">ID: #{selectedIssue.id}</p>
                </div>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-purple-200 hover:text-white focus:outline-none transition-colors duration-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="p-6">

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Complaint Type</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.complaintType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                    <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedIssue.priorityLevel)}`}>
                      {selectedIssue.priorityLevel}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedIssue.status)}`}>
                      {selectedIssue.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Location</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.location}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{selectedIssue.description}</p>
                  </div>
                  {selectedIssue.attachment && (
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500">Attachment</h4>
                      <div className="mt-1 flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <a 
                            href={`http://localhost:5000${selectedIssue.attachment}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View Attachment
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Submitted By</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedIssue.user?.username || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Submission Date</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedIssue.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="mb-4">
                  <label htmlFor="technical-officer" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Technical Officer
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowOfficerDropdown(!showOfficerDropdown)}
                      className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    >
                      <span className="flex items-center">
                        <FiUser className="flex-shrink-0 h-5 w-5 text-gray-400" />
                        <span className="ml-3 block truncate">
                          {selectedOfficer ? selectedOfficer.username : 'Select a technical officer'}
                        </span>
                      </span>
                      <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <FiChevronDown className="h-5 w-5 text-gray-400" />
                      </span>
                    </button>
                    
                    {showOfficerDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {technicalOfficers.length > 0 ? (
                          technicalOfficers.map((officer) => (
                            <div
                              key={officer.id}
                              className={`${
                                selectedOfficer?.id === officer.id ? 'bg-purple-100 text-purple-900' : 'text-gray-900'
                              } cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-purple-50`}
                              onClick={() => handleOfficerSelect(officer)}
                            >
                              <div className="flex items-center">
                                <FiUser className="flex-shrink-0 h-5 w-5 text-gray-400" />
                                <span className="ml-3 block font-normal truncate">
                                  {officer.username} ({officer.email})
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 py-2 pl-3">No technical officers found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAssignIssue(selectedIssue.id)}
                    disabled={!selectedOfficer}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                      selectedOfficer 
                        ? 'bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-900' 
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Assign to {selectedOfficer ? selectedOfficer.username.split(' ')[0] : 'Technician'}
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

export default Dashboard; 