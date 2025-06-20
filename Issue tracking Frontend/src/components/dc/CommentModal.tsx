import React from 'react';

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
  
  const isReject = type === 'reject';
  const isViewOnly = isReject 
    ? commentIssue.status === 'DC Rejected' 
    : commentIssue.status === 'DC Approved';
  
  const title = isReject 
    ? (isViewOnly ? 'Rejection Comment' : 'Reject Issue')
    : (isViewOnly ? 'Approval Comment' : 'Approve Issue');
    
  const commentLabel = isReject ? 'Process' : 'Approval Reason';
  const placeholder = isReject 
    ? 'Enter reason for rejection...' 
    : 'Enter any additional comments (optional)...';
  const buttonText = isReject ? 'Reject Issue' : 'Approve Issue';
  
  const bgColor = isReject ? 'bg-red-50' : 'bg-green-50';
  const borderColor = isReject ? 'border-red-200' : 'border-green-200';
  const textColor = isReject ? 'text-red-700' : 'text-green-700';
  const buttonColor = isReject ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
  const focusRing = isReject ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-green-500 focus:border-green-500';
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
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
            <div className={`p-4 ${bgColor} border ${borderColor} rounded-md`}>
              <h4 className={`text-sm font-medium ${textColor} mb-2`}>{commentLabel}</h4>
              {commentIssue.comment ? (
                <div className="p-3 bg-white rounded border border-gray-100">
                  <p className="text-gray-700">{commentIssue.comment}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic p-3 bg-white rounded border border-gray-100">
                  No {isReject ? 'rejection' : 'approval'} comment was provided.
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-3">
                {isReject 
                  ? 'Please provide a detailed reason for rejecting this issue.'
                  : 'You can add optional comments for this approval.'}
                {' '}This comment will be stored in the database.
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={placeholder}
                className={`w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 ${focusRing} ${focusRing.replace('focus:border', 'border')}`}
                rows={4}
                required={isReject}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => commentIssue && handleSubmit(commentIssue.id)}
                  className={`px-4 py-2 text-white rounded-md transition-colors flex items-center ${buttonColor} ${isReject && !comment.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isReject && !comment.trim()}
                >
                  {buttonText}
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
