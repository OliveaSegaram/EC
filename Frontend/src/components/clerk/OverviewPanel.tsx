import * as React from 'react';
import { useTranslation } from 'react-i18next';
import IconMapper from '../ui/IconMapper';
import Button from '../ui/buttons/Button';

// Define the Issue interface for type safety
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

// Define the component props interface
interface OverviewPanelProps {
  issues: Issue[];
  rejectedIssuesCount: number;
  setShowSubmissionForm: (show: boolean) => void;
  setOverviewMode: (mode: 'dashboard' | 'form') => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

interface OverviewPanelProps {
  issues: Issue[];
  rejectedIssuesCount: number;
  setShowSubmissionForm: (show: boolean) => void;
  setOverviewMode: (mode: 'dashboard' | 'form') => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({
  issues = [],
  rejectedIssuesCount = 0,
  setShowSubmissionForm = () => {},
  setOverviewMode = () => {},
  getPriorityColor = () => '',
  currentPage = 1,
  setCurrentPage = () => {},
  itemsPerPage = 5,
  totalItems = 0
}: OverviewPanelProps) => {
  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = issues.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNewIssue = () => {
    setShowSubmissionForm(true);
    setOverviewMode('form');
  };

  // This function is called from the ClerkDashboard component to render recent issues
  const renderRecentIssues = (): React.ReactElement => {
    if (issues.length === 0) {
      return <div className="text-center text-gray-500 py-4">{t('noRecentIssuesFound')}</div>;
    }

    return (
      <div className="mt-4 space-y-2">
        {issues.slice(0, 5).map(issue => renderIssueRow(issue))}
      </div>
    );
  };
  
  // Make renderRecentIssues available to parent component
  React.useImperativeHandle(null, () => ({
    renderRecentIssues
  }));

  const renderIssueRow = (issue: Issue): React.ReactElement => {
    return (
      <div 
        key={issue.id} 
        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
        onClick={() => {
          setShowSubmissionForm(true);
          setOverviewMode('form');
        }}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium">{issue.deviceId}</span>
          <span className={`text-sm px-2 py-1 rounded-full ${getPriorityColor(issue.priorityLevel)}`}>
            {issue.priorityLevel}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">{issue.description}</p>
      </div>
    );
  };

  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">{t('dashboard')}</h2>
        <div className="flex space-x-3">
          <Button
            buttonText={t('newIssue')}
            buttonColor="#3B0043"
            buttonStyle={2}
            textColor="white"
            iconName="Add"
            onClick={handleNewIssue}
            className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          />
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Issues Card */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="text-blue-600">
              <IconMapper iconName="Dashboard" iconSize={28} />
            </div>
            <div>
              <p className="text-base font-medium text-gray-700">{t('totalIssues')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{totalItems}</p>
              <p className="text-xs text-gray-400 mt-1">{t('allReportedIssues')}</p>
            </div>
          </div>
        </div>

        {/* Pending Issues Card */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="text-amber-600">
              <IconMapper iconName="Clock" iconSize={28} />
            </div>
            <div>
              <p className="text-base font-medium text-gray-700">{t('pendingIssues')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {issues.filter(issue => issue.status === 'Pending').length}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t('awaitingAction')}</p>
            </div>
          </div>
        </div>

        {/* Rejected Issues Card */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="text-red-600">
              <IconMapper iconName="XCircle" iconSize={28} />
            </div>
            <div>
              <p className="text-base font-medium text-gray-700">{t('rejectedIssues')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {rejectedIssuesCount}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t('issuesNotApproved')}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Issues */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('recentPendingIssues')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('latestIssuesRequireAttention')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#4d1a57] bg-opacity-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('issueId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Device ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{issue.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {issue.complaintType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {issue.deviceId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(issue.priorityLevel)}`}>
                      {issue.priorityLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(issue.submittedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
              
              {totalItems === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                    No pending issues found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <IconMapper iconName="XCircle" iconSize={20} className="text-red-500 mr-2" />
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, totalItems)}
                  </span>{' '}
                  of <span className="font-medium">{totalItems}</span> results
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      &larr; Previous
                    </button>
                    <div className="flex">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === number
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      Next &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;
