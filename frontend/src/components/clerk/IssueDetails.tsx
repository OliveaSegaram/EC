import React, { useState } from 'react';
import axios from 'axios';

interface Issue {
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
}

interface IssueDetailsProps {
  selectedIssue: Issue;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  editMode: boolean;
  editForm: Issue | null;
  setEditForm: (issue: Issue | null) => void;
  fetchIssues: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const IssueDetails: React.FC<IssueDetailsProps> = ({
  selectedIssue,
  showModal,
  setShowModal,
  editMode,
  editForm,
  setEditForm,
  fetchIssues,
  getStatusColor,
  getPriorityColor
}) => {
  const [isSaving, setIsSaving] = useState(false);
  
  if (!showModal || !selectedIssue) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editForm) {
      setEditForm({
        ...editForm,
        [name]: value,
      });
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (editForm) {
      setEditForm({
        ...editForm,
        [name]: checked,
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/issues/${editForm.id}`, editForm, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      fetchIssues();
      setShowModal(false);
      alert('Issue updated successfully');
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Error updating issue');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to handle attachment view
  const handleViewAttachment = () => {
    if (selectedIssue.attachment) {
      // Open the attachment in a new tab
      window.open(`http://localhost:5000/${selectedIssue.attachment}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {editMode ? 'Edit Issue' : 'Issue Details'}
            {selectedIssue.status === 'Rejected' && (
              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                Rejected
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-500 text-2xl"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        {/* Attachment Preview */}
        {selectedIssue.attachment && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-2">Attachment</h4>
            <button
              onClick={handleViewAttachment}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              View Attachment
            </button>
          </div>
        )}
        
        {editMode && editForm ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device ID</label>
                <input
                  type="text"
                  name="deviceId"
                  value={editForm.deviceId}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Type</label>
                <select
                  name="complaintType"
                  value={editForm.complaintType}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select an issue type</option>
                  <option value="Computer Repair">Computer Repair</option>
                  <option value="Virus Issue">Virus Issue</option>
                  <option value="Permissions">Permissions</option>
                  <option value="Network Issues">Network Issues</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
                <select
                  name="priorityLevel"
                  value={editForm.priorityLevel}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="underWarranty"
                  name="underWarranty"
                  checked={editForm.underWarranty}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="underWarranty" className="ml-2 block text-sm text-gray-700">
                  Under Warranty
                </label>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Device ID</h4>
              <p className="mt-1">{selectedIssue.deviceId}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Complaint Type</h4>
              <p className="mt-1">{selectedIssue.complaintType}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1">{selectedIssue.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Priority Level</h4>
              <p className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(selectedIssue.priorityLevel)}`}>
                  {selectedIssue.priorityLevel}
                </span>
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <p className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedIssue.status)}`}>
                  {selectedIssue.status}
                </span>
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Location</h4>
              <p className="mt-1">{selectedIssue.location}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Submitted At</h4>
              <p className="mt-1">{new Date(selectedIssue.submittedAt).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Under Warranty</h4>
              <p className="mt-1">{selectedIssue.underWarranty ? 'Yes' : 'No'}</p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default IssueDetails;
