import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiClipboard,
  FiLogOut,
  FiBell,
  FiMapPin,
} from 'react-icons/fi';
import { useAppContext } from '../../provider/AppContext';
import userAvatar from '../../assets/icons/login/User.svg';
import AssignedTasks from '../../components/technicalofficer/AssignedTasks';

interface UserProfile {
  username: string;
  email: string;
  role: string;
}

const TechnicalOfficerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn, backendUrl } = useAppContext();

  const [activeTab, setActiveTab] = useState<'AssignedTasks'>('AssignedTasks');
  const [showDropdown, setShowDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user profile on component mount and when token changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${backendUrl}/auth/user-profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch user profile');
        }

        const data = await response.json();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setUserProfile({
            username: data.username || data.email?.split('@')[0] || 'User',
            email: data.email || '',
            role: data.role || 'Technical Officer'
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          navigate('/login');
        }
      }
    };

    fetchUserProfile();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [navigate, setIsLoggedIn, backendUrl]);

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
                {userProfile?.username || 'Technical Officer'}
              </span>
            </div>
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
