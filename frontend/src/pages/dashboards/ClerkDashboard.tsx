import React, { useState, useEffect } from 'react';
import { CiCircleList, CiWallet, CiClock1 } from 'react-icons/ci'; 
import { FiUsers, FiLogOut, FiBell, FiPlus, FiHome, FiEdit, FiTrash2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../provider/AppContext';
import IssueSubmit from '../../components/clerk/issuesubmit';
import api from '../../services/api';
import CheckStatus from '../../components/clerk/checkstatus';
import userAvatar from '../../assets/icons/login/User.svg'; 

const ClerkDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn } = useAppContext();

  const [activeTab, setActiveTab] = useState<'Home' | 'Check Status' | 'Reports'>('Home');
  const [overviewStats, setOverviewStats] = useState({
    totalForms: 10,
    pending: 2,
    processing: 3,
    completed: 5,
  });
  const [showIssueSubmit, setShowIssueSubmit] = useState(false);

  interface Issue {
    id: string;
    deviceId: string;
    complaintType: string;
    description: string;
    priorityLevel: string;
    location: string;
    status: string;
  }

  const [issues, setIssues] = useState<Issue[]>([]);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['Home', 'Check Status', 'Reports'].includes(hash)) {
      setActiveTab(hash as typeof activeTab);
    }
    fetchIssues();
  }, [window.location.hash]);

  const fetchIssues = async () => {
    try {
      const response = await api.get('/issues');
      setIssues(response.data.issues);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    try {
      await api.delete(`/issues/${id}`);
      fetchIssues();
      alert('Issue deleted successfully');
    } catch (error) {
      console.error('Error deleting issue:', error);
      alert('Error deleting issue');
    }
  };

  const handleTabClick = (tabKey: string) => {
    navigate(`${location.pathname}#${tabKey}`);
    setActiveTab(tabKey as typeof activeTab); 
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const handleAddNewIssueClick = () => {
    setShowIssueSubmit(true);
  };

  const handleBackToOverview = () => {
    setShowIssueSubmit(false);
  };

  const handleEditIssue = (issueId: string) => {
    const issueToEdit = issues.find((i) => i.id === issueId);
    if (issueToEdit) {
      setEditingIssue(issueToEdit);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg fixed top-0 left-0 w-full z-10 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-900">Subject Clerk Dashboard</h1>
        <div className="flex items-center space-x-4 ml-auto">
          <FiBell className="text-gray-700 cursor-pointer" size={20} />
          <span className="text-gray-700 text-md">Subject Clerk</span>
          <img
            src={userAvatar} 
            alt="User Avatar"
            className="rounded-full w-10 h-10"
          />
        </div>
      </div>

      <div className="flex flex-1 pt-20">
        <aside className="w-52 bg-white border-r shadow-lg fixed left-0 top-16 bottom-0 flex flex-col justify-between px-2 py-4">
          <div>
            <nav className="flex flex-col space-y-4">
              <button onClick={() => handleTabClick('Home')} className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${activeTab === 'Home' ? 'bg-purple-100 text-purple-700 font-semibold' : 'hover:bg-purple-200 text-gray-700'}`}>
                <FiHome className="mr-2" size={20} /> Home
              </button>
              <button onClick={() => handleTabClick('Check Status')} className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${activeTab === 'Check Status' ? 'bg-purple-100 text-purple-700 font-semibold' : 'hover:bg-purple-200 text-gray-700'}`}>
                <FiAlertCircle className="mr-2" size={20} /> Check Status
              </button>
              <button onClick={() => handleTabClick('Reports')} className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${activeTab === 'Reports' ? 'bg-purple-100 text-purple-700 font-semibold' : 'hover:bg-purple-200 text-gray-700'}`}>
                <FiCheckCircle className="mr-2" size={20} /> Reports
              </button>
            </nav>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-gray-500">Subject Clerk</span>
                      <button
                        onClick={handleLogout}
                        title="Logout"
                        className="text-gray-500 hover:text-red-600"
                      >
                        <FiLogOut size={20} />
                      </button>
                    </div>
        </aside>

        <main className="flex-1 p-8 overflow-auto ml-60 pt-2">

          {activeTab === 'Check Status' ? (
            <CheckStatus />
          ) : !showIssueSubmit ? (
            <>
              {activeTab === 'Home' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-gray-700">Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Total Registrations Card */}
                    <div className="flex items-center bg-white p-4 rounded shadow border-l-4 border-blue-500">
                      <CiCircleList size={30} className="text-blue-500 mr-4" />
                      <div>
                        <h4 className="font-bold text-gray-700">Submittged Issues</h4>
                        <p className="text-2xl">{overviewStats.totalForms}</p>
                      </div>
                    </div>
                    {/* Verified Users Card */}
                    <div className="flex items-center bg-white p-4 rounded shadow border-l-4 border-green-500">
                      <CiWallet size={30} className="text-green-500 mr-4" />
                      <div>
                        <h4 className="font-bold text-gray-700">Pending Issues</h4>
                        <p className="text-2xl">{overviewStats.completed}</p>
                      </div>
                    </div>
                    {/* Pending Approvals Card */}
                    <div className="flex items-center bg-white p-4 rounded shadow border-l-4 border-yellow-500">
                      <CiClock1 size={30} className="text-yellow-500 mr-4" />
                      <div>
                        <h4 className="font-bold text-gray-700">Approved Issues</h4>
                        <p className="text-2xl">{overviewStats.pending}</p>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Issues</h2>
                  <div className="space-y-4">
                    {issues.map((issue) => (
                      <div key={issue.id} className="bg-white shadow-xl p-4 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">Device ID:{issue.deviceId}</p>
                          <p className="text-sm text-gray-500">ComplaintType:{issue.complaintType}</p>
                          <p className="text-sm text-gray-500">Description:{issue.description}</p>
                          <p className="text-sm text-gray-500">Priority: {issue.priorityLevel}</p>
                          <p className="text-sm text-gray-500">Location: {issue.location}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => handleEditIssue(issue.id)} className="text-blue-600 hover:text-blue-800">
                            <FiEdit className="text-purple-500" size={20} />
                          </button>
                          <button onClick={() => handleDeleteIssue(issue.id)} className="text-red-600 hover:text-red-800">
                            <FiTrash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {editingIssue && (
                    <div className="bg-white p-4 rounded-lg shadow-lg mt-6">
                      <h3 className="text-lg font-semibold mb-4 text-purple-900">Edit Issue</h3>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          const { id, description, priorityLevel, location } = editingIssue;
                          await api.patch(`/issues/${id}`, { description, priorityLevel, location });
                          alert('Issue updated successfully');
                          fetchIssues();
                          setEditingIssue(null);
                        } catch (error) {
                          console.error('Error updating issue:', error);
                          alert('Failed to update issue');
                        }
                      }}>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-600">Description</label>
                          <textarea value={editingIssue.description} onChange={(e) => setEditingIssue({ ...editingIssue, description: e.target.value })} rows={3} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-600">Priority</label>
                          <select value={editingIssue.priorityLevel} onChange={(e) => setEditingIssue({ ...editingIssue, priorityLevel: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-600">Location</label>
                          <input type="text" value={editingIssue.location} onChange={(e) => setEditingIssue({ ...editingIssue, location: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="flex space-x-2">
                          <button type="submit" className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800">Save</button>
                          <button type="button" className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400" onClick={() => setEditingIssue(null)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <button onClick={handleAddNewIssueClick} className="absolute top-24 right-6 bg-gradient-to-b from-purple-600 to-purple-900 text-white px-4 py-2 rounded-md flex items-center text-m hover:bg-purple-800 transition-all shadow-lg">
                    <FiPlus className="mr-2" size={20} /> Add New Issue
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 text-gray-700"></h2>
              <IssueSubmit />
              <button onClick={handleBackToOverview} className="mt-3 py-2 px-3 bg-gradient-to-b from-purple-600 to-purple-900 text-white rounded-md hover:bg-gray-700">Back to Overview</button>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClerkDashboard;
