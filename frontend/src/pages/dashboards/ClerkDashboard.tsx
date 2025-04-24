import React, { useEffect, useState } from 'react';
import { FiUsers, FiAlertCircle, FiShield, FiLogOut, FiBell } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../provider/AppContext';
import IssueSubmit from '../../components/clerk/issuesubmit';

const ClerkDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn } = useAppContext();

  const [activeTab, setActiveTab] = useState<'submit' | 'status'>('submit');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['submit', 'status'].includes(hash)) {
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <div className="bg-white shadow-md fixed top-0 left-0 w-full z-10 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-700">Issue Tracker</h1>
        <div className="flex items-center space-x-4 ml-auto">
          <FiBell className="text-gray-700 cursor-pointer" size={20} />
          <span className="text-gray-700 text-sm">Clerk</span>
          <img
            src="/assets/icons/login/User.png"
            alt="User Avatar"
            className="rounded-full w-8 h-8"
          />
        </div>
      </div>

      <div className="flex flex-1 pt-20">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r shadow-sm fixed left-0 top-16 bottom-0 flex flex-col justify-between px-4 py-6">
          <div>
            <nav className="flex flex-col space-y-3">
              <button
                onClick={() => handleTabClick('submit')}
                className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
                  activeTab === 'submit'
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <FiUsers className="mr-2" /> Submit Issue
              </button>

              <button
                onClick={() => handleTabClick('status')}
                className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
                  activeTab === 'status'
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <FiAlertCircle className="mr-2" /> View Status
              </button>
            </nav>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-gray-500">Clerk</span>
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
          {activeTab === 'submit' && (
            <div>
              <h2 className="text-2xl font-bold">Submit Issue</h2>
              <IssueSubmit />
            </div>
          )}

          {activeTab === 'status' && (
            <div>
              <h2 className="text-2xl font-bold">View Status</h2>
              {/* View Status component goes here */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClerkDashboard;
