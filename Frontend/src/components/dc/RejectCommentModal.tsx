import * as React from 'react';
import { ISSUE_STATUS } from '../../constants/issueStatuses';

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

interface RejectCommentModalProps {
  showCommentModal: boolean;
  commentIssue: Issue | null;
  rejectComment: string;
  setRejectComment: (comment: string) => void;
  setShowCommentModal: (show: boolean) => void;
  handleRejectIssue: (issueId: number) => void;
}

const RejectCommentModal: React.FC<RejectCommentModalProps> = ({
  showCommentModal,
  commentIssue,
  rejectComment,
  setRejectComment,
  setShowCommentModal,
  handleRejectIssue
}) => {
  if (!showCommentModal || !commentIssue) return null;
  
  const isViewOnly = commentIssue.status === ISSUE_STATUS.DC_REJECTED;
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-20">
      <div className="relative top-20 mx-auto border w-96 shadow-lg rounded-md bg-white overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-red-700">
            {isViewOnly ? 'Rejection Comment' : 'Reject Issue'}
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
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-700 mb-2">Rejection Reason</h4>
              {commentIssue.comment ? (
                <div className="p-3 bg-white rounded border border-red-100">
                  <p className="text-gray-700">{commentIssue.comment}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic p-3 bg-white rounded border border-red-100">No comment was provided for this rejection.</p>
              )}
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-3">Please provide a detailed reason for rejecting this issue. This comment will be stored in the database.</p>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => commentIssue && handleRejectIssue(commentIssue.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  disabled={!rejectComment.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Issue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RejectCommentModal;
