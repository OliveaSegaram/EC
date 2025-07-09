import { useState } from 'react';
import AssignedTasks from '../../components/technicalofficer/AssignedTasks';
import Layout from '../../components/layout/Layout';
import type { SidebarItem } from '../../components/layout/Layout';



const TechnicalOfficerDashboard = () => {
  const [activeTab, setActiveTab] = useState<'AssignedTasks'>('AssignedTasks');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Define sidebar items for Technical Officer
  const sidebarItems: SidebarItem[] = [
    { 
      linkName: 'Assigned Tasks', 
      icon: 'Clipboard', 
    },
  ];



  const handleSidebarSelect = (index: number) => {
    setSelectedIndex(index);
    if (index === 0) {
      setActiveTab('AssignedTasks');
    }
  };

  return (
    <Layout 
      title="Technical Officer Dashboard"
      dashboardType="default"
      customSidebarItems={sidebarItems}
      selectedIndex={selectedIndex}
      onSelectedIndexChange={handleSidebarSelect}
    >
      <div className="p-6">
        {activeTab === 'AssignedTasks' && <AssignedTasks />}
      </div>
    </Layout>
  );
};

export default TechnicalOfficerDashboard;
