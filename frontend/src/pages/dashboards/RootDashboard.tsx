import React, { useEffect, useState } from 'react';
import SidebarLayout from '../../components/common/SidebarLayout';
import RegistrationPanel from '../../components/root/RegistrationPanel';
import IssuePanel from '../../components/root/IssuePanel';
import RolePanel from '../../components/root/RolePanel';

const RootDashboard = () => {
  const [activeTab, setActiveTab] = useState<'registration' | 'issues' | 'roles'>('registration');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['registration', 'issues', 'roles'].includes(hash)) {
      setActiveTab(hash as typeof activeTab);
    }
  }, [window.location.hash]);

  const tabs = [
    { key: 'registration', label: 'Registrations' },
    { key: 'issues', label: 'Issues' },
    { key: 'roles', label: 'Roles' },
  ];

  return (
    <SidebarLayout tabs={tabs}>
      <div className="mb-6">
  <h1 className="text-2xl font-bold text-gray-800 pb-2 border-b-4 border-purple-600 inline-block">
    Super Admin Dashboard
  </h1>
  <div className="mt-4 border-t border-gray-300" />
</div>


      {/*Tab-specific content */}
      {activeTab === 'registration' && <RegistrationPanel />}
      {activeTab === 'issues' && <IssuePanel />}
      {activeTab === 'roles' && <RolePanel />}
    </SidebarLayout>
  );
};

export default RootDashboard;
