import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RegistrationPanel from '../../components/root/RegistrationPanel';
import IssuePanel from '../../components/root/IssuePanel';
import RolePanel from '../../components/root/RolePanel';
import ReviewPanel from '../../components/root/ReviewPanel';
import Layout from '../../components/layout/Layout';
import { AppContext } from '../../provider/AppContext';

// View components mapping - order must match the sidebar items in Layout.tsx
const viewComponents = [
  <IssuePanel key="issues" />,
  <RegistrationPanel key="registration" />,
  <RolePanel key="roles" />,
  <ReviewPanel key="review" />
];

// Map of URL hashes to view indices - must match the order in viewComponents
const viewMap: Record<string, number> = {
  'issues': 0,
  'registration': 1,
  'roles': 2,
  'review': 3
};

const RootDashboard = () => {
  const [username, setUsername] = useState('');
  const [activeViewIndex, setActiveViewIndex] = useState(1); // Default to Issues
  const navigate = useNavigate();
  const location = useLocation();
  const { backendUrl } = useContext(AppContext);

  // Get the current view based on URL hash
  const getCurrentView = () => {
    const hash = window.location.hash.replace('#', '');
    return viewMap[hash] ?? 1; // Default to Issues if hash is invalid
  };

  // Fetch user profile on component mount
  useEffect(() => {
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
          navigate('/login');
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
        navigate('/login');
      }
    };

    fetchUserProfile();
  }, [backendUrl, navigate]);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setActiveViewIndex(getCurrentView());
    };

    // Set initial view from URL
    setActiveViewIndex(getCurrentView());

    // Listen for hash changes
    window.addEventListener('popstate', handleHashChange);
    
    return () => {
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [location.pathname]);

  // Handle sidebar navigation
  const handleSidebarSelect = (index: number) => {
    const viewName = Object.keys(viewMap).find(key => viewMap[key] === index);
    if (viewName) {
      navigate(`${location.pathname}#${viewName}`, { replace: true });
    }
  };

  return (
    <Layout 
      title="Root Dashboard"
      dashboardType="root"
      selectedIndex={activeViewIndex}
      onSelectedIndexChange={setActiveViewIndex}
      onSidebarSelect={handleSidebarSelect}
    >
      <div className="w-full bg-white rounded-lg shadow-sm p-6">
        {viewComponents[activeViewIndex] || <div>Page not found</div>}
      </div>
    </Layout>
  );
};

export default RootDashboard;