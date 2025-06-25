import { useEffect, useState, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiEdit } from 'react-icons/fi';
import { AppContext } from '../../provider/AppContext';

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
  const { backendUrl } = useContext(AppContext);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [status, setStatus] = useState('In Progress');
  const [comment, setComment] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  interface UpdateRequestData {
    comment: string;
    resolutionDetails?: string;
    procurementDetails?: string;
  }

  useEffect(() => {
    fetchAssignedIssues();
  }, []);

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
      status = 'Resolved'; // Combine Completed into Resolved
    } else if (status === 'Reopened') {
      status = 'Reopened';
    }
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total completed (resolved + reopened)
  const totalCompleted = (statusCounts['Resolved'] || 0) + (statusCounts['Reopened'] || 0);

  const fetchAssignedIssues = useCallback(async () => {
    const toastId = toast.loading('Fetching your assigned tasks...');

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

      console.log('Raw API response:', responseData);
      console.log('Issues with statuses:', responseData.issues?.map((i: any) => ({
        id: i.id,
        status: i.status,
        description: i.description
      })));

      setIssues(responseData.issues || []);

      // Log status counts for debugging
      const statusCounts = (responseData.issues || []).reduce((acc: any, issue: any) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, {});
      console.log('Status counts:', statusCounts);

      toast.update(toastId, {
        render: responseData.issues?.length 
          ? `Successfully loaded ${responseData.issues.length} tasks` 
          : 'No tasks assigned to you',
        type: 'success',
        isLoading: false,
        autoClose: 2000
      });

    } catch (error: any) {
      console.error('Error fetching assigned tasks:', error);

      let errorMessage = 'Failed to fetch assigned tasks';
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMessage = 'Session expired. Please log in again.';
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
    }
  }, [backendUrl]);

  const handleOpenModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setStatus(issue.status);
    setComment(issue.comment || '');
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedIssue) return;

    
    const toastId = toast.loading(`Updating status to ${status}...`);

    try {
      let endpoint = '';
      let requestData: UpdateRequestData = { 
        comment: status === 'Procurement' ? `[Procurement Request] ${comment}` : comment
      };
      let newStatus = status;
      
      // Determine which endpoint to use based on status
      if (status === 'In Progress') {
        endpoint = `${backendUrl}/assignments/${selectedIssue.id}/start`;
        newStatus = 'In Progress';
      } else if (status === 'Resolved') {
        endpoint = `${backendUrl}/assignments/${selectedIssue.id}/resolve`;
        requestData = { ...requestData, resolutionDetails: comment };
        newStatus = 'Resolved';
      } else if (status === 'Procurement') {
        endpoint = `${backendUrl}/assignments/${selectedIssue.id}/procurement`;
        newStatus = 'Procurement';
      } else {
        throw new Error('Invalid status');
      }

      console.log('Sending request to:', endpoint);
      console.log('Request data:', requestData);

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
      console.log('Update response:', responseData);
      
      if (!response.ok) {
        // Revert local state if the server update fails
        setIssues(prevIssues => 
          prevIssues.map(issue => 
            issue.id === selectedIssue.id 
              ? { ...issue, status: selectedIssue.status }
              : issue
          )
        );
        throw new Error(responseData.message || 'Failed to update status');
      }

      // Show success message
      toast.update(toastId, {
        render: responseData.message || 'Status updated successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });
      
      // Close the modal and refresh the list to ensure we have the latest data
      setShowModal(false);
      fetchAssignedIssues();
      
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      let errorMessage = 'Failed to update status';
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMessage = 'Session expired. Please log in again.';
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
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
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Assigned Tasks</h2>
        </div>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5">
          {/* Assigned to Technician Card */}
          <div 
            className={`p-5 rounded-lg cursor-pointer transition-all duration-200 border ${activeFilter === 'Assigned to Technician' 
              ? 'border-blue-400 shadow-lg bg-gradient-to-br from-blue-50 to-white' 
              : 'border-gray-100 bg-white hover:shadow-lg hover:border-blue-200 shadow-sm'}`}
            onClick={() => setActiveFilter(activeFilter === 'Assigned to Technician' ? null : 'Assigned to Technician')}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0111.357-3m1.764-3.643a5.5 5.5 0 010 7.286M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                {statusCounts['Assigned to Technician'] || 0} Tasks
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-800">Assigned</h3>
            <p className="mt-1.5 text-sm text-gray-500">Tasks waiting to be started</p>
          </div>

          {/* In Progress Card */}
          <div 
            className={`p-5 rounded-lg cursor-pointer transition-all duration-200 border ${activeFilter === 'In Progress' 
              ? 'border-amber-400 shadow-lg bg-gradient-to-br from-amber-50 to-white' 
              : 'border-gray-100 bg-white hover:shadow-lg hover:border-amber-200 shadow-sm'}`}
            onClick={() => setActiveFilter(activeFilter === 'In Progress' ? null : 'In Progress')}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-500 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                {statusCounts['In Progress'] || 0} In Progress
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-800">In Progress</h3>
            <p className="mt-1.5 text-sm text-gray-500">Tasks currently being worked on</p>
          </div>

          {/* Completed Card - Shows Resolved + Reopened */}
          <div 
            className={`p-5 rounded-lg cursor-pointer transition-all duration-200 border ${activeFilter === 'Resolved' || activeFilter === 'Reopened'
              ? 'border-green-400 shadow-lg bg-gradient-to-br from-green-50 to-white' 
              : 'border-gray-100 bg-white hover:shadow-lg hover:border-green-200 shadow-sm'}`}
            onClick={() => {
              if (activeFilter === 'Resolved' || activeFilter === 'Reopened') {
                setActiveFilter(null);
              } else {
                setActiveFilter('Resolved');
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-green-50 text-green-500 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                {totalCompleted} Total
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-800">Resolved Tasks</h3>
            <p className="mt-1.5 text-sm text-gray-500">Tasks that are resolved or need review</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                {statusCounts['Resolved'] || 0} Resolved
              </span>
              {statusCounts['Reopened'] > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  {statusCounts['Reopened']} Reopened
                </span>
              )}
            </div>
          </div>
        </div>

        {/* No issues message */}
        {filteredIssues.length === 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {activeFilter 
                    ? `No tasks found with status "${activeFilter}"`
                    : 'No tasks assigned to you yet'}
                </p>
              </div>
            </div>
          </div>
        )}

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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-hidden">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] mx-auto p-6 overflow-y-auto">
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
              
              {/* Show approval/assignment note or previous comments */}
              {selectedIssue.comment && (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    {selectedIssue.status === 'Issue assigned by Super User' ? 'Assignment Note' : 
                     selectedIssue.status === 'Approved' ? 'Approval Note' : 'Previous Note'}
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedIssue.comment}
                  </p>
                </div>
              )}
              
              {selectedIssue.attachment && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Attachment</h4>
                  <a 
                    href={`${backendUrl}/${selectedIssue.attachment.replace(/^uploads\//, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    View Attachment
                  </a>
                </div>
              )}
              
              {!['Resolved', 'resolved', 'Completed', 'completed'].includes(selectedIssue.status) ? (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Comment</h4>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 mt-1"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={status === 'Procurement' 
                        ? 'Enter procurement details (e.g., required parts, estimated cost, etc.)' 
                        : 'Add your comment'}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-md border ${status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-400' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                      onClick={() => setStatus('In Progress')}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-md border ${status === 'Resolved' ? 'bg-green-100 text-green-800 border-green-400' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                      onClick={() => setStatus('Resolved')}
                    >
                      Resolved
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-md border ${status === 'Procurement' ? 'bg-blue-100 text-blue-800 border-blue-400' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                      onClick={() => setStatus('Procurement')}
                    >
                      Procurement
                    </button>
                  </div>
                  <button
                    className="w-full mt-4 bg-purple-700 text-white py-2 rounded-md hover:bg-purple-800 transition"
                    onClick={handleUpdateStatus}
                  >
                    Update
                  </button>
                </>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-600">This issue is marked as resolved and cannot be modified.</p>
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
