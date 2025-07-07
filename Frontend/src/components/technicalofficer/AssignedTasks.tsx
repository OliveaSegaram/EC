import { useEffect, useState, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiEdit, FiClock, FiX, FiInfo, FiCheck, FiTool } from 'react-icons/fi';
import { AppContext } from '../../provider/AppContext';
import { ISSUE_STATUS } from '../../constants/issueStatuses';
import axios from 'axios';
import Button from '../ui/buttons/Button';

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

const AssignedTasks = () => {
  const { t } = useTranslation();
  const { backendUrl } = useContext(AppContext);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  type StatusType = typeof ISSUE_STATUS.IN_PROGRESS | typeof ISSUE_STATUS.RESOLVED | typeof ISSUE_STATUS.ADD_TO_PROCUREMENT | 'Procurement' | 'Add to Procurement';
  const [status, setStatus] = useState<StatusType>(ISSUE_STATUS.IN_PROGRESS);
  const [comment, setComment] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [districts, setDistricts] = useState<Record<string, string>>({});

  interface UpdateRequestData {
    comment: string;
    resolutionDetails?: string;
    procurementDetails?: string;
    status?: string;
  }

  useEffect(() => {
    fetchAssignedIssues();
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${backendUrl}/districts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        const districtsMap = response.data.reduce((acc: Record<string, string>, district: any) => {
          acc[district.id] = district.name;
          return acc;
        }, {});
        setDistricts(districtsMap);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const getDistrictName = (locationId: string) => {
    return districts[locationId] || locationId; // Return district name or fallback to ID if not found
  };

  // Update filtered issues when issues or activeFilter changes
  useEffect(() => {
    console.log('Updating filtered issues. Active filter:', activeFilter);
    console.log('All issues:', issues.map(i => ({ id: i.id, status: i.status })));

    let result = [...issues];

    // Apply active filter if any
    if (activeFilter === 'Resolved' || activeFilter === 'Reopened') {
      // Show both Resolved and Reopened issues
      result = result.filter(issue => {
        const normalizedStatus = issue.status.toLowerCase();
        const matches = 
          normalizedStatus.includes('resolved') || 
          normalizedStatus.includes('reopened');

        console.log(`Issue ${issue.id} (${issue.status}): ${matches ? 'INCLUDED' : 'excluded'}`);
        return matches;
      });
    } else if (activeFilter === 'Assigned to Technician') {
      // Handle assigned issues (might be 'Assigned to Technical Officer' or similar)
      result = result.filter(issue => {
        const normalizedStatus = issue.status.toLowerCase();
        const matches = 
          normalizedStatus.includes('assigned') || 
          normalizedStatus.includes('assigned to technician');

        console.log(`Issue ${issue.id} (${issue.status}): ${matches ? 'INCLUDED' : 'excluded'}`);
        return matches;
      });
    } else if (activeFilter) {
      // Show only the selected status (case-insensitive match)
      result = result.filter(issue => {
        const normalizedStatus = issue.status.toLowerCase();
        const normalizedFilter = activeFilter.toLowerCase();
        const matches = normalizedStatus === normalizedFilter;

        console.log(`Issue ${issue.id} (${issue.status}): ${matches ? 'INCLUDED' : 'excluded'}`);
        return matches;
      });
    }

    console.log('Filtered result:', result.map(i => ({ id: i.id, status: i.status })));
    setFilteredIssues(result);
  }, [issues, activeFilter]);

  // Count issues by status, normalizing status names
  const statusCounts = issues.reduce((acc, issue) => {
    let status = issue.status;
    // Normalize status names for counting
    if (status.includes('Assigned') || status.includes('assigned')) {
      status = 'Assigned to Technician';
    } else if (status === 'Completed' || status === 'Resolved') {
      status = 'Resolved'; 
    } else if (status === 'Reopened') {
      status = 'Reopened';
    }
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);


  const fetchAssignedIssues = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      let responseData;
      let response;

      // First try to get all assigned issues including resolved ones
      try {
        response = await fetch(`${backendUrl}/issues/assigned`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to fetch assigned tasks');
        }
      } catch (error) {
        console.log('Primary endpoint failed, trying fallback...', error);
        // Fall back to the original endpoint
        const fallbackResponse = await fetch(`${backendUrl}/assignments/my-issues`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!fallbackResponse.ok) {
          const errorData = await fallbackResponse.json();
          throw new Error(errorData.message || 'Failed to fetch assigned tasks');
        }

        responseData = await fallbackResponse.json();
      }

      setIssues(responseData.issues || []);

      if (responseData.issues?.length === 0) {
        toast.info(t('noTasksAssigned'));
      }

    } catch (error: any) {
      console.error('Error fetching assigned tasks:', error);

      let errorMessage = t('fetchTasksError');
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMessage = t('sessionExpired');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { autoClose: 5000 });
    }
  }, [backendUrl]);

  const handleOpenModal = (issue: Issue) => {
    setSelectedIssue(issue);
    // Ensure the status is one of the allowed values
    const issueStatus = issue.status as StatusType;
    setStatus(issueStatus);
    setComment(''); // Clear the comment field when opening the modal
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedIssue) return;

    const toastId = toast.loading(t('updatingStatus'));

    try {
      let endpoint = '';
      let requestData: UpdateRequestData = { 
        comment: status === 'Procurement' ? `[Procurement Request] ${comment}` : comment
      };
      let newStatus = status;
      
      // Determine which endpoint to use based on status
      if (status === ISSUE_STATUS.IN_PROGRESS) {
        endpoint = `${backendUrl}/assignments/${selectedIssue.id}/start`;
        newStatus = ISSUE_STATUS.IN_PROGRESS;
      } else if (status === ISSUE_STATUS.RESOLVED) {
        endpoint = `${backendUrl}/assignments/${selectedIssue.id}/resolve`;
        requestData = { ...requestData, resolutionDetails: comment };
        newStatus = ISSUE_STATUS.RESOLVED;
      } else if (status === 'Procurement' || status === 'Add to Procurement' || status === ISSUE_STATUS.ADD_TO_PROCUREMENT) {
        endpoint = `${backendUrl}/updates/${selectedIssue.id}/update`;
        requestData = { ...requestData, status: ISSUE_STATUS.ADD_TO_PROCUREMENT };
        newStatus = ISSUE_STATUS.ADD_TO_PROCUREMENT;
      } else {
        throw new Error(t('invalidStatus'));
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Update local state immediately for better UX
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === selectedIssue.id 
            ? { ...issue, status: newStatus, comment: comment || issue.comment }
            : issue
        )
      );

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        // Revert local state if the server update fails
        setIssues(prevIssues => 
          prevIssues.map(issue => 
            issue.id === selectedIssue.id 
              ? { ...issue, status: selectedIssue.status }
              : issue
          )
        );
        throw new Error(responseData.message || t('updateStatusError'));
      }

      toast.success(t('statusUpdatedSuccess'), { autoClose: 2000 });
      
      // Close the modal and refresh the list to ensure we have the latest data
      setShowModal(false);
      fetchAssignedIssues();
      
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      let errorMessage = t('updateStatusError');
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMessage = t('sessionExpired');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      toast.dismiss(toastId);
    }
  };

  const getStatusColor = (status: string) => {
    return ISSUE_STATUS.getStatusColor(status);
  };

  return (
    <div className="p-6">
      <div className="bg-transparent">
        {/*<div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
         <h2 className="text-lg font-semibold text-gray-800">Assigned Tasks</h2>
        </div>*/}
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-3 py-3 max-w-4xl mx-auto">
          {/* Assigned to Technician Card */}
          <div 
            className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-sm shadow-sm border-2 ${
              activeFilter === 'Assigned to Technician' 
                ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-lg shadow-blue-100/50' 
                : 'bg-white/90 border-gray-200 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/50 backdrop-blur-sm'
            }`}
            onClick={() => setActiveFilter(activeFilter === 'Assigned to Technician' ? null : 'Assigned to Technician')}
          >
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-lg ${
                activeFilter === 'Assigned to Technician'
                  ? 'bg-blue-600/10 text-blue-600'
                  : 'bg-blue-50 text-blue-500'
              }`}>
                <FiTool className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">{t('assigned')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{t('waitingToStart')}</p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">{t('lastUpdated')}</span>
                <span className="text-[11px] font-medium text-gray-700">Just now</span>
              </div>
            </div>
          </div>

          {/* In Progress Card */}
          <div 
            className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-sm shadow-sm border-2 ${
              activeFilter === 'In Progress' 
                ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-lg shadow-amber-100/50' 
                : 'bg-white/90 border-gray-200 hover:border-amber-200 hover:shadow-md hover:shadow-amber-50/50 backdrop-blur-sm'
            }`}
            onClick={() => setActiveFilter(activeFilter === 'In Progress' ? null : 'In Progress')}
          >
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-lg ${
                activeFilter === 'In Progress'
                  ? 'bg-amber-600/10 text-amber-600'
                  : 'bg-amber-50 text-amber-500'
              }`}>
                <FiClock className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">{t('inProgress')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{t('currentlyWorking')}</p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">{t('activeTasks')}</span>
                <span className="text-[11px] font-medium text-gray-700">{statusCounts['In Progress'] || 0} ongoing</span>
              </div>
            </div>
          </div>

          {/* Completed Card - Shows Resolved + Reopened */}
          <div 
            className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-sm shadow-sm border-2 ${
              activeFilter === 'Resolved' || activeFilter === 'Reopened'
                ? 'bg-gradient-to-br from-green-50 to-white border-green-200 shadow-lg shadow-green-100/50' 
                : 'bg-white/90 border-gray-200 hover:border-green-200 hover:shadow-md hover:shadow-green-50/50 backdrop-blur-sm'
            }`}
            onClick={() => {
              if (activeFilter === 'Resolved' || activeFilter === 'Reopened') {
                setActiveFilter(null);
              } else {
                setActiveFilter('Resolved');
              }
            }}
          >
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-lg ${
                activeFilter === 'Resolved' || activeFilter === 'Reopened'
                  ? 'bg-green-600/10 text-green-600'
                  : 'bg-green-50 text-green-500'
              }`}>
                <FiCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">{t('resolved')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{t('completedTasksOverview')}</p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[11px] text-gray-500 mb-0.5">{t('resolved')}</span>
                  <span className="text-xs font-medium text-green-700">{statusCounts['Resolved'] || 0}</span>
                </div>
                {statusCounts['Reopened'] > 0 && (
                  <div>
                    <span className="block text-[11px] text-gray-500 mb-0.5">{t('reopened')}</span>
                    <span className="text-sm font-medium text-amber-700">{statusCounts['Reopened']}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* No issues message */}
        {filteredIssues.length === 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiInfo className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {activeFilter 
                    ? t('noTasksWithStatus', { status: activeFilter })
                    : t('noTasksAssigned')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 overflow-x-auto bg-white shadow-md rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#4d1a57]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('issueId')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('type')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('description')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('priority')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('status')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('location')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('action')}</th>
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
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getDistrictName(issue.location)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenModal(issue)}
                      className="text-[#6e2f74] hover:text-white p-2 rounded-full hover:bg-[#6e2f74] transition-colors duration-200"
                      title={t('updateStatus')}
                    >
                      <FiEdit size={18} className="w-5 h-5" />
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden p-4">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] mx-auto p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{t('updateTaskStatus')}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                aria-label="Close modal"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t('description')}</h4>
                <p className="mt-1 text-gray-700">{selectedIssue.description}</p>
              </div>
              
              {/* Show approval/assignment note or previous comments */}
              {selectedIssue.comment && (
                <div className="p-4 bg-[#f5e6f8] border-l-4 border-[#884f97] rounded-r-lg shadow-sm">
                  <h4 className="text-sm font-medium text-[#5e2f63] mb-2">
                    {selectedIssue.status === 'Issue assigned by Super User' ? t('assignmentNote') : 
                     selectedIssue.status === 'Approved' ? t('approvalNote') : t('previousNote')}
                  </h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white/50 p-3 rounded-md">
                    {selectedIssue.comment}
                  </p>
                </div>
              )}
              
              {selectedIssue.attachment && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{t('attachment')}</h4>
                  <a 
                    href={selectedIssue.attachment.startsWith('http') 
                      ? selectedIssue.attachment 
                      : `${backendUrl}${selectedIssue.attachment.startsWith('/') ? '' : '/'}${selectedIssue.attachment}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-[#884f97] hover:text-[#6e3d74] hover:bg-purple-50 transition-colors duration-200"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-purple-100 text-[#884f97] group-hover:bg-purple-200 transition-colors duration-200">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </span>
                    {t('viewAttachment')}
                  </a>
                </div>
              )}
              
              {!['Resolved', 'resolved', 'Completed', 'completed'].includes(selectedIssue.status) ? (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t('comment')}</h4>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 mt-1"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={status === 'Procurement' || status === 'Add to Procurement' || status === ISSUE_STATUS.ADD_TO_PROCUREMENT
                        ? t('procurementDetailsPlaceholder')
                        : t('addCommentPlaceholder')}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      buttonText={ISSUE_STATUS.getDisplayName(ISSUE_STATUS.IN_PROGRESS)}
                      buttonStyle={1}
                      buttonColor={status === ISSUE_STATUS.IN_PROGRESS ? '#6E2F74' : '#6B7280'}
                      textColor={status === ISSUE_STATUS.IN_PROGRESS ? '#6E2F74' : '#6B7280'}
                      iconName="FiClock"
                      onClick={() => setStatus(ISSUE_STATUS.IN_PROGRESS)}
                      className={`text-sm font-medium px-3 py-1.5 ${status === ISSUE_STATUS.IN_PROGRESS ? 'ring-1 ring-offset-0 ring-purple-300' : ''}`}
                    />
                    <Button
                      buttonText={ISSUE_STATUS.getDisplayName(ISSUE_STATUS.RESOLVED)}
                      buttonStyle={1}
                      buttonColor={status === ISSUE_STATUS.RESOLVED ? '#6E2F74' : '#6B7280'}
                      textColor={status === ISSUE_STATUS.RESOLVED ? '#6E2F74' : '#6B7280'}
                      iconName="FiCheck"
                      onClick={() => setStatus(ISSUE_STATUS.RESOLVED)}
                      className={`text-sm font-medium px-3 py-1.5 ${status === ISSUE_STATUS.RESOLVED ? 'ring-1 ring-offset-0 ring-purple-300' : ''}`}
                    />
                    <Button
                      buttonText={ISSUE_STATUS.getDisplayName(ISSUE_STATUS.ADD_TO_PROCUREMENT)}
                      buttonStyle={1}
                      buttonColor={status === ISSUE_STATUS.ADD_TO_PROCUREMENT ? '#6E2F74' : '#6B7280'}
                      textColor={status === ISSUE_STATUS.ADD_TO_PROCUREMENT ? '#6E2F74' : '#6B7280'}
                      iconName="FiShoppingCart"
                      onClick={() => setStatus(ISSUE_STATUS.ADD_TO_PROCUREMENT)}
                      className={`text-sm font-medium px-3 py-1.5 ${status === ISSUE_STATUS.ADD_TO_PROCUREMENT ? 'ring-1 ring-offset-0 ring-purple-300' : ''}`}
                    />
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button
                      buttonText={t('updateStatus')}
                      buttonStyle={2}
                      buttonColor="#6E2F74"
                      textColor="white"
                      onClick={handleUpdateStatus}
                      className="px-8 py-2 text-md"
                    />
                  </div>
                </>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-600">{t('issueResolvedMessage')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedTasks;
