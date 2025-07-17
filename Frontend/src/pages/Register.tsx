import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../provider/AppContext';
import { toast } from 'react-toastify';
import Button from '../components/ui/buttons/Button';

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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<District[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng)
      .then(() => {
        console.log('Language changed successfully to:', lng);
      })
      .catch(error => {
        console.error('Failed to change language:', error);
      });
  };

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
    skillIds: string[]; // Changed from skillId to skillIds
    branch: string;
    description: string;
    attachment: File | null;
  }

  // List of branches for Colombo Head Office
  const branches = [
    'Parliament Branch',
    'Local Bodies Branch',
    'Legal Investigation and Planning Branch',
    'Admin Branch',
    'Finance Branch',
    'Establishment Branch / Transport Branch',
    'Supplies Branch',
    'ICT Branch',
    'Language Policy Implementation Branch',
    'Internal Audit Branch'
  ];

  const [formData, setFormData] = useState<FormData>({
    nic: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    districtId: '',
    skillIds: [], // Changed from skillId to skillIds
    branch: '',
    description: '',
    attachment: null
  });
  const [fileTouched, setFileTouched] = useState(false);

  const [, setShowSkills] = useState(false); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Define roles that should use Colombo Head Office
    const headOfficeRoles = ['super_admin', 'super_user', 'technical_officer'];

    // Update form data
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value,
        // Reset skillIds when role changes to non-technical
        ...(name === 'role' && value !== 'technical_officer' && { skillIds: [] })
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

      return newFormData as FormData;
    });

    // Show skills section only for Technical Officer role
    if (name === 'role') {
      setShowSkills(value === 'technical_officer');
    }
  };

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const currentSkills = Array.isArray(prev.skillIds) ? [...prev.skillIds] : [];
      
      if (checked) {
        // Add skill if checked and not already in the array
        if (!currentSkills.includes(value)) {
          return { ...prev, skillIds: [...currentSkills, value] };
        }
      } else {
        // Remove skill if unchecked
        return { ...prev, skillIds: currentSkills.filter(id => id !== value) };
      }
      
      return prev;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, attachment: file }));
    if (!fileTouched) setFileTouched(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check file attachment
    if (!formData.attachment) {
      setFileTouched(true);
      return;
    }
    
    // Check if form is valid using HTML5 validation
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const validateForm = () => {
      const { nic, password, confirmPassword, role, skillIds, districtId } = formData;
      
      const requiredFields = ['nic', 'username', 'email', 'password', 'confirmPassword', 'role', 'districtId'];
      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          toast.error(`Please fill in all required fields. Missing: ${field}`);
          return false;
        }
      }

      // NIC validation: 12 digits OR 9 digits followed by v/V/x/X
      const nicRegex = /^(\d{12}|\d{9}[vVxX])$/;
      if (!nicRegex.test(nic)) {
        toast.error('Please enter a valid NIC (12 digits or 9 digits followed by v/V/x/X)');
        return false;
      }

      if (role === 'technical_officer') {
        if (!skillIds || (Array.isArray(skillIds) && skillIds.length === 0)) {
          toast.error('Please select at least one skill');
          return false;
        }
      }

      if (!districtId) {
        toast.error('Please select a district');
        return false;
      }

      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
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
        skillIds: formData.role === 'technical_officer' ? formData.skillIds : ['1'],
        description: formData.description
      };

      console.log('Form data being submitted:', debugData);

      // Add form data to payload
      payload.append('nic', formData.nic);
      payload.append('username', formData.username);
      payload.append('email', formData.email);
      payload.append('password', formData.password);
      payload.append('role', formData.role);
      
      // Add branch if available
      if (formData.branch) {
        payload.append('branch', formData.branch);
      }
      
      // Always include districtId, it will be set to Colombo Head Office for relevant roles
      const districtIdToSend = formData.districtId || 
        (['super_admin', 'super_user', 'technical_officer'].includes(formData.role) && 
         districts.find(d => d.name === 'Colombo Head Office')?.id);
      
      if (districtIdToSend) {
        payload.append('districtId', districtIdToSend.toString());
      }

      // Add skillIds (use default '1' for non-technical roles)
      if (formData.role === 'technical_officer') {
        // Convert array of skill IDs to comma-separated string
        const skillIds = Array.isArray(formData.skillIds) ? formData.skillIds.join(',') : '';
        payload.append('skillIds', skillIds);
      } else {
        // For non-technical roles, set default skill ID
        payload.append('skillIds', '1');
      }

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

      toast.success('Registration submitted! Wait for super admin approval.');
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
          <p className="mt-4 text-gray-600">{t('Loading registration form...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    toast.error(error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center p-6 max-w-md mx-4 bg-red-50 rounded-lg">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-700 mb-2">{t('Error Loading Form')}</h2>
          <p className="text-gray-600 mb-4">An error occurred while loading the form. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            {t('Try Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4 z-50">
        <select 
          value={i18n.language} 
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="p-2 border rounded bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="en">English</option>
          <option value="si">සිංහල</option>
          <option value="ta">தமிழ்</option>
        </select>
      </div>
      <div className="flex drop-shadow-[0_10px_15px_rgba(139,92,246,0.4)] rounded-xl overflow-hidden">

        {/* Left form section */}
        <div className="bg-white p-10 w-[28rem]">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">{t('Register')}</h2>
          <p className="text-center text-gray-500 text-sm mb-6">{t('Create a new account')}</p>

          <form onSubmit={handleSubmit} noValidate>
            <input
              name="nic"
              type="text"
              value={formData.nic}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-4 py-2 rounded-lg mb-3 transition-colors"
              placeholder={t('NIC Number')}
              pattern="^(\d{12}|\d{9}[vVxX])$"
              title="Enter valid NIC (12 digits or 9 digits + v/V/x/X)"
              required
            />

            <input
              name="username"
              placeholder={t('Username')}
              value={formData.username}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-4 py-2 rounded-lg mb-3 transition-colors"
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9_]+"
              title="Only letters, numbers, and _"
              required
            />

            <input
              name="email"
              type="email"
              placeholder={t('Email')}
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-4 py-2 rounded-lg mb-3 transition-colors"
              pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
              title="Enter a valid email"
              required
            />

            <input
              name="password"
              type="password"
              placeholder={t('Password')}
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-4 py-2 rounded-lg mb-3 transition-colors"
              minLength={8}
              title="Min 8 characters"
              required
            />

            <input
              name="confirmPassword"
              type="password"
              placeholder={t('Confirm Password')}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-4 py-2 rounded-lg mb-3 transition-colors"
              minLength={8}
              title="Passwords must match"
              required
            />
            <p className="text-sm text-gray-600 mb-1 ml-1">
              {t('Select your role as per your position*')},
            </p>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-gray-300 focus:ring-0 px-4 py-2 rounded-lg mb-3 transition-colors"
              required
            >
              <option value="">{t('-- Select Role --')}</option>
              <option value="subject_clerk">Subject Clerk</option>
              <option value="super_user">Super User</option>
              <option value="technical_officer">Technical Officer</option>
              <option value="dc">Verifying Officer</option>
              <option value="other">Other</option>
            </select>

            <select
              name="districtId"
              value={formData.districtId}
              onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
              className="w-full border border-gray-300 focus:border-gray-300 focus:ring-0 px-4 py-2 rounded-lg mb-3 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              required
              disabled={isLoading || ['super_admin', 'super_user', 'technical_officer'].includes(formData.role)}
            >
              <option value="">{t('-- Select District --')}</option>
              {districts.map(district => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>

            {/* District info message for head office roles */}
            {['super_admin', 'super_user', 'technical_officer'].includes(formData.role) && (
              <p className="text-sm text-gray-500 mb-2 ml-1">
                {t('District is automatically set to Colombo Head Office for this role')}
              </p>
            )}

            {/* Branch selection for subject_clerk and dc roles in Colombo Head Office */}
            {(formData.role === 'subject_clerk' || formData.role === 'dc') && formData.districtId && 
             districts.find(d => d.id.toString() === formData.districtId)?.name === 'Colombo Head Office' && (
              <div className="mb-3">
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full border border-gray-300 focus:border-gray-300 focus:ring-0 px-4 py-2 rounded-lg mb-3 transition-colors"
                  required
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((branch, index) => (
                    <option key={index} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Skills checkboxes - only shown for Technical Officer role */}
            {formData.role === 'technical_officer' && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2 ml-1">{t('Select your skills')} *</p>
                <div className="grid grid-cols-2 gap-2">
                  {skills.map(skill => {
                    const isChecked = Array.isArray(formData.skillIds) 
                      ? formData.skillIds.includes(skill.id.toString())
                      : false;
                      
                    return (
                      <label key={skill.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          name="skills"
                          value={skill.id}
                          checked={isChecked}
                          onChange={handleSkillChange}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">{skill.name}</span>
                      </label>
                    );
                  })}
                </div>
                {formData.role === 'technical_officer' && (!formData.skillIds || formData.skillIds.length === 0) && (
                  <p className="mt-1 text-sm text-red-500">{t('Please select at least one skill')}</p>
                )}
              </div>
            )}

            <textarea
              name="description"
              placeholder={
                (formData.role === 'subject_clerk' || formData.role === 'dc') && 
                districts.find(d => d.id.toString() === formData.districtId)?.name === 'Colombo Head Office'
                  ? t('Enter a short description about yourself')
                  : t('Enter a short description or reason for registering')
              }
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 px-4 py-2 rounded-lg mb-3 resize-none transition-colors"
              rows={4}
            />

            <div className="relative mb-3">
              <label className="block w-full py-2 px-4 rounded-lg bg-purple-100 text-purple-800 font-medium text-center cursor-pointer hover:bg-purple-200 transition-colors">
                {formData.attachment ? formData.attachment.name : t('Choose File')}
                <input
                  type="file"
                  name="attachment"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                  onInvalid={(e) => {
                    e.preventDefault();
                    setFileTouched(true);
                  }}
                />
              </label>
              {fileTouched && !formData.attachment && (
                <p className="mt-1 text-sm text-red-500">File is required</p>
              )}
              {formData.attachment && (
                <span className="block mt-1 text-sm text-gray-600 text-center">
                  {formData.attachment.name}
                </span>
              )}
            </div>

            <Button
              buttonText={t('Register')}
              buttonType="submit"
              buttonColor="#5B005B"
              textColor="white"
              buttonStyle={2}
              className="w-full py-2 text-xl"
            />

            <p className="text-center text-sm mt-4">
              {t("Already have an account?")}{' '}
              <span className="text-purple-700 font-semibold cursor-pointer" onClick={() => navigate('/login')}>
                {t('Login')}
              </span>
            </p>
          </form>
        </div>



      </div>
    </div>
  );
};

export default Register;
