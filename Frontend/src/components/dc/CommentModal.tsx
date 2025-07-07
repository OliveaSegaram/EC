import * as React from 'react';
import { useTranslation } from 'react-i18next';

type CommentType = 'reject' | 'approve';

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
  comment?: string;
}

interface CommentModalProps {
  showCommentModal: boolean;
  commentIssue: Issue | null;
  comment: string;
  setComment: (comment: string) => void;
  setShowCommentModal: (show: boolean) => void;
  handleSubmit: (issueId: number) => void;
  type: CommentType;
}

const CommentModal: React.FC<CommentModalProps> = ({
  showCommentModal,
  commentIssue,
  comment,
  setComment,
  setShowCommentModal,
  handleSubmit,
  type
}) => {
  if (!showCommentModal || !commentIssue) return null;
  
  const { t } = useTranslation();
  
  const isReject = type === 'reject';
  const isViewOnly = isReject 
    ? commentIssue.status === 'DC Rejected' 
    : commentIssue.status === 'DC Approved';
  
  const title = isReject 
    ? (isViewOnly ? t('rejectionComment') : t('rejectIssue'))
    : (isViewOnly ? t('approvalComment') : t('approveIssue'));
    
  const commentLabel = isReject ? t('process') : t('approvalReason');
  const placeholder = isReject 
    ? t('enterReasonForRejection')
    : t('enterAdditionalCommentsOptional');
  
  const bgColor = isReject ? 'bg-red-50' : 'bg-green-50';
  const textColor = isReject ? 'text-red-700' : 'text-green-700';
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-20">
      <div className="relative top-20 mx-auto border w-96 shadow-lg rounded-md bg-white overflow-hidden">
        <div className={`flex justify-between items-center p-4 border-b ${bgColor}`}>
          <h3 className={`text-lg font-medium ${textColor}`}>
            {title}
          </h3>
          <button
            onClick={() => setShowCommentModal(false)}
            className="text-gray-400 hover:text-gray-500 text-xl font-semibold"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          {isViewOnly ? (
            <div className={`p-4 ${bgColor} border border-gray-200 rounded-md`}>
              <h4 className={`text-sm font-medium ${textColor} mb-2`}>{commentLabel}</h4>
              {commentIssue.comment ? (
                <div className="p-3 bg-white rounded border border-gray-100">
                  <p className="text-gray-700">{commentIssue.comment}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic p-3 bg-white rounded border border-gray-100">
                  {t('noCommentProvided')}
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-3">
                {isReject 
                  ? t('pleaseProvideReasonForRejection')
                  : t('youCanAddOptionalCommentsForApproval')}
                {' '} {t('thisCommentWillBeStoredInTheDatabase')}
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                required={isReject}
              />
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(commentIssue.id)}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {isReject ? t('reject') : t('approve')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
