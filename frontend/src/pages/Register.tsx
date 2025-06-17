import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed unused LoginAssets import
import { useAppContext } from '../provider/AppContext';
import { toast } from 'react-toastify';

interface District {
  id: number;
  name: string;
}

interface Skill {
  id: number;
  name: string;
}

const Register = () => {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<District[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch districts and skills on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [districtsRes, skillsRes] = await Promise.all([
          fetch(`${backendUrl}/districts`),
          fetch(`${backendUrl}/skills`)
        ]);

        if (!districtsRes.ok || !skillsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const districtsData = await districtsRes.json();
        const skillsData = await skillsRes.json();

        setDistricts(districtsData);
        setSkills(skillsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please refresh the page.');
        toast.error('Failed to load registration form data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [backendUrl]);

  interface FormData {
    nic: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
    districtId: string;
    skillId: string;
    description: string;
    attachment: File | null;
  }

  const [formData, setFormData] = useState<FormData>({
    nic: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    districtId: '',
    skillId: '',
    description: '',
    attachment: null
  });
  
  const [, setShowSkills] = useState(false); // Keep setShowSkills for potential future use

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Define roles that should use Colombo Head Office
    const headOfficeRoles = ['super_admin', 'super_user', 'technical_officer'];
    
    // Update form data
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value,
        // Reset skillId when role changes to non-technical
        ...(name === 'role' && value !== 'technical_officer' && { skillId: '' })
      };
      
      // If role is changed to a head office role, set district to Colombo Head Office
      if (name === 'role') {
        if (headOfficeRoles.includes(value)) {
          const colomboDistrict = districts.find(d => d.name === 'Colombo Head Office');
          if (colomboDistrict) {
            newFormData.districtId = colomboDistrict.id.toString();
          }
        }
      }
      
      return newFormData;
    });
    
    // Show skills section only for Technical Officer role
    if (name === 'role') {
      setShowSkills(value === 'technical_officer');
    }
  };
  
  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      skillId: checked ? value : ''
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, attachment: file });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validateForm = () => {
      const { nic, password, confirmPassword, districtId } = formData;
      
      if (!nic.trim()) {
        setError('NIC is required');
        return false;
      }

      if (formData.role === 'technical_officer' && !formData.skillId) {
        toast.error('Please select a skill');
        return false;
      }

      if (!districtId) {
        toast.error('Please select a district');
        return false;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }

      return true;
    };

    if (!validateForm()) return;

    // Create the FormData object for submission
    const payload = new FormData();
    
    try {
      // First, create a regular object for debugging
      const debugData = {
        nic: formData.nic,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        districtId: formData.districtId,
        skillId: formData.role === 'technical_officer' ? formData.skillId : '1',
        description: formData.description
      };
      
      console.log('Form data being submitted:', debugData);
      
      // Add form data to payload
      payload.append('nic', formData.nic);
      payload.append('username', formData.username);
      payload.append('email', formData.email);
      payload.append('password', formData.password);
      payload.append('role', formData.role);
      payload.append('districtId', formData.districtId);
      
      // Add skillId (use default '1' for non-technical roles)
      payload.append('skillId', formData.role === 'technical_officer' ? formData.skillId : '1');
      
      // Add description if provided
      if (formData.description) {
        payload.append('description', formData.description);
      }
      
      // Add attachment if exists
      if (formData.attachment) {
        payload.append('document', formData.attachment);
      }
      
      // Log the FormData entries for debugging
      for (let pair of payload.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
    } catch (error) {
      console.error('Error preparing form data:', error);
      toast.error('Error preparing form data');
      return;
    }
    

    try {
      console.log('Sending registration data to:', `${backendUrl}/auth/register`);

      const response = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        body: payload
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const err = await response.json();
        console.error('Registration error:', err);
        throw new Error(err.message || 'Registration failed');
      }

      toast.success('Registration submitted! Wait for root approval.');
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Registration failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center p-6 max-w-md mx-4 bg-red-50 rounded-lg">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Form</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
      <div className="flex drop-shadow-[0_10px_15px_rgba(139,92,246,0.4)] rounded-xl overflow-hidden">

        {/* Left form section */}
        <div className="bg-white p-10 w-96">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">Register</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Create a new account</p>

          <form onSubmit={handleSubmit}>
            <input
              name="nic"
              type="text"
              value={formData.nic}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-full mb-3"
              placeholder="NIC Number"
              required
            />
            
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

            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
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
            
            <select
              name="districtId"
              value={formData.districtId}
              onChange={(e) => setFormData({...formData, districtId: e.target.value})}
              className="w-full border px-4 py-2 rounded-full mb-3"
              required
              disabled={isLoading || ['super_admin', 'super_user', 'technical_officer'].includes(formData.role)}
            >
              <option value="">-- Select District --</option>
              {districts.map(district => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>

            {/* District info message for head office roles */}
            {['super_admin', 'super_user', 'technical_officer'].includes(formData.role) && (
              <p className="text-sm text-gray-500 mb-2 ml-1">
                District is automatically set to Colombo Head Office for this role
              </p>
            )}
            
            {/* Skills checkboxes - only shown for Technical Officer role */}
            {formData.role === 'technical_officer' && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2 ml-1">Select your skills *</p>
                <div className="grid grid-cols-2 gap-2">
                  {skills.map(skill => (
                    <label key={skill.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="skillId"
                        value={skill.id}
                        checked={formData.skillId === skill.id.toString()}
                        onChange={handleSkillChange}
                        className="rounded text-purple-600 focus:ring-purple-500"
                        required={formData.role === 'technical_officer' && skills.length > 0}
                      />
                      <span className="text-sm">{skill.name}</span>
                    </label>
                  ))}
                </div>
                {formData.role === 'technical_officer' && !formData.skillId && (
                  <p className="mt-1 text-sm text-red-500">Please select at least one skill</p>
                )}
              </div>
            )}

            <textarea
              name="description"
              placeholder="Enter a short description or reason for registering"
              value={formData.description}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-xl mb-3 resize-none"
              rows={4}
            />

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
