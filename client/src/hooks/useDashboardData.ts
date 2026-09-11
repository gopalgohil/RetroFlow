'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, ENDPOINTS } from '@/lib/api';
import {
  RetroBoard,
  CreateRetroPayload,
  TeamMember,
  WorkspaceSettingsData,
  PaginationMeta,
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
const DEFAULT_WORKSPACE_USER = {
  name: 'Gopal',
  email: 'gopalgohel249@gmail.com',
  role: 'admin',
};

export function useDashboardData(activeTab: DashboardTab, searchQuery: string) {
  const router = useRouter();

  // 1. User Authentication State - synchronously initialized to prevent role flicker
  const [user, setUser] = useState<{ name: string; email: string; role?: string }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('retroflow_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed && (parsed.email || parsed.name)) {
            return parsed;
          }
        }
      } catch {}
    }
    return DEFAULT_WORKSPACE_USER;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Check auth session & sync profile
  useEffect(() => {
    const token = localStorage.getItem('retroflow_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const storedUser = localStorage.getItem('retroflow_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.email) setUser(parsed);
      } catch {}
    }

    // Sync live profile from backend
    api
      .get(ENDPOINTS.AUTH.ME)
      .then((res) => {
        if (res?.data && res.data.email) {
          setUser(res.data);
          try {
            localStorage.setItem('retroflow_user', JSON.stringify(res.data));
          } catch {}
        }
      })
      .catch(() => {});
  }, [router]);

  // 2. Retrospective Sessions State & Actions
  const [sessions, setSessions] = useState<RetroBoard[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const sessionsAbortRef = useRef<AbortController | null>(null);

  const fetchSessions = useCallback(async () => {
    // Abort previous in-flight request if still running
    if (sessionsAbortRef.current) {
      sessionsAbortRef.current.abort();
    }
    const controller = new AbortController();
    sessionsAbortRef.current = controller;

    setIsSessionsLoading(true);
    try {
      const res = await api.get(ENDPOINTS.RETROS, {
        params: searchQuery ? { search: searchQuery.trim() } : undefined,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setSessions(list);
    } catch (err: any) {
      const isAborted =
        err?.name === 'AbortError' ||
        err?.name === 'CanceledError' ||
        err?.code === 'ERR_CANCELED' ||
        controller.signal.aborted ||
        (err?.message && String(err.message).toLowerCase().includes('aborted'));

      if (isAborted) {
        return;
      }
      console.error('Failed to load retrospectives:', err.message);
    } finally {
      if (!controller.signal.aborted) {
        setIsSessionsLoading(false);
      }
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
  const [membersPagination, setMembersPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 5,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [membersPage, setMembersPage] = useState<number>(1);
  const [membersLimit, setMembersLimit] = useState<number>(10);
  const [membersSearch, setMembersSearch] = useState<string>('');
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const membersAbortRef = useRef<AbortController | null>(null);

  const membersPageRef = useRef(membersPage);
  membersPageRef.current = membersPage;
  const membersLimitRef = useRef(membersLimit);
  membersLimitRef.current = membersLimit;
  const membersSearchRef = useRef(membersSearch);
  membersSearchRef.current = membersSearch;

  const fetchMembers = useCallback(
    async (
      pageOverride?: number,
      limitOverride?: number,
      searchOverride?: string,
      minDelayMs: number = 0
    ) => {
      // Abort any existing in-flight request
      if (membersAbortRef.current) {
        membersAbortRef.current.abort();
      }
      const controller = new AbortController();
      membersAbortRef.current = controller;

      setIsMembersLoading(true);
      const pageToUse = pageOverride ?? membersPageRef.current;
      const limitToUse = limitOverride ?? membersLimitRef.current;
      const searchToUse = searchOverride !== undefined ? searchOverride : membersSearchRef.current;

      try {
        const fetchPromise = api.get(ENDPOINTS.MEMBERS, {
          params: {
            page: pageToUse,
            limit: limitToUse,
            search: searchToUse ? searchToUse.trim() : undefined,
          },
          signal: controller.signal,
        });

        const [res] =
          minDelayMs > 0
            ? await Promise.all([
                fetchPromise,
                new Promise((resolve) => setTimeout(resolve, minDelayMs)),
              ])
            : [await fetchPromise];

        if (controller.signal.aborted) return;

        if (res.data) {
          if (Array.isArray(res.data)) {
            setMembers(res.data);
            setMembersPagination({
              page: pageToUse,
              limit: limitToUse,
              totalItems: res.data.length,
              totalPages: Math.ceil(res.data.length / limitToUse) || 1,
              hasNextPage: false,
              hasPrevPage: false,
            });
          } else if (res.data.members && Array.isArray(res.data.members)) {
            setMembers(res.data.members);
            if (res.data.pagination) {
              setMembersPagination(res.data.pagination);
            }
          }
        }
      } catch (err: any) {
        const isAborted =
          err?.name === 'AbortError' ||
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED' ||
          controller.signal.aborted ||
          (err?.message && String(err.message).toLowerCase().includes('aborted'));

        if (isAborted) {
          return;
        }
        console.error('Failed to load workspace members:', err.message);
      } finally {
        if (!controller.signal.aborted) {
          setIsMembersLoading(false);
        }
      }
    },
    []
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setMembersPage(newPage);
      fetchMembers(newPage, membersLimitRef.current, membersSearchRef.current, 0);
    },
    [fetchMembers]
  );

  const handleLimitChange = useCallback(
    (newLimit: number) => {
      setMembersLimit(newLimit);
      setMembersPage(1);
      fetchMembers(1, newLimit, membersSearchRef.current, 0);
    },
    [fetchMembers]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setMembersSearch(query);
      setMembersPage(1);
      fetchMembers(1, membersLimitRef.current, query, 0);
    },
    [fetchMembers]
  );

  const addWhitelistMember = useCallback(
    async (email: string) => {
      try {
        await api.post(ENDPOINTS.MEMBERS, { email });
        showToast(`Developer ${email} whitelisted successfully!`);
        await fetchMembers(1, membersLimit, membersSearch);
      } catch (err: any) {
        showToast(err.message || 'Failed to whitelist member');
        throw err;
      }
    },
    [fetchMembers, membersLimit, membersSearch, showToast]
  );

  const removeWhitelistMember = useCallback(
    async (email: string) => {
      try {
        setMembers((prev) => prev.filter((m) => m.email.toLowerCase() !== email.toLowerCase()));
        await api.delete(`${ENDPOINTS.MEMBERS}/${encodeURIComponent(email)}`);
        showToast(`Developer ${email} removed from workspace.`);
        await fetchMembers(membersPage, membersLimit, membersSearch);
      } catch (err: any) {
        showToast(err.message || 'Failed to remove member from workspace');
        await fetchMembers(membersPage, membersLimit, membersSearch);
      }
    },
    [fetchMembers, membersPage, membersLimit, membersSearch, showToast]
  );

  const updateMemberRole = useCallback(
    async (email: string, newRole: string) => {
      try {
        await api.patch(`${ENDPOINTS.MEMBERS}/${encodeURIComponent(email)}/role`, { role: newRole });
        setMembers((prev) =>
          prev.map((m) =>
            m.email.toLowerCase() === email.toLowerCase()
              ? { ...m, projectRole: newRole }
              : m
          )
        );
        showToast(`Role updated to ${newRole} for ${email}`);
      } catch (err: any) {
        showToast(err.message || 'Failed to update member role');
        throw err;
      }
    },
    [showToast]
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

  // 6. Cleanup active abort controllers on unmount
  useEffect(() => {
    return () => {
      sessionsAbortRef.current?.abort();
      membersAbortRef.current?.abort();
    };
  }, []);

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
    membersPagination,
    membersPage,
    membersLimit,
    membersSearch,
    isMembersLoading,
    fetchMembers,
    onMembersPageChange: handlePageChange,
    onMembersLimitChange: handleLimitChange,
    onMembersSearchChange: handleSearchChange,
    addWhitelistMember,
    removeWhitelistMember,
    updateMemberRole,
    // Settings
    settings,
    isSettingsLoading,
    isSavingSettings,
    fetchSettings,
    saveSettings,
  };
}

export default useDashboardData;
