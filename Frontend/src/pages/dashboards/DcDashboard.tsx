import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapPin } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../provider/AppContext';
import { toast } from 'react-toastify';
import { ISSUE_STATUS } from '../../constants/issueStatuses';

// Import components
import IssueDetails from '../../components/dc/IssueDetails';
import RejectCommentModal from '../../components/dc/RejectCommentModal';
import OverviewPanel from '../../components/dc/OverviewPanel';
import Layout from '../../components/layout/Layout';
import SimplePagination from '../../components/common/SimplePagination';
import { useSimplePagination } from '../../hooks/useSimplePagination';
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

const DCACDashboard = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues'>('overview');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const itemsPerPage = 10; // Number of items per page
  const { currentPage, totalPages, paginatedItems, handlePageChange } = useSimplePagination(issues, itemsPerPage);
  const [showModal, setShowModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentIssue, setCommentIssue] = useState<Issue | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [userDistrict, setUserDistrict] = useState<string>('');
  const [userDistrictId, setUserDistrictId] = useState<string>('');
  //const [username, setUsername] = useState<string>('');
  const { backendUrl } = useContext(AppContext);
  const { t } = useTranslation();
  
  // Handle sidebar selection
  const handleSidebarSelect = (index: number) => {
    setSelectedIndex(index);
    setActiveTab(index === 0 ? 'overview' : 'issues');
  };

  // Close dropdown when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // No need for showDropdown state anymore
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch user profile and set up the component
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Fetching user profile...');
      const response = await axios.get(`${backendUrl}/auth/user-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const userData = response.data;
      // console.log('User profile data:', userData);

      if (userData) {
        if (userData.district) {
          if (typeof userData.district === 'object' && userData.district.name) {
            setUserDistrict(userData.district.name);
            setUserDistrictId(userData.district.id || '');
          } else if (userData.districtId) {
            setUserDistrictId(userData.districtId);
          }
      } else {
        console.error('No username found in response');
      }
        } else if (userData.districtId) {
          setUserDistrictId(userData.districtId);
        }


    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error(t('sessionExpired'));
        navigate('/login');
      }
    }
  }, [navigate]);

  // Fetch issues with proper error handling and loading states
  const fetchIssues = useCallback(async (showSuccess = false) => {
    if (!userDistrictId) return;

    try {
      console.log('Fetching issues...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, redirecting to login');
        toast.error('Session expired. Please log in again.');
        navigate('/login');
        return;
      }

      console.log('Sending request to fetch issues for district ID:', userDistrictId);
      
      if (!userDistrictId) {
        throw new Error('No district ID available for this user');
      }

      const response = await axios.get(`${backendUrl}/issues`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Content-Type': 'application/json'
        },
        params: {
          userDistrict: userDistrictId
        }
      });

      console.log('Issues API response:', response);

      if (response.data) {
        console.log('Issues data received:', response.data);
        if (response.data.issues) {
          const normalizedIssues = response.data.issues.map((issue: any) => ({
            ...issue,
            status: Object.values(ISSUE_STATUS).includes(issue.status as any)
              ? issue.status
              : issue.status === 'Rejected'
                ? ISSUE_STATUS.DC_REJECTED
                : issue.status === 'Approved by DC'
                  ? ISSUE_STATUS.DC_APPROVED
                  : issue.status
          }));

          console.log('Setting normalized issues:', normalizedIssues);
          setIssues(normalizedIssues);
          
          if (showSuccess && normalizedIssues.length > 0) {
            toast.success(`Loaded ${normalizedIssues.length} issues`);
          }
        } else {
          console.warn('No issues array in response');
          setIssues([]);
        }
      } else {
        console.warn('No data in response');
        setIssues([]);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
      
      let errorMessage = 'An unexpected error occurred';
      let shouldLogout = false;

      if (axios.isAxiosError(error)) {
        if (error.response) {
          
          console.error('Error response data:', error.response.data);
          console.error('Error status:', error.response.status);
          
          if (error.response.status === 403) {
            errorMessage = 'Access denied. You do not have permission to view these issues.';
            shouldLogout = true;
          } else if (error.response.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
            shouldLogout = true;
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          } else {
            errorMessage = `Server error: ${error.response.status} ${error.response.statusText}`;
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Request setup error:', error.message);
          errorMessage = `Request error: ${error.message}`;
        }
      }

      console.error('Error details:', errorMessage);
      
      if (shouldLogout) {
        // Clear any existing auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(errorMessage);
      }
    }
  }, [userDistrictId, navigate]);

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Fetch issues when district ID changes
  useEffect(() => {
    if (userDistrictId) {
      fetchIssues(true); 
    }
  }, [userDistrictId]);

  const handleApproveIssue = useCallback(async (issueId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      await axios.post(
        `${backendUrl}/issues/${issueId}/approve-dc`,
        { comment: 'Approved by DC/AC' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the issue status locally
      setIssues(currentIssues => 
        currentIssues.map(issue => 
          issue.id === issueId 
            ? { ...issue, status: ISSUE_STATUS.DC_APPROVED, comment: 'Approved by DC/AC' } 
            : issue
        )
      );
      
      toast.success(t('issueApprovedSuccessfullt'));
      
      // Refresh issues to get the latest data without showing success toast
      await fetchIssues(false);
    } catch (error) {
      console.error('Error approving issue:', error);
      const errorMessage = axios.isAxiosError(error)
        ? (error.response?.data?.message || t('Failed to approve issue'))
        : t('unexpectedError');

      toast.error(errorMessage);

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [fetchIssues, navigate]);

  const handleRejectSubmit = async (issueId: number) => {
    if (!rejectComment.trim()) {
      toast.error(t('Please provide a reason for rejection'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${backendUrl}/issues/${issueId}/reject-dc`,
        { comment: rejectComment },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the issue status locally
      setIssues(issues.map(issue => 
        issue.id === issueId 
          ? { ...issue, status: ISSUE_STATUS.DC_REJECTED, comment: rejectComment } 
          : issue
      ));
      
      setShowCommentModal(false);
      setRejectComment('');
      setCommentIssue(null);
      toast.success(t('Issue rejected successfully'));
      
      // Refresh issues to get the latest data without showing success toast
      await fetchIssues(false);
    } catch (error) {
      console.error('Error rejecting issue:', error);
      toast.error(t('Failed to reject issue'));
    }
  };
  
  const openRejectCommentModal = (issue: Issue) => {
    setCommentIssue(issue);
    setShowCommentModal(true);
  };
  
  const showComment = (issue: Issue) => {
    setCommentIssue(issue);
    setShowCommentModal(true);
  };

  {/*const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };*/}

  const getStatusColor = (status: string) => {
    // Use the status color from the ISSUE_STATUS constants if available
    try {
      return ISSUE_STATUS.getStatusColor(status);
    } catch (e) {
      console.warn(`No color mapping found for status: ${status}`);
      // Fallback to legacy status handling for backward compatibility
      const statusLower = status.toLowerCase();

      if (statusLower.includes('reject') || statusLower.includes('decline')) {
        return 'bg-red-100 text-red-800';
      }

      // If not found in constants, use the old switch cases as fallback
      switch (status) {
        case 'Pending':
        case 'Pending Approval':
          return 'bg-yellow-100 text-yellow-800';
        case 'DC Approved':
        case 'Issue approved by DC':
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
          return 'bg-red-100 text-red-800';
        case 'Completed':
        case 'Resolved':
          return 'bg-purple-100 text-purple-800';
        case 'Closed':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
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
    <Layout 
      title={t('dcAcDashboard')}
      dashboardType="default"
      onSidebarSelect={handleSidebarSelect}
      selectedIndex={selectedIndex}
      onSelectedIndexChange={setSelectedIndex}
      customSidebarItems={[
        { linkName: t('overview'), icon: 'Grid' }, // FiGrid
        { linkName: t('issues'), icon: 'List' }     // FiList
      ]}
    >
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* District Badge */}
        {userDistrict && (
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              <FaMapPin className="mr-1.5 h-4 w-4" />
              {t('districtBadge', { district: userDistrict })}
            </span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <OverviewPanel
            issues={issues}
            handleApproveIssue={handleApproveIssue}
            openRejectCommentModal={openRejectCommentModal}
            showComment={showComment}
            setSelectedIssue={setSelectedIssue}
            setShowModal={setShowModal}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
          />
        ) : (
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="overflow-x-auto rounded-t-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#4d1a57]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('id')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('deviceId')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('complaint')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('priority')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((issue) => (
                        <tr key={issue.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.deviceId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.complaintType}</td>
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
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                              {issue.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedIssue(issue);
                                setShowModal(true);
                              }}
                              className="relative text-[#6e2f74] hover:text-[#6e2f74] mr-3 group transition-all duration-200"
                            >
                              <span className="relative z-10">{t('view')}</span>
                              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#6e2f74] group-hover:w-full transition-all duration-300"></span>
                            </button>
                            {issue.status === 'New' && (
                              <>
                                <button
                                  onClick={() => handleApproveIssue(issue.id)}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                >
                                  {t('approveAction')}
                                </button>
                                <button
                                  onClick={() => openRejectCommentModal(issue)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  {t('rejectAction')}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          {t('noIssuesFound')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {issues.length > 0 && (
                  <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      {t('showingXofY', { x: paginatedItems.length, y: issues.length })}
                    </div>
                    {totalPages > 1 && (
                      <SimplePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        className="mt-4"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Issue Details Modal */}
      {showModal && selectedIssue && (
        <IssueDetails
          selectedIssue={selectedIssue}
          showModal={showModal}
          setShowModal={setShowModal}
          setSelectedIssue={setSelectedIssue}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          handleApproveIssue={handleApproveIssue}
          openRejectCommentModal={openRejectCommentModal}
          isDashboardView={activeTab === 'overview'}
        />
      )}

      {/* Comment/Reject Modal */}
      <RejectCommentModal
        showCommentModal={showCommentModal}
        commentIssue={commentIssue}
        rejectComment={rejectComment}
        setRejectComment={setRejectComment}
        setShowCommentModal={setShowCommentModal}
        handleRejectIssue={handleRejectSubmit}
      />
    </Layout>
  );
};

export default DCACDashboard;