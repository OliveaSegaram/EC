import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUsers, FiAlertCircle, FiShield, FiLogOut, FiBell, FiMapPin, FiClipboard } from 'react-icons/fi';
import RegistrationPanel from '../../components/root/RegistrationPanel';
import IssuePanel from '../../components/root/IssuePanel';
import RolePanel from '../../components/root/RolePanel';
import ReviewPanel from '../../components/root/ReviewPanel';
import userAvatar from '../../assets/icons/login/User.svg'; 

const RootDashboard = () => {
  const [activeTab, setActiveTab] = useState<'registration' | 'issues' | 'roles' | 'review'>('issues');
  const [showDropdown, setShowDropdown] = useState(false);
  const [username, setUsername] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['registration', 'issues', 'roles', 'review'].includes(hash)) {
      setActiveTab(hash as typeof activeTab);
    }
  }, [window.location.hash]);

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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const tabs = [
    { key: 'issues', label: 'Issues' },
    { key: 'registration', label: 'Registrations' },
    { key: 'review', label: 'Review' },
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
              {tab.key === 'review' && <FiClipboard className="mr-2" size={20} />}
              {tab.key === 'roles' && <FiShield className="mr-2" size={20} />}
              {tab.label}
            </button>
          ))}
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
            Root Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <FiBell className="text-gray-600" />
            <div className="relative flex items-center space-x-2">
              <img
                src={userAvatar}
                alt="User"
                className="w-8 h-8 rounded-full cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              />
              <span className="text-gray-700 font-medium">{username}</span>
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-56 pt-20 px-4">
        {activeTab === 'registration' && <RegistrationPanel />}
        {activeTab === 'issues' && <IssuePanel />}
        {activeTab === 'review' && <ReviewPanel />}
        {activeTab === 'roles' && <RolePanel />}
      </main>
    </div>
  );
};

export default RootDashboard;