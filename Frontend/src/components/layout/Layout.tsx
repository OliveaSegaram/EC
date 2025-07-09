import { useState } from "react";
import type { ReactNode } from "react";
import Footer from './Footer';
import Sidebar from './Sidebar';
import AppBar from './AppBar';

export type DashboardType = 'clerk' | 'root' | 'default';

export interface SidebarItem {
    linkName: string;
    icon: string;
    component?: ReactNode;
}

// Default sidebar configuration
const defaultSidebarItems: SidebarItem[] = [
    { 
        linkName: 'Dashboard', 
        icon: 'Grid', // FiGrid
    },
    { 
        linkName: 'Issues', 
        icon: 'FileText', // FiFileText
    },
];

// Clerk dashboard sidebar configuration
const clerkSidebarItems: SidebarItem[] = [
    { 
        linkName: 'Dashboard', 
        icon: 'Grid', // FiGrid
    },
    { 
        linkName: 'Issues', 
        icon: 'FileText', // FiFileText
    },
];

// Root dashboard sidebar configuration
const rootSidebarItems: SidebarItem[] = [
    { 
        linkName: 'Issues', 
        icon: 'FileText', // FiFileText
    },
    { 
        linkName: 'Registration', 
        icon: 'UserPlus', // FiUserPlus
    },
    { 
        linkName: 'Roles', 
        icon: 'Shield', // FiShield
    },
    { 
        linkName: 'Review', 
        icon: 'CheckSquare', // FiCheckSquare
    },
];

// Get sidebar items based on dashboard type
const getSidebarItems = (dashboardType: DashboardType): SidebarItem[] => {
    switch (dashboardType) {
        case 'clerk':
            return clerkSidebarItems;
        case 'root':
            return rootSidebarItems;
        default:
            return defaultSidebarItems;
    }
};

interface LayoutProps {
    children?: ReactNode;
    title?: string;
    dashboardType?: DashboardType;
    onSidebarSelect?: (index: number, item: SidebarItem) => void;
    customSidebarItems?: SidebarItem[];
    selectedIndex?: number;
    onSelectedIndexChange?: (index: number) => void;
}

const Layout: React.FC<LayoutProps> = ({
    children,
    title = 'Dashboard',
    dashboardType = 'default',
    onSidebarSelect,
    customSidebarItems,
    selectedIndex: externalSelectedIndex,
    onSelectedIndexChange,
}) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [internalSelectedIndex, setInternalSelectedIndex] = useState(0);
    
    // Use external selected index if provided, otherwise use internal state
    const selectedIndex = externalSelectedIndex !== undefined ? externalSelectedIndex : internalSelectedIndex;
    
    // Get sidebar items based on dashboard type or use custom items if provided
    const sidebarItems = customSidebarItems || getSidebarItems(dashboardType);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    const handleSidebarSelect = (index: number) => {
        if (onSelectedIndexChange) {
            onSelectedIndexChange(index);
        } else {
            setInternalSelectedIndex(index);
        }
        
        if (onSidebarSelect) {
            onSidebarSelect(index, sidebarItems[index]);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header with Sidebar Toggle */}
            <AppBar title={title} setSidebarOpen={toggleSidebar} />

            <div className="flex flex-grow w-full">
                {/* Sidebar (Hidden on Small Screens) */}
                <Sidebar 
                    bgColor="#FFFFFF"
                    textColor="#6E2F74" 
                    links={sidebarItems.map(({ linkName, icon }) => ({ linkName, icon }))} 
                    onSelect={handleSidebarSelect} 
                    isSidebarOpen={isSidebarOpen}
                    selectedIndex={selectedIndex}
                />

                {/* Main Content Area */}
                <main
                    className="flex-grow overflow-auto transition-all duration-300 bg-gray-50 min-h-[calc(100vh-4rem)]"
                    style={{
                        marginLeft: isSidebarOpen ? "200px" : "60px",
                        paddingTop: '4rem',
                        paddingLeft: '1rem',
                        paddingRight: '1rem',
                        paddingBottom: '1rem',
                    }}
                >
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
            
            {/* Footer */}
            <Footer bgColor="#3B0044" className="border-t-2 border-gray-200" />
        </div>
    );
};

export default Layout;