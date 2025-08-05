import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Calendar, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface ReportGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vulnerabilities: Array<{
    id: string;
    title: string;
    severity: string;
    cvss: number;
    repository: string;
    repositoryId: string;
    platform: string;
    package: string;
    version: string;
    fixedIn: string;
    status: string;
    discoveredDate: string;
    description: string;
  }>;
  metrics: Array<{
    title: string;
    value: number | string;
    description: string;
    [key: string]: any; // Allow additional properties
  }>;
}

export function ReportGenerationModal({ open, onOpenChange, vulnerabilities, metrics }: ReportGenerationModalProps) {
  const [selectedFormats, setSelectedFormats] = useState({
    csv: true,
    pdf: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const generateCSV = () => {
    const csvHeader = [
      'Vulnerability ID',
      'Title', 
      'Severity',
      'CVSS Score',
      'Repository',
      'Package',
      'Current Version',
      'Fixed Version',
      'Status',
      'Discovered Date',
      'Description'
    ].join(',');

    const csvRows = vulnerabilities.map(vuln => [
      vuln.id,
      `"${vuln.title.replace(/"/g, '""')}"`,
      vuln.severity,
      vuln.cvss,
      vuln.repository,
      vuln.package,
      vuln.version,
      vuln.fixedIn,
      vuln.status,
      vuln.discoveredDate,
      `"${vuln.description.replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [
      '# Security Vulnerability Report',
      `# Generated on: ${reportDate}`,
      `# Total Vulnerabilities: ${vulnerabilities.length}`,
      `# Critical: ${metrics[0]?.value || 0}`,
      `# High: ${metrics[1]?.value || 0}`,
      `# Medium/Low: ${metrics[2]?.value || 0}`,
      `# Security Score: ${metrics[3]?.value || 0}/100`,
      '',
      csvHeader,
      ...csvRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `security-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = () => {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const marginBottom = 20;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - marginBottom) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Header
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('🔒 Security Vulnerability Report', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated on: ${reportDate}`, 20, yPosition);
    yPosition += 20;

    // Executive Summary
    checkPageBreak(30);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('📊 Executive Summary', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Total Vulnerabilities Found: ${vulnerabilities.length}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Repositories Scanned: ${new Set(vulnerabilities.map(v => v.repository)).size}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Security Score: ${metrics[3]?.value || 0}/100`, 20, yPosition);
    yPosition += 15;

    // Security Metrics
    checkPageBreak(40);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Security Metrics', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    metrics.slice(0, 4).forEach((metric, index) => {
      if (index % 2 === 0) checkPageBreak(12);
      const xPos = index % 2 === 0 ? 20 : 110;
      if (index % 2 === 0 && index > 0) yPosition += 6;
      
      pdf.setFont(undefined, 'bold');
      pdf.text(`${metric.title}: ${metric.value}`, xPos, yPosition);
      pdf.setFont(undefined, 'normal');
      
      if (index % 2 === 1) yPosition += 8;
    });
    yPosition += 15;

    // Vulnerability Details
    checkPageBreak(30);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('🚨 Vulnerability Details', 20, yPosition);
    yPosition += 15;

    vulnerabilities.forEach((vuln, index) => {
      checkPageBreak(50);
      
      // Vulnerability title and severity
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      const titleText = `${index + 1}. ${vuln.title}`;
      pdf.text(titleText, 20, yPosition);
      
      // Severity badge
      pdf.setFontSize(10);
      const severityColor = vuln.severity.toLowerCase() === 'critical' ? [220, 38, 38] :
                           vuln.severity.toLowerCase() === 'high' ? [245, 158, 11] :
                           vuln.severity.toLowerCase() === 'medium' ? [59, 130, 246] : [16, 185, 129];
      
      pdf.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      pdf.text(`[${vuln.severity.toUpperCase()}]`, 160, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 10;

      // Vulnerability details
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      
      const details = [
        `ID: ${vuln.id}`,
        `CVSS Score: ${vuln.cvss}/10`,
        `Repository: ${vuln.repository}`,
        `Package: ${vuln.package}`,
        `Current Version: ${vuln.version} → Fixed In: ${vuln.fixedIn}`,
        `Platform: ${vuln.platform}`,
        `Status: ${vuln.status.toUpperCase()}`,
        `Discovered: ${new Date(vuln.discoveredDate).toLocaleDateString()}`
      ];

      details.forEach(detail => {
        checkPageBreak(5);
        pdf.text(detail, 25, yPosition);
        yPosition += 4;
      });

      // Description
      checkPageBreak(15);
      pdf.setFont(undefined, 'bold');
      pdf.text('Description:', 25, yPosition);
      yPosition += 4;
      
      pdf.setFont(undefined, 'normal');
      const descriptionLines = pdf.splitTextToSize(vuln.description, 160);
      descriptionLines.forEach((line: string) => {
        checkPageBreak(4);
        pdf.text(line, 25, yPosition);
        yPosition += 4;
      });
      
      yPosition += 8; // Space between vulnerabilities
    });

    // Footer
    checkPageBreak(15);
    yPosition = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('This report was automatically generated by the Security Vulnerability Scanner', 20, yPosition);

    // Save the PDF
    const fileName = `security-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  const handleGenerate = async () => {
    if (!selectedFormats.csv && !selectedFormats.pdf) {
      toast({
        title: "No Format Selected",
        description: "Please select at least one report format (CSV or PDF).",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      if (selectedFormats.csv) {
        generateCSV();
      }

      if (selectedFormats.pdf) {
        generatePDF();
      }

      const formats = [];
      if (selectedFormats.csv) formats.push("CSV");
      if (selectedFormats.pdf) formats.push("PDF");

      toast({
        title: "Report Generated Successfully! 📄",
        description: `Your security vulnerability report has been generated in ${formats.join(" and ")} format${formats.length > 1 ? 's' : ''}.`,
        duration: 5000,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Security Report
          </DialogTitle>
          <DialogDescription>
            Choose the format(s) for your vulnerability report. You can select multiple formats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Report Summary</span>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Vulnerabilities:</strong> {vulnerabilities.length}</p>
              <p><strong>Repositories:</strong> {new Set(vulnerabilities.map(v => v.repository)).size}</p>
              <p className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <strong>Generated:</strong> {reportDate}
              </p>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-4">
            <h4 className="font-medium">Select Report Format(s):</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="csv"
                  checked={selectedFormats.csv}
                  onCheckedChange={(checked) => 
                    setSelectedFormats(prev => ({ ...prev, csv: !!checked }))
                  }
                />
                <div className="flex-1">
                  <label htmlFor="csv" className="font-medium cursor-pointer">
                    CSV (Comma-Separated Values)
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Spreadsheet-friendly format for data analysis
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="pdf"
                  checked={selectedFormats.pdf}
                  onCheckedChange={(checked) => 
                    setSelectedFormats(prev => ({ ...prev, pdf: !!checked }))
                  }
                />
                <div className="flex-1">
                  <label htmlFor="pdf" className="font-medium cursor-pointer">
                    PDF (Printable Document)
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Professional report format for sharing and archiving
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 gap-2"
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}