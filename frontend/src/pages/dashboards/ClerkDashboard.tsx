import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiAlertCircle, FiBell, FiArrowLeft, FiMapPin } from 'react-icons/fi'; // Removed unused: FiPlus, FiLogOut
import axios from 'axios';
import userAvatar from '../../assets/icons/login/User.svg';
import DeleteConfirmation from '../../components/clerk/DeleteConfirmation';
import IssueSubmit from '../../components/clerk/issuesubmit';
import IssueTable from '../../components/clerk/IssueTable';
import OverviewPanel from '../../components/clerk/OverviewPanel';

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
}

const ClerkDashboard = () => {
  const [username, setUsername] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean, issue: Issue | null}>({open: false, issue: null});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Handle clicks outside dropdown to close it
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
  }, []);

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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'issues'>('dashboard');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pendingIssues, setPendingIssues] = useState<Issue[]>([]);
  const [rejectedIssues, setRejectedIssues] = useState<Issue[]>([]);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [overviewMode, setOverviewMode] = useState<'dashboard' | 'form'>('dashboard');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentIssuesPage, setCurrentIssuesPage] = useState(1);
  const [itemsPerPage] = useState(5); // 5 items per page for pagination
  const [itemsPerIssuesPage] = useState(5);

  // Function to fetch issues
  const fetchIssues = useCallback(async () => {
    try {
      console.log('Fetching issues...');
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Clear any existing issues
      setIssues([]);

      // Get user profile to get the district ID
      const profileResponse = await axios.get('http://localhost:5000/api/auth/user-profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('User profile:', profileResponse.data);
      
      // Get the district ID from the user profile
      const userDistrictId = profileResponse.data.districtId;
      
      if (!userDistrictId) {
        console.error('User does not have a district assigned');
        setIssues([]);
        return;
      }
      
      // Then fetch issues with the user's district ID
      const response = await axios.get('http://localhost:5000/api/issues', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: {
          userDistrict: userDistrictId.toString()
        }
      });

      console.log('Issues fetched:', response.data.issues);
      if (response.data && response.data.issues) {
        const issuesData = response.data.issues;
        setIssues(issuesData);
        // Filter pending and rejected issues for the dashboard
        const pending = issuesData.filter((issue: Issue) => issue.status === 'Pending');
        const rejected = issuesData.filter((issue: Issue) => issue.status === 'Rejected');
        setPendingIssues(pending);
        setRejectedIssues(rejected);
      } else {
        console.warn('No issues found or invalid response format');
        setIssues([]);
        setPendingIssues([]);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data || error.message);
      }
      // Set empty array on error to prevent UI issues
      setIssues([]);
    }
  }, [navigate]);

  // Fetch issues when component mounts and when activeTab changes
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Function to manually refresh issues
  const refreshIssues = useCallback(async () => {
    await fetchIssues();
  }, [fetchIssues]);

  // Removed unused handleIssueSelect function

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      // Pending states
      case 'Pending':
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      
      // Approved states
      case 'DC Approved':
      case 'Issue approved by Super Admin':
      case 'Super User Approved':
      case 'Super Admin Approved':
      case 'Approved':
        return 'bg-green-50 text-green-800 border border-green-200';
      
      // In Progress states
      case 'Assigned to Technician':
      case 'In Progress':
      case 'Under Repair':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      
      // Rejected states
      case 'Rejected':
      case 'Rejected by DC':
      case 'Rejected by Super Admin':
      case 'Issue rejected by Super Admin':
        return 'bg-red-50 text-red-800 border border-red-200';
      
      // Completed/Resolved states
      case 'Completed':
      case 'Resolved':
        return 'bg-purple-50 text-purple-800 border border-purple-200';
      
      // Closed/Cancelled states
      case 'Closed':
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      
      // Default case for any other status
      default:
        return 'bg-gray-50 text-gray-800 border border-gray-200';
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
    <div className="flex min-h-screen bg-gray-100">
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
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
              activeTab === 'dashboard'
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
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-900">
            Subject Clerk Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <FiBell className="text-gray-700 cursor-pointer" size={18} />
            <div className="relative flex items-center space-x-2">
              <div className="relative">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
                  <img
                    src={userAvatar}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full"
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
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-56 pt-20 px-4">
        {activeTab === 'dashboard' && (
          <>
            {overviewMode === 'dashboard' ? (
              <OverviewPanel
                issues={pendingIssues}
                rejectedIssuesCount={rejectedIssues.length}
                setShowSubmissionForm={setShowSubmissionForm}
                setOverviewMode={setOverviewMode}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={pendingIssues.length}
              />
            ) : (
              <>
                <button
                  onClick={() => {
                    setOverviewMode('dashboard');
                    setShowSubmissionForm(false);
                  }}
                  className="flex items-center mb-4 text-gray-600 hover:text-gray-900"
                >
                  <FiArrowLeft className="mr-2" /> Back to Dashboard
                </button>
                <IssueSubmit onSuccess={() => {
                  refreshIssues();
                  setOverviewMode('dashboard');
                  setShowSubmissionForm(false);
                }} />
              </>
            )}
          </>
        )}
        
        {activeTab === 'issues' && (
          <>
            {showSubmissionForm ? (
              <>
                <button
                  onClick={() => setShowSubmissionForm(false)}
                  className="flex items-center mb-4 text-gray-600 hover:text-gray-900"
                >
                  <FiArrowLeft className="mr-2" /> Back to Issues
                </button>
                <IssueSubmit onSuccess={() => {
                  fetchIssues();
                  setShowSubmissionForm(false);
                }} />
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Issue Management</h2>
                  </div>
                  <div className="flex space-x-4">
                    <div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Pending' | 'Approved' | 'Rejected')}
                        className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="All">All Issues</option>
                        <option value="Pending">Pending Issues</option>
                        <option value="Approved">Approved Issues</option>
                        <option value="Rejected">Rejected Issues</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <IssueTable
                  issues={filterStatus === 'All' ? issues : issues.filter(issue => issue.status === filterStatus)}
                  filterStatus={filterStatus}
                  setDeleteConfirm={setDeleteConfirm}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  currentPage={currentIssuesPage}
                  setCurrentPage={setCurrentIssuesPage}
                  itemsPerPage={itemsPerIssuesPage}
                  fetchIssues={fetchIssues}
                />
              </>
            )}
          </>
        )} 
        {/* Delete Confirmation Dialog */}
        {deleteConfirm.open && (
          <DeleteConfirmation
            deleteConfirm={deleteConfirm}
            setDeleteConfirm={setDeleteConfirm}
            fetchIssues={fetchIssues}
            isDeleting={isDeleting}
            setIsDeleting={setIsDeleting}
          />
        )}
      </main>
    </div>
  );
};

export default ClerkDashboard;
