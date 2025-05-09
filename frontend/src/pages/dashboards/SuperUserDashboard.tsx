import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiAlertCircle,
  FiLogOut,
  FiBell,
  FiMapPin,
} from 'react-icons/fi';
import { useAppContext } from '../../provider/AppContext';
import userAvatar from '../../assets/icons/login/User.svg';
import Approvals from '../../components/superuser/Approvals';
import Status from '../../components/superuser/Status';

const SuperUserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn } = useAppContext();

  const [activeTab, setActiveTab] = useState<'Status' | 'Approvals'>('Status');

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

  {/* Sidebar Navigation – now moved to top */}
  <nav className="flex flex-col space-y-3 px-2 py-4">
    <button
      onClick={() => handleTabClick('Status')}
      className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
        activeTab === 'Status'
          ? 'bg-purple-100 text-purple-700 font-semibold'
          : 'hover:bg-purple-200 text-gray-700'
      }`}
    >
      <FiHome className="mr-2" size={20} /> Status
    </button>
    <button
      onClick={() => handleTabClick('Approvals')}
      className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
        activeTab === 'Approvals'
          ? 'bg-purple-100 text-purple-700 font-semibold'
          : 'hover:bg-purple-200 text-gray-700'
      }`}
    >
      <FiAlertCircle className="mr-2" size={20} /> Approvals
    </button>
  </nav>

  {/* Sidebar Footer */}
  <div className="mt-auto px-4 py-4 border-t flex justify-between items-center">
    <span className="text-gray-500 text-sm">Super User</span>
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
      Super User Dashboard
    </h1>
    <div className="flex items-center space-x-3">
      <FiBell className="text-gray-700 cursor-pointer" size={18} />
      <span className="text-gray-700 text-sm">Super User</span>
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
        {activeTab === 'Status' && <Status />}
        {activeTab === 'Approvals' && <Approvals />}
      </main>
    </div>
  );
};

export default SuperUserDashboard;
