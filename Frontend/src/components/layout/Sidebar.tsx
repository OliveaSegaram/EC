import { useState } from 'react';
import getIconComponent from '../ui/IconMapper';

type LinkProps = {
    linkName: string;
    icon: string;
};

type Props = {
    links: LinkProps[];
    onSelect: (index: number) => void;
    isSidebarOpen: boolean;
    bgColor?: string;
    textColor?: string;
    sidebarWidth?: string;
    selectedIndex?: number;
};

function Sidebar({
    links,
    onSelect,
    isSidebarOpen,
    bgColor = "#3B0044",
    textColor = "#FFFFFF",
    sidebarWidth = "12rem",
    selectedIndex = -1
}: Props) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div>
            <aside
                className="fixed h-full top-16 transition-all duration-300 ease-in-out flex flex-col pt-4"
                style={{
                    width: isSidebarOpen ? sidebarWidth : "70px",
                    backgroundColor: bgColor,
                    color: textColor,
                    boxShadow: "0 0 15px rgba(0, 0, 0, 0.7)",
                }}
            >
                <nav className="flex-1 overflow-y-auto">
                    <ul className="space-y-2 p-0 m-0">
                        {links.map((link, index) => {
                            const isActive = hoveredIndex === index || selectedIndex === index;

                            return (
                                <li
                                    key={index}
                                    onClick={() => {
                                        onSelect(index);
                                        setHoveredIndex(index);
                                    }}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    className={`w-full cursor-pointer flex items-center transition-all duration-200
                                        hover:bg-purple-100 hover:text-[#5B005B] hover:font-bold
                                        ${isActive ? "bg-purple-100 text-[#5B005B] font-bold" : ""}`}
                                    style={{ boxSizing: "border-box" }}
                                >
                                    <div className="p-2 pl-6 flex items-center w-full rounded">
                                        {getIconComponent({
                                            iconName: link.icon,
                                            iconSize: 24,
                                            iconColor: isActive ? "#5B005B" : "currentColor"
                                        })}
                                        <span
                                            className={`ml-2 transition-all duration-300 overflow-hidden whitespace-nowrap ${
                                                isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                                            }`}
                                        >
                                            {link.linkName}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
        </div>
    );
}

export default Sidebar;
