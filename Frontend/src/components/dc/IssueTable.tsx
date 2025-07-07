import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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

interface IssueTableProps {
  issues: Issue[];
  handleApproveIssue?: (issueId: number) => void;
  openRejectCommentModal?: (issue: Issue) => void;
  showComment?: (issue: Issue) => void;
  setSelectedIssue: (issue: Issue) => void;
  setShowModal: (show: boolean) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const IssueTable: React.FC<IssueTableProps> = ({
  issues,
  setSelectedIssue,
  setShowModal,
}) => {
  

  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow p-6 relative mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">{t('issueId')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">{t('complaint')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">{t('priority')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">{t('status')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">{t('submitted')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-normal">{t('view')}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {issues.map((issue) => (
            <tr key={issue.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{issue.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.complaintType}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  issue.priorityLevel === 'High' ? 'bg-red-100 text-red-800' :
                  issue.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {issue.priorityLevel}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${ISSUE_STATUS.getStatusColor(issue.status)}`}>
                  {ISSUE_STATUS.getDisplayName(issue.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(issue.submittedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedIssue(issue);
                      setShowModal(true);
                      toast.info(t('loadingIssueDetails'));
                    }}
                    className="text-[#6e2f74] hover:text-[#6e2f74] transition-colors duration-200 p-1 rounded"
                    title={t('viewDetails')}
                  >
                    <FiEye size={18} color="#6e2f74" className="hover:scale-110 transition-transform" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IssueTable;
