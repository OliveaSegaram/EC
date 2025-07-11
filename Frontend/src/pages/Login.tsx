import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../provider/AuthProvider';
import { AppContext } from '../provider/AppContext';
import { LoginAssets } from '../assets/icons/login/login';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Button from '../components/ui/buttons/Button';

const Login = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const { backendUrl } = React.useContext(AppContext);

  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotNic, setForgotNic] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const { t } = useTranslation();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nic || !password) {
      toast.error(t('NIC and password are required'));
      return;
    }
    
    // Validate NIC format
    if (!/^(\d{12}|\d{9}[vVxX])$/.test(nic)) {
      toast.error(t('Please enter a valid NIC'));
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nic, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Debug log to check the role value
      console.log('Login response data:', data);
      const userRole = data.role || data.user?.role;
      console.log('User role from login:', userRole);

      // Set token and user data through AuthProvider
      setToken(data.token, {
        username: data.username || data.user?.username,
        role: userRole,
      });
      
      // Redirect to the intended URL or default dashboard
      const from = location.state?.from?.pathname || `/dashboard/${userRole}`;
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotNic) {
      toast.error('Please enter your NIC');
      return;
    }
    
    // Validate NIC format
    if (!/^(\d{12}|\d{9}[vVxX])$/.test(forgotNic)) {
      toast.error('Please enter a valid NIC');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nic: forgotNic })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      toast.success('Check your inbox for the reset link.');
      setForgotMsg('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">

      {/* Login Form */}
      <div className={`flex rounded-xl overflow-hidden shadow-[0px_0px_35px_rgba(138,31,231,0.4)] ${showForgotModal ? 'blur-sm pointer-events-none' : ''}`}>

        {/* Left welcome section  */}
        <div className="bg-gradient-to-b from-[#6E2F74] to-[#24012B] text-white px-10 py-8 w-96 flex flex-col justify-center items-center">
          <img src={LoginAssets.Logo} className="w-16 h-16 mb-3" alt="logo" />
          <p className="text-sm">මැතිවරණ කොමිෂන් සභාව</p>
          <p className="text-sm">தேர்தல் ஆணைக்குழு</p>
          <p className="text-sm mb-2">Election Commission</p>
          <p className="text-xl font-bold text-center w-full">{t('Issue Tracking Management System')}</p>
    
        </div>

        {/* Right form section */}
        <div className="bg-white p-10 w-96">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">{t('Login')}</h2>
          <p className="text-center text-gray-500 text-sm mb-6">{t('Login to your account')}</p>

          <form onSubmit={handleSubmit}>
            <div className="flex items-center mb-4 border border-gray-300 rounded-lg px-3 py-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-colors">
              <img src={LoginAssets.User} alt="user" className="w-5 h-5 mr-2" />
              <input
                type="text"
                placeholder={t('NIC Number')}
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                className="w-full bg-transparent outline-none"
                required
              />
            </div>

            <div className="flex items-center mb-4 border border-gray-300 rounded-lg px-3 py-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-colors">
              <img src={LoginAssets.Padlock} alt="lock" className="w-5 h-5 mr-2" />
              <input
                type="password"
                placeholder={t('Password')}
                className="flex-1 bg-transparent outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <p
              className="text-sm text-blue-600 text-right mb-4 cursor-pointer"
              onClick={() => setShowForgotModal(true)}
            >
              {t('Forgot password?')}
            </p>

            <Button
              buttonText={t('Login')}
              buttonType="submit"
              buttonColor="#5B005B"
              textColor="white"
              buttonStyle={2}
              className="w-full py-2 text-xl"
            />

            <p className="text-center text-sm mt-4">
              {t("Don't have an account?")}{' '}
              <span
                className="text-purple-700 font-semibold cursor-pointer"
                onClick={() => navigate('/register')}
              >
                {t('Register here')}
              </span>
            </p>
          </form>
        </div>
      </div>

      {/*  Forgot Password Modal Overlay */}
      {showForgotModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white/90 p-6 rounded-xl shadow-xl w-80 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-purple-700 mb-4">{t('Reset Password')}</h3>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder={t('Please enter your NIC number')}
                  value={forgotNic}
                  onChange={(e) => setForgotNic(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A1FE7] bg-white/80"
                />
              </div>
              <div className="pt-2">
                <Button
                  buttonType="submit"
                  buttonText={t('Send Email')}
                  buttonColor="#5B005B"
                  buttonStyle={2}
                  className="w-full"
                />
              </div>
              {forgotMsg && <p className="text-sm text-green-600">{forgotMsg}</p>}
            </form>
            <button
              className="text-sm text-blue-600 hover:underline mt-3"
              onClick={() => {
                setShowForgotModal(false);
                setForgotMsg('');
              }}
            >
              {t('Back')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
