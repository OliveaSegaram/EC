import React, { useState, useEffect } from 'react';
import { FiUsers, FiClipboard, FiClock, FiCheckCircle, FiAlertCircle, FiLogOut, FiBell, FiPlus } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../provider/AppContext';
import IssueSubmit from '../../components/clerk/issuesubmit';

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
  const [showIssueSubmit, setShowIssueSubmit] = useState(false); // State to show IssueSubmit form

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['Home', 'Check Status', 'Reports'].includes(hash)) {
      setActiveTab(hash as typeof activeTab);
    }
  }, [window.location.hash]);

  const handleTabClick = (tabKey: string) => {
    navigate(`${location.pathname}#${tabKey}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const handleAddNewIssueClick = () => {
    setShowIssueSubmit(true); //
  };

  const handleBackToOverview = () => {
    setShowIssueSubmit(false); 
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <div className="bg-white shadow-lg fixed top-0 left-0 w-full z-10 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-700">Subject Clerk Dashboard</h1>
        <div className="flex items-center space-x-4 ml-auto">
          <FiBell className="text-gray-700 cursor-pointer" size={20} />
          <span className="text-gray-700 text-sm">Subject Clerk</span>
          <img
            src="/assets/icons/login/User.png"
            alt="User Avatar"
            className="rounded-full w-8 h-8"
          />
        </div>
      </div>

      <div className="flex flex-1 pt-20">
        {/* Sidebar with Tabs */}
        <aside className="w-64 bg-white border-r shadow-lg fixed left-0 top-16 bottom-0 flex flex-col justify-between px-4 py-6">
          <div>
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => handleTabClick('Home')}
                className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
                  activeTab === 'Home' ? 'bg-purple-100 text-purple-700 font-semibold' : 'hover:bg-purple-200 text-gray-700'
                }`}
              >
                <FiUsers className="mr-2" size={20} /> Home
              </button>

              <button
                onClick={() => handleTabClick('Check Status')}
                className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
                  activeTab === 'Check Status' ? 'bg-purple-100 text-purple-700 font-semibold' : 'hover:bg-purple-200 text-gray-700'
                }`}
              >
                <FiAlertCircle className="mr-2" size={20} /> Check Status
              </button>

              <button
                onClick={() => handleTabClick('Reports')}
                className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
                  activeTab === 'Reports' ? 'bg-purple-100 text-purple-700 font-semibold' : 'hover:bg-purple-200 text-gray-700'
                }`}
              >
                <FiClipboard className="mr-2" size={20} /> Reports
              </button>
            </nav>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-gray-500 hover:text-red-600"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-50 overflow-auto ml-64">
          {/* Show Overview or Issue Form based on showIssueSubmit */}
          {!showIssueSubmit ? (
            <>
              {/* Overview Section */}
              {activeTab === 'Home' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-700">Overview</h2>
                  <div className="grid grid-cols-4 gap-6 mb-8">
                    {/* Total Forms Card */}
                    <div className="bg-white shadow-xl p-6 rounded-lg text-center hover:shadow-2xl transition-all">
                      <FiClipboard size={20} className="text-purple-700 mb-3 mx-auto" />
                      <h3 className="text-lg font-semibold text-gray-800">Total Forms</h3>
                      <p className="text-s font-bold text-gray-900">{overviewStats.totalForms}</p>
                    </div>

                    {/* Pending Forms Card */}
                    <div className="bg-white shadow-xl p-6 rounded-lg text-center hover:shadow-2xl transition-all">
                      <FiClock size={20} className="text-yellow-500 mb-3 mx-auto" />
                      <h3 className="text-lg font-semibold text-gray-800">Pending</h3>
                      <p className="text-s font-bold text-gray-900">{overviewStats.pending}</p>
                    </div>

                    {/* Processing Forms Card */}
                    <div className="bg-white shadow-xl p-6 rounded-lg text-center hover:shadow-2xl transition-all">
                      <FiAlertCircle size={20} className="text-blue-500 mb-3 mx-auto" />
                      <h3 className="text-lg font-semibold text-gray-800">Processing</h3>
                      <p className="text-s font-bold text-gray-900">{overviewStats.processing}</p>
                    </div>

                    {/* Completed Forms Card */}
                    <div className="bg-white shadow-xl p-6 rounded-lg text-center hover:shadow-2xl transition-all">
                      <FiCheckCircle size={20} className="text-green-500 mb-3 mx-auto" />
                      <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
                      <p className="text-s font-bold text-gray-900">{overviewStats.completed}</p>
                    </div>
                  </div>

                  {/* Add New Issue Button */}
                  <button
                    onClick={handleAddNewIssueClick}
                    className="bg-purple-700 text-white px-8 py-4 rounded-md flex items-center text-lg hover:bg-purple-800 transition-all shadow-lg"
                  >
                    <FiPlus className="mr-2" size={20} /> Add New Issue
                  </button>
                </div>
              )}
            </>
          ) : (
            // Show IssueSubmit Form
            <>
              <h2 className="text-2xl font-bold mb-6 text-gray-700">Submit New Issue</h2>
              <IssueSubmit />
              <button
                onClick={handleBackToOverview}
                className="mt-4 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Back to Overview
              </button>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClerkDashboard;
