import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiAlertCircle, FiLogOut, FiBell, FiMapPin, FiUsers, FiClipboard } from 'react-icons/fi';
import axios from 'axios';
import { AppContext } from '../../provider/AppContext';
import Layout from '../../components/layout/Layout';
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
  const { backendUrl, setIsLoggedIn } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Approvals'>('Dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${backendUrl}/auth/user-profile`, {
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
  
  // Handle sidebar selection
  const handleSidebarSelect = (index: number) => {
    setActiveTab(index === 0 ? 'Dashboard' : 'Approvals');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  // Define custom sidebar items for Super User
  const superUserSidebarItems = [
    { 
      linkName: 'Dashboard', 
      icon: 'FaHome', // Using a home icon for dashboard
    },
    { 
      linkName: 'Approvals', 
      icon: 'FaClipboardCheck', // Using a checkmark icon for approvals
    },
  ];

  return (
    <Layout 
      title="Super User Dashboard"
      dashboardType="default"
      onSidebarSelect={handleSidebarSelect}
      customSidebarItems={superUserSidebarItems}
      selectedIndex={activeTab === 'Dashboard' ? 0 : 1}
    >
      {activeTab === 'Dashboard' && <Dashboard />}
      {activeTab === 'Approvals' && <Approvals />}
    </Layout>
  );
};

export default SuperUserDashboard;
