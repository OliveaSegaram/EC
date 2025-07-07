import React, { useState, useRef, useEffect } from 'react';

interface UserAvatarProps {
    username: string;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    onLogout?: () => void;
    onChangeLanguage?: (lang: string) => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
    username,
    size = 'md',
    color = 'bg-white',
    onLogout,
    onChangeLanguage
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);

    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-11 h-11 text-xl',
        lg: 'w-12 h-12 text-2xl'
    };

    const firstLetter = username?.charAt(0).toUpperCase() || '?';

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
                avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = () => {
        onLogout?.();
        setIsMenuOpen(false);
    };

    const handleLanguageClick = (lang: string) => {
        onChangeLanguage?.(lang);
        setIsMenuOpen(false);
    };

    return (
        <div className="flex items-center gap-3 relative">
            {/* 3D Avatar Circle */}
            <div
                ref={avatarRef}
                className={`
          rounded-full flex items-center justify-center 
          font-bold text-[#5B005B]
          ${color}
          ${sizeClasses[size]}
          shadow-[0_0_0_2px_rgba(255,255,255,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]
          transition-all duration-300 ease-in-out
          hover:rotate-y-5 hover:scale-105
          hover:shadow-[0_0_0_4px_rgba(255,255,255,0.2),0_10px_15px_-3px_rgba(0,0,0,0.2),0_4px_6px_-2px_rgba(0,0,0,0.1)]
          cursor-pointer
        `}
                aria-label={`Avatar of ${username}`}
                onClick={toggleMenu}
            >
                {firstLetter}
            </div>

            {/* Username */}
            <span className="text-white font-medium">
                {username}
            </span>

            {/* Dropdown Menu */}
            {isMenuOpen && (
                <div
                    ref={menuRef}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                >
                    <button
                        onClick={() => handleLanguageClick('en')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-100"
                    >
                        Change Language
                    </button>
                    <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-100 border-t border-gray-100"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserAvatar;