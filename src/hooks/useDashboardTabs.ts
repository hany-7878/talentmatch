import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const DASHBOARD_TABS = {
  PIPELINE: 'pipeline',
  DISCOVERY: 'discovery',
  MESSAGES: 'messages',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  APPLICATIONS: 'applications',
} as const;

export type DashboardTab = typeof DASHBOARD_TABS[keyof typeof DASHBOARD_TABS];

export function useDashboardTabs(role: string | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const isManager = useMemo(() => role?.toLowerCase() === 'manager', [role]);

  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab') as DashboardTab;
    
    // 1. Default fallback if URL is empty
    if (!tab) return isManager ? DASHBOARD_TABS.PIPELINE : DASHBOARD_TABS.DISCOVERY;

    // 2. Security: Prevent Seekers from seeing the Manager Pipeline
    if (tab === DASHBOARD_TABS.PIPELINE && !isManager) return DASHBOARD_TABS.DISCOVERY;

    // 3. Security: Prevent Managers from seeing Seeker Applications
    if (tab === DASHBOARD_TABS.APPLICATIONS && isManager) return DASHBOARD_TABS.PIPELINE;
    
    // Allow everything else (Discovery is shared but handled inside the views)
    return tab;
  }, [searchParams, isManager]);

  /**
   * Updates the tab while keeping other URL params intact
   */
  const setActiveTab = useCallback((tab: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    }, { replace: true }); // Prevents back-button clutter
  }, [setSearchParams]);

  return { activeTab, setActiveTab, isManager };
}