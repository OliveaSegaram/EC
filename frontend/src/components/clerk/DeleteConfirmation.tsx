import React from 'react';
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

interface DeleteConfirmationProps {
  deleteConfirm: {
    open: boolean;
    issue: Issue | null;
  };
  setDeleteConfirm: (confirm: {open: boolean, issue: Issue | null}) => void;
  fetchIssues: () => void;
  isDeleting: boolean;
  setIsDeleting: (isDeleting: boolean) => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  deleteConfirm,
  setDeleteConfirm,
  fetchIssues,
  isDeleting,
  setIsDeleting
}) => {
  if (!deleteConfirm.open || !deleteConfirm.issue) return null;
  
  const handleDelete = async () => {
    if (!deleteConfirm.issue) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/issues/${deleteConfirm.issue.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Issue deleted successfully');
    } catch (error: any) {
      if (error?.response?.status === 404) {
        alert('Issue not found or already deleted.');
      } else {
        alert('Failed to delete issue: ' + (error?.response?.data?.message || error.message || error));
      }
    } finally {
      setDeleteConfirm({ open: false, issue: null });
      fetchIssues();
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">Delete Issue</h3>
        <p>Are you sure you want to delete this issue?</p>
        <div className="flex justify-end space-x-2 mt-4">
          <button 
            onClick={() => setDeleteConfirm({ open: false, issue: null })} 
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
