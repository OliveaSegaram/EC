import { useState, useEffect, useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiLayers, FiEye, FiUser, FiChevronDown, FiFileText } from 'react-icons/fi';
import Button from '../ui/buttons/Button';
import axios from 'axios';

import { toast } from 'react-toastify';
import { ISSUE_STATUS } from '../../constants/issueStatuses';
import { AppContext } from '../../provider/AppContext';
import ReportGenerator from '../ReportGenerator/ReportGenerator';

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
  comment?: string; // Add comment field
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
  const { backendUrl } = useContext(AppContext);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentComment, setCurrentComment] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [technicalOfficers, setTechnicalOfficers] = useState<TechnicalOfficer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<TechnicalOfficer | null>(null);
  const [showOfficerDropdown, setShowOfficerDropdown] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [overviewStats, setOverviewStats] = useState({
    totalIssues: 0,
    completedIssues: 0,
    underProcurementIssues: 0,
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
      
      const response = await axios.get(`${backendUrl}/issues/technical-officers/all`, {
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
      const userProfile = await axios.get(`${backendUrl}/auth/user-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const userDistrict = userProfile.data?.district || '';
      console.log('User district from profile:', userDistrict);

      // Fetch issues with district filter
      const response = await axios.get(`${backendUrl}/issues`, {
        params: { userDistrict },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data || !response.data.issues) {
        console.error('Invalid response format:', response.data);
        return;
      }

      // Filter issues to show in the dashboard
      const filteredIssues = response.data.issues.filter((issue: Issue) => {
        // For computer repair issues, show if status is 'under procurement', 'add to procurement' or 'super admin approved' but not 'resolved'
        if (issue.complaintType === 'Computer Repair') {
          return issue.status === 'Under Procurement' || 
                 issue.status === ISSUE_STATUS.ADD_TO_PROCUREMENT ||
                 issue.status === ISSUE_STATUS.SUPER_ADMIN_APPROVED;
        }
        // For other issue types, show only super admin approved or add to procurement
        return issue.status === ISSUE_STATUS.SUPER_ADMIN_APPROVED || 
               issue.status === ISSUE_STATUS.ADD_TO_PROCUREMENT;
      });
      
      setIssues(filteredIssues);
      
      // Update overview stats
      const allIssues = response.data.issues;
      setOverviewStats({
        totalIssues: allIssues.length,
        completedIssues: allIssues.filter((issue: Issue) => 
          issue.status === 'Completed' || issue.status === ISSUE_STATUS.RESOLVED
        ).length,
        underProcurementIssues: allIssues.filter((issue: Issue) => 
          issue.status === 'Under Procurement' || 
          issue.status === ISSUE_STATUS.ADD_TO_PROCUREMENT ||
          (issue.complaintType === 'Computer Repair' && issue.status === ISSUE_STATUS.SUPER_ADMIN_APPROVED)
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
    setCurrentComment(''); // Reset comment when opening modal
    setShowViewModal(true);
  };

  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowViewModal(false);
      }
    };

    if (showViewModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showViewModal]);

  const handleAssignIssue = async (issueId: number) => {
    if (!selectedOfficer || isAssigning) return;
    
    console.log('Starting assignment for issue:', issueId, 'to officer:', selectedOfficer);
    setIsAssigning(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const error = new Error('No authentication token found');
        console.error(error);
        toast.error('Authentication error. Please log in again.');
        return;
      }

      console.log('Making API call to assign technician...');
      const response = await axios.post(
        `${backendUrl}/issues/${issueId}/assign-technician`,
        { technicalOfficerId: selectedOfficer.id },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API Response:', response);

      // Check if the response indicates success (handling different response formats)
      const isSuccess = response.data && (response.data.success === true || response.data.message?.includes('assigned'));
      
      if (isSuccess) {
        console.log('Assignment successful, updating UI...');
        
        // Update the issue in the local state
        setIssues(prevIssues => 
          prevIssues.map(issue => 
            issue.id === issueId 
              ? { 
                  ...issue, 
                  status: 'Assigned to Technician',
                  assignedTo: selectedOfficer
                } 
              : issue
          )
        );
        
        // Show success message
        toast.success(t('issueAssignedSuccess'));
        
        // Close the modal and reset states after a short delay
        setTimeout(() => {
          setShowViewModal(false);
          setSelectedOfficer(null);
          setShowOfficerDropdown(false);
        }, 500);
      } else {
        const errorMessage = response.data?.message || 'Failed to assign issue';
        console.error('Assignment failed:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error in handleAssignIssue:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         t('assignIssueError');
      toast.error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };
  
  const handleOfficerSelect = (officer: TechnicalOfficer) => {
    setSelectedOfficer(officer);
    setShowOfficerDropdown(false);
  };

  const handleUpdateStatus = async (status: string, comment: string = '') => {
    if (!selectedIssue) return;
    
    try {
      setIsUpdatingStatus(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication error. Please log in again.');
        return;
      }

      // Log the status being sent
      console.log('Updating status to:', status);
      
      // Prepare the update data
      const updateData: any = { status };
      
      // Add comment if provided
      if (comment.trim()) {
        updateData.comment = comment;
      }
      
      console.log('Sending update data:', updateData);

      const response = await axios.put(
        `${backendUrl}/issues/${selectedIssue.id}`,
        updateData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.issue) {
        // Remove the issue from the list if it's completed
        if (status === 'Completed') {
          setIssues(prevIssues => 
            prevIssues.filter(issue => issue.id !== selectedIssue.id)
          );
        } else {
          // Update the issue in the list
          setIssues(prevIssues => 
            prevIssues.map(issue => 
              issue.id === selectedIssue.id 
                ? { ...issue, status, comment: comment || issue.comment }
                : issue
            )
          );
        }
        
        // Close the modal
        setShowViewModal(false);
        
        // Clear the input field
        setCurrentComment('');
        
        // Show success message
        toast.success(t('statusUpdatedSuccess'));
      } else {
        throw new Error(t('updateStatusError'));
    }
  } catch (error: any) {
    console.error(`Error updating status to ${status}:`, error);
    toast.error(error.response?.data?.message || `Failed to update status to ${status}`);
  } finally {
    setIsUpdatingStatus(false);
  }
};

  const isComputerRepairUnderWarranty = (issue: Issue): boolean => {
    return issue.complaintType === 'Computer Repair' && issue.underWarranty === true;
  };

  const isAddToProcurement = (issue: Issue): boolean => {
    return issue.status === 'Add to Procurement' || 
           issue.status === 'Add_To_Procurement' ||
           issue.status === 'Under Procurement';
  };

  const shouldShowTechnicianAssignment = (issue: Issue) => {
    return !isComputerRepairUnderWarranty(issue) && !isAddToProcurement(issue);
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
    <div className="container mx-auto py-4 px-4">
      <ReportGenerator 
        show={showReportModal} 
        onHide={() => setShowReportModal(false)} 
      />
      
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-md">
              <FiLayers size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">{t('totalIssues')}</h3>
              <p className="text-xl font-bold text-blue-600">{overviewStats.totalIssues}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className="bg-purple-100 text-purple-600 p-2 rounded-md">
              <FiCheckCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">{t('completed')}</h3>
              <p className="text-xl font-bold text-purple-600">{overviewStats.completedIssues}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className="bg-yellow-100 text-yellow-600 p-2 rounded-md">
              <FiLayers size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">{t('underProcurement')}</h3>
              <p className="text-xl font-bold text-yellow-600">{overviewStats.underProcurementIssues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">{t('allIssues')}</h2>
          <button 
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#4d1a57] hover:bg-[#3a1343] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4d1a57] text-sm"
          >
            <FiFileText className="mr-1" /> {t('generateReport')}
          </button>
        </div>
        <div className="overflow-x-auto rounded-t-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#4d1a57]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-normal">
                  {t('deviceId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-normal">
                  {t('type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-normal">
                  {t('priority')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-normal">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-normal">
                  {t('location')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-normal">
                  {t('actions')}
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
                      className="relative text-[#6e2f74] hover:text-[#6e2f74] flex items-center group transition-colors duration-200"
                      title="View Details"
                    >
                      <FiEye size={22} color="#6e2f74" />
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#6e2f74] group-hover:w-full transition-all duration-300"></span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-[#4d1a57] text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-white">{t('issueDetails')}</h2>
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

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t('complaintType')}</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.complaintType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t('priority')}</h4>
                    <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedIssue.priorityLevel)}`}>
                      {selectedIssue.priorityLevel}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t('status')}</h4>
                    <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedIssue.status)}`}>
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
                  {selectedIssue.attachment && (
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500">{t('attachment')}</h4>
                      <div className="mt-1 flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-50 rounded-md flex items-center justify-center">
                          <svg className="h-5 w-5 text-[#884f97]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <a 
                            href={`${backendUrl}/${selectedIssue.attachment}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[#884f97] hover:text-[#6e3d74] hover:underline transition-colors duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {t('viewAttachment')}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">{t('submittedBy')}</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedIssue.user?.username || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">{t('submissionDate')}</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedIssue.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combined Section for Warranty and Procurement */}
              {(selectedIssue && (isAddToProcurement(selectedIssue) || isComputerRepairUnderWarranty(selectedIssue))) && (
                <>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      {isComputerRepairUnderWarranty(selectedIssue) ? t('warrantyInformation') : t('procurementInformation')}
                    </h4>
                    
                    <div className="mb-4">
                      <label htmlFor="issue-comment" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('addNotes')}
                      </label>
                      <textarea
                        id="issue-comment"
                        rows={3}
                        className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                        placeholder={isComputerRepairUnderWarranty(selectedIssue) 
                          ? t('enterWarrantyNotes') 
                          : t('enterProcurementNotes')}
                        value={currentComment}
                        onChange={(e) => setCurrentComment(e.target.value)}
                        disabled={isUpdatingStatus}
                      />
                    </div>

                    <div className={`mt-4 p-3 rounded-md ${isComputerRepairUnderWarranty(selectedIssue) ? 'bg-purple-50' : 'bg-yellow-50'}`}>
                      <p className={`text-sm ${isComputerRepairUnderWarranty(selectedIssue) ? 'text-[#884f97]' : 'text-yellow-700'}`}>
                        <span className="font-medium">{t('note')}:</span> {
                          isComputerRepairUnderWarranty(selectedIssue)
                            ? t('warrantyNote')
                            : t('procurementNote')
                        }
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                      {((selectedIssue.status === 'Add to Procurement' || 
                         selectedIssue.status === 'Add_To_Procurement' ||
                         isComputerRepairUnderWarranty(selectedIssue)) && 
                         selectedIssue.status !== 'Under Procurement') && (
                        <Button
                          buttonText={isUpdatingStatus ? t('updating') : t('underProcurement')}
                          buttonStyle={1}
                          buttonColor="#6E2F74"
                          textColor="white"
                          iconName={isUpdatingStatus ? 'FiLoader' : 'FiShoppingCart'}
                          onClick={() => handleUpdateStatus('Under Procurement', currentComment)}
                          disabled={isUpdatingStatus}
                          className="px-4 py-2 text-sm mr-2"
                        />
                      )}
                      <Button
                        buttonText={isUpdatingStatus ? t('updating') : t('markAsCompleted')}
                        buttonStyle={2}
                        buttonColor="#6E2F74"
                        textColor="white"
                        iconName={isUpdatingStatus ? 'FiLoader' : 'FiCheck'}
                        onClick={() => handleUpdateStatus('Completed', currentComment)}
                        disabled={isUpdatingStatus}
                        className="px-4 py-2 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Technician Assignment Section - Only show for non-warranty computer repairs */}
              {selectedIssue && shouldShowTechnicianAssignment(selectedIssue) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="mb-4">
                    <label htmlFor="technical-officer" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('assignToTechnicalOfficer')}
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowOfficerDropdown(!showOfficerDropdown)}
                        className="relative w-full bg-white border-2 border-[#6E2F74] rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-2 focus:ring-[#8a3d91] focus:border-[#8a3d91] sm:text-sm transition-colors duration-200"
                      >
                        <span className="flex items-center">
                          <FiUser className="flex-shrink-0 h-5 w-5 text-[#6E2F74]" />
                          <span className="ml-3 block truncate text-gray-900">
                            {selectedOfficer ? selectedOfficer.username : t('selectTechnicalOfficer')}
                          </span>
                        </span>
                        <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <FiChevronDown className="h-5 w-5 text-[#6E2F74]" />
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
                            <div className="text-gray-500 py-2 pl-3">{t('noTechnicalOfficers')}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button
                      buttonText={isAssigning ? t('assigning') : `${t('assignTo')} ${selectedOfficer ? selectedOfficer.username.split(' ')[0] : t('technician')}`}
                      buttonStyle={2}
                      buttonColor="#6E2F74"
                      textColor="white"
                      iconName={isAssigning ? 'FiLoader' : 'FiUserPlus'}
                      onClick={() => handleAssignIssue(selectedIssue.id)}
                      disabled={!selectedOfficer || isAssigning}
                      className="px-4 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;