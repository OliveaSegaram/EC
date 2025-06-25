import { useState, useContext, useCallback } from 'react';
import type { FC, ReactNode } from 'react';
import api from '../../services/api';
import { AppContext } from '../../provider/AppContext';
import { Bar, Pie } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import jsPDF from 'jspdf';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ReportGeneratorProps {
  show: boolean;
  onHide: () => void;
}

type ReportType = 'by_status' | 'by_district' | 'by_issue_type';

interface FormData {
  reportType: ReportType | '';
  startDate: string;
  endDate: string;
}

interface DistrictData {
  [issueType: string]: number;
}

interface ReportData {
  [district: string]: number | DistrictData;
}

const ReportGenerator: FC<ReportGeneratorProps> = ({ show, onHide }) => {
  // Early return if modal is not shown
  if (!show) return null;
  
  const { backendUrl } = useContext(AppContext);
  
  // Form state management
  const [formData, setFormData] = useState<FormData>({
    reportType: '',
    startDate: '',
    endDate: ''
  });

  // Report data state
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Loading state for API calls
  const [isLoading, setIsLoading] = useState(false);
  
  // Available report types
  const REPORT_TYPES = [
    { value: 'by_status' as const, label: 'By Issue Status' },
    { value: 'by_district' as const, label: 'By Districts' },
    { value: 'by_issue_type' as const, label: 'By Issue Types' }
  ] as const;
  
  // Handle report generation
  const handleGenerateReport = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!formData.reportType) {
      alert('Please select a report type');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Sending report generation request with:', {
        type: formData.reportType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        backendUrl: backendUrl
      });

      // Ensure we don't have double /api in the URL
      const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
      const endpoint = baseUrl.endsWith('/api') ? '/reports/generate' : '/api/reports/generate';
      
      const response = await api.get(`${baseUrl}${endpoint}`, {
        params: {
          type: formData.reportType,
          startDate: formData.startDate,
          endDate: formData.endDate
        },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Report generation response:', response);
      
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to generate report');
      }
    } catch (error: any) {
      console.error('Error generating report:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
          headers: error.config?.headers
        },
        stack: error.stack
      });
      
      let errorMessage = 'Failed to generate report. Please try again.';
      
      if (error.response) {
        // Server responded with an error status code
        if (error.response.status === 403) {
          errorMessage = 'You do not have permission to generate reports.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Invalid request. Please check your input.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, backendUrl]);
  
  // Transform report data into chart data format
  const getChartData = useCallback(() => {
    if (!reportData) return null;
    
    console.log('Raw report data:', JSON.stringify(reportData, null, 2));

    if (formData.reportType === 'by_district') {
      // For district report, create a stacked bar chart
      const districts = Object.keys(reportData).filter(
        key => typeof reportData[key] === 'object'
      );
      
      // Collect all unique issue types across all districts
      const issueTypes = new Set<string>();
      districts.forEach(district => {
        const districtData = reportData[district] as DistrictData;
        Object.keys(districtData).forEach(type => issueTypes.add(type));
      });

      // Create a dataset for each issue type
      const datasets = Array.from(issueTypes).map((type, idx) => {
        const hue = (idx * 360) / Math.max(1, issueTypes.size);
        return {
          label: type,
          data: districts.map(district => {
            const districtData = reportData[district] as DistrictData;
            return districtData[type] || 0;
          }),
          backgroundColor: `hsla(${hue}, 70%, 60%, 0.7)`,
          borderColor: `hsl(${hue}, 70%, 50%)`,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        };
      });

      return {
        labels: districts,
        datasets,
      };
    } else {
      // For simple key-value reports (status or issue type)
      const labels = Object.keys(reportData);
      return {
        labels,
        datasets: [
          {
            label: formData.reportType === 'by_status' ? 'Status Count' : 'Issue Count',
            data: labels.map(label => {
              const value = reportData[label];
              return typeof value === 'number' ? value : 0;
            }),
            backgroundColor: labels.map((_, i) => 
              `hsl(${(i * 360) / Math.max(1, labels.length)}, 70%, 60%)`
            ),
            borderColor: 'white',
            borderWidth: 1,
          },
        ],
      };
    }
  }, [reportData, formData.reportType]);

  // Simple text-based PDF generation
  const downloadPDF = () => {
    if (!reportData) return;
    
    try {
      // Create a new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;
      
      // Add title
      pdf.setFontSize(18);
      pdf.text(`Report: ${formData.reportType}`, margin, yPos);
      yPos += 10;
      
      // Add date range
      pdf.setFontSize(12);
      pdf.text(`Date Range: ${formData.startDate} to ${formData.endDate}`, margin, yPos);
      yPos += 10;
      
      // Add report data as text
      pdf.setFontSize(10);
      const dataText = JSON.stringify(reportData, null, 2);
      const splitText = pdf.splitTextToSize(dataText, pageWidth - 2 * margin);
      
      splitText.forEach((line: string) => {
        if (yPos > 280) { // Near bottom of page
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, margin, yPos);
        yPos += 5; // Line height
      });
      
      // Save the PDF
      pdf.save(`report-${formData.reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Get report title based on type
  const getReportTitle = () => {
    switch (formData.reportType) {
      case 'by_status':
        return 'Issues by Status';
      case 'by_district':
        return 'Issues by District';
      case 'by_issue_type':
        return 'Issues by Type';
      default:
        return 'Report';
    }
  };

  // Render the appropriate report based on type
  const renderReport = useCallback((): ReactNode => {
    if (!reportData) return null;
    
    const chartData = getChartData();
    if (!chartData) return null;

    const isPieChart = formData.reportType !== 'by_district';
    
    // Common options for both chart types
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'rectRounded' as const
          }
        },
        title: {
          display: true,
          text: getReportTitle(),
          font: {
            size: 18,
            weight: 700 as const // Using numeric weight instead of 'bold'
          },
          padding: {
            bottom: 20
          }
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
        },
      },
    };

    // For bar charts only
    const barOptions = {
      ...commonOptions,
      indexAxis: 'x' as const,
      scales: {
        x: { 
          stacked: true,
          grid: {
            display: false
          },
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0
          },
          title: {
            display: true,
            text: 'Districts',
            font: {
              weight: 700
            },
            padding: { top: 10 }
          }
        },
        y: { 
          stacked: true, 
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Issues',
            font: {
              weight: 700
            },
            padding: { bottom: 10 }
          },
          ticks: {
            stepSize: 1,
            precision: 0
          }
        }
      },
      plugins: {
        ...commonOptions.plugins,
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'bar' | 'pie'>) => {
              const label = context.dataset.label || '';
              const chartType = (context.chart as any).config?.type as string || 'bar';
              if (chartType === 'bar') {
                const parsed = context.parsed as { y: number; _stacks?: { y: Record<string, { base: number }> } };
                const base = parsed._stacks?.y?.[context.datasetIndex]?.base || 0;
                const value = parsed.y - base;
                return `${label}: ${value}`;
              } else {
                return `${label}: ${context.parsed}`;
              }
            }
          }
        },
        legend: {
          ...commonOptions.plugins.legend,
          position: 'bottom' as const,
          labels: {
            ...commonOptions.plugins.legend.labels,
            padding: 20,
            boxWidth: 12
          }
        }
      },
      layout: {
        padding: {
          top: 10,
          right: 20,
          bottom: 20,
          left: 20
        }
      },
      responsive: true,
      maintainAspectRatio: false
    } as const;

    const options = isPieChart ? commonOptions : barOptions;

    return (
      <div className="mt-6 space-y-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className={isPieChart ? "max-w-md mx-auto h-96" : "w-full h-[500px]"}>
            {isPieChart ? (
              <Pie 
                data={chartData} 
                options={options} 
                className="w-full h-full"
              />
            ) : (
              <Bar 
                data={chartData} 
                options={options} 
                className="w-full h-full"
              />
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Raw Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {formData.reportType === 'by_district' ? 'District' : 'Category'}
                  </th>
                  {formData.reportType === 'by_district' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(reportData).map(([key, value]) => {
                  if (typeof value === 'object') {
                    return Object.entries(value).map(([subKey, subValue]) => (
                      <tr key={`${key}-${subKey}`}>
                        <td className="px-6 py-4 whitespace-nowrap">{key}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{subKey}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{subValue as number}</td>
                      </tr>
                    ));
                  }
                  return (
                    <tr key={key}>
                      <td className="px-6 py-4 whitespace-nowrap">{key}</td>
                      {formData.reportType === 'by_district' && <td></td>}
                      <td className="px-6 py-4 whitespace-nowrap">{value as number}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }, [reportData, formData.reportType, getChartData]);

  // Add download button to the UI
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadClick = async () => {
    if (!reportData || isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    try {
      await downloadPDF();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderDownloadButton = () => (
    <div className="mt-6 flex justify-end">
      <button
        onClick={handleDownloadClick}
        disabled={!reportData || isGeneratingPdf}
        className={`download-pdf-btn inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          !reportData || isGeneratingPdf ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {isGeneratingPdf ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating PDF...
          </>
        ) : (
          <>
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Report as PDF
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Generate Report</h2>
            <button
              onClick={onHide}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
                  Report Type
                </label>
                <select
                  id="reportType"
                  value={formData.reportType}
                  onChange={(e) => setFormData({...formData, reportType: e.target.value as ReportType})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a report type</option>
                  {REPORT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onHide}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
            
            {reportData && (
              <div id="report-content" className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold mb-4">{getReportTitle()}</h2>
                  <p className="text-gray-600 mb-4">
                    Report Period: {formData.startDate} to {formData.endDate}
                  </p>
                </div>
                {renderReport()}
                {renderDownloadButton()}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
