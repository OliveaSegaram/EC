import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import IconMapper from '../ui/IconMapper';
import axios from 'axios';
import { AppContext } from '../../provider/AppContext';
import Button from '../ui/buttons/Button';
import SimplePagination from '../common/SimplePagination';
import { useSimplePagination } from '../../hooks/useSimplePagination';

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

type StatusFilter = 'all' | 'pending' | 'assigned' | 'under_procurement';

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
    assigned: 0,
    under_procurement: 0
  });

  const { backendUrl } = useContext(AppContext);
  const { t } = useTranslation();
  
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
    } else if (statusFilter === 'under_procurement') {
      return matchesSearch && issue.status === 'Under Procurement';
    }
    return matchesSearch;
  });
  
  // Pagination
  const itemsPerPage = 5;
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedIssues,
    handlePageChange
  } = useSimplePagination(filteredIssues, itemsPerPage);

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
            i.status === 'DC/AC Approved'
          ).length,
          under_procurement: issuesData.filter((i: Issue) => i.status === 'Under Procurement').length
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

  // Moved filteredIssues declaration to before useSimplePagination
  
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
        <h2 className="text-2xl font-semibold">{t('allIssues')}</h2>
        <div className="flex items-center space-x-4">
          <div className="relative w-56">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconMapper iconName="Search" iconSize={16} iconColor="#9CA3AF" />
            </div>
            <input
              type="text"
              placeholder={t('search')}
              className="block w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8a3d91] focus:border-transparent transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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
              {t('allLocations')}
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'colombo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('colombo')}
            >
              {t('colomboOnly')}
            </button>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === 'all' 
              ? 'bg-[#f3e8ff] text-[#8a3d91] border-2 border-[#8a3d91]' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'}`}
          >
            {t('all')} ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === 'pending' 
              ? 'bg-[#fdf2f8] text-[#8a3d91] border-2 border-[#8a3d91]' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'}`}
          >
            {t('pending')} ({stats.pending})
          </button>
          <button
            onClick={() => setStatusFilter('assigned')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === 'assigned' 
              ? 'bg-[#f0e7ff] text-[#8a3d91] border-2 border-[#8a3d91]' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'}`}
          >
            {t('assigned')} ({stats.assigned})
          </button>
          <button
            onClick={() => setStatusFilter('under_procurement')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusFilter === 'under_procurement' 
              ? 'bg-[#fdf2f8] text-[#8a3d91] border-2 border-[#8a3d91]' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'}`}
          >
            {t('underProcurement')} ({stats.under_procurement || 0})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-12">
          <IconMapper iconName="CheckCircle" iconSize={48} iconColor="#10B981" className="mx-auto mb-4" />
          <p className="text-gray-500">{t('noApprovedIssuesFound')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-t-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#4d1a57]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('id')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('type')}
                </th>

                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('priority')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('status')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('location')}
                </th>

                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t('actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedIssues.map((issue) => (
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
                      className="relative text-[#6e2f74] hover:text-[#6e2f74] flex items-center group transition-colors duration-200 px-3 py-1.5 -ml-2"
                    >
                      <IconMapper iconName="Eye" iconSize={22} iconColor="#6e2f74" marginRight={8} />
                      <span className="relative text-sm font-medium">{t('view')}</span>
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#6e2f74] group-hover:w-full transition-all duration-300"></span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {filteredIssues.length > itemsPerPage && (
            <div className="flex justify-end mt-4 px-6 py-3 border-t border-gray-200">
              <SimplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}

      {/* View Issue Modal */}
      {showViewModal && selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-[#4d1a57] text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white">{t('issueDetails')}</h3>
                  <p className="text-sm text-purple-100 mt-1">ID: #{selectedIssue.id}</p>
                </div>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-purple-200 hover:text-white focus:outline-none transition-colors duration-200"
                >
                  <span className="sr-only">{t('close')}</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="p-6">

              {/* Device ID and Complaint Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('deviceId')}</h4>
                  <p className="mt-1 text-sm font-medium text-gray-900">{selectedIssue.deviceId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('complaintType')}</h4>
                  <p className="mt-1 text-sm text-gray-900">{selectedIssue.complaintType}</p>
                </div>
              </div>

              {/* Attachment Section */}
              {selectedIssue.attachment && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{t('attachment')}</h4>
                  <div className="mt-1 flex items-center">
                    <a 
                      href={`${backendUrl}/${selectedIssue.attachment}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#884f97] hover:text-[#6e3d74] text-sm flex items-center transition-colors duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {t('viewAttachment')}
                    </a>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t('complaintType')}</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.complaintType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t('priority')}</h4>
                    <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedIssue.priorityLevel === 'High' ? 'bg-red-100 text-red-800' :
                      selectedIssue.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedIssue.priorityLevel}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t('status')}</h4>
                    <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(selectedIssue.status)}`}>
                      {selectedIssue.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t('location')}</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.location}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">{t('description')}</h4>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{selectedIssue.description}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">{t('submissionDate')}</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedIssue.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Technical Officer Comments */}
                {(selectedIssue.status === 'In Progress' || selectedIssue.status === 'Resolved' || selectedIssue.comment) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">{t('activityLog')}</h4>
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
                                <div className="flex-shrink-0">
                                  {isStatusUpdate ? (
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                      <IconMapper iconName="RefreshCw" iconSize={16} iconColor="#FFFFFF" />
                                    </div>
                                  ) : (
                                    <IconMapper iconName="MessageSquare" iconSize={20} iconColor="#a169b0" className="mt-1" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900">
                                        {isStatusUpdate ? t('statusUpdate') : t('comment')}
                                      </span>
                                      {status && (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                          {status}
                                        </span>
                                      )}
                                    </div>
                                    {timestamp && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(timestamp).toLocaleString()}
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
                        <p className="text-sm text-gray-500">{t('noActivityLog')}</p>
                      )}
                    </div>
                  </div>
                )} 
              
              {/* Approval/Rejection Comments */}
              {(selectedIssue.status === 'Rejected by DC/AC' || 
                selectedIssue.status === 'Issue approved by Super Admin' ||
                selectedIssue.status === 'Issue rejected by Super Admin') && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">{t('approvalDetails')}</h4>
                  <div className="space-y-4">
                    {(selectedIssue.approvals || [])
                      .filter(approval => {
                        if (!approval) return false;
                        return (
                          (selectedIssue.status === 'Rejected by DC/AC' && approval.approvalLevel === 'dc') ||
                          (selectedIssue.status.includes('Super Admin') && approval.approvalLevel === 'superuser')
                        );
                      })
                      .map((approval, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {approval.approvalLevel === 'dc' ? 'DC/AC Approval' : 'Super Admin Approval'}
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
                
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                <Button
                  buttonText={t('close')}
                  buttonStyle={1}
                  buttonColor="#6E2F74"
                  textColor="#6E2F74"
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-md"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;