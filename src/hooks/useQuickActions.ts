import { useState } from 'react';
import { useRepositories } from '@/hooks/useRepositories';

export interface QuickActionsState {
  isSecurityScanOpen: boolean;
  isVersionScanOpen: boolean;
  isCoverageAnalysisOpen: boolean;
  isScheduleScansOpen: boolean;
}

export function useQuickActions() {
  const { repositories } = useRepositories();
  const [state, setState] = useState<QuickActionsState>({
    isSecurityScanOpen: false,
    isVersionScanOpen: false,
    isCoverageAnalysisOpen: false,
    isScheduleScansOpen: false,
  });

  const openSecurityScan = () => {
    setState(prev => ({ ...prev, isSecurityScanOpen: true }));
  };

  const closeSecurityScan = () => {
    setState(prev => ({ ...prev, isSecurityScanOpen: false }));
  };

  const openVersionScan = () => {
    setState(prev => ({ ...prev, isVersionScanOpen: true }));
  };

  const closeVersionScan = () => {
    setState(prev => ({ ...prev, isVersionScanOpen: false }));
  };

  const openCoverageAnalysis = () => {
    setState(prev => ({ ...prev, isCoverageAnalysisOpen: true }));
  };

  const closeCoverageAnalysis = () => {
    setState(prev => ({ ...prev, isCoverageAnalysisOpen: false }));
  };

  const openScheduleScans = () => {
    setState(prev => ({ ...prev, isScheduleScansOpen: true }));
  };

  const closeScheduleScans = () => {
    setState(prev => ({ ...prev, isScheduleScansOpen: false }));
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'scan-versions':
        openVersionScan();
        break;
      case 'scan-security':
        openSecurityScan();
        break;
      case 'analyze-coverage':
        openCoverageAnalysis();
        break;
      case 'schedule-scans':
        openScheduleScans();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  return {
    ...state,
    repositories,
    openSecurityScan,
    closeSecurityScan,
    openVersionScan,
    closeVersionScan,
    openCoverageAnalysis,
    closeCoverageAnalysis,
    openScheduleScans,
    closeScheduleScans,
    handleAction,
  };
}