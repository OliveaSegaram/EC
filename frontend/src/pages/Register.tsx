import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginAssets } from '../assets/icons/login/login';
import { useAppContext } from '../provider/AppContext';
import { toast } from 'react-toastify';

const Register = () => {
    const { backendUrl } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
    description:'',
    attachment: null as File | null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, attachment: file });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (key === 'attachment' && val) {
        payload.append('document', val as Blob); 
      } else {
        payload.append(key, val as string);
      }
    });
    

    try {
      const response = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        body: payload
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Registration failed');
      }

      toast.success('Registration submitted! Wait for root approval.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
      <div className="flex drop-shadow-[0_10px_15px_rgba(139,92,246,0.4)] rounded-xl overflow-hidden">

        {/* Left form section */}
        <div className="bg-white p-10 w-96">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">Register</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Create a new account</p>

          <form onSubmit={handleSubmit}>
            <input
              name="username"
              placeholder="Username"
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-full mb-3"
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-full mb-3"
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-full mb-3"
              required
            />
             <p className="text-sm text-gray-600 mb-1 ml-1">
                  Select your role as per your position*,
             </p>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-full mb-3"
              required
            >
              <option value="">-- Select Role --</option>
              <option value="subject_clerk">Subject Clerk</option>
              <option value="super_user">Super User</option>
              <option value="technical_officer">Technical Officer</option>
              <option value="dc">DC</option>
              <option value="other">Other</option>
            </select>
            <textarea
              name="description"
              placeholder="Enter a short description or reason for registering"
              rows={4}
              onChange={handleChange}
              value={formData.description}
              className="w-full border px-4 py-2 rounded-xl mb-3 resize-none"/>

            <input
              type="file"
              name="document"
              onChange={handleFileChange}
              className="mb-3"
              required
            />

            <button
              type="submit"
              className="w-full py-2 rounded-full text-white text-xl bg-gradient-to-b from-purple-600 to-purple-900 shadow-md transition duration-300 hover:shadow-lg"
            >
              Register
            </button>

            <p className="text-center text-sm mt-4">
              Already have an account?{' '}
              <span className="text-purple-700 font-semibold cursor-pointer" onClick={() => navigate('/login')}>
                Login
              </span>
            </p>
          </form>
        </div>

        
        
      </div>
    </div>
  );
};

export default Register;
