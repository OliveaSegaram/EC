import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiClipboard,
  FiLogOut,
  FiBell,
  FiMapPin,
} from 'react-icons/fi';
import { useAppContext } from '../../provider/AppContext';
import userAvatar from '../../assets/icons/login/User.svg';
import AssignedTasks from '../../components/technicalofficer/AssignedTasks';

const TechnicalOfficerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn } = useAppContext();

  const [activeTab, setActiveTab] = useState<'AssignedTasks'>('AssignedTasks');

  const handleTabClick = (tabKey: string) => {
    navigate(`${location.pathname}#${tabKey}`);
    setActiveTab(tabKey as typeof activeTab);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
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
            onClick={() => handleTabClick('AssignedTasks')}
            className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
              activeTab === 'AssignedTasks'
                ? 'bg-purple-100 text-purple-700 font-semibold'
                : 'hover:bg-purple-200 text-gray-700'
            }`}
          >
            <FiClipboard className="mr-2" size={20} /> Assigned Tasks
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
            Technical Officer Dashboard
          </h1>
          <div className="flex items-center space-x-3">
            <FiBell className="text-gray-700 cursor-pointer" size={18} />
            <span className="text-gray-700 text-sm">Technical Officer</span>
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
        {activeTab === 'AssignedTasks' && <AssignedTasks />}
      </main>
    </div>
  );
};

export default TechnicalOfficerDashboard;
