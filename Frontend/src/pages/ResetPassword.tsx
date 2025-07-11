import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../provider/AppContext';
import { toast } from 'react-toastify';
import Button from '../components/ui/buttons/Button';

const ResetPassword: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { backendUrl } = useContext(AppContext);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    if (password !== confirm) {
      toast.error(t('Passwords do not match'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${backendUrl}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      
      toast.success('Password has been reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-800">{t('Reset Password')}</h2>

        {isSubmitting ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Updating password...</p>
          </div>
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



            <Button
              buttonType="submit"
              buttonText={t('Update Password')}
              buttonColor="#5B005B"
              buttonStyle={2}
              className="w-full"
              disabled={isSubmitting}
            />
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
