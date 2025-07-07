import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FiTrash2, FiEye, FiChevronLeft, FiChevronRight, FiEdit2 } from 'react-icons/fi'; 
import axios from 'axios';
import { toast } from 'react-toastify';
import IssueDetailsModal from './IssueDetailsModal';
import IssueSubmit from './issuesubmit.tsx';
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
  attachment: string | null;
  underWarranty: boolean;
  comment?: string;
}

interface IssueTableProps {
  issues: Issue[];
  filterStatus: 'All' | 'Pending' | 'Approved' | 'Rejected';
  setDeleteConfirm: (confirm: { open: boolean; issue: Issue | null }) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  fetchIssues: () => Promise<void>;
}

const IssueTable = ({
  issues,
  filterStatus,
  setDeleteConfirm,
  getStatusColor,
  getPriorityColor,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  fetchIssues,
}: IssueTableProps) => {
  const appContext = useContext(AppContext);
  if (!appContext) throw new Error('AppContext is not available');
  const { backendUrl } = appContext;
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [districtMap, setDistrictMap] = useState<Record<string, string>>({});
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
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

  // Filter issues based on status
  useEffect(() => {
    // Log all unique status values in the issues array
    const uniqueStatuses = [...new Set(issues.map(i => i.status))];
    console.log('All unique statuses in issues:', uniqueStatuses);
    console.log('Current filter status:', filterStatus);
    
    let filtered = [...issues];
    
    if (filterStatus === 'Pending') {
      filtered = filtered.filter(issue => issue.status === 'Pending' || issue.status === 'Pending Approval');
    } else if (filterStatus === 'Approved') {
      const approvedStatuses = [
        'Approved',
        'Approved by Super Admin',
        'DC Approved',
        'Issue approved by Super Admin',
        'Super User Approved',
        'Super Admin Approved'
      ];
      console.log('Approved statuses being checked:', approvedStatuses);
      filtered = filtered.filter(issue => approvedStatuses.includes(issue.status));
      console.log('Filtered approved issues:', filtered);
    } else if (filterStatus === 'Rejected') {
      filtered = filtered.filter(issue => [
        'Rejected', 
        'Rejected by DC', 
        'Rejected by Super Admin', 
        'Issue rejected by Super Admin'
      ].includes(issue.status));
    }
    
    setFilteredIssues(filtered);
    const total = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(total || 1);
    
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [issues, filterStatus, currentPage, itemsPerPage, setCurrentPage]);
  
  // Get current issues for pagination
  const indexOfLastIssue = currentPage * itemsPerPage;
  const indexOfFirstIssue = indexOfLastIssue - itemsPerPage;
  const currentIssues = filteredIssues.slice(indexOfFirstIssue, indexOfLastIssue);
  
  // Change page
  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  const handleViewDetails = (issue: Issue) => {
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
            {currentIssues.length > 0 ? (
              currentIssues.map((issue) => (
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
                      {issue.status}
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
                        <FiEye size={18} />
                      </button>
                      {issue.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleEditIssue(issue)}
                            className="text-[#4d1a57] hover:text-[#3a1340] transition-colors duration-200 p-1.5 rounded-full hover:bg-purple-50"
                            title="Edit Issue"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ open: true, issue })}
                            className="text-red-500 hover:text-red-600 transition-colors duration-200 p-1.5 rounded-full hover:bg-red-50"
                            title="Delete Issue"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </>
                      )}
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
      
      {totalPages > 1 && (
        <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-md"
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstIssue + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastIssue, filteredIssues.length)}
                </span>{' '}
                of <span className="font-medium">{filteredIssues.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-gradient-to-r from-purple-600 to-purple-800 text-white border-purple-700 shadow-md'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:bg-opacity-50'
                      } transition-colors duration-200`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <span className="sr-only">Next</span>
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedIssue && (
        <IssueDetailsModal
          issue={selectedIssue}
          onClose={() => setShowDetailsModal(false)}
          onReopen={handleReopenIssue}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />
      )}
    </div>
  );
};

export default IssueTable;
