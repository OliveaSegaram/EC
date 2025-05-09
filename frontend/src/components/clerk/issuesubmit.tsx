import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface IssueState {
  deviceId: string;
  complaintType: string;
  description: string;
  priorityLevel: string;
  location: string;
  attachment: File | null;
  underWarranty: boolean;
}

interface IssueSubmitProps {
  onSuccess?: () => void;
}

const IssueSubmit: React.FC<IssueSubmitProps> = ({ onSuccess }) => {
  const [issue, setIssue] = useState<IssueState>({
    deviceId: '',
    complaintType: '',
    description: '',
    priorityLevel: '',
    location: '',
    attachment: null,
    underWarranty: false,
  });

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
    const form = new FormData();
   
    // Ensure all fields are added to FormData
    form.append('deviceId', issue.deviceId);
    form.append('complaintType', issue.complaintType);
    form.append('description', issue.description);
    form.append('priorityLevel', issue.priorityLevel);
    form.append('location', issue.location);
    form.append('underWarranty', issue.underWarranty.toString()); 
   
    // Append the file (if it exists)
    if (issue.attachment) {
      form.append('attachment', issue.attachment);
    }
   
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post('http://localhost:5000/api/issues/submit', form, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Issue submitted successfully');
      // Reset form
      setIssue({
        deviceId: '',
        complaintType: '',
        description: '',
        priorityLevel: '',
        location: '',
        attachment: null,
        underWarranty: false,
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error submitting issue:', error.response ? error.response.data : error.message);
      } else {
        console.error('Unexpected error:', error);
      }
      toast.error('Error submitting issue. Please check the console for details.');
    }
  };
   
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg border-1-4 border-gray-300 mt-10 mb-10">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">Issue Form</h2>
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

        {/* Location */}
        <div className="mb-4">
          <label htmlFor="location" className="block text-gray-700 font-semibold mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={issue.location}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

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

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="mt-3 py-2 px-3 bg-gradient-to-b from-purple-600 to-purple-900 text-white rounded-md hover:bg-gray-700"
          >
            Submit 
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueSubmit;
