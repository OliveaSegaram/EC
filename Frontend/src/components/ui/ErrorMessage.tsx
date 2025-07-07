interface ErrorMessageProps {
    message?: string; //The error message (optional)
}

const ErrorMessage = ({ message }: ErrorMessageProps) => {
    return (
        <p className="h-5 mt-1 mb-1 text-xs  text-rose-400">{message ? message : null}</p>
    )
};

export default ErrorMessage;