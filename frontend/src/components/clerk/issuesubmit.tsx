import React, { useState } from 'react';
import axios from 'axios';

const IssueSubmit = () => {
  const [issue, setIssue] = useState<{
    complaintType: string;
    description: string;
    priorityLevel: string;
    attachment: File | null;
    location: string;
    username: string;
  }>({
    complaintType: '',
    description: '',
    priorityLevel: '',
    attachment: null,
    location: '',
    username: '',
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
    form.append('complaintType', issue.complaintType);
    form.append('description', issue.description);
    form.append('priorityLevel', issue.priorityLevel);
    if (issue.attachment) {
      form.append('attachment', issue.attachment);
    }
    form.append('location', issue.location);
    form.append('username', issue.username);
    try {
      await axios.post('http://localhost:5000/api/issues/submit', form);
      alert('Issue submitted successfully');
    } catch (error) {
      console.error('Error submitting issue:', error);
      alert('Error submitting issue. Please check the console for details.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-[0px_5px_25px_rgba(138,31,231,0.4)] border-t-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Submit an Issue</h2>
      <form onSubmit={handleSubmit}>
        {/* Username Field */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 font-semibold mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={issue.username}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="complaintType" className="block text-gray-700 font-semibold mb-2">
            Complaint Type
          </label>
          <select
            id="complaintType"
            name="complaintType"
            value={issue.complaintType}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Select a type</option>
            <option value="Computer Repair">Computer Repair</option>
            <option value="Virus Issue">Virus Issue</option>
            <option value="Permissions">Permissions</option>
            <option value="Network Issues">Network Issues</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">
            Description
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

        <div className="mb-4">
          <label htmlFor="attachment" className="block text-gray-700 font-semibold mb-2">
            Attachment
          </label>
          <input
            type="file"
            id="attachment"
            name="attachment"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex justify-center">
          <button className="w-1/4 py-2 rounded-full text-sm text-white bg-gradient-to-b from-purple-600 to-purple-900 shadow-md transition duration-300 hover:shadow-lg">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueSubmit;