import { useState } from 'react';

import Layout from '../../components/layout/Layout';
import Approvals from '../../components/superuser/Approvals';
import Dashboard from '../../components/superuser/Dashboard';


const SuperUserDashboard = () => {

  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Approvals'>('Dashboard');


  
  // Handle sidebar selection
  const handleSidebarSelect = (index: number) => {
    setActiveTab(index === 0 ? 'Dashboard' : 'Approvals');
  };



  // Define custom sidebar items for Super User
  const superUserSidebarItems = [
    { 
      linkName: 'Dashboard', 
      icon: 'Home', 
    },
    { 
      linkName: 'Approvals', 
      icon: 'CheckSquare', 
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
