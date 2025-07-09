import type { IconType } from 'react-icons';
import * as FiIcons from 'react-icons/fi';

type Props = {
    iconName: string; // Icon name (e.g., 'Home', 'Check', 'X')
    iconSize?: number; // Adjust icon size
    iconColor?: string; // Icon color
    marginRight?: number; // Margin between icon and the content
    className?: string; // Additional CSS classes
}

// Map of icon names to React Icons
const iconMap: Record<string, IconType> = {
    // Feather Icons (Fi)
    'Home': FiIcons.FiHome,
    'Dashboard': FiIcons.FiGrid,
    'Settings': FiIcons.FiSettings,
    'Person': FiIcons.FiUser,
    'People': FiIcons.FiUsers,
    'Menu': FiIcons.FiMenu,
    'Close': FiIcons.FiX,
    'Search': FiIcons.FiSearch,
    'Notifications': FiIcons.FiBell,
    'Email': FiIcons.FiMail,
    'Delete': FiIcons.FiTrash2,
    'Trash2': FiIcons.FiTrash2,
    'Edit': FiIcons.FiEdit2,
    'Edit2': FiIcons.FiEdit2,
    'Add': FiIcons.FiPlus,
    'Remove': FiIcons.FiMinus,
    'ArrowBack': FiIcons.FiArrowLeft,
    'ArrowForward': FiIcons.FiArrowRight,
    'Check': FiIcons.FiCheck,
    'Cancel': FiIcons.FiXCircle,
    'XCircle': FiIcons.FiXCircle,
    'Visibility': FiIcons.FiEye,
    'Eye': FiIcons.FiEye,
    'Filter': FiIcons.FiFilter,
    'FilterList': FiIcons.FiFilter,
    'Clock': FiIcons.FiClock,
    'MessageSquare': FiIcons.FiMessageSquare,
    'Paperclip': FiIcons.FiPaperclip,
    'Calendar': FiIcons.FiCalendar,
    'CheckCircle': FiIcons.FiCheckCircle,
    'Info': FiIcons.FiInfo,
    'File': FiIcons.FiFile,
    'Loader': FiIcons.FiLoader,
    'User': FiIcons.FiUser,
    'X': FiIcons.FiX,
    'RefreshCw': FiIcons.FiRefreshCw,
    'ShoppingBag': FiIcons.FiShoppingBag,
    'ChevronDown': FiIcons.FiChevronDown,
    'Tool': FiIcons.FiTool,
    'ShoppingCart': FiIcons.FiShoppingCart,
    'Grid': FiIcons.FiGrid,
    'FileText': FiIcons.FiFileText,
    'UserPlus': FiIcons.FiUserPlus,
    'Shield': FiIcons.FiShield,
    'CheckSquare': FiIcons.FiCheckSquare,
    'Clipboard': FiIcons.FiClipboard,
    'List': FiIcons.FiList,
    
    // Aliases for backward compatibility
    'FiCheck': FiIcons.FiCheck,
    'FiX': FiIcons.FiX,
    'FiClock': FiIcons.FiClock, 
    'Cog': FiIcons.FiSettings, 
    'SignOutAlt': FiIcons.FiLogOut,
    'SignInAlt': FiIcons.FiLogIn,
    'Lock': FiIcons.FiLock,
    'Unlock': FiIcons.FiUnlock,
    'Warning': FiIcons.FiAlertTriangle,
    'Error': FiIcons.FiXCircle,
    'Success': FiIcons.FiCheckCircle,
    
    // Add more mappings as needed
};

const getIconComponent = ({ 
    iconName, 
    iconSize = 24, 
    marginRight = 0, 
    iconColor = "#6E2F74",
    className = ''
}: Props): React.ReactElement | null => {
    const IconComponent = iconMap[iconName];
    
    if (!IconComponent) {
        console.warn(`Icon '${iconName}' not found in the icon map`);
        return null;
    }
    
    return (
        <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center',
            marginRight: `${marginRight}px`,
            color: iconColor,
            fontSize: `${iconSize}px`
        }} className={className}>
            <IconComponent style={{ width: '1em', height: '1em' }} />
        </span>
    );
};

export default getIconComponent;