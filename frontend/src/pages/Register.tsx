import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginAssets } from '../assets/icons/login/login';
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

  const [formData, setFormData] = useState({
    empId: '',
    username: '',
    email: '',
    password: '',
    role: '',
    description: '',
    districtId: 0,
    skillId: 0,
    attachment: null as File | null
  });
  
  const [showSkills, setShowSkills] = useState(false);

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
        ...(name === 'role' && value !== 'technical_officer' && { skillId: 0 })
      };
      
      // If role is changed to a head office role, set district to Colombo Head Office
      if (name === 'role') {
        if (headOfficeRoles.includes(value)) {
          const colomboDistrict = districts.find(d => d.name === 'Colombo Head Office');
          if (colomboDistrict) {
            newFormData.districtId = colomboDistrict.id;
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
  
  const handleSkillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const skillId = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      skillId
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, attachment: file });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.empId) {
      toast.error('Employee ID is required');
      return;
    }

    if (formData.role === 'technical_officer' && !formData.skillId) {
      toast.error('Please select a skill');
      return;
    }

    if (!formData.districtId) {
      toast.error('Please select a district');
      return;
    }
    
    // Create the FormData object for submission
    const payload = new FormData();
    
    try {
      // First, create a regular object for debugging
      const debugData = {
        empId: formData.empId,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        districtId: formData.districtId,
        skillId: formData.skillId,
        description: formData.description || ''
      };
      
      console.log('Form data being submitted:', debugData);
      
      // Add form data to payload
      payload.append('empId', formData.empId);
      payload.append('username', formData.username);
      payload.append('email', formData.email);
      payload.append('password', formData.password);
      payload.append('role', formData.role);
      payload.append('districtId', formData.districtId.toString());
      
      // Add skillId only for technical officers
      if (formData.role === 'technical_officer') {
        payload.append('skillId', formData.skillId.toString());
      } else {
        // Set a default skill ID for non-technical roles if needed
        payload.append('skillId', '1'); // Adjust this based on your default skill ID
      }
      
      // Add description
      payload.append('description', formData.description || '');
      
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
              name="empId"
              placeholder="Employee ID"
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-full mb-3"
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
              value={formData.districtId || ''}
              onChange={(e) => setFormData({...formData, districtId: parseInt(e.target.value)})}
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
            
            {/* Skills dropdown - only shown for Technical Officer role */}
            {formData.role === 'technical_officer' && (
              <select
                name="skillId"
                value={formData.skillId || ''}
                onChange={handleSkillChange}
                className="w-full border px-4 py-2 rounded-full mb-3"
                required={formData.role === 'technical_officer'}
                disabled={isLoading}
              >
                <option value="">-- Select Skill --</option>
                {skills.map(skill => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
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
