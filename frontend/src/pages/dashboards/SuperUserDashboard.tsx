import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiAlertCircle, FiLogOut, FiBell, FiMapPin } from 'react-icons/fi';
import axios from 'axios';
import { useAppContext } from '../../provider/AppContext';
import userAvatar from '../../assets/icons/login/User.svg';
import Approvals from '../../components/superuser/Approvals';
import Dashboard from '../../components/superuser/Dashboard';

interface UserProfile {
  username: string;
  email: string;
  role: string;
}

const SuperUserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn } = useAppContext();

  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Approvals'>('Dashboard');
  const [showDropdown, setShowDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('http://localhost:5000/api/auth/user-profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setUserProfile({
          username: response.data.username,
          email: response.data.email,
          role: response.data.role
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);
  
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
  }, []);

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
      onClick={() => handleTabClick('Dashboard')}
      className={`flex items-center px-4 py-2 rounded-md transition-all text-left w-full ${
        activeTab === 'Dashboard'
          ? 'bg-purple-100 text-purple-700 font-semibold'
          : 'hover:bg-purple-200 text-gray-700'
      }`}
    >
      <FiHome className="mr-2" size={20} /> Dashboard
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
  <div className="mt-auto px-4 py-4 border-t">
    <span className="text-gray-500 text-sm text-center block">Election Commission Of Sri Lanka</span>
  </div>
</aside>



    {/* Top Navbar */}
    <div className="fixed top-4 left-60 right-4 bg-white shadow-lg z-10 py-3 px-6 rounded-xl">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-900">
          Super User Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <FiBell className="text-gray-700 cursor-pointer" size={18} />
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={userAvatar}
                alt="User Avatar"
                className="w-10 h-10 rounded-full cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              />
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
            <span className="text-sm font-medium text-gray-900">
              {userProfile?.username || 'Super User'}
            </span>
          </div>
        </div>
      </div>
    </div>



      {/* Main Content */}
      <main className="flex-1 ml-56 pt-20 px-4">
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Approvals' && <Approvals />}
      </main>
    </div>
  );
};

export default SuperUserDashboard;
