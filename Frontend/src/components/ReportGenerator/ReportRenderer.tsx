// components/ReportGenerator/ReportRenderer.tsx
import React, { useRef, useEffect } from 'react';
import type { FC } from 'react';
import { Chart, registerables, type ChartConfiguration, type ChartOptions } from 'chart.js';
import type { FormData, ReportData, ReportItem } from './reportUtils';
import { ISSUE_STATUS } from '../../constants/issueStatuses';
import Button from '../ui/buttons/Button';

// Register Chart.js components
Chart.register(...registerables);



interface ReportRendererProps {
  reportData: ReportData | null;
  formData: FormData;
  getChartData: () => any;
  getReportTitle: () => string;
  isGeneratingPdf?: boolean;
  onDownload?: () => void;
}

const ReportRenderer: FC<ReportRendererProps> = ({
  reportData,
  formData,
  getChartData,
  getReportTitle,
  isGeneratingPdf,
  onDownload,
}) => {
  const chartData = getChartData();
  const title = getReportTitle();
  
  // Ensure reportData is always an array
  const reportItems = Array.isArray(reportData) ? reportData : [];
  
  // Calculate total count for percentage calculation
  const totalCount = reportItems.reduce((sum, item) => sum + (item?.value || 0), 0);

  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle chart update/destruction
  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart instance if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create new chart instance
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      const chartType: 'bar' = 'bar';
      
      // Chart options
      const chartOptions: ChartOptions<typeof chartType> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              boxWidth: 12,
              padding: 20,
              usePointStyle: true,
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.dataset?.label || '';
                const value = context.raw;
                return `${label}: ${value}`;
              }
            }
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          }
        },
        layout: {
          padding: {
            top: 10,
            right: 20,
            bottom: 10,
            left: 20
          }
        }
      };

      // Add specific options for bar charts
      if (chartType === 'bar') {
        chartOptions.scales = {
          x: {
            title: {
              display: true,
              text: formData.reportType === 'by_status' ? 'Status' : 'Issue Type',
              font: {
                weight: 'bold',
                size: 14
              }
            },
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Issues',
              font: {
                weight: 'bold',
                size: 14
              }
            },
            ticks: {
              stepSize: 1,
              precision: 0
            }
          }
        };
        
        // Set bar chart specific options using datasets
        if (chartData.datasets && chartData.datasets.length > 0) {
          chartData.datasets.forEach((dataset: any) => {
            dataset.barPercentage = 0.6;
            dataset.categoryPercentage = 0.8;
          });
        }
      }

      // Create chart configuration
      const chartConfig: ChartConfiguration<typeof chartType> = {
        type: chartType,
        data: chartData,
        options: chartOptions
      };

      // Create the chart
      chartRef.current = new Chart(ctx, chartConfig);
    }

    // Cleanup function to destroy chart on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData, formData.reportType, getReportTitle]);

  const renderBreakdown = (breakdown: Record<string, number> | undefined, total: number) => {
    if (!breakdown || Object.keys(breakdown).length === 0) return null;

    return (
      <div className="ml-4 mt-1 text-xs text-gray-600">
        {Object.entries(breakdown).map(([key, count]) => (
          <div key={key} className="flex justify-between">
            <span>{key}:</span>
            <span>{count} ({(count / total * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSummaryTable = () => {
    if (reportItems.length === 0) {
      return <p className="text-gray-500">No data available for the selected criteria.</p>;
    }

    // Sort by value in descending order and ensure values are numbers
    const sortedData = [...reportItems]
      .filter(item => item && typeof item.value === 'number')
      .sort((a, b) => (b?.value || 0) - (a?.value || 0));

    const getDisplayLabel = (item: ReportItem) => {
      if (formData.reportType === 'by_status') {
        return ISSUE_STATUS.getDisplayName(item.key);
      } else if (formData.reportType === 'by_issue_type') {
        return item.label || item.key;
      }
      return item.key;
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Count
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item) => {
              const percentage = totalCount > 0 ? ((item.value / totalCount) * 100).toFixed(1) : '0.0';
              const displayLabel = getDisplayLabel(item);
              const hasBreakdown = item.breakdown && Object.keys(item.breakdown).length > 0;
              
              return (
                <React.Fragment key={item.key}>
                  <tr className={hasBreakdown ? 'border-b-0' : ''}>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      <div className="font-medium">{displayLabel}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {item.value.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {percentage}%
                    </td>
                  </tr>
                  {hasBreakdown && (
                    <tr>
                      <td colSpan={3} className="px-6 py-2 bg-gray-50">
                        {renderBreakdown(item.breakdown, item.value)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                {totalCount.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="h-80">
          <canvas ref={canvasRef} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          {formData.reportType === 'by_status' ? 'Issues by Status' : 'Report Data'}
        </h3>
        {renderSummaryTable()}
      </div>

      {onDownload && (
        <div className="flex justify-end">
          <Button
            onClick={onDownload}
            buttonText={isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
            buttonStyle={2}
            buttonColor="#6E2F74"
            textColor="white"
            iconName={isGeneratingPdf ? 'FaSpinner' : 'FaFilePdf'}
            iconSize={16}
            className="px-5 py-2.5 text-sm font-medium"
            disabled={isGeneratingPdf}
            reverseIcons={false}
          />
        </div>
      )}
    </div>
  );
};

export default ReportRenderer;
