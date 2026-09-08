'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, ENDPOINTS } from '@/lib/api';
import {
  RetroBoard,
  CreateRetroPayload,
  TeamMember,
  WorkspaceSettingsData,
} from '@/types/retro';
import { DashboardTab } from './useDashboardTabs';

const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettingsData = {
  workspaceName: 'RetroFlow Agile Core',
  organizationName: 'Agile Engineering Team',
  defaultVotingLimit: 5,
  allowAnonymousFeedback: true,
  timerDefaultMinutes: 10,
  enableSlackNotifications: false,
};

/**
 * Custom Hook: useDashboardData
 * Senior-level business logic hook encapsulating:
 * - Authentication & profile session
 * - Retrospectives CRUD lifecycle (GET, POST, PUT, DELETE /api/retros)
 * - Team members & whitelist roster (GET, POST /api/members)
 * - Workspace preferences (GET, PUT /api/settings)
 * - Toast feedback messages
 */
export function useDashboardData(activeTab: DashboardTab, searchQuery: string) {
  const router = useRouter();

  // 1. User Authentication State
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Check auth session
  useEffect(() => {
    const token = localStorage.getItem('retroflow_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const storedUser = localStorage.getItem('retroflow_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Fallback
      }
    }
  }, [router]);

  // 2. Retrospective Sessions State & Actions
  const [sessions, setSessions] = useState<RetroBoard[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setIsSessionsLoading(true);
    try {
      const res = await api.get(ENDPOINTS.RETROS, {
        params: searchQuery ? { search: searchQuery } : undefined,
      });
      if (res.data) {
        setSessions(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load retrospectives:', err.message);
    } finally {
      setIsSessionsLoading(false);
    }
  }, [searchQuery]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await api.delete(`${ENDPOINTS.RETROS}/${sessionId}`);
        setSessions((prev) => prev.filter((s) => s._id !== sessionId));
        showToast('Retrospective session deleted successfully.');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete session');
      }
    },
    [showToast]
  );

  const saveSession = useCallback(
    async (payload: CreateRetroPayload, editingSessionId?: string) => {
      if (editingSessionId) {
        const res = await api.put(`${ENDPOINTS.RETROS}/${editingSessionId}`, payload);
        setSessions((prev) =>
          prev.map((s) => (s._id === editingSessionId ? res.data : s))
        );
        showToast('Retrospective updated successfully!');
        return res.data;
      } else {
        const res = await api.post(ENDPOINTS.RETROS, payload);
        setSessions((prev) => [res.data, ...prev]);
        showToast('🚀 Launching your live retrospective session...');
        return res.data;
      }
    },
    [showToast]
  );

  // 3. Team Members & Whitelist State & Actions
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsMembersLoading(true);
    try {
      const res = await api.get(ENDPOINTS.MEMBERS);
      if (res.data) {
        setMembers(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load workspace members:', err.message);
    } finally {
      setIsMembersLoading(false);
    }
  }, []);

  const addWhitelistMember = useCallback(
    async (email: string) => {
      try {
        await api.post(ENDPOINTS.MEMBERS, { email });
        showToast(`Developer ${email} whitelisted successfully!`);
        await fetchMembers();
      } catch (err: any) {
        showToast(err.message || 'Failed to whitelist member');
        throw err;
      }
    },
    [fetchMembers, showToast]
  );

  // 4. Workspace Settings State & Actions
  const [settings, setSettings] = useState<WorkspaceSettingsData>(DEFAULT_WORKSPACE_SETTINGS);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    try {
      const res = await api.get(ENDPOINTS.SETTINGS);
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load workspace settings:', err.message);
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(
    async (updatedSettings: WorkspaceSettingsData) => {
      setIsSavingSettings(true);
      try {
        const res = await api.put(ENDPOINTS.SETTINGS, updatedSettings);
        if (res.data) {
          setSettings(res.data);
        }
        showToast('Workspace settings saved successfully!');
      } catch (err: any) {
        showToast(err.message || 'Failed to update workspace settings');
        throw err;
      } finally {
        setIsSavingSettings(false);
      }
    },
    [showToast]
  );

  // 5. Automatic Tab Data Fetching Trigger
  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    } else if (activeTab === 'members') {
      fetchMembers();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab, fetchSessions, fetchMembers, fetchSettings]);

  return {
    user,
    toastMessage,
    showToast,
    // Sessions
    sessions,
    isSessionsLoading,
    fetchSessions,
    deleteSession,
    saveSession,
    activeSessionsCount: sessions.filter((s) => s.status === 'active').length,
    // Members
    members,
    isMembersLoading,
    fetchMembers,
    addWhitelistMember,
    // Settings
    settings,
    isSettingsLoading,
    isSavingSettings,
    fetchSettings,
    saveSettings,
  };
}

export default useDashboardData;
