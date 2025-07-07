import getIconComponent from '../IconMapper';

// Developed by: D.W.M.T.R. Dissanayaka (ICT Officer)
// Date created: 2025.06.20 

type Props = {
    iconName?: string; // Input MUI icon name
    iconSize?: number; // Icon size, default is 32
    iconColor?: string // Icon color E.g.: #FFFFFF
    placeHolder?: string; // Placeholder text
    textBoxType?: string; // Type of the textbox (E.G.: text of password)
    value?: string; // Value
    min?: number; // Minimum number of characters allowed
    max?: number; // Minimum number of characters allowed
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
};

function Textbox({ iconName, iconSize = 32, iconColor, placeHolder = "", textBoxType = "text", value, onChange, min, max, required = false }: Props) {
    return (
        <div className="mb-3 flex items-center w-full px-3 py-2.5 rounded-sm border border-gray-300">
            {iconName && getIconComponent({ iconName: iconName, iconSize: iconSize, iconColor: iconColor })}
            <input
                type={textBoxType}
                className="bg-transparent outline-none"
                placeholder={placeHolder}
                minLength={min}
                maxLength={max}
                required={required}
                value={value}
                onChange={onChange}
            />
        </div>
    )
}

export default Textbox