import { useEffect, useState, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import IconMapper from '../ui/IconMapper';
import { AppContext } from '../../provider/AppContext';
import { ISSUE_STATUS } from '../../constants/issueStatuses';
import Button from '../ui/buttons/Button';
import { useSimplePagination } from '../../hooks/useSimplePagination';
import SimplePagination from '../common/SimplePagination';

interface District {
  id?: string | number;
  name: string;
  districtName?: string; // Added to match the API response structure
}

interface Issue {
  id: number;
  deviceId: string;
  complaintType: string;
  description: string;
  priorityLevel: string;
  location: string | District | null;
  branch?: string; // Add branch information
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
  // Removed unused districts state as we're now getting location directly from the issue
  
  // Pagination
  const itemsPerPage = 5;
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedIssues,
    handlePageChange
  } = useSimplePagination(filteredIssues, itemsPerPage);

  interface UpdateRequestData {
    comment: string;
    resolutionDetails?: string;
    procurementDetails?: string;
    status?: string;
  }

  useEffect(() => {
    fetchAssignedIssues();
  }, []);

  // Removed fetchDistricts as we're now getting location directly from the issue

  const getDistrictName = (location: string | District | null, branch?: string): string => {
    console.log('getDistrictName called with location:', location, 'branch:', branch);
    
    let locationName = 'N/A';
    
    // Handle different location formats
    if (typeof location === 'string' && location.trim() !== '') {
      locationName = location;
    } else if (location && typeof location === 'object') {
      const district = location as District;
      locationName = district.name || district.districtName || 'N/A';
    }
    
    // Special handling for Colombo Head Office with branch information
    if ((locationName === 'Colombo Head Office' || locationName === 'Head Office' || locationName === 'Colombo') && branch) {
      return `Colombo Head Office - ${branch}`;
    }
    
    // For other locations, just return the location name
    return locationName;
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
    } else if (activeFilter === 'In Progress') {
      // Group 'In Progress', 'Add to Procurement', and 'Under Procurement' statuses together
      result = result.filter(issue => {
        const normalizedStatus = issue.status.toLowerCase();
        const matches = 
          normalizedStatus.includes('in progress') || 
          normalizedStatus.includes('add to procurement') ||
          normalizedStatus.includes('under procurement');

        console.log(`Issue ${issue.id} (${issue.status}): ${matches ? 'INCLUDED in In Progress' : 'excluded'}`);
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
    } else if (status === 'In Progress' || status === ISSUE_STATUS.ADD_TO_PROCUREMENT || status === 'Add to Procurement' || status === 'Under Procurement') {
      status = 'In Progress'; // Group these under In Progress
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

      // First try to get all assigned issues including resolved ones with district and branch info
      try {
        const response = await axios.get(`${backendUrl}/issues/assigned?include=district,branch`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        responseData = response.data;
      } catch (error) {
        console.log('Primary endpoint failed, trying fallback...', error);
        // Fall back to the original endpoint with district and branch info
        try {
          const fallbackResponse = await axios.get(`${backendUrl}/assignments/my-issues?include=district,branch`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          responseData = fallbackResponse.data;
        } catch (fallbackError: unknown) {
          const errorMessage = (fallbackError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch assigned tasks';
          throw new Error(errorMessage);
        }
      }

      // Process the issues to ensure consistent location format
      const processedIssues = (responseData.issues || []).map((issue: any) => {
        // If location is missing but district is present, use district as location
        const location = issue.location || (issue.district ? issue.district.name : 'N/A');
        
        // For Colombo Head Office, include branch information if available
        let displayLocation = location;
        if ((location === 'Colombo Head Office' || location === 'Head Office' || location === 'Colombo') && issue.branch) {
          displayLocation = `Colombo Head Office - ${issue.branch}`;
        }
        
        return {
          ...issue,
          location: displayLocation,
          branch: issue.branch || ''
        };
      });

      console.log('Processed issues with locations:', processedIssues);
      setIssues(processedIssues);

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

  // Function to extract and format timestamp from a string
  const extractAndFormatTimestamp = (text: string): { timestamp: string | null, content: string } => {
    if (!text) return { timestamp: null, content: text };
    
    // This regex matches ISO 8601 timestamps in the format YYYY-MM-DDTHH:mm:ss.sssZ
    const timestampRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)/;
    const match = text.match(timestampRegex);
    
    if (!match) return { timestamp: null, content: text };
    
    try {
      const date = new Date(match[0]);
      // Format as: "DD MMM, hh:mm a" (e.g., "09 Jul, 11:05 AM")
      const formattedTimestamp = date.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      // Remove any ' at ' before the timestamp and the timestamp itself
      const content = text
        .replace(new RegExp(`\\s*\\bat\\b\\s*${timestampRegex.source}`), '')
        .trim();
      
      return { timestamp: formattedTimestamp, content };
    } catch (e) {
      return { timestamp: null, content: text };
    }
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
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                activeFilter === 'Assigned to Technician'
                  ? 'bg-blue-200 text-blue-700'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <IconMapper iconName="User" iconSize={16} className="m-0 p-0" />
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
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                activeFilter === 'In Progress'
                  ? 'bg-amber-200 text-amber-700'
                  : 'bg-amber-100 text-amber-600'
              }`}>
                <IconMapper iconName="Clock" iconSize={16} className="animate-pulse" />
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
              <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                activeFilter === 'Resolved' || activeFilter === 'Reopened'
                  ? 'bg-green-200 text-green-700'
                  : 'bg-green-100 text-green-600'
              }`}>
                <IconMapper iconName="Check" iconSize={16} />
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
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100">
                <IconMapper iconName="Info" iconSize={20} iconColor="#2563EB" />
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
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('priority')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('status')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('location')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedIssues.map((issue) => (
                <tr key={issue.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">#{issue.id}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{issue.complaintType}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      issue.priorityLevel === 'High' ? 'bg-red-100 text-red-800' :
                      issue.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.priorityLevel}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(issue.status)}`}>{issue.status}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getDistrictName(issue.location, issue.branch)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenModal(issue)}
                      className="group p-2 rounded-full hover:bg-[#6e2f74] transition-colors duration-200"
                      title={t('updateStatus')}
                    >
                      <div className="relative">
                        <IconMapper 
                          iconName="Edit2" 
                          iconSize={20}
                          className="text-[#6e2f74] group-hover:!text-white transition-colors duration-200"
                        />
                      </div>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {filteredIssues.length > itemsPerPage && (
            <div className="flex justify-end px-6 py-3 border-t border-gray-200">
              <SimplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
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
                <IconMapper iconName="X" iconSize={20} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('deviceId')}</h4>
                  <p className="mt-1 text-gray-700 font-medium">{selectedIssue.deviceId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t('complaintType')}</h4>
                  <p className="mt-1 text-gray-700">{selectedIssue.complaintType}</p>
                </div>
              </div>
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
                  <div className="space-y-3">
                    {selectedIssue.comment.split('\n').filter(line => line.trim() !== '').map((line, index) => {
                      const { timestamp, content } = extractAndFormatTimestamp(line);
                      if (!content) return null;
                      
                      return (
                        <div key={index} className="bg-white/50 p-3 rounded-md border border-gray-100 shadow-sm relative">
                          {timestamp && (
                            <div className="absolute top-2 right-2">
                              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                {timestamp}
                              </span>
                            </div>
                          )}
                          <p className="text-sm text-gray-800 pr-16">
                            {content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
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
