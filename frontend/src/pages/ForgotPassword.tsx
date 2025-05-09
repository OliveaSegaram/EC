import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send email');
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative">
      {/* Background blur if modal is open */}
      <div className={`${showSuccess ? 'blur-sm pointer-events-none' : ''} transition-all w-full max-w-md bg-white p-8 rounded shadow z-0`}>
        <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mb-4 p-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            className="w-full bg-purple-700 hover:bg-purple-800 text-white p-2 rounded"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="absolute z-10 inset-0 flex items-center justify-center">
          <div className="bg-white shadow-lg rounded-lg p-6 w-80 text-center">
            <h3 className="text-xl font-semibold mb-2 text-purple-800">Link Sent!</h3>
            <p className="text-sm mb-4 text-gray-600">Please check your email for the password reset link.</p>
            <button
              onClick={() => {
                setShowSuccess(false);
                navigate('/login');
              }}
              className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
