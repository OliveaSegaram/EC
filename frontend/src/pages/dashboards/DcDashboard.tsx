import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiAlertCircle, FiLogOut, FiBell, FiMapPin, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import axios from 'axios';
import userAvatar from '../../assets/icons/login/User.svg';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ISSUE_STATUS } from '../../constants/issueStatuses';

// Import components
import IssueTable from '../../components/dc/IssueTable';
import IssueDetails from '../../components/dc/IssueDetails';
import RejectCommentModal from '../../components/dc/RejectCommentModal';
import OverviewPanel from '../../components/dc/OverviewPanel';

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

const DCDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found');
          return;
        }

        console.log('Fetching user profile...');
        const response = await fetch('http://localhost:5000/api/auth/user-profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response from server:', errorData);
          return;
        }

        const userData = await response.json();
        console.log('User profile data:', userData);
        
        if (userData && userData.username) {
          setUsername(userData.username);
          console.log('Username set to:', userData.username);
        } else {
          console.error('No username found in response');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'issues'>('overview');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentIssue, setCommentIssue] = useState<Issue | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [userDistrict, setUserDistrict] = useState<string>('');
  const [userDistrictId, setUserDistrictId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userDistrictId) {
      fetchIssues();
    }
  }, [userDistrictId]);
  
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/auth/user-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        // Handle both string and object district formats
        const district = response.data.district;
        if (district && typeof district === 'object' && district.name) {
          setUserDistrict(district.name);
          setUserDistrictId(district.id || '');
        } else {
          setUserDistrict(district || '');
          // If district is a string, we need to get the ID from the user object
          if (response.data.districtId) {
            setUserDistrictId(response.data.districtId);
          }
        }
        setUserName(response.data.username || '');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchIssues = async () => {
    const toastId = toast.loading('Fetching issues...');
    try {
      console.log('Fetching issues...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, redirecting to login');
        toast.update(toastId, {
          render: 'Session expired. Please log in again.',
          type: 'error',
          isLoading: false,
          autoClose: 3000,
          closeButton: true
        });
        navigate('/login');
        return;
      }

      if (!userDistrictId) {
        console.error('No district ID available');
        toast.update(toastId, {
          render: 'Error: District information not available',
          type: 'error',
          isLoading: false,
          autoClose: 3000,
          closeButton: true
        });
        return;
      }

      console.log('Sending request to fetch issues for district ID:', userDistrictId);
      const response = await axios.get(`http://localhost:5000/api/issues?userDistrict=${userDistrictId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log('Issues API response:', response);
      
      if (response.data) {
        console.log('Issues data received:', response.data);
        if (response.data.issues) {
          // Map statuses to ensure they match our constants
          const normalizedIssues = response.data.issues.map((issue: any) => ({
            ...issue,
            // Ensure status matches one of our constants
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
          
          toast.update(toastId, {
            render: 'Issues loaded successfully',
            type: 'success',
            isLoading: false,
            autoClose: 2000,
            closeButton: true
          });
        } else {
          console.warn('No issues array in response');
          setIssues([]);
          toast.update(toastId, {
            render: 'No issues found',
            type: 'info',
            isLoading: false,
            autoClose: 2000,
            closeButton: true
          });
        }
      } else {
        console.warn('No data in response');
        setIssues([]);
        toast.update(toastId, {
          render: 'No data received from server',
          type: 'warning',
          isLoading: false,
          autoClose: 3000,
          closeButton: true
        });
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
      const errorMessage = axios.isAxiosError(error) 
        ? (error.response?.data?.message || 'Failed to fetch issues')
        : 'An unexpected error occurred';
      
      toast.update(toastId, {
        render: `Error: ${errorMessage}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        closeButton: true
      });
    }
  };

  const handleApproveIssue = async (issueId: number) => {
    const toastId = toast.loading('Approving issue...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      await axios.post(
        `http://localhost:5000/api/issues/${issueId}/approve-dc`,
        { comment: 'Approved by DC' },
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
          ? { ...issue, status: ISSUE_STATUS.DC_APPROVED, comment: 'Approved by DC' } 
          : issue
      ));
      
      toast.update(toastId, {
        render: 'Issue approved successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        closeButton: true
      });
      
      // Refresh issues to get the latest data
      await fetchIssues();
    } catch (error) {
      console.error('Error approving issue:', error);
      toast.update(toastId, {
        render: 'Error approving issue',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
        closeButton: true
      });
    }
  };

  const handleRejectSubmit = async (issueId: number) => {
    if (!rejectComment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/issues/${issueId}/reject-dc`,
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
      toast.success('Issue rejected successfully');
      
      // Refresh issues to get the latest data
      await fetchIssues();
    } catch (error) {
      console.error('Error rejecting issue:', error);
      toast.error('Failed to reject issue');
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    
    // Handle all rejected status variations
    if (statusLower.includes('reject') || statusLower.includes('decline')) {
      return 'bg-red-100 text-red-800';
    }
    
    // Handle other statuses
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Issue approved by DC':
        return 'bg-blue-100 text-blue-800';
      case 'Issue approved by Super Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Issue assigned by Super User':
        return 'bg-green-100 text-green-800';
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

  // Toast container configuration
  const toastConfig = {
    position: "top-right" as const,
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light" as const,
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ToastContainer {...toastConfig} />
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r shadow-lg fixed left-0 top-0 bottom-0 flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center space-x-2 px-4 py-4 border-b">
          <FiMapPin className="text-purple-700" size={24} />
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-900">Issue Tracker</span>
        </div>
        {/* Sidebar Navigation */}
        <nav className="flex flex-col space-y-3 px-2 py-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
              activeTab === 'overview'
                ? 'bg-purple-100 text-purple-700 font-semibold'
                : 'hover:bg-purple-200 text-gray-700'
            }`}
          >
            <FiHome className="mr-2" size={20} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
              activeTab === 'issues'
                ? 'bg-purple-100 text-purple-700 font-semibold'
                : 'hover:bg-purple-200 text-gray-700'
            }`}
          >
            <FiAlertCircle className="mr-2" size={20} /> Issues
          </button>
        </nav>
        {/* Sidebar Footer */}
        <div className="mt-auto px-4 py-4 border-t">
          <span className="text-gray-500 text-sm text-center block">Election Commission Of Sri Lanka</span>
        </div>
      </aside>

      {/* Top Navbar */}
      <div className="fixed top-4 left-60 right-4 bg-white shadow-lg z-10 py-3 px-6 rounded-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-900">
              DC Dashboard
            </h1>
            {userDistrict && (
              <p className="text-sm text-gray-600 flex items-center">
                <FiMapPin className="mr-1" size={14} />
                {userDistrict} District
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <FiBell className="text-gray-600" />
            <div className="relative">
              <div className="flex items-center space-x-2">
                <img
                  src={userAvatar}
                  alt="User"
                  className="w-8 h-8 rounded-full cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                />
                <span className="text-gray-700 font-medium">{username}</span>
              </div>
              {showDropdown && (
                <div 
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                >
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiLogOut className="mr-2" size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-56 pt-20 px-4">
        {activeTab === 'overview' && (
          <OverviewPanel 
            issues={issues.filter(issue => issue.status.toLowerCase() === 'pending')}
            handleApproveIssue={handleApproveIssue}
            openRejectCommentModal={openRejectCommentModal}
            showComment={showComment}
            setSelectedIssue={setSelectedIssue}
            setShowModal={setShowModal}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
          />
        )}
        
        {activeTab === 'issues' && (
          <>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                <span className="font-semibold">Note:</span> You are viewing issues from {userDistrict} district only.
              </p>
            </div>
            <IssueTable 
              issues={issues}
              handleApproveIssue={handleApproveIssue}
              openRejectCommentModal={openRejectCommentModal}
              showComment={showComment}
              setSelectedIssue={setSelectedIssue}
              setShowModal={setShowModal}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
            />
          </>
        )}
      </main>

      {/* Issue Details Modal */}
      {selectedIssue && (
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
    </div>
  );
};

export default DCDashboard;