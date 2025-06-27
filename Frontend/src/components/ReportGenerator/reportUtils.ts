// components/ReportGenerator/reportUtils.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ISSUE_STATUS } from '../../constants/issueStatuses';

// Extend jsPDF with autoTable types
declare module 'jspdf' {
  interface AutoTableOptions {
    head?: any[][];
    body?: any[][];
    startY?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    headStyles?: any;
    alternateRowStyles?: any;
    styles?: any;
    columnStyles?: any;
    didDrawPage?: (data: any) => void;
  }

  interface AutoTableResult {
    finalY: number;
  }

  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    lastAutoTable?: AutoTableResult;
  }
}

// Helper function to generate a consistent color from a string
const stringToColor = (str: string): [number, number, number] => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate pastel colors by keeping values in a higher range (150-255)
  const r = (hash & 0xFF) % 106 + 150; // 150-255
  const g = ((hash >> 8) & 0xFF) % 106 + 150; // 150-255
  const b = ((hash >> 16) & 0xFF) % 106 + 150; // 150-255
  
  return [r, g, b];
};

export type ReportType = 'by_status' | 'by_issue_type';

export interface FormData {
  reportType: ReportType | '';
  startDate: string;
  endDate: string;
}

export interface ReportItem {
  key: string;
  label: string;
  value: number;
  breakdown?: Record<string, number>;
}

export type ReportData = ReportItem[];

export interface ReportGeneratorProps {
  show: boolean;
  onHide: () => void;
}

export const getReportTitle = (type: ReportType | ''): string => {
  switch (type) {
    case 'by_status':
      return 'Issues by Status';
    case 'by_issue_type':
      return 'Issues by Type';
    default:
      return 'Report';
  }
};

export const getChartData = (formData: FormData, reportData: ReportData) => {
  if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Sort by value in descending order
  const sortedData = [...reportData].sort((a, b) => b.value - a.value);

  if (formData.reportType === 'by_issue_type') {
    // For issue types, we'll show a horizontal bar chart
    return {
      labels: reportData.map(item => item.label),
      datasets: [
        {
          label: 'Number of Issues',
          data: reportData.map(item => item.value),
          backgroundColor: reportData.map(item => {
            const color = stringToColor(item.label);
            return `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.7)`;
          }),
          borderColor: reportData.map(item => {
            const color = stringToColor(item.label);
            return `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
          }),
          borderWidth: 1,
        },
      ],
    };
  }

  // Show statuses with their display names
  const labels = sortedData.map(item => ISSUE_STATUS.getDisplayName(item.key));
  const data = sortedData.map(item => item.value);
  
  // Generate distinct colors for each status
  const backgroundColors = labels.map((_, i) => 
    `hsl(${(i * 360) / Math.max(1, labels.length)}, 70%, 60%)`
  );

  return {
    labels,
    datasets: [{
      label: 'Issues by Status',
      data,
      backgroundColor: backgroundColors,
      borderColor: backgroundColors.map(color => color.replace('60%)', '50%)')),
      borderWidth: 1,
      borderRadius: 4,
    }]
  };
};

export const hexToRgb = (hex: string): [number, number, number] => {
  const hexValue = hex.replace('#', '');
  if (hexValue.length === 3) {
    return [
      parseInt(hexValue[0] + hexValue[0], 16),
      parseInt(hexValue[1] + hexValue[1], 16),
      parseInt(hexValue[2] + hexValue[2], 16),
    ];
  }
  if (hexValue.length === 6) {
    return [
      parseInt(hexValue.substring(0, 2), 16),
      parseInt(hexValue.substring(2, 4), 16),
      parseInt(hexValue.substring(4, 6), 16),
    ];
  }
  return [255, 255, 255];
};

export const downloadPDF = async ({ formData, reportData }: { formData: FormData; reportData: ReportData }): Promise<void> => {
  try {
    // Get the chart canvas element
    const chartCanvas = document.getElementById('report-chart') as HTMLCanvasElement | null;
    let chartImage: string | null = null;
    
    // If chart exists, convert it to an image
    if (chartCanvas) {
      const chartDataUrl = await new Promise<string>((resolve, reject) => {
        html2canvas(chartCanvas, {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true
        }).then(canvas => resolve(canvas.toDataURL('image/png')))
          .catch(reject);
      });
      chartImage = chartDataUrl;
    }

    // Create new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(75, 0, 130); // Purple color
    pdf.setFont('helvetica', 'bold');
    pdf.text(getReportTitle(formData.reportType as ReportType), pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Add date range
    pdf.setFontSize(12);
    pdf.setTextColor(100);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Report Period: ${formData.startDate} to ${formData.endDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // Add chart if available
    if (chartImage) {
      const imgProps = pdf.getImageProperties(chartImage);
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      pdf.addImage(
        chartImage,
        'PNG',
        margin,
        yPos,
        imgWidth,
        Math.min(imgHeight, 120) // Limit chart height
      );
      yPos += Math.min(imgHeight, 120) + 10;
    }

    // Calculate total for percentages
    const total = reportData.reduce((sum, item) => sum + (item?.value || 0), 0);
    
    // Prepare table data based on report type
    const tableData = reportData.map(item => {
      let label = item.label || item.key;
      
      // For status reports, use the display name from ISSUE_STATUS
      if (formData.reportType === 'by_status') {
        label = ISSUE_STATUS.getDisplayName(item.key) || label;
      }
      
      // For issue type reports, use the label as is
      if (formData.reportType === 'by_issue_type') {
        // Format the label to be more readable (capitalize first letter and replace underscores with spaces)
        label = label
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
      }
      
      return {
        label,
        value: item.value.toString(),
        percentage: total > 0 ? `${Math.round((item.value / total) * 100)}%` : '0%'
      };
    });

    // Add summary section header
    pdf.setFontSize(14);
    pdf.setTextColor(75, 0, 130);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary', margin, yPos);
    yPos += 10;

    // Generate the PDF table
    autoTable(pdf, {
      head: [['Item', 'Count', 'Percentage']],
      body: tableData.map(item => [item.label, item.value, item.percentage]),
      startY: yPos,
      margin: { top: 10, right: margin, bottom: 10, left: margin },
      headStyles: {
        fillColor: [75, 0, 130], // Purple header
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 246, 253] // Light purple for alternate rows
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        overflow: 'linebreak',
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        valign: 'middle',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 30 }
      },
      didDrawPage: (data: any) => {
        // Footer with page numbers
        const pageCount = pdf.getNumberOfPages();
        const pageSize = pdf.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        
        // Footer text
        const footerText = `Generated on ${new Date().toLocaleDateString()} | Page ${data.pageNumber} of ${pageCount}`;
        
        pdf.text(
          footerText,
          data.settings.margin.left,
          pageHeight - 10,
          { align: 'left' }
        );
      }
    });
    
    // Ensure the table is properly drawn
    if (pdf.lastAutoTable) {
      pdf.lastAutoTable.finalY = Math.max(pdf.lastAutoTable.finalY || 0, yPos);
    }

    // Save the PDF with a descriptive filename
    const reportType = formData.reportType || 'report';
    const fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    try {
      pdf.save(fileName);
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
