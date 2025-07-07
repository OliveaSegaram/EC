import { useTranslation } from "react-i18next"; //Import internationalization


type FooterProps = {
    organization?: string; // E.g. "Election commission of Sri Lanka" 
    devUnit?: string; //E.g "Team who developed the system"
    textColor?: string; //E.g: #FFFFFF
    bgColor?: string; // E.g: #5B015B
    footerHeight?: number; //Footer height
    textSize?: number; // Font size
    className?: string; //Adding className so can add tailwind css
};

function Footer({ organization = "Election Commission of Sri Lanka", devUnit = "Developed by the IT Unit", textColor = "#FFFFFF", bgColor = "#5B015B", footerHeight = 42, textSize = 12, className }: FooterProps) {
    const { t } = useTranslation();
    const Version = import.meta.env.VITE_VERSION; // Software version
    const Srv = import.meta.env.VITE_SRV;
    return (
        <div>
            {/* Responsive Footer */}
            <footer
                className={`flex items-center justify-center p-4 text-center relative w-full ${className}`}
                style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    height: footerHeight,
                    fontSize: textSize,
                }}
            >
                <p>© {new Date().getFullYear()} {t(organization)} | {devUnit} | All rights reserved | Version {Version} | Srv {Srv} </p>
            </footer>
        </div >
    )
}

export default Footer
