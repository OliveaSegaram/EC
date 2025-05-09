import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUsers, FiAlertCircle, FiShield, FiLogOut, FiBell, FiMapPin } from 'react-icons/fi';
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
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
                activeTab === tab.key
                  ? 'bg-purple-100 text-purple-700 font-semibold'
                  : 'hover:bg-purple-200 text-gray-700'
              }`}
            >
              {tab.key === 'registration' && <FiUsers className="mr-2" size={20} />}
              {tab.key === 'issues' && <FiAlertCircle className="mr-2" size={20} />}
              {tab.key === 'roles' && <FiShield className="mr-2" size={20} />}
              {tab.label}
            </button>
          ))}
        </nav>
        {/* Sidebar Footer */}
        <div className="mt-auto px-4 py-4 border-t flex justify-between items-center">
          <span className="text-gray-500 text-sm">Super Admin</span>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-gray-500 hover:text-red-600"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Top Navbar */}
      <div className="fixed top-4 left-60 right-4 bg-white shadow-lg z-10 py-3 px-6 rounded-xl">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-900">
            Root Dashboard
          </h1>
          <div className="flex items-center space-x-3">
            <FiBell className="text-gray-700 cursor-pointer" size={18} />
            <img
              src={userAvatar}
              alt="User Avatar"
              className="rounded-full w-8 h-8"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-56 pt-20 px-4">
        {activeTab === 'registration' && <RegistrationPanel />}
        {activeTab === 'issues' && <IssuePanel />}
        {activeTab === 'roles' && <RolePanel />}
      </main>
    </div>
  );
};

export default RootDashboard;