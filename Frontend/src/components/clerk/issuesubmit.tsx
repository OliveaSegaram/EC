import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../provider/AppContext';

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
  const appContext = useContext(AppContext);
  if (!appContext) throw new Error('AppContext is not available');
  const { backendUrl } = appContext;
  const [userDistrict, setUserDistrict] = useState<{id: number; name: string} | null>(null);
  const [isHeadOffice, setIsHeadOffice] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
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
          const errorMsg = 'You are not logged in. Please log in to submit an issue.';
          console.error('No authentication token found');
          setLocationError(errorMsg);
          toast.error(errorMsg);
          return;
        }
        
        console.log('Fetching user profile with token:', token.substring(0, 15) + '...');
        
        const response = await axios.get(`${backendUrl}/auth/user-profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('User profile response:', response.data);
        
        if (response.data.district) {
          const district = response.data.district;
          const isColombo = district.name === 'Colombo Head Office';
          
          setUserDistrict({
            id: district.id,
            name: district.name
          });
          setIsHeadOffice(isColombo);
          setLocationError(null);
          
          // Set the location in the form state if not already set
          setIssue(prev => ({
            ...prev,
            location: district.id.toString(),
            // Clear branch if not head office
            branch: isColombo ? (prev.branch || '') : ''
          }));
        } else {
          const errorMsg = 'Your account is not associated with a district. Please contact support.';
          console.warn('District not found in user profile');
          setLocationError(errorMsg);
          setUserDistrict(null);
          setIsHeadOffice(false);
          toast.warning(errorMsg);
        }
      } catch (error) {
        const errorMsg = 'Could not retrieve your district information. Please try again later.';
        console.error('Error fetching user data:', error);
        setLocationError(errorMsg);
        toast.error(errorMsg);
      }
    };
    
    fetchUserData();
  }, [backendUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setIssue((prev) => {
      // If complaintType is changing, handle warranty field
      if (name === 'complaintType') {
        return {
          ...prev,
          [name]: value,
          // Set underWarranty to false if not Computer Repair
          underWarranty: value === 'Computer Repair' ? prev.underWarranty : false
        };
      }
      
      return {
        ...prev,
        [name]: value,
      };
    });
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
    
    if (locationError) {
      toast.error(`Cannot submit issue: ${locationError}`, {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    
    if (!userDistrict) {
      const errorMsg = 'Please set your district before submitting an issue.';
      setLocationError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    const validateForm = () => {
      if (!issue.deviceId.trim()) {
        toast.error('Please enter a device ID');
        return false;
      }
      if (!issue.complaintType) {
        toast.error('Please select a complaint type');
        return false;
      }
      if (!issue.description.trim()) {
        toast.error('Please enter a description');
        return false;
      }
      if (!issue.priorityLevel) {
        toast.error('Please select a priority level');
        return false;
      }
      if (isHeadOffice && !issue.branch) {
        toast.error('Please select a branch');
        return false;
      }
      if (issue.underWarranty === undefined || issue.underWarranty === null) {
        toast.error('Please select warranty status');
        return false;
      }
      return true;
    };

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const errorMsg = 'You are not logged in. Please log in to submit an issue.';
        toast.error(errorMsg);
        throw new Error('No authentication token found');
      }
      
      const form = new FormData();
      
      // Always include these fields
      const formData: Record<string, any> = {
        deviceId: issue.deviceId,
        complaintType: issue.complaintType,
        description: issue.description,
        priorityLevel: issue.priorityLevel,
        // Only include underWarranty if it's a Computer Repair issue
        underWarranty: issue.complaintType === 'Computer Repair' ? issue.underWarranty : false,
      };

      // Handle location based on user type
      if (isHeadOffice && issue.branch) {
        // For head office, we'll use a special location ID or handle it differently
        
        formData.location = '1'; 
      } else if (userDistrict) {
        // Use the district ID for the location
        formData.location = userDistrict.id.toString();
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
        // For updates, send all fields that should be updated
        const updateForm = new FormData();
        
        // Always include these fields
        updateForm.append('deviceId', issue.deviceId);
        updateForm.append('complaintType', issue.complaintType);
        updateForm.append('description', issue.description);
        updateForm.append('priorityLevel', issue.priorityLevel);
        // Only include underWarranty if it's a Computer Repair issue
        updateForm.append('underWarranty', issue.complaintType === 'Computer Repair' ? issue.underWarranty.toString() : 'false');
        
        // Handle location based on user type
        if (isHeadOffice && issue.branch) {
          // For head office, we'll use a special location ID or handle it differently
          updateForm.append('location', '1'); 
        } else if (userDistrict) {
          // Use the district ID for the location
          updateForm.append('location', userDistrict.id.toString());
        }
        
        // Add attachment if it exists
        if (issue.attachment) {
          updateForm.append('attachment', issue.attachment);
        }
        
        // Add a comment about the update
        updateForm.append('comment', 'Issue details updated by user');
        
        console.log('Updating issue with data:', {
          deviceId: issue.deviceId,
          complaintType: issue.complaintType,
          description: issue.description.substring(0, 30) + '...',
          priorityLevel: issue.priorityLevel,
          underWarranty: issue.complaintType === 'Computer Repair' ? issue.underWarranty : false,
          hasAttachment: !!issue.attachment
        });
        
        response = await axios.put(
          `${backendUrl}/issues/${issueToEdit.id}`,
          updateForm,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        toast.success('Issue updated successfully!');
      } else {
        // For new issues, send all data
        response = await axios.post(
          `${backendUrl}/issues`,
          form,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        toast.success('Issue submitted successfully!');
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
    <div className="max-w-xl mx-auto rounded-lg overflow-hidden shadow-lg bg-white/80 backdrop-blur-sm mt-10 mb-10 border border-gray-200">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4">
        <h2 className="text-2xl font-semibold text-white text-center">
          {issueToEdit ? 'Edit Issue' : 'Submit New Issue'}
        </h2>
      </div>
      <div className="p-6">
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
              <option value="">Select Branch *</option>
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
          <div className="flex items-center">
            <label 
              htmlFor="attachment"
              className="cursor-pointer bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-4 py-2 rounded-l-md text-sm font-medium transition-all duration-200 flex items-center justify-center shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Choose File
            </label>
            <div className="flex-1 ml-2">
              <input
                type="file"
                id="attachment"
                name="attachment"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
              />
              {issue.attachment ? (
                <div className="border border-gray-300 rounded-r-md px-3 py-2 text-sm text-gray-700 truncate">
                  {issue.attachment.name}
                </div>
              ) : (
                <div className="border border-l-0 border-gray-300 rounded-r-md px-3 py-2 text-sm text-gray-500">
                  No file chosen
                </div>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 5MB)
          </p>
        </div>

        {/* Under Warranty Radio Buttons - Only show for Computer Repair */}
        {issue.complaintType === 'Computer Repair' && (
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Under Warranty <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-6">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="underWarranty"
                  checked={issue.underWarranty === true}
                  onChange={() => setIssue({ ...issue, underWarranty: true })}
                  className="form-radio h-4 w-4 text-purple-600"
                  required
                />
                <span className="ml-2 text-gray-700">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="underWarranty"
                  checked={issue.underWarranty === false}
                  onChange={() => setIssue({ ...issue, underWarranty: false })}
                  className="form-radio h-4 w-4 text-purple-600"
                  required
                />
                <span className="ml-2 text-gray-700">No</span>
              </label>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default IssueSubmit;
