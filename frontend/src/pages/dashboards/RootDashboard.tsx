import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUsers, FiAlertCircle, FiShield, FiLogOut, FiBell } from 'react-icons/fi';
import RegistrationPanel from '../../components/root/RegistrationPanel';
import IssuePanel from '../../components/root/IssuePanel';
import RolePanel from '../../components/root/RolePanel';
import userAvatar from '../../assets/icons/login/User.svg'; 

const RootDashboard = () => {
  const [activeTab, setActiveTab] = useState<'registration' | 'issues' | 'roles'>('registration');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['registration', 'issues', 'roles'].includes(hash)) {
      setActiveTab(hash as typeof activeTab);
    }
  }, [window.location.hash]);

  const handleTabClick = (tabKey: string) => {
    navigate(`${location.pathname}#${tabKey}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const tabs = [
    { key: 'registration', label: 'Registrations' },
    { key: 'issues', label: 'Issues' },
    { key: 'roles', label: 'Roles' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <div className="bg-white shadow-md fixed top-0 left-0 w-full z-10 p-4 flex justify-between items-center">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-900">
           Issue Tracker
      </h1>

        <div className="flex items-center space-x-4 ml-auto">
          <FiBell className="text-gray-700 cursor-pointer" size={20} />
          <span className="text-gray-700 text-sm">Super Admin</span>
          
          {/* User Avatar */}
          <img
            src={userAvatar} 
            alt="User Avatar"
            className="rounded-full w-10 h-10"
          />
        </div>
      </div>

      <div className="flex flex-1 pt-20">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r shadow-sm fixed left-0 top-16 bottom-0 flex flex-col justify-between px-4 py-6">
          {/* Top Navigation Section */}
          <div>
            <nav className="flex flex-col space-y-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-purple-700 font-semibold'
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.key === 'registration' && <FiUsers className="mr-2" />}
                  {tab.key === 'issues' && <FiAlertCircle className="mr-2" />}
                  {tab.key === 'roles' && <FiShield className="mr-2" />}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Bottom Section */}
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-gray-500">Super Admin</span>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-gray-500 hover:text-red-600"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 p-8 bg-gray-50 overflow-auto ml-64">
          {activeTab === 'registration' && <RegistrationPanel />}
          {activeTab === 'issues' && <IssuePanel />}
          {activeTab === 'roles' && <RolePanel />}
        </main>
      </div>
    </div>
  );
};

export default RootDashboard;