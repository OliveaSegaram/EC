import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../provider/AuthProvider';
import RegistrationPanel from '../../components/root/RegistrationPanel';
import IssuePanel from '../../components/root/IssuePanel';
import RolePanel from '../../components/root/RolePanel';
import ReviewPanel from '../../components/root/ReviewPanel';
import Layout from '../../components/layout/Layout';

// Map of URL hashes to view indices - must match the order in viewComponents
const viewMap: Record<string, number> = {
  '#issues': 0,
  '#registration': 1,
  '#roles': 2,
  '#review': 3,
};

const RootDashboard = () => {
  const [activeViewIndex, setActiveViewIndex] = useState(1); // Default to Registration
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();



  // Handle view changes
  const handleViewChange = (index: number) => {
    const hash = Object.entries(viewMap).find(([_, i]) => i === index)?.[0] || '#registration';
    navigate(hash, { replace: true });
  };

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!user) {
          console.log('No user in context, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('User from auth context:', user);
        // User data is available in the auth context
      } catch (error) {
        console.error('Error handling user data:', error);
        navigate('/login');
      }
    };

    fetchUserProfile();
  }, [user, navigate]);

  // Handle URL hash changes
  useEffect(() => {
    const hash = window.location.hash || '#registration';
    const viewIndex = viewMap[hash] ?? 1;
    setActiveViewIndex(viewIndex);
  }, [location]);

  // View components mapping - order must match the sidebar items in Layout.tsx
  const viewComponents = [
    <IssuePanel key="issues" />,
    <RegistrationPanel key="registration" />,
    <RolePanel key="roles" />,
    <ReviewPanel key="review" />
  ];

  return (
    <Layout 
      title="Root Dashboard"
      dashboardType="root"
      selectedIndex={activeViewIndex}
      onSelectedIndexChange={handleViewChange}
    >
      <div className="w-full bg-white rounded-lg shadow-sm p-6">
        {viewComponents[activeViewIndex] || <div>Page not found</div>}
      </div>
    </Layout>
  );
};

export default RootDashboard;