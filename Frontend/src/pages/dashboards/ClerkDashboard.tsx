import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AppContext } from '../../provider/AppContext';
import DeleteConfirmation from '../../components/clerk/DeleteConfirmation';
import IssueSubmit from '../../components/clerk/issuesubmit';
import IssueTable from '../../components/clerk/IssueTable';
import OverviewPanel from '../../components/clerk/OverviewPanel';
import Layout from '../../components/layout/Layout';
//import getIconComponent from '../../components/ui/IconMapper';

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
  const { t } = useTranslation();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pendingIssues, setPendingIssues] = useState<Issue[]>([]);
  const [rejectedIssues, setRejectedIssues] = useState<Issue[]>([]);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentIssuesPage, setCurrentIssuesPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean, issue: Issue | null}>({open: false, issue: null});
  const [activeView, setActiveView] = useState<'dashboard' | 'issues'>('dashboard');
  
  const itemsPerPage = 5;
  const itemsPerIssuesPage = 5;
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);
  
  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Handle dropdown close if needed
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // User profile is handled in the Layout component

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Get user profile to get the district ID
      const profileResponse = await axios.get(`${backendUrl}/auth/user-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const userDistrictId = profileResponse.data.districtId;
      
      if (!userDistrictId) {
        console.error('User does not have a district assigned');
        setIssues([]);
        return;
      }
      
      // Fetch issues with the user's district ID
      const response = await axios.get(`${backendUrl}/issues`, {
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

      if (response.data && response.data.issues) {
        const issuesData = response.data.issues;
        setIssues(issuesData);
        
        // Filter pending and rejected issues for the dashboard
        const pending = issuesData.filter((issue: Issue) => issue.status === 'Pending');
        const rejected = issuesData.filter((issue: Issue) => 
          ['Rejected', 'Rejected by DC/AC', 'Rejected by Super Admin', 'Issue rejected by Super Admin'].includes(issue.status)
        );
        
        setPendingIssues(pending);
        setRejectedIssues(rejected);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
    }
  }, [backendUrl, navigate]);

  // Initial fetch
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Logout functionality is handled in the Layout component

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      // Pending states
      'Pending': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'Pending Approval': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      
      // Approved states
      'DC/AC Approved': 'bg-green-50 text-green-800 border border-green-200',
      'Issue approved by Super Admin': 'bg-green-50 text-green-800 border border-green-200',
      'Super User Approved': 'bg-green-50 text-green-800 border border-green-200',
      'Super Admin Approved': 'bg-green-50 text-green-800 border border-green-200',
      'Approved': 'bg-green-50 text-green-800 border border-green-200',
      
      // In Progress states
      'Assigned to Technician': 'bg-blue-50 text-blue-800 border border-blue-200',
      'In Progress': 'bg-blue-50 text-blue-800 border border-blue-200',
      'Under Repair': 'bg-blue-50 text-blue-800 border border-blue-200',
      
      // Rejected states
      'Rejected': 'bg-red-50 text-red-800 border border-red-200',
      'Rejected by DC/AC': 'bg-red-50 text-red-800 border border-red-200',
      'Rejected by Super Admin': 'bg-red-50 text-red-800 border border-red-200',
      'Issue rejected by Super Admin': 'bg-red-50 text-red-800 border border-red-200',
      
      // Completed/Resolved states
      'Completed': 'bg-purple-50 text-purple-800 border border-purple-200',
      'Resolved': 'bg-purple-50 text-purple-800 border border-purple-200',
      
      // Closed/Cancelled states
      'Closed': 'bg-gray-100 text-gray-800 border border-gray-200',
      'Cancelled': 'bg-gray-100 text-gray-800 border border-gray-200',
    };
    
    return statusMap[status] || 'bg-gray-50 text-gray-800 border border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle sidebar navigation
  const handleSidebarSelect = (index: number) => {
    if (index === 0) {
      setActiveView('dashboard');
    } else if (index === 1) {
      setActiveView('issues');
    }
  };

  return (
    <Layout 
      title="Clerk Dashboard"
      dashboardType="clerk"
      onSidebarSelect={handleSidebarSelect}
      selectedIndex={activeView === 'dashboard' ? 0 : 1}
    >
      <div className="w-full p-6">
        <div className="mt-4">
          {showSubmissionForm ? (
            <div className="mt-4">
              <button
                onClick={() => setShowSubmissionForm(false)}
                className="flex items-center text-[#4d1a57] hover:text-[#4d1a57] mb-4"
              >
                <span className="mr-2">←</span> {t('Back to dashboard')}
              </button>
              <IssueSubmit 
                onSuccess={() => {
                  fetchIssues();
                  setShowSubmissionForm(false);
                  setActiveView('dashboard');
                }} 
              />
            </div>
          ) : activeView === 'dashboard' ? (
            <OverviewPanel
              issues={pendingIssues}
              rejectedIssuesCount={rejectedIssues.length}
              setShowSubmissionForm={setShowSubmissionForm}
              setOverviewMode={() => {}}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={pendingIssues.length}
            />
          ) : null}

          {activeView === 'issues' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">All Issues</h2>
                  <p className="text-sm text-gray-500 mt-1">View and manage all reported issues</p>
                </div>
                
                <div className="relative inline-block text-left">
                  <div>
                    <button
                      type="button"
                      className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4d1a57]"
                      id="menu-button"
                      aria-expanded="true"
                      aria-haspopup="true"
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    >
                      {filterStatus === 'All' ? 'Filter by Status' : `Status: ${filterStatus}`}
                      <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {showFilterDropdown && (
                    <div 
                      className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="menu-button"
                    >
                      <div className="py-1" role="none">
                        {[
                          { value: 'All', label: 'All Issues', count: issues.length },
                          { value: 'Pending', label: 'Pending Issues', count: pendingIssues.length },
                          { 
                            value: 'Approved', 
                            label: 'Approved Issues', 
                            count: issues.filter(i => i.status.includes('Approved')).length 
                          },
                          { 
                            value: 'Rejected', 
                            label: 'Rejected Issues', 
                            count: issues.filter(i => i.status.includes('Rejected')).length 
                          }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setFilterStatus(option.value as any);
                              setShowFilterDropdown(false);
                            }}
                            className={`${
                              filterStatus === option.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } group flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-gray-50`}
                            role="menuitem"
                          >
                            <span>{option.label}</span>
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {option.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <IssueTable
                issues={issues}
                filterStatus={filterStatus}
                setDeleteConfirm={setDeleteConfirm}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                currentPage={currentIssuesPage}
                setCurrentPage={setCurrentIssuesPage}
                itemsPerPage={itemsPerIssuesPage}
                fetchIssues={fetchIssues}
              />
            </div>
          )}

          {deleteConfirm.open && (
            <DeleteConfirmation
              deleteConfirm={deleteConfirm}
              setDeleteConfirm={setDeleteConfirm}
              fetchIssues={fetchIssues}
              isDeleting={isDeleting}
              setIsDeleting={setIsDeleting}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClerkDashboard;
