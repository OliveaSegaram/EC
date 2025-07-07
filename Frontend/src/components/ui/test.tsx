import { useState } from 'react';

function SubmitButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate async operation (e.g. API call)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // your actual form submission logic here
    } catch (error) {
      console.error("Submit failed", error);
    }

    setIsSubmitting(false);
  };

  return (
    <div className='flex-col space-y-12'>
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 01-8 8z"
            />
          </svg>
        ) : (
          'Submit'
        )}
      </button>
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          </div>
        ) : (
          'Submit'
        )}

      </button>
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-[#3B0043] text-white rounded hover:bg-[#5B005B] disabled flex items-center justify-center"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          'Submit'
        )}
      </button>
    </div >
  );
}

export default SubmitButton;
