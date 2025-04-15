import React, { useState } from 'react';
import RegistrationPanel from '../../components/root/RegistrationPanel';
import IssuePanel from '../../components/root/IssuePanel';
import RolePanel from '../../components/root/RolePanel';

const RootDashboard = () => {
  const [activeTab, setActiveTab] = useState<'registration' | 'issues' | 'roles'>('registration');

  const tabClasses = (tab: string) =>
    `px-4 py-2 cursor-pointer border-b-2 ${activeTab === tab ? 'border-purple-700 font-bold' : 'text-gray-500'}`;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Super Admin Dashboard</h2>
      <div className="flex gap-6 mb-6 border-b">
        <span className={tabClasses('registration')} onClick={() => setActiveTab('registration')}>Registration</span>
        <span className={tabClasses('issues')} onClick={() => setActiveTab('issues')}>Issues</span>
        <span className={tabClasses('roles')} onClick={() => setActiveTab('roles')}>Roles</span>
      </div>

      {activeTab === 'registration' && <RegistrationPanel />}
      {activeTab === 'issues' && <IssuePanel />}
      {activeTab === 'roles' && <RolePanel />}
    </div>
  );
};

export default RootDashboard;
