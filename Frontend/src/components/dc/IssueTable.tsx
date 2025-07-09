import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ISSUE_STATUS } from '../../constants/issueStatuses';
import IconMapper from '../ui/IconMapper';

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
                <div className="flex items-center gap-1.5">
                  <span className={`p-1 rounded-full ${
                    issue.priorityLevel === 'High' ? 'bg-red-100 text-red-800' :
                    issue.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    <IconMapper 
                      iconName={
                        issue.priorityLevel === 'High' ? 'AlertTriangle' :
                        issue.priorityLevel === 'Medium' ? 'AlertCircle' : 'Info'
                      } 
                      iconSize={14}
                      className="inline"
                    />
                  </span>
                  <span className={`text-xs ${
                    issue.priorityLevel === 'High' ? 'text-red-800' :
                    issue.priorityLevel === 'Medium' ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    {issue.priorityLevel}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className={`p-1 rounded-full ${ISSUE_STATUS.getStatusColor(issue.status)}`}>
                    <IconMapper 
                      iconName={
                        issue.status === 'PENDING' ? 'Clock' :
                        issue.status === 'IN_PROGRESS' ? 'RefreshCw' :
                        issue.status === 'RESOLVED' ? 'CheckCircle' :
                        issue.status === 'REJECTED' ? 'XCircle' : 'AlertCircle'
                      }
                      iconSize={14}
                      className="inline"
                    />
                  </span>
                  <span className={`text-xs font-medium ${ISSUE_STATUS.getStatusColor(issue.status).replace('bg-', 'text-').replace('-100', '-800')}`}>
                    {ISSUE_STATUS.getDisplayName(issue.status)}
                  </span>
                </div>
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
                    <IconMapper 
                      iconName="Eye" 
                      iconSize={18} 
                      iconColor="#6e2f74" 
                      className="hover:scale-110 transition-transform" 
                    />
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
