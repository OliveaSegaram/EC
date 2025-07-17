import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import IconMapper from '../ui/IconMapper';
import axios from 'axios';
import { toast } from 'react-toastify';
import IssueDetailsModal from './IssueDetailsModal';
import IssueSubmit from './issuesubmit.tsx';
import { AppContext } from '../../provider/AppContext';
import SimplePagination from '../common/SimplePagination';
import { useSimplePagination } from '../../hooks/useSimplePagination';
import { ISSUE_STATUS } from '../../constants/issueStatuses';

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
  comment?: string;
}

interface IssueTableProps {
  issues: Issue[];
  filterStatus: 'All' | 'Pending' | 'Approved' | 'Rejected';
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  fetchIssues: () => Promise<void>;
}

const IssueTable = ({
  issues,
  filterStatus,
  getStatusColor,
  getPriorityColor,
  fetchIssues,
}: IssueTableProps) => {
  const appContext = useContext(AppContext);
  if (!appContext) throw new Error('AppContext is not available');
  const { backendUrl } = appContext;
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [removedIssueIds, setRemovedIssueIds] = useState<number[]>([]);
  
  // Pagination
  const { paginatedItems, currentPage, totalPages, handlePageChange } = useSimplePagination(filteredIssues, 5);
  const [districtMap, setDistrictMap] = useState<Record<string, string>>({});
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean; issue: Issue | null}>({open: false, issue: null});
  const { t } = useTranslation();
  
  const handleEditIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    if (fetchIssues) {
      fetchIssues();
    }
  };
  
  // Handle reopening an issue
  const handleReopenIssue = async (issueId: number) => {
    if (isReopening) return; // Prevent multiple clicks
    
    setIsReopening(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await axios.post(
        `${backendUrl}/issues/${issueId}/reopen`,
        { 
          comment: 'Reopened and workflow restarted by Subject Clerk',
          timestamp: new Date().toISOString()
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 1000 // 10 seconds timeout
        }
      );
      
      if (response.status === 200) {
        // Success toast is now shown in the modal
        // Refresh the issues list
        if (fetchIssues) {
          await fetchIssues();
        }
        setShowDetailsModal(false);
      } else {
        throw new Error(response.data?.message || 'Failed to reopen issue');
      }
    } catch (error: unknown) {
      console.error('Error reopening issue:', error);
      let errorMessage = 'An unexpected error occurred';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.message || error.response.statusText || 'Failed to reopen issue';
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsReopening(false);
    }
  };

  // Show delete confirmation
  const showDeleteConfirm = (issue: Issue) => {
    setDeleteConfirm({ open: true, issue });
  };

  // Handle confirmed deletion (UI only)
  const handleUIRemove = () => {
    if (!deleteConfirm.issue) return;
    
    setRemovedIssueIds(prev => [...prev, deleteConfirm.issue!.id]);
    setDeleteConfirm({ open: false, issue: null });
    toast.success('Issue removed from view');
  };

  // Filter issues based on status and removed issues
  useEffect(() => {
    const filtered = issues.filter(issue => {
      // Skip removed issues
      if (removedIssueIds.includes(issue.id)) return false;
      
      // Apply status filter
      if (filterStatus === 'All') return true;
      if (filterStatus === 'Pending') {
        return issue.status === 'Pending' || issue.status === 'Pending Approval';
      } else if (filterStatus === 'Approved') {
        const approvedStatuses = [
          'Approved',
          'Approved by Super Admin',
          'DC Approved',
          'Issue approved by Super Admin',
          'Super User Approved',
          'Super Admin Approved'
        ];
        return approvedStatuses.includes(issue.status);
      } else if (filterStatus === 'Rejected') {
        return [
          'Rejected', 
          'Rejected by DC', 
          'Rejected by Super Admin', 
          'Issue rejected by Super Admin'
        ].includes(issue.status);
      }
      return false;
    });
    setFilteredIssues(filtered);
  }, [issues, filterStatus, removedIssueIds]);

  // Fetch district names for all unique district IDs in the issues
  useEffect(() => {
    const fetchDistrictNames = async () => {
      try {
        // Extract unique district IDs from issues
        const districtIds = Array.from(
          new Set(
            issues
              .map(issue => issue.location)
              .filter(loc => loc && !isNaN(Number(loc)))
          )
        );

        if (districtIds.length === 0) {
          setLoadingDistricts(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${backendUrl}/data/districts/by-ids`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { ids: districtIds.join(',') }
        });

        if (response.data?.districts) {
          const newDistrictMap: Record<string, string> = {};
          response.data.districts.forEach((district: { id: string; name: string }) => {
            newDistrictMap[district.id] = district.name;
          });
          setDistrictMap(newDistrictMap);
        }
      } catch (error) {
        console.error('Error fetching district names:', error);
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistrictNames();
  }, [issues]);

  // Function to get district name from ID
  const getDistrictName = (location: string) => {
    if (!location) return 'Not specified';
    if (location.startsWith('Colombo Head Office')) return location;
    if (!isNaN(Number(location)) && districtMap[location]) {
      return districtMap[location];
    }
    return location;
  };

  const handleViewDetails = (issue: Issue | null) => {
    setSelectedIssue(issue);
    setShowDetailsModal(true);
  };

  return (
    <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Edit Modal */}
      {showEditModal && selectedIssue && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-transparent w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 z-20 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-md"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <IssueSubmit 
              issueToEdit={selectedIssue} 
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditModal(false)}
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#4d1a57] bg-opacity-100">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('issueId')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('complaint')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('priority')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('status')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('submitted')}</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-purple-600 mr-2"></div>
                      #{issue.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="font-medium">{issue.complaintType}</div>
                    {issue.location && (
                      <div className="text-xs text-gray-500 mt-1">
                        {loadingDistricts ? t('loadingLocation') : getDistrictName(issue.location)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(issue.priorityLevel)}`}>
                      {issue.priorityLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                      {ISSUE_STATUS.getDisplayName(issue.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(issue.submittedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleViewDetails(issue)}
                        className="text-gray-500 hover:text-purple-600 transition-colors duration-200 p-1.5 rounded-full hover:bg-purple-50"
                        title="View Details"
                      >
                        <IconMapper iconName="Eye" iconSize={20} className="text-purple-600 hover:text-purple-800" />
                      </button>
                      {issue.status === 'Pending' && (
                        <button
                          onClick={() => handleEditIssue(issue)}
                          className="text-[#4d1a57] hover:text-[#3a1340] transition-colors duration-200 p-1.5 rounded-full hover:bg-purple-50"
                          title="Edit Issue"
                        >
                          <IconMapper iconName="Edit2" iconSize={20} className="text-blue-600 hover:text-blue-800" />
                        </button>
                      )}
                      <button
                        onClick={() => showDeleteConfirm(issue)}
                        className="text-red-500 hover:text-red-600 transition-colors duration-200 p-1.5 rounded-full hover:bg-red-50"
                        title="Remove from view"
                      >
                        <IconMapper iconName="Trash2" iconSize={20} className="text-red-500 hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="text-gray-400">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-500">{t('noIssuesFound')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-end mt-4">
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
      
      {showDetailsModal && selectedIssue && (
        <IssueDetailsModal
          issue={selectedIssue}
          onClose={() => setShowDetailsModal(false)}
          onReopen={handleReopenIssue}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />
      )}
      
      {/* Delete Confirmation Dialog with semi-transparent background */}
      {deleteConfirm.open && deleteConfirm.issue && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Remove Issue
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to remove this issue?
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleUIRemove}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false, issue: null })}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueTable;
