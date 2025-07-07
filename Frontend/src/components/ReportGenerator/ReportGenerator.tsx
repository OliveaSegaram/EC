import { useState, useContext, useCallback } from 'react';
import type { FC } from 'react';
import axios from 'axios';
import { AppContext } from '../../provider/AppContext';
import { toast } from 'react-toastify';
import ReportRenderer from './ReportRenderer';
import { getChartData, getReportTitle, downloadPDF } from './reportUtils';
import type { ReportData, FormData, ReportGeneratorProps } from './reportUtils';
import Button from '../ui/buttons/Button';

const ReportGenerator: FC<ReportGeneratorProps> = ({ show, onHide }) => {
  if (!show) return null;
  
  // Ensure the modal is properly positioned and visible
  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)'
  } as React.CSSProperties;

  const { backendUrl } = useContext(AppContext);
  const [formData, setFormData] = useState<FormData>({
    reportType: 'by_status',
    startDate: '',
    endDate: '',
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGenerateReport = useCallback(async () => {
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Please log in again.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Map frontend form data to backend expected parameter names
      const params = {
        type: formData.reportType,
        startDate: formData.startDate,
        endDate: formData.endDate
      };
      
      console.log('Sending request with params:', params);
      
      const response = await axios.get(`${backendUrl}/reports/generate`, {
        params,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('Response received:', response.data);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        setReportData(response.data.data);
      } else {
        console.error('Invalid response format:', response.data);
        toast.error('Received invalid data format from server');
        setReportData([]);
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  }, [formData, backendUrl]);

  const handleDownloadPdf = async () => {
    if (!reportData) return;
    setIsGeneratingPdf(true);
    try {
      await downloadPDF({ formData, reportData });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div style={modalStyle} className="p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-purple-100">
        <div className="p-6 border-b border-purple-100 flex justify-between items-center" style={{ backgroundColor: '#3B0043' }}>
          <h2 className="text-2xl font-bold text-white">Generate Report</h2>
          <button 
            onClick={onHide}
            className="text-white hover:text-purple-200 transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Close"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={formData.reportType}
                onChange={(e) => setFormData({ ...formData, reportType: e.target.value as any })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6E2F74] focus:border-[#6E2F74] focus:outline-none transition-all shadow-sm"
              >
                <option value="by_status">By Status</option>
                <option value="by_issue_type">By Issue Types</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                required
                min={formData.startDate}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={onHide}
              buttonText="Cancel"
              buttonStyle={1}
              buttonColor="#6E2F74"
              textColor="#6E2F74"
              className="px-5 py-2 text-sm font-medium"
              disabled={isLoading}
            />
            <Button
              onClick={handleGenerateReport}
              buttonText={isLoading ? 'Generating...' : 'Generate Report'}
              buttonStyle={2}
              buttonColor="#6E2F74"
              textColor="white"
              className="px-6 py-2 text-sm font-medium"
              disabled={isLoading || !formData.startDate || !formData.endDate}
            />
          </div>
          
          {reportData && (
            <div className="mt-6">
              <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              {getReportTitle(formData.reportType)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(formData.startDate).toLocaleDateString()} - {new Date(formData.endDate).toLocaleDateString()}
            </p>
          </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <ReportRenderer 
  reportData={reportData} 
  formData={formData}
  getChartData={() => getChartData(formData, reportData)}
  getReportTitle={() => getReportTitle(formData.reportType)}
  isGeneratingPdf={isGeneratingPdf}
  onDownload={handleDownloadPdf}
/>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
