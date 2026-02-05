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
  
    if (!tab) return isManager ? DASHBOARD_TABS.PIPELINE : DASHBOARD_TABS.DISCOVERY;

    if (tab === DASHBOARD_TABS.PIPELINE && !isManager) return DASHBOARD_TABS.DISCOVERY;

    if (tab === DASHBOARD_TABS.APPLICATIONS && isManager) return DASHBOARD_TABS.PIPELINE;
 
    return tab;
  }, [searchParams, isManager]);

  const setActiveTab = useCallback((tab: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    }, { replace: true }); 
  }, [setSearchParams]);

  return { activeTab, setActiveTab, isManager };
}