import React, { useState, useEffect, useContext } from 'react';
import { FiSearch, FiEye, FiCheckCircle, FiRefreshCw, FiMessageSquare } from 'react-icons/fi'; 
import axios from 'axios';
import { AppContext } from '../../provider/AppContext';

interface Approval {
  id: number;
  approvalLevel: string;
  status: string;
  comment?: string;
  approvedAt: string;
  approver: {
    username: string;
  };
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
  updatedAt: string;
  comment?: string;  
  attachment?: string | null;  
  user: {
    id: number;
    username: string;
    email: string;
  };
  assignedTo: {
    id: number;
    username: string;
    email: string;
  } | null;
  approvals: Approval[];
}

type StatusFilter = 'all' | 'pending' | 'assigned';

const Approvals = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'colombo'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [userDistrict, setUserDistrict] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0
  });

  const { backendUrl } = useContext(AppContext);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${backendUrl}/auth/user-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserDistrict(response.data.district || '');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchAllIssues = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Set district filter based on active tab
      const districtFilter = activeTab === 'colombo' ? 'Colombo Head Office' : '';
      
      // Fetch all issues
      const response = await axios.get(`${backendUrl}/issues`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          userDistrict: districtFilter || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter
        }
      });
      
      if (response.data && response.data.issues) {
        setIssues(response.data.issues);
        
        // Calculate stats
        const issuesData = response.data.issues;
        setStats({
          total: issuesData.length,
          pending: issuesData.filter((i: Issue) => i.status === 'Pending').length,
          assigned: issuesData.filter((i: Issue) => 
            i.status === 'Assigned to Technician' || 
            i.status === 'In Progress' ||
            i.status === 'Issue approved by Super Admin' || 
            i.status === 'DC Approved'
          ).length
        });
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    fetchUserProfile();
    fetchAllIssues();
  }, [fetchAllIssues]);

  const handleViewDetails = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowViewModal(true);
  };

  const filteredIssues = issues.filter(issue => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      issue.deviceId?.toLowerCase().includes(searchLower) ||
      issue.complaintType?.toLowerCase().includes(searchLower) ||
      issue.description?.toLowerCase().includes(searchLower) ||
      issue.user?.username?.toLowerCase().includes(searchLower) ||
      issue.id.toString().includes(searchLower)
    );

    // Apply status filter
    if (statusFilter === 'pending') {
      return matchesSearch && issue.status === 'Pending';
    } else if (statusFilter === 'assigned') {
      return matchesSearch && (
        issue.status === 'Assigned to Technician' || 
        issue.status === 'In Progress' ||
        issue.status === 'Issue approved by Super Admin' || 
        issue.status === 'DC Approved'
      );
    }
    return matchesSearch;
  });
  
  const getStatusBadge = (status: string) => {
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

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">All Issues</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-4 mb-6">
        {/* Location Tabs */}
        {userDistrict && typeof userDistrict === 'string' && userDistrict.includes('Colombo') && (
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('all')}
            >
              All Locations
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'colombo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('colombo')}
            >
              Colombo Only
            </button>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === 'all' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === 'pending' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Pending ({stats.pending})
          </button>

          <button
            onClick={() => setStatusFilter('assigned')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === 'assigned' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Assigned ({stats.assigned})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-12">
          <FiCheckCircle className="mx-auto text-4xl text-green-500 mb-4" />
          <p className="text-gray-500">No approved issues found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>

                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>

                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{issue.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {issue.complaintType}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      issue.priorityLevel === 'High' ? 'bg-red-100 text-red-800' :
                      issue.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.priorityLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(issue.status)}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {issue.location}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(issue)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <FiEye className="mr-1" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

              {/* Attachment Section */}
              {selectedIssue.attachment && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Attachment</h4>
                  <div className="mt-1 flex items-center">
                    <a 
                      href={`${backendUrl}/${selectedIssue.attachment}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      View Attachment
                    </a>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Complaint Type</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.complaintType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                    <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedIssue.priorityLevel === 'High' ? 'bg-red-100 text-red-800' :
                      selectedIssue.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedIssue.priorityLevel}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(selectedIssue.status)}`}>
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
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Submission Date</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedIssue.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Technical Officer Comments */}
                {(selectedIssue.status === 'In Progress' || selectedIssue.status === 'Resolved' || selectedIssue.comment) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Activity Log</h4>
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
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                          {status}
                                        </span>
                                      )}
                                    </div>
                                    {timestamp && (
                                      <span className="text-xs text-gray-500">
                                        {timestamp.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                                    {isStatusUpdate ? commentText.replace(/^Status updated to [^:]+:?\s*/i, '') : commentText}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No activity log available</p>
                      )}
                    </div>
                  </div>
                )} 
              
              {/* Approval/Rejection Comments */}
              {(selectedIssue.status === 'Rejected by DC' || 
                selectedIssue.status === 'Issue approved by Super Admin' ||
                selectedIssue.status === 'Issue rejected by Super Admin') && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Approval Details</h4>
                  <div className="space-y-4">
                    {(selectedIssue.approvals || [])
                      .filter(approval => {
                        if (!approval) return false;
                        return (
                          (selectedIssue.status === 'Rejected by DC' && approval.approvalLevel === 'dc') ||
                          (selectedIssue.status.includes('Super Admin') && approval.approvalLevel === 'superuser')
                        );
                      })
                      .map((approval, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {approval.approvalLevel === 'dc' ? 'DC Approval' : 'Super Admin Approval'}
                              </p>
                              {approval.comment && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {approval.comment}
                                </p>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              approval.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {approval.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            {new Date(approval.approvedAt).toLocaleString()} by {approval.approver?.username || 'System'}
                          </p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
                
              {selectedIssue.assignedTo && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Assigned To</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedIssue.assignedTo.username} ({selectedIssue.assignedTo.email})
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;