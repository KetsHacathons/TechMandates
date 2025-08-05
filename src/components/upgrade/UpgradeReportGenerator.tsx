import jsPDF from "jspdf";

interface UpgradeInfo {
  repositoryName: string;
  technology: string;
  currentVersion: string | null;
  targetVersion: string;
  upgradeType: 'single' | 'bulk';
}

interface TechnologyBenefits {
  [key: string]: {
    securityImprovements: string[];
    performanceImprovements: string[];
    newFeatures: string[];
    bugFixes: string[];
    deprecationFixes: string[];
  };
}

const technologyBenefits: TechnologyBenefits = {
  'Java': {
    securityImprovements: [
      'Enhanced security manager and permissions',
      'Improved cryptographic algorithms',
      'Better SSL/TLS handling',
      'Security vulnerability patches'
    ],
    performanceImprovements: [
      'JVM optimizations and faster startup times',
      'Improved garbage collection algorithms',
      'Better memory management',
      'Enhanced compilation optimizations'
    ],
    newFeatures: [
      'Pattern matching and record classes',
      'Sealed classes and interfaces',
      'New String and Stream methods',
      'Enhanced switch expressions'
    ],
    bugFixes: [
      'Critical JVM bug fixes',
      'Memory leak resolution',
      'Thread safety improvements',
      'Platform-specific issue fixes'
    ],
    deprecationFixes: [
      'Removal of deprecated APIs',
      'Migration to modern alternatives',
      'Updated dependencies',
      'Legacy code cleanup'
    ]
  },
  'Angular': {
    securityImprovements: [
      'Enhanced Content Security Policy support',
      'Improved sanitization mechanisms',
      'Security vulnerability patches',
      'Better XSS protection'
    ],
    performanceImprovements: [
      'Smaller bundle sizes with tree-shaking',
      'Faster change detection',
      'Improved rendering performance',
      'Better lazy loading support'
    ],
    newFeatures: [
      'Standalone components',
      'Angular Elements improvements',
      'New CLI features and generators',
      'Enhanced reactive forms'
    ],
    bugFixes: [
      'Component lifecycle bug fixes',
      'Router navigation issues',
      'Form validation improvements',
      'HTTP client fixes'
    ],
    deprecationFixes: [
      'Migration to Ivy renderer',
      'Removal of deprecated decorators',
      'Updated Angular Material',
      'Modern TypeScript features'
    ]
  },
  'Python': {
    securityImprovements: [
      'Enhanced SSL and cryptography modules',
      'Security vulnerability patches',
      'Improved input validation',
      'Better secret management'
    ],
    performanceImprovements: [
      'Faster interpreter and execution',
      'Memory usage optimizations',
      'Improved import system',
      'Better async/await performance'
    ],
    newFeatures: [
      'Structural pattern matching',
      'Enhanced type hints',
      'New syntax features',
      'Improved error messages'
    ],
    bugFixes: [
      'Core interpreter bug fixes',
      'Standard library improvements',
      'Platform compatibility fixes',
      'Unicode handling improvements'
    ],
    deprecationFixes: [
      'Removal of deprecated modules',
      'Updated standard library',
      'Modern syntax adoption',
      'Legacy code modernization'
    ]
  },
  'TypeScript': {
    securityImprovements: [
      'Better type safety checks',
      'Enhanced strict mode',
      'Improved dependency validation',
      'Security vulnerability patches'
    ],
    performanceImprovements: [
      'Faster compilation times',
      'Better incremental builds',
      'Improved memory usage',
      'Enhanced IDE performance'
    ],
    newFeatures: [
      'New type system features',
      'Enhanced template literal types',
      'Better inference capabilities',
      'Advanced utility types'
    ],
    bugFixes: [
      'Type checking improvements',
      'Compiler bug fixes',
      'Declaration file fixes',
      'IDE integration improvements'
    ],
    deprecationFixes: [
      'Removal of deprecated compiler options',
      'Updated type definitions',
      'Modern ECMAScript features',
      'Legacy syntax removal'
    ]
  },
  'Node.js': {
    securityImprovements: [
      'Updated OpenSSL and security patches',
      'Enhanced permission model',
      'Better input validation',
      'Improved crypto modules'
    ],
    performanceImprovements: [
      'V8 engine optimizations',
      'Faster startup times',
      'Improved async operations',
      'Better memory management'
    ],
    newFeatures: [
      'New built-in modules',
      'Enhanced ES modules support',
      'Improved debugging tools',
      'Better worker threads'
    ],
    bugFixes: [
      'Core runtime bug fixes',
      'HTTP/HTTPS improvements',
      'File system fixes',
      'Stream handling improvements'
    ],
    deprecationFixes: [
      'Removal of deprecated APIs',
      'Updated dependencies',
      'Modern JavaScript features',
      'Legacy code cleanup'
    ]
  }
};

export class UpgradeReportGenerator {
  private static getDefaultBenefits() {
    return {
      securityImprovements: [
        'Latest security patches and vulnerability fixes',
        'Enhanced security features and protocols',
        'Improved authentication and authorization',
        'Better encryption and data protection'
      ],
      performanceImprovements: [
        'Optimized runtime performance',
        'Reduced memory consumption',
        'Faster execution and startup times',
        'Better resource utilization'
      ],
      newFeatures: [
        'Latest language and framework features',
        'Enhanced developer experience',
        'New APIs and capabilities',
        'Improved tooling and debugging'
      ],
      bugFixes: [
        'Critical bug fixes and stability improvements',
        'Edge case handling improvements',
        'Platform compatibility fixes',
        'Integration issue resolutions'
      ],
      deprecationFixes: [
        'Removal of deprecated features',
        'Migration to modern alternatives',
        'Updated dependencies and libraries',
        'Code modernization benefits'
      ]
    };
  }

  static generateUpgradeReport(upgrades: UpgradeInfo[]): void {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const marginBottom = 20;
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

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
    pdf.text('🚀 Version Upgrade Report', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated on: ${reportDate}`, 20, yPosition);
    yPosition += 20;

    // Executive Summary
    checkPageBreak(40);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('📋 Executive Summary', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Total Upgrades: ${upgrades.length}`, 20, yPosition);
    yPosition += 6;
    
    const technologies = [...new Set(upgrades.map(u => u.technology))];
    pdf.text(`Technologies: ${technologies.join(', ')}`, 20, yPosition);
    yPosition += 6;
    
    const repositories = [...new Set(upgrades.map(u => u.repositoryName))];
    pdf.text(`Repositories: ${repositories.length}`, 20, yPosition);
    yPosition += 20;

    // Benefits Overview
    checkPageBreak(50);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('✨ Key Benefits of These Upgrades', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    const benefitText = [
      '• Enhanced security with latest patches and vulnerability fixes',
      '• Improved performance and optimizations',
      '• Access to new features and capabilities',
      '• Better stability with bug fixes',
      '• Modern code practices and deprecated feature removal'
    ];

    benefitText.forEach(benefit => {
      checkPageBreak(6);
      pdf.text(benefit, 20, yPosition);
      yPosition += 6;
    });
    yPosition += 15;

    // Individual Upgrade Details
    upgrades.forEach((upgrade, index) => {
      checkPageBreak(80);
      
      // Upgrade header
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${index + 1}. ${upgrade.repositoryName} - ${upgrade.technology}`, 20, yPosition);
      yPosition += 10;

      // Version info
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const versionText = upgrade.currentVersion 
        ? `Upgrading from ${upgrade.currentVersion} to ${upgrade.targetVersion}`
        : `Upgrading to ${upgrade.targetVersion}`;
      pdf.text(versionText, 25, yPosition);
      yPosition += 12;

      // Get technology-specific benefits
      const benefits = technologyBenefits[upgrade.technology] || this.getDefaultBenefits();

      // Security Improvements
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('🔒 Security Improvements:', 25, yPosition);
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      benefits.securityImprovements.slice(0, 2).forEach(improvement => {
        checkPageBreak(4);
        pdf.text(`  • ${improvement}`, 30, yPosition);
        yPosition += 4;
      });
      yPosition += 3;

      // Performance Improvements
      checkPageBreak(15);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('⚡ Performance Improvements:', 25, yPosition);
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      benefits.performanceImprovements.slice(0, 2).forEach(improvement => {
        checkPageBreak(4);
        pdf.text(`  • ${improvement}`, 30, yPosition);
        yPosition += 4;
      });
      yPosition += 3;

      // New Features
      checkPageBreak(15);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('🆕 New Features:', 25, yPosition);
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      benefits.newFeatures.slice(0, 2).forEach(feature => {
        checkPageBreak(4);
        pdf.text(`  • ${feature}`, 30, yPosition);
        yPosition += 4;
      });
      yPosition += 3;

      // Bug Fixes
      checkPageBreak(15);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('🐛 Bug Fixes & Stability:', 25, yPosition);
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      benefits.bugFixes.slice(0, 2).forEach(fix => {
        checkPageBreak(4);
        pdf.text(`  • ${fix}`, 30, yPosition);
        yPosition += 4;
      });
      yPosition += 8;
    });

    // Recommendations
    checkPageBreak(40);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('💡 Recommendations', 20, yPosition);
    yPosition += 12;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const recommendations = [
      '1. Review all changes in the pull requests before merging',
      '2. Test upgrades in a development environment first',
      '3. Ensure all dependencies are compatible with new versions',
      '4. Run comprehensive tests after upgrading',
      '5. Monitor applications closely after deployment',
      '6. Keep documentation updated with new version requirements'
    ];

    recommendations.forEach(rec => {
      checkPageBreak(5);
      pdf.text(rec, 20, yPosition);
      yPosition += 5;
    });

    // Footer
    checkPageBreak(15);
    yPosition = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('This upgrade report was automatically generated by the Version Management System', 20, yPosition);

    // Save the PDF
    const fileName = `version-upgrade-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }
}