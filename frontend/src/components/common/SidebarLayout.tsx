import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiUsers, FiAlertCircle, FiShield, FiLogOut } from 'react-icons/fi';
import { useAppContext } from '../../provider/AppContext';

type Tab = {
  key: string;
  label: string;
};

type SidebarLayoutProps = {
  tabs: Tab[];
  children: React.ReactNode;
};

const iconMap: Record<string, React.ReactNode> = {
  registration: <FiUsers className="mr-2" />,
  issues: <FiAlertCircle className="mr-2" />,
  roles: <FiShield className="mr-2" />,
};

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ tabs, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn } = useAppContext();

  const activeTab = location.hash.replace('#', '') || tabs[0].key;

  const handleTabClick = (tabKey: string) => {
    navigate(`${location.pathname}#${tabKey}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen font-sans bg-gray-100">
     
      <aside className="w-64 bg-white border-r shadow-sm px-6 py-8 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-purple-700">Issue Tracker</h1>
          </div>

          {/*  Navigation */}
          <nav className="flex flex-col space-y-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`flex items-center px-4 py-2 rounded-md transition-all text-left ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                {iconMap[tab.key]} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="flex items-center justify-between mt-6 border-t pt-6">
          <div>
            <p className="text-sm font-semibold text-gray-700">Super Admin</p>
            <p className="text-xs text-gray-500">rootadmin@example.com</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-gray-500 hover:text-red-600"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-8 bg-gray-50 overflow-auto">{children}</main>
    </div>
  );
};

export default SidebarLayout;
