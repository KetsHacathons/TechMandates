import { db } from './database';
import { v4 as uuidv4 } from 'uuid';

// Mock function implementations to replace Supabase edge functions
export const localFunctions = {
  'detect-current-version': async (body: { repositoryId: string; technology: string }) => {
    console.log('Detecting current version for:', body);
    
    // Mock implementation - in a real app, you'd implement actual version detection
    const mockVersions = {
      'react': '18.2.0',
      'typescript': '5.0.0',
      'node': '18.0.0',
      'vite': '4.0.0',
      'tailwindcss': '3.3.0'
    };
    
    return {
      data: {
        currentVersion: mockVersions[body.technology] || '1.0.0',
        repositoryId: body.repositoryId,
        technology: body.technology
      },
      error: null
    };
  },

  'create-upgrade-pr': async (body: { repositoryId: string; technology: string; targetVersion: string }) => {
    console.log('Creating upgrade PR for:', body);
    
    // Mock implementation
    return {
      data: {
        success: true,
        prUrl: `https://github.com/mock/repo/pull/${Math.floor(Math.random() * 1000)}`,
        message: `Upgrade ${body.technology} to ${body.targetVersion}`
      },
      error: null
    };
  },

  'security-scan': async (body: { repositoryId: string; scanTypes: string[] }) => {
    console.log('Running security scan for:', body);
    
    // Mock security vulnerabilities
    const mockVulnerabilities = [
      {
        id: uuidv4(),
        title: 'Outdated dependency detected',
        description: 'Package has known security vulnerabilities',
        severity: 'high',
        package_name: 'lodash',
        current_version: '4.17.15',
        recommended_version: '4.17.21',
        file_path: 'package.json',
        line_number: 15
      },
      {
        id: uuidv4(),
        title: 'Weak password policy',
        description: 'Password requirements are too lenient',
        severity: 'medium',
        package_name: null,
        current_version: null,
        recommended_version: null,
        file_path: 'src/auth/config.js',
        line_number: 25
      }
    ];
    
    return {
      data: {
        vulnerabilities: mockVulnerabilities,
        scanCompleted: true
      },
      error: null
    };
  },

  'fix-vulnerability': async (body: { repositoryId: string; vulnerabilityId: string }) => {
    console.log('Fixing vulnerability:', body);
    
    return {
      data: {
        success: true,
        prUrl: `https://github.com/mock/repo/pull/${Math.floor(Math.random() * 1000)}`,
        message: 'Vulnerability fix applied'
      },
      error: null
    };
  },

  'fetch-coverage-data': async (body: { repositoryIds: string[] }) => {
    console.log('Fetching coverage data for:', body);
    
    // Mock coverage data
    const mockCoverageData = body.repositoryIds.map(id => ({
      repositoryId: id,
      coverage: Math.floor(Math.random() * 100),
      testCount: Math.floor(Math.random() * 1000),
      lastUpdated: new Date().toISOString()
    }));
    
    return {
      data: {
        coverageData: mockCoverageData
      },
      error: null
    };
  },

  'improve-coverage': async (body: { repositories: any[] }) => {
    console.log('Improving coverage for:', body);
    
    return {
      data: {
        success: true,
        improvements: body.repositories.map(repo => ({
          repositoryId: repo.id,
          suggestedTests: Math.floor(Math.random() * 10) + 1,
          estimatedCoverageIncrease: Math.floor(Math.random() * 20) + 5
        }))
      },
      error: null
    };
  }
}; 