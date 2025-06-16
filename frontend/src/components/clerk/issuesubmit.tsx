import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface IssueState {
  deviceId: string;
  complaintType: string;
  description: string;
  priorityLevel: string;
  branch: string; // Branch field for Colombo Head Office
  attachment: File | null;
  underWarranty: boolean;
}

interface IssueSubmitProps {
  onSuccess?: () => void;
  issueToEdit?: {
    id: number;
    deviceId: string;
    complaintType: string;
    description: string;
    priorityLevel: string;
    location: string;
    status: string;
    submittedAt: string;
    attachment: string | null;
    underWarranty: boolean;
  } | null;
  onCancel?: () => void;
}

const IssueSubmit: React.FC<IssueSubmitProps> = ({ onSuccess, issueToEdit, onCancel }) => {
  const [userDistrict, setUserDistrict] = useState<string>('');
  const [isHeadOffice, setIsHeadOffice] = useState<boolean>(false);
  
  // List of branches for Colombo Head Office
  const headOfficeBranches = [
    'Admin Branch',
    'Finance Branch',
    'HR Branch',
    'IT Branch',
    'Operations Branch',
    'Legal Branch',
    'Marketing Branch',
    'Customer Service Branch'
  ];
  
  const [issue, setIssue] = useState<IssueState>({
    deviceId: issueToEdit?.deviceId || '',
    complaintType: issueToEdit?.complaintType || '',
    description: issueToEdit?.description || '',
    priorityLevel: issueToEdit?.priorityLevel || '',
    branch: issueToEdit?.location?.includes('Colombo Head Office - ') 
      ? issueToEdit.location.replace('Colombo Head Office - ', '') 
      : '',
    attachment: null,
    underWarranty: issueToEdit?.underWarranty || false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch user's district when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          toast.error('You are not logged in. Please log in to submit an issue.');
          return;
        }
        
        console.log('Fetching user profile with token:', token.substring(0, 15) + '...');
        
        const response = await axios.get('http://localhost:5000/api/auth/user-profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('User profile response:', response.data);
        
        if (response.data.district) {
          const districtName = response.data.district.name;
          const isColombo = districtName === 'Colombo Head Office';
          
          setUserDistrict(districtName);
          setIsHeadOffice(isColombo);
          
          // Set the location in the form state if not already set
          setIssue(prev => ({
            ...prev,
            location: districtName,
            // Clear branch if not head office
            branch: isColombo ? (prev.branch || '') : ''
          }));
        } else {
          console.warn('District not found in user profile');
          setUserDistrict('');
          setIsHeadOffice(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Set a fallback district or let user choose
        toast.error('Could not retrieve your district information. Please try again later.');
      }
    };
    
    fetchUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setIssue((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setIssue((prev) => ({
      ...prev,
      attachment: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You are not logged in. Please log in to submit an issue.');
        throw new Error('No authentication token found');
      }
      
      const form = new FormData();
      
      // Always include all fields in the form data
      const formData: Record<string, any> = {
        deviceId: issue.deviceId,
        complaintType: issue.complaintType,
        description: issue.description,
        priorityLevel: issue.priorityLevel,
        underWarranty: issue.underWarranty,
      };

      // Handle location based on user type
      if (isHeadOffice && issue.branch) {
        formData.location = `Colombo Head Office - ${issue.branch}`;
      } else if (userDistrict) {
        formData.location = userDistrict;
      }
      
      // Append all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, value);
        }
      });
      
      // Append the file (if it exists)
      if (issue.attachment) {
        form.append('attachment', issue.attachment);
      }
      
      console.log('Submitting issue with data:', {
        ...formData,
        description: issue.description.substring(0, 20) + '...',
        hasAttachment: !!issue.attachment,
        isEdit: !!issueToEdit
      });
      
      let response;
      
      if (issueToEdit) {
        // For updates, send all fields that have changed
        const updateData: Record<string, any> = {};
        
        // Check which fields have changed
        Object.entries(formData).forEach(([key, value]) => {
          if (key in issueToEdit && issueToEdit[key as keyof typeof issueToEdit] !== value) {
            updateData[key] = value;
          }
        });
        
        // If no fields changed, show an error
        if (Object.keys(updateData).length === 0 && !issue.attachment) {
          toast.error('No changes detected');
          setIsSubmitting(false);
          return;
        }
        
        // If there's a new file, include it in the update
        if (issue.attachment) {
          updateData.attachment = true; // Signal that we're updating the attachment
        }
        
        // Create a new FormData for the update
        const updateForm = new FormData();
        Object.entries(updateData).forEach(([key, value]) => {
          updateForm.append(key, value);
        });
        
        console.log('Updating issue with data:', updateData);
        
        response = await axios.put(
          `http://localhost:5000/api/issues/${issueToEdit.id}`,
          updateForm,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        toast.success('Issue updated successfully');
      } else {
        // For new issues, send all data
        response = await axios.post(
          'http://localhost:5000/api/issues',
          form,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        toast.success('Issue submitted successfully');
      }
      
      console.log('Issue submission/update response:', response.data);
      
      // Reset form if not in edit mode
      if (!issueToEdit) {
        setIssue({
          deviceId: '',
          complaintType: '',
          description: '',
          priorityLevel: '',
          branch: '',
          attachment: null,
          underWarranty: false,
        });
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error submitting/updating issue:', error.response ? error.response.data : error.message);
        const errorMessage = error.response?.data?.message || 'An error occurred while processing your request';
        toast.error(`Error: ${errorMessage}`);
      } else {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
   
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg border-1-4 border-gray-300 mt-10 mb-10">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
        {issueToEdit ? 'Edit Issue' : 'Submit New Issue'}
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Device ID with Scan QR Button */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="deviceId" className="block text-gray-700 font-semibold mb-2">Device ID</label>
            <input
              type="text"
              id="deviceId"
              name="deviceId"
              value={issue.deviceId}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <button
            type="button"
            className="h-10 mt-6 px-3 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
            onClick={() => toast.info('not implemented')}
          >
            Scan QR
          </button>
        </div>

        {/* Complaint Type */}
        <div className="mb-4">
          <label htmlFor="complaintType" className="block text-gray-700 font-semibold mb-2">
            Issue Type
          </label>
          <select
            id="complaintType"
            name="complaintType"
            value={issue.complaintType}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Select an issue type</option>
            <option value="Computer Repair">Computer Repair</option>
            <option value="Virus Issue">Virus Issue</option>
            <option value="Permissions">Permissions</option>
            <option value="Network Issues">Network Issues</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Issue Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">
            Issue Description
          </label>
          <textarea
            id="description"
            name="description"
            value={issue.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Priority Level */}
        <div className="mb-4">
          <label htmlFor="priorityLevel" className="block text-gray-700 font-semibold mb-2">
            Priority Level
          </label>
          <select
            id="priorityLevel"
            name="priorityLevel"
            value={issue.priorityLevel}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Select priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Location - Automatically set to user's district */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Location
          </label>
          <div className="p-2 bg-gray-100 rounded-md">
            {userDistrict || 'Not specified'}
            {userDistrict && (
              <span className="ml-2 text-sm text-gray-500">
                (automatically set from your profile)
              </span>
            )}
          </div>
        </div>
        
        {/* Branch dropdown for Colombo Head Office */}
        {isHeadOffice && (
          <div className="mb-4">
            <label htmlFor="branch" className="block text-gray-700 font-semibold mb-2">
              Branch
            </label>
            <select
              id="branch"
              name="branch"
              value={issue.branch}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Select Branch --</option>
              {headOfficeBranches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        )}

        {/* Upload Image */}
        <div className="mb-4">
          <label htmlFor="attachment" className="block text-gray-700 font-semibold mb-2">
            Upload Image (Optional)
          </label>
          <input
            type="file"
            id="attachment"
            name="attachment"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Under Warranty Checkbox */}
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="underWarranty"
            name="underWarranty"
            checked={issue.underWarranty}
            onChange={(e) => setIssue({ ...issue, underWarranty: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="underWarranty" className="text-gray-500 ml-2">
            Under Warranty
          </label>
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : issueToEdit ? (
              'Update Issue'
            ) : (
              'Submit Issue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueSubmit;
