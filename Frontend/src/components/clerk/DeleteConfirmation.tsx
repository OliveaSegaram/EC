import * as React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../provider/AppContext';
import 'react-toastify/dist/ReactToastify.css';


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
  
  const { backendUrl } = useAppContext();
  const { t } = useTranslation();
  
  const handleDelete = async () => {
    if (!deleteConfirm.issue) return;
    
    setIsDeleting(true);
    const toastId = toast.loading(t('Deleting issue...'));
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('Authentication required. Please log in again.'));
      }
      
      await axios.delete(`${backendUrl}/issues/${deleteConfirm.issue.id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.update(toastId, {
        render: t('Issue deleted successfully'),
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
      
      // Close the modal and refresh the issues list
      setDeleteConfirm({ open: false, issue: null });
      fetchIssues();
      
    } catch (error: any) {
      console.error('Delete error:', error);
      
      let errorMessage = t('Failed to delete issue');
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMessage = t('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error?.response?.status === 404) {
        errorMessage = t('Issue not found or already deleted.');
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      if (!toast.isActive(toastId)) {
        setIsDeleting(false);
      }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">{t('Delete Issue')}</h3>
        <p>{t('Are you sure you want to delete this issue?')}</p>
        <div className="flex justify-end space-x-2 mt-4">
          <button 
            onClick={() => setDeleteConfirm({ open: false, issue: null })} 
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? t('Deleting...') : t('Delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
