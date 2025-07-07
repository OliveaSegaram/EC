import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
    lang1?: string; // 1st language
    lang2?: string; // 2nd language
    lang3?: string; //3rd language
    paddingLeft?: string; // padding left
    paddingRight?: string; // padding right
}

const LanguageButton = ({ lang1 = "English", lang2 = "සිංහල", lang3 = "தமிழ்", paddingLeft = "pl-3", paddingRight = "pr-10" }: Props) => {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

    // Update local state when i18n language changes
    useEffect(() => {
        setCurrentLanguage(i18n.language);
    }, [i18n.language]);

    const changeLanguage = async (lng: string) => {
        console.log('Attempting to change language to:', lng);
        try {
            await i18n.changeLanguage(lng);
            console.log('Language change initiated for:', lng);
            // The i18n.changeLanguage will trigger a re-render of all components using translations
        } catch (error) {
            console.error('Failed to change language:', error);
        }
    };

    return (
        <div className="relative">
            <select
                id="language-select"
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className={`cursor-pointer appearance-none bg-white border border-gray-300 text-gray-700 text-sm rounded-full ${paddingLeft} ${paddingRight} py-1.5 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6E2F74] transition duration-200`}
            >
                <option value="en">{lang1}</option>
                <option value="si">{lang2}</option>
                <option value="ta">{lang3}</option>
            </select>

            {/* Dropdown Arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    )
}

export default LanguageButton;