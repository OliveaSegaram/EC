import React, { useState, useEffect } from 'react';
import { FiEye } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

interface ReviewIssue {
  id: number;
  deviceId: string;
  issueType: string;
  lastUpdatedStatus: string;
  comment: string;
  attachment: string | null;
  details: string;
}

const ReviewPanel: React.FC = () => {
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      // Replace with your actual API endpoint
      const response = await axios.get('http://localhost:5000/api/issues/review', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data && response.data.issues) {
        setIssues(response.data.issues);
      }
    } catch (error) {
      setIssues([]); // fallback to empty
    }
  };

  const handleConfirm = async (issueId: number) => {
    setConfirming(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.post(`http://localhost:5000/api/issues/${issueId}/confirm-review`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Issue confirmed!');
      setShowModal(false);
      setSelectedIssue(null);
      fetchIssues();
    } catch (error) {
      toast.error('Failed to confirm issue');
    }
    setConfirming(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Technical Officer Updates - Review</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issues.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-400">No issues to review</td>
              </tr>
            )}
            {issues.map((issue) => (
              <tr key={issue.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{issue.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.issueType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.lastUpdatedStatus}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.comment}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => { setSelectedIssue(issue); setShowModal(true); }}
                    className="text-blue-600 hover:text-blue-800"
                    title="View Details"
                  >
                    <FiEye size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for issue details */}
      {showModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-0 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white overflow-hidden">
            {/* Header with status indicator */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <div className="flex items-center">
                <h3 className="text-lg font-medium">Issue #{selectedIssue.id}</h3>
                <span className="ml-3 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {selectedIssue.lastUpdatedStatus}
                </span>
              </div>
              <button
                onClick={() => { setShowModal(false); setSelectedIssue(null); }}
                className="text-gray-400 hover:text-gray-500 text-xl font-semibold"
              >×</button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Device ID</h4>
                  <p className="mt-1 text-gray-900 font-medium">{selectedIssue.deviceId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Issue Type</h4>
                  <p className="mt-1 text-gray-900">{selectedIssue.issueType}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Comment</h4>
                  <p className="mt-1 text-gray-900 p-3 bg-gray-50 rounded">{selectedIssue.comment}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Details</h4>
                  <p className="mt-1 text-gray-900 p-3 bg-gray-50 rounded">{selectedIssue.details}</p>
                </div>
                {selectedIssue.attachment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Attachment</h4>
                    <a
                      href={selectedIssue.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block px-3 py-1 bg-blue-50 text-blue-600 hover:text-blue-800 rounded border border-blue-200 transition-colors"
                    >
                      View Attachment
                    </a>
                  </div>
                )}
              </div>
              
              {/* Action button footer */}
              <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="flex justify-center">
                  <button
                    onClick={() => handleConfirm(selectedIssue.id)}
                    className={`flex items-center justify-center bg-white border border-purple-500 text-purple-700 hover:bg-purple-50 rounded-md transition-all shadow-sm hover:shadow py-2 px-6 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${confirming ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={confirming}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{confirming ? 'Confirming...' : 'Confirm Review'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPanel;
