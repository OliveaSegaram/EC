import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../provider/AuthProvider';
import { AppContext } from '../provider/AppContext';
import { LoginAssets } from '../assets/icons/login/login';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const { backendUrl, setIsLoggedIn } = React.useContext(AppContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hover, setHover] = useState(false);

  //  Added forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      setToken(data.token);
      setIsLoggedIn(true);
      navigate(`/dashboard/${data.role}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4 relative">
      {/* Login Form */}
      <div className={`flex rounded-xl overflow-hidden shadow-[0px_0px_35px_rgba(138,31,231,0.4)] ${showForgotModal ? 'blur-sm pointer-events-none' : ''}`}>

        {/* Left form section */}
        <div className="bg-white p-10 w-96">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">Login</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Login to your account</p>

          <form onSubmit={handleSubmit}>
            <div className="flex items-center mb-4 border rounded-full px-3 py-2">
              <img src={LoginAssets.User} alt="user" className="w-5 h-5 mr-2" />
              <input
                type="email"
                placeholder="E-Mail"
                className="flex-1 bg-transparent outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center mb-4 border rounded-full px-3 py-2">
              <img src={LoginAssets.Padlock} alt="lock" className="w-5 h-5 mr-2" />
              <input
                type="password"
                placeholder="Password"
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
              Forgot password?
            </p>

            <button
              type="submit"
              className="w-full py-2 rounded-full text-white text-xl bg-gradient-to-b from-purple-600 to-purple-900 shadow-md transition duration-300 hover:shadow-lg"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              Login
            </button>

            <p className="text-center text-sm mt-4">
              Don't have an account?{' '}
              <span
                className="text-purple-700 font-semibold cursor-pointer"
                onClick={() => navigate('/register')}
              >
                Register
              </span>
            </p>
          </form>
        </div>

        {/* Right welcome section */}
        <div className="bg-gradient-to-b from-[#8A1FE7] to-[#1C0267] text-white px-10 py-8 w-96 flex flex-col justify-center items-center">
          <img src={LoginAssets.Logo} className="w-16 h-16 mb-3" alt="logo" />
          <p className="text-sm">මැතිවරණ කොමිෂන් සභාව</p>
          <p className="text-sm">தேர்தல் ஆணைக்குழு</p>
          <p className="text-sm mb-2">Election Commission</p>
          <h2 className="text-xl font-bold">Welcome</h2>
          <p className="text-center text-sm mt-1">Issue Management System</p>
        </div>
      </div>

      {/*  Forgot Password Modal Overlay */}
      {showForgotModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
            <h3 className="text-lg font-semibold text-purple-700 mb-2">Reset Password</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch(`${backendUrl}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: forgotEmail }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message);
                  setForgotMsg('Check your inbox for the reset link.');
                } catch (err: any) {
                  setForgotMsg(err.message || 'Failed to send reset email.');
                }
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full p-2 mb-3 border rounded"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-purple-700 text-white py-2 rounded mb-2"
              >
                Send Reset Link
              </button>
              {forgotMsg && <p className="text-sm text-green-600">{forgotMsg}</p>}
            </form>
            <button
              className="text-sm text-blue-600 hover:underline mt-3"
              onClick={() => {
                setShowForgotModal(false);
                setForgotMsg('');
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
