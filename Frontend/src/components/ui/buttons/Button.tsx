// Developed by: D.W.M.T.R. Dissanayaka (ICT Officer)
// Date created: 2025.06.20

import { useState } from 'react'
import getIconComponent from '../IconMapper';

type Props = {
    buttonText: string; // Button text
    buttonColor?: string; // Button color (E.g: #3B0043)
    buttonStyle?: number; // Choose the button style (Two stlyes, 1 = Regular button, 2 = Action button)
    textColor?: string; // Button text color
    iconName?: string; // Input MUI icon name
    iconSize?: number; // Icon size, default is 32
    className?: string; // Extended styles
    onClick?: (e: React.MouseEvent) => void; // Handle submit with event parameter
    buttonType?: 'button' | 'submit' | 'reset'; // E.g: 'button' or 'submit'
    disabled?: boolean; // Whether the button is disabled
    reverseIcons?: boolean; // Whether to reverse the order of icon and text
};

function Button({ buttonText, buttonType = "button", textColor = "red", buttonColor = "#3B0043", buttonStyle = 1, iconName, iconSize, className, onClick, disabled = false, reverseIcons = false }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate async operation (e.g. API call)
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            await onClick?.(e);
            // your actual form submission logic here
        } catch (error) {
            console.error("Submit failed", error);
        }

        setIsSubmitting(false);
    };

    const isButtonDisabled = disabled || isSubmitting;
    
    return (
        <div>
            <button
                type={buttonType}
                onClick={buttonType === 'button' ? (e) => handleSubmit(e) : undefined}
                className={buttonStyle === 1 
                    ? `cursor-pointer px-4 py-2 bg-white border-2 border-[${buttonColor}] text-[${textColor}] rounded hover:border-2 hover:border-[#6E2F74] hover:text-[#6E2F74] hover:font-medium disabled:cursor-default flex items-center justify-center duration-300 h-[42px] transition-all ${
                        isButtonDisabled ? 'opacity-70' : 'hover:scale-[1.02] hover:shadow-sm'
                      } ${className}`
                    : `cursor-pointer px-4 py-2 text-white rounded-sm disabled:cursor-default flex items-center justify-center duration-300 h-[42px] transition-all ${className} ${
                        isButtonDisabled ? 'opacity-70' : 'hover:scale-105 hover:shadow-md'
                      }`}
                style={buttonStyle === 2 ? { backgroundColor: buttonColor } : {}}
                disabled={isButtonDisabled}
            >
                <div className={`flex items-center gap-2 w-full justify-center ${reverseIcons ? 'flex-row-reverse' : ''}`}>
                    {isSubmitting ? (
                        <div className={`w-5 h-5 border-2 border-[${textColor}] border-t-transparent rounded-full animate-spin`} />
                    ) : (
                        <>
                            {iconName && !reverseIcons &&
                                getIconComponent({
                                    iconName,
                                    iconSize,
                                    iconColor: textColor,
                                })}
                            <span>{buttonText}</span>
                            {iconName && reverseIcons &&
                                getIconComponent({
                                    iconName,
                                    iconSize,
                                    iconColor: textColor,
                                })}
                        </>
                    )}
                </div>
            </button>
        </div >
    )
}

export default Button