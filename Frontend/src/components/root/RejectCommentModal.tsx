import * as React from 'react';
import Button from '../ui/buttons/Button';
import type { Issue } from '../../types/issue';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReject && !isOptional && !comment.trim()) {
     
      return;
    }
    
    try {
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
      
      // Call the onSubmit handler and wait for it to complete
      await onSubmit(issue);
      
      // Close the modal after successful submission
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Error handling is done in the parent component
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-20">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b-0 bg-[#4d1a57] text-white">
          <h3 className="text-lg font-medium">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-semibold leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              {isReject 
                ? t('rejectReasonPrompt')
                : t('optionalCommentPrompt')}
            </p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-2 focus:outline-none focus:ring-indigo-500"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isReject ? t('enterReasonForRejection') : t('addOptionalComment')}
              required={!isOptional && isReject}
              aria-required={!isOptional && isReject}
              aria-label={isReject ? t('reasonForRejection') : t('approvalComment')}
            />
            {!isOptional && !comment.trim() && (
              <p className="mt-1 text-sm text-red-600">{t('fieldRequired')}</p>
            )}
          </div>
          
          <div className="flex justify-end p-4 border-t bg-gray-50 space-x-3">
            <Button
              buttonText={t('cancel')}
              buttonStyle={1}
              buttonColor="#3B0043"
              textColor="#3B0043"
              onClick={onClose}
              className="px-4 py-2 text-sm"
            />
            <Button
              buttonText={submitButtonText}
              buttonStyle={isReject ? 1 : 2}
              buttonColor={isReject ? "#3B0043" : "#3B0043"}
              textColor={isReject ? "#3B0043" : "white"}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as React.FormEvent);
              }}
              className="px-4 py-2 text-sm"
              disabled={isReject && !isOptional && !comment.trim()}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectCommentModal;
