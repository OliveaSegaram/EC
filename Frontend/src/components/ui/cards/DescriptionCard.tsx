type Props = {
    title: string; // Title of the card
    description: string; //Description of the card
};
function DescriptionCard({ title, description }: Props) {
    return (
        <div className="cursor-pointer bg-white shadow-md rounded-sm p-4 transform transition duration-150 hover:scale-102 hover:shadow-xl">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    )
}

export default DescriptionCard