import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../provider/AppContext';
import Button from '../ui/buttons/Button';

interface IssueState {
  deviceId: string;
  complaintType: string;
  description: string;
  priorityLevel: string;
  branch: string; 
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

const IssueSubmit: React.FC<IssueSubmitProps> = ({
  onSuccess = () => {},
  issueToEdit = null,
  onCancel = () => {}
}: IssueSubmitProps) => {
  const { t } = useTranslation();
  const appContext = useContext(AppContext);
  if (!appContext) throw new Error('AppContext is not available');
  const { backendUrl } = appContext;
  const [userDistrict, setUserDistrict] = useState<{id: number; name: string} | null>(null);
  const [isHeadOffice, setIsHeadOffice] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [issue, setIssue] = useState<IssueState>({
    deviceId: issueToEdit?.deviceId || '',
    complaintType: issueToEdit?.complaintType || '',
    description: issueToEdit?.description || '',
    priorityLevel: issueToEdit?.priorityLevel || '',
    branch: issueToEdit?.location?.includes(t('Colombo Head Office') + ' - ') 
      ? issueToEdit.location.replace(t('Colombo Head Office') + ' - ', '') 
      : '',
    attachment: null,
    underWarranty: issueToEdit?.underWarranty || false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch user's district and branch when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          const errorMsg = t('You are not logged in. Please log in to submit an issue.');
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
          
          // Set the location and branch in the form state
          setIssue(prev => ({
            ...prev,
            location: district.id.toString(),
            // Set branch from user profile if available, otherwise keep existing value
            branch: isColombo ? (response.data.branch || prev.branch || '') : ''
          }));
        } else {
          const errorMsg = t('Your account is not associated with a district. Please contact support.');
          console.warn('District not found in user profile');
          setLocationError(errorMsg);
          setUserDistrict(null);
          setIsHeadOffice(false);
          toast.warning(errorMsg);
        }
      } catch (error) {
        const errorMsg = t('Could not retrieve your district information. Please try again later.');
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
      toast.error(t('Cannot submit issue: ') + locationError, {
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
      const errorMsg = t('Please set your district before submitting an issue.');
      setLocationError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    const validateForm = (t: (key: string) => string) => {
      if (!issue.deviceId.trim()) {
        toast.error(t('Please enter a device ID'));
        return false;
      }
      if (!issue.complaintType) {
        toast.error(t('Please select a complaint type'));
        return false;
      }
      if (!issue.description.trim()) {
        toast.error(t('Please enter a description'));
        return false;
      }
      if (!issue.priorityLevel) {
        toast.error(t('Please select a priority level'));
        return false;
      }
      if (isHeadOffice && !issue.branch) {
        toast.error(t('Please select a branch'));
        return false;
      }
      // Under Warranty is now optional
      // Default to false if not provided
      if (issue.underWarranty === undefined || issue.underWarranty === null) {
        setIssue(prev => ({
          ...prev,
          underWarranty: false
        }));
      }
      return true;
    };

    if (!validateForm(t)) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const errorMsg = t('You are not logged in. Please log in to submit an issue.');
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
        } else if (issueToEdit?.attachment) {
          // If no new file but there was an existing attachment, keep it
          updateForm.append('keepExistingAttachment', 'true');
        }
        
        // Add a comment about the update
        updateForm.append('comment', t('Issue details updated by user'));
        
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
      <div className="bg-[#4d1a57] p-4">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {issueToEdit ? t('Edit Issue') : t('Report an Issue')}
        </h2>
      </div>
      <div className="p-6">
      <form onSubmit={handleSubmit}>
        {/* Device ID with Scan QR Button */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="deviceId" className="block text-gray-700 font-semibold mb-2">
            {t('Device ID')}
          </label>
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
            {t('Issue Type')}
          </label>
          <select
            id="complaintType"
            name="complaintType"
            value={issue.complaintType}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">{t('Select an issue type')}</option>
            <option value="Computer Repair">{t('Computer Repair')}</option>
            <option value="Virus Issue">{t('Virus Issue')}</option>
            <option value="Permissions">{t('Permissions')}</option>
            <option value="Network Issues">{t('Network Issues')}</option>
            <option value="Other">{t('Other')}</option>
          </select>
        </div>

        {/* Issue Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">
            {t('Issue Description')}
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
            {t('Priority Level')}
          </label>
          <select
            id="priorityLevel"
            name="priorityLevel"
            value={issue.priorityLevel}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">{t('Select priority')}</option>
            <option value="Low">{t('Low')}</option>
            <option value="Medium">{t('Medium')}</option>
            <option value="High">{t('High')}</option>
          </select>
        </div>

        {/* Branch display for Colombo Head Office */}
        {isHeadOffice && issue.branch && (
          <div className="mb-4">
            <label htmlFor="branch" className="block text-gray-700 font-semibold mb-2">
              {t('Branch')}
            </label>
            <input
              type="text"
              id="branch"
              name="branch"
              value={issue.branch}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 text-sm cursor-not-allowed"
            />
            <input type="hidden" name="branch" value={issue.branch} />
          </div>
        )}

        {/* Upload Image */}
        <div className="mb-4">
          <label htmlFor="attachment" className="block text-gray-700 font-semibold mb-2">
            {t('Upload Image')} ({t('Optional')})
          </label>
          <div className="flex items-center">
              <label 
                htmlFor="attachment"
                className="cursor-pointer bg-white border border-[#4d1a57] text-[#4d1a57] hover:bg-purple-50 px-4 py-2 rounded-l-md text-sm font-medium transition-all duration-200 flex items-center justify-center shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('Choose File')}
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
                  {t('No file chosen')}
                </div>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {t('Supported formats:')} JPG, PNG, PDF, DOC, DOCX ({t('Max')} 5MB)
          </p>
        </div>

        {/* Under Warranty Radio Buttons - Only show for Computer Repair */}
        {issue.complaintType === 'Computer Repair' && (
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              {t('Under Warranty')} <span className="text-red-500">*</span>
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
                <span className="ml-2 text-gray-700">{t('Yes')}</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="underWarranty"
                  checked={issue.underWarranty === false}
                  onChange={() => setIssue({ ...issue, underWarranty: false })}
                  className="form-radio h-4 w-4 text-purple-00"
                  required
                />
                <span className="ml-2 text-gray-700">{t('No')}</span>
              </label>
            </div>
          </div>
        )}

        {/* Submit and Cancel Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          {onCancel && (
            <Button
              buttonText={t('Cancel')}
              buttonColor="transparent"
              buttonStyle={1}
              textColor="#4B5563"
              onClick={onCancel}
              disabled={isSubmitting}
              className="border border-gray-300 hover:bg-gray-50"
            />
          )}
          <Button
            buttonText={issueToEdit ? t('Update Issue') : t('Submit Issue')}
            buttonColor="#3B0043"
            buttonStyle={2}
            textColor="white"
            iconName={isSubmitting ? 'Loader' : undefined}
            buttonType="submit"
            disabled={isSubmitting}
            className="shadow-md hover:shadow-lg transition-shadow"
          />
        </div>
      </form>
      </div>
    </div>
  );
};

export default IssueSubmit;
