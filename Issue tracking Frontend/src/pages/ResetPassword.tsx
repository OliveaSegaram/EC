import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../provider/AppContext';

const ResetPassword: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const { backendUrl } = useContext(AppContext);
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      setError(t('Passwords do not match'));
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(true);
      setError('');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-800">{t('Reset Password')}</h2>

        {success ? (
          <p className="text-green-600 text-center">{t('Password updated! Redirecting to login...')}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder={t('New Password')}
              className="w-full mb-4 p-3 border border-gray-300 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder={t('Confirm Password')}
              className="w-full mb-4 p-3 border border-gray-300 rounded"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

            <button
              type="submit"
              className="w-full py-2 bg-purple-700 text-white rounded hover:bg-purple-800"
            >
              {t('Update Password')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
