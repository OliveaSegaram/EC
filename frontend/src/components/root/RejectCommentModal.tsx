import React from 'react';
import { toast } from 'react-toastify';

import { Issue } from '../../types/issue';

interface RejectCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (issue: Issue) => void;
  comment: string;
  setComment: (comment: string) => void;
  issueId?: number;
  title: string;
  submitButtonText: string;
  isReject: boolean;
  isOptional?: boolean;
}

const RejectCommentModal: React.FC<RejectCommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  comment,
  setComment,
  issueId,
  title,
  submitButtonText,
  isReject,
  isOptional = false
}) => {
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOptional && !comment.trim()) {
      toast.error('Please provide a comment');
      return;
    }
    
    // Create a new issue object with the updated comment
    const issue: Issue = {
      id: issueId || 0, // This should always be defined
      deviceId: '',
      complaintType: '',
      description: '',
      priorityLevel: '',
      location: '',
      status: '',
      submittedAt: '',
      attachment: null,
      underWarranty: false,
      comment: comment.trim() || undefined,
    };
    
    onSubmit(issue);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-20">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <div className={`flex justify-between items-center p-4 border-b ${isReject ? 'bg-red-50' : 'bg-green-50'}`}>
          <h3 className={`text-lg font-medium ${isReject ? 'text-red-700' : 'text-green-700'}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 text-2xl font-semibold leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              {isReject 
                ? 'Please provide a reason for rejecting this issue. This will be visible to the DC who submitted the issue.'
                : 'You can add an optional comment that will be visible to all users.'}
            </p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-2 focus:outline-none focus:ring-indigo-500"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isReject ? 'Enter reason for rejection...' : 'Add an optional comment...'}
              required={!isOptional && isReject}
              aria-required={!isOptional && isReject}
              aria-label={isReject ? 'Rejection reason' : 'Approval comment'}
            />
            {!isOptional && !comment.trim() && (
              <p className="mt-1 text-sm text-red-600">This field is required</p>
            )}
          </div>
          
          <div className="flex justify-end p-4 border-t bg-gray-50 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isReject && !isOptional && !comment.trim()}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isReject 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              } ${isReject && !isOptional && !comment.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectCommentModal;
