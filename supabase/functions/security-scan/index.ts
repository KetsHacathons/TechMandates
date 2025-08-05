import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanRequest {
  repositoryId: string;
  repositoryName: string;
  fullName: string;
  language: string | null;
}

interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss: number;
  package: string;
  version: string;
  fixedIn: string;
  status: 'open' | 'in-progress' | 'resolved';
  discoveredDate: string;
  description: string;
}

// Mock vulnerability database based on common packages and known CVEs
const mockVulnerabilities: Record<string, Vulnerability[]> = {
  'Java': [
    {
      id: 'CVE-2024-1001',
      title: 'SQL Injection vulnerability in Spring Security',
      severity: 'critical',
      cvss: 9.8,
      package: 'spring-security-core',
      version: '5.7.2',
      fixedIn: '6.1.0',
      status: 'open',
      discoveredDate: new Date().toISOString().split('T')[0],
      description: 'Authentication bypass through SQL injection in login endpoint'
    },
    {
      id: 'CVE-2024-1002',
      title: 'Deserialization vulnerability in Jackson',
      severity: 'high',
      cvss: 8.5,
      package: 'jackson-databind',
      version: '2.14.2',
      fixedIn: '2.15.0',
      status: 'open',
      discoveredDate: new Date().toISOString().split('T')[0],
      description: 'Remote code execution through unsafe deserialization'
    },
    {
      id: 'CVE-2024-1003',
      title: 'Path traversal in Commons IO',
      severity: 'medium',
      cvss: 6.1,
      package: 'commons-io',
      version: '2.11.0',
      fixedIn: '2.11.1',
      status: 'open',
      discoveredDate: new Date().toISOString().split('T')[0],
      description: 'Directory traversal allows reading arbitrary files'
    }
  ],
  'TypeScript': [
    {
      id: 'CVE-2024-2001',
      title: 'Cross-site scripting in Angular',
      severity: 'high',
      cvss: 7.5,
      package: '@angular/common',
      version: '16.0.0',
      fixedIn: '16.2.1',
      status: 'open',
      discoveredDate: new Date().toISOString().split('T')[0],
      description: 'XSS vulnerability in user input validation'
    },
    {
      id: 'CVE-2024-2002',
      title: 'Prototype pollution in lodash',
      severity: 'medium',
      cvss: 5.6,
      package: 'lodash',
      version: '4.17.20',
      fixedIn: '4.17.21',
      status: 'open',
      discoveredDate: new Date().toISOString().split('T')[0],
      description: 'Prototype pollution vulnerability in merge function'
    }
  ],
  'JavaScript': [
    {
      id: 'CVE-2024-3001',
      title: 'Remote code execution in Node.js',
      severity: 'critical',
      cvss: 9.2,
      package: 'node',
      version: '18.0.0',
      fixedIn: '18.17.1',
      status: 'open',
      discoveredDate: new Date().toISOString().split('T')[0],
      description: 'RCE through malicious package import'
    }
  ],
  'Python': [
    {
      id: 'CVE-2024-4001',
      title: 'SQL injection in Django ORM',
      severity: 'high',
      cvss: 8.1,
      package: 'Django',
      version: '4.1.0',
      fixedIn: '4.2.5',
      status: 'open',
      discoveredDate: new Date().toISOString().split('T')[0],
      description: 'SQL injection through raw query parameters'
    },
    {
      id: 'CVE-2024-4002',
      title: 'Insecure deserialization in pickle',
      severity: 'critical',
      cvss: 9.8,
      package: 'pickle',
      version: '0.7.0',
      fixedIn: '0.7.1',
      status: 'open',
      discoveredDate: new Date().toISOString().split('T')[0],
      description: 'Remote code execution through unsafe pickle loads'
    }
  ]
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repositoryId, repositoryName, fullName, language }: ScanRequest = await req.json();

    console.log(`Starting security scan for repository: ${fullName} (${language})`);

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Get vulnerabilities based on repository language
    const languageVulns = language ? mockVulnerabilities[language] : [];
    
    // Randomly select some vulnerabilities to simulate real findings
    const foundVulnerabilities: Vulnerability[] = [];
    if (languageVulns && languageVulns.length > 0) {
      const numVulns = Math.floor(Math.random() * (languageVulns.length + 1));
      const shuffled = [...languageVulns].sort(() => 0.5 - Math.random());
      foundVulnerabilities.push(...shuffled.slice(0, numVulns));
    }

    // Add some random vulnerabilities from other languages occasionally
    if (Math.random() > 0.7) {
      const allVulns = Object.values(mockVulnerabilities).flat();
      const randomVuln = allVulns[Math.floor(Math.random() * allVulns.length)];
      if (randomVuln && !foundVulnerabilities.some(v => v.id === randomVuln.id)) {
        foundVulnerabilities.push({
          ...randomVuln,
          package: `${randomVuln.package}-dep` // Mark as dependency
        });
      }
    }

    console.log(`Security scan completed for ${fullName}. Found ${foundVulnerabilities.length} vulnerabilities.`);

    return new Response(
      JSON.stringify({
        success: true,
        repositoryId,
        repositoryName,
        vulnerabilities: foundVulnerabilities,
        scanDate: new Date().toISOString(),
        summary: {
          total: foundVulnerabilities.length,
          critical: foundVulnerabilities.filter(v => v.severity === 'critical').length,
          high: foundVulnerabilities.filter(v => v.severity === 'high').length,
          medium: foundVulnerabilities.filter(v => v.severity === 'medium').length,
          low: foundVulnerabilities.filter(v => v.severity === 'low').length,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Security scan error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Security scan failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});