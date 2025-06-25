import React, { useState, useContext } from 'react';

import { useTranslation } from 'react-i18next';
import { AppContext } from '../provider/AppContext';
import { toast } from 'react-toastify';

const ForgotPassword: React.FC = () => {
  const [nic, setNic] = useState('');
  // Removed showSuccess state as we'll use toast for success messages
  const [loading, setLoading] = useState(false);
  const { backendUrl } = useContext(AppContext);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nic })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send email');
      toast.success('Password reset link has been sent to your email.');
      setNic(''); // Clear the input field
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative">
      <div className="w-full max-w-md bg-white p-8 rounded shadow z-0">
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-800">{t('Forgot Password')}</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">{t('Enter your NIC to receive a password reset link')}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t('Enter your NIC')}
            value={nic}
            onChange={(e) => setNic(e.target.value)}
            required
            className="w-full mb-4 p-2 border border-gray-300 rounded-full px-4"
          />
          <button
            type="submit"
            className="w-full bg-purple-700 hover:bg-purple-800 text-white p-2 rounded"
            disabled={loading}
          >
            {loading ? t('Sending...') : t('Send Reset Link to My Email')}
          </button>
        </form>
      </div>

      {/* Success message is now handled by toast */}
    </div>
  );
};

export default ForgotPassword;
