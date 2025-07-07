import { useAuth } from "../../provider/AuthProvider";
import { useNavigate } from 'react-router-dom';
import Avatar from "./Avatar";
import LanguageButton from "../ui/buttons/LanguageButton";
import { useTranslation } from 'react-i18next';

type Props = {
    title: string; // Title of the content, e.g., 'Dashboard' (This will be displayed at the top left of the window)
    setSidebarOpen: () => void;
    bgColor?: string; // Background color
};

function AppBar({ title, setSidebarOpen, bgColor = "#24012B" }: Props) {
    const { user, setToken } = useAuth();
    const navigate = useNavigate();
    const { i18n } = useTranslation();

    const handleLogout = () => {
        setToken(null);
        navigate('/login');
    };

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    return (
        <div>
            <header 
                className="text-white p-4 fixed w-full top-0 z-10 flex justify-between items-center"
                style={{
                    backgroundColor: bgColor,
                    borderBottom: "0.75px solid rgba(255, 255, 255, 0.7)",
                    borderColor: "white",
                    boxShadow: "0 0 15px rgba(0, 0, 0, 0.7)",
                }}
            >
                <div className="flex items-center space-x-9">
                    <button
                        className="pl-2 cursor-pointer block text-white text-2xl"
                        onClick={setSidebarOpen}
                        aria-label="Toggle sidebar"
                    >
                        ☰
                    </button>
                    <h1 className="text-xl font-bold">{title}</h1>
                </div>
                <div className="flex items-center space-x-4 pr-4">
                    <LanguageButton 
                        lang1="EN" 
                        lang2="සිං" 
                        lang3="தமி" 
                        paddingLeft="pl-2" 
                        paddingRight="pr-6" 
                    />
                    <Avatar 
                        username={user?.username || 'User'} 
                        size="md"
                        onLogout={handleLogout}
                        onChangeLanguage={handleLanguageChange}
                    />
                </div>
            </header>
        </div>
    );
}

export default AppBar
