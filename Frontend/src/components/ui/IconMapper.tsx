import * as Icons from 'react-icons/fa';

type Props = {
    iconName: string; // Icon name (e.g., 'FaHome', 'FaCog')
    iconSize?: number; // Adjust icon size
    iconColor?: string; // Icon color
    marginRight?: number; // Margin between icon and the content
}

const getIconComponent = ({ 
    iconName, 
    iconSize = 24, 
    marginRight = 8, 
    iconColor = "#6E2F74" 
}: Props): React.ReactElement | null => {
    // Handle different icon name formats (with or without 'Fa' prefix)
    const iconKey = iconName.startsWith('Fa') ? iconName : `Fa${iconName}`;
    const IconComponent = (Icons as any)[iconKey];
    
    return IconComponent ? (
        <IconComponent 
            style={{ 
                fontSize: iconSize, 
                marginRight: `${marginRight}px`, 
                color: iconColor 
            }} 
        />
    ) : null;
};

export default getIconComponent;