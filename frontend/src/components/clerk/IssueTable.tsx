import React, { useState, useEffect } from 'react';
import { FiTrash2, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi'; // Removed unused: FiEdit2
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import IssueDetailsModal from './IssueDetailsModal';

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

const IssueTable: React.FC<IssueTableProps> = ({
  issues,
  filterStatus,
  setDeleteConfirm,
  getStatusColor,
  getPriorityColor,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  fetchIssues,
}) => {
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [districtMap, setDistrictMap] = useState<Record<string, string>>({});
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [, setIsReopening] = useState(false);
  
  // Handle reopening an issue
  const handleReopenIssue = async (issueId: number) => {
    if (!window.confirm('Are you sure you want to reopen this issue?')) return;
    
    setIsReopening(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/issues/${issueId}/reopen`,
        { comment: 'Reopened by Subject Clerk' },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      toast.success('Issue reopened successfully');
      // Refresh the issues list
      if (fetchIssues) {
        await fetchIssues();
      }
      setShowDetailsModal(false);
    } catch (error: unknown) {
      console.error('Error reopening issue:', error);
      const errorMessage = error instanceof AxiosError 
        ? error.response?.data?.message || 'Failed to reopen issue'
        : 'An unexpected error occurred';
      toast.error(errorMessage);
    } finally {
      setIsReopening(false);
    }
  };

  // Filter issues based on status
  useEffect(() => {
    let filtered = [...issues];
    
    if (filterStatus === 'Pending') {
      filtered = filtered.filter(issue => issue.status === 'Pending');
    } else if (filterStatus === 'Approved') {
      filtered = filtered.filter(issue => issue.status === 'Approved');
    } else if (filterStatus === 'Rejected') {
      filtered = filtered.filter(issue => issue.status === 'Rejected');
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

        const response = await axios.get('http://localhost:5000/api/data/districts/by-ids', {
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue ID</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Complaint</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
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
                        {loadingDistricts ? 'Loading location...' : getDistrictName(issue.location)}
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
                        <button
                          onClick={() => setDeleteConfirm({ open: true, issue })}
                          className="text-red-500 hover:text-red-600 transition-colors duration-200 p-1.5 rounded-full hover:bg-red-50"
                          title="Delete Issue"
                        >
                          <FiTrash2 size={18} />
                        </button>
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
                    <p className="mt-2 text-sm font-medium text-gray-500">No issues found</p>
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
