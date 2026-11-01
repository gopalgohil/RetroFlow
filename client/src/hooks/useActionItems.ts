'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ProjectApiService } from '@/services/projectApi';
import { EnrichedActionItem } from '@/types/project';
import { useDebounce } from '@/hooks/useDebounce';

export interface UseActionItemsOptions {
  user?: { name: string; email: string; role?: string; projectRole?: string } | null;
  isAdmin?: boolean;
  isManager?: boolean;
  canMarkDone?: boolean;
  onActionItemsCountChange?: (count: number) => void;
}

export function useActionItems({
  user,
  isAdmin = false,
  isManager = false,
  canMarkDone = false,
  onActionItemsCountChange,
}: UseActionItemsOptions = {}) {
  const isElevatedRole = Boolean(
    isAdmin ||
    isManager ||
    user?.role === 'admin' ||
    user?.role?.includes('manager') ||
    user?.projectRole?.toLowerCase().includes('manager') ||
    user?.role?.includes('lead') ||
    user?.projectRole?.toLowerCase().includes('lead')
  );

  const [items, setItems] = useState<EnrichedActionItem[]>([]);
  const [baseItems, setBaseItems] = useState<EnrichedActionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const onActionItemsCountChangeRef = useRef(onActionItemsCountChange);
  useEffect(() => {
    onActionItemsCountChangeRef.current = onActionItemsCountChange;
  }, [onActionItemsCountChange]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const isSearching = searchQuery.trim() !== debouncedSearch.trim();

  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'newest'>('newest');

  const [viewAllTeam, setViewAllTeam] = useState<boolean>(() => isElevatedRole);

  const hasHydratedRoleRef = useRef(false);
  useEffect(() => {
    if (!hasHydratedRoleRef.current && isElevatedRole) {
      setViewAllTeam(true);
      hasHydratedRoleRef.current = true;
    }
  }, [isElevatedRole]);

  const notify = useCallback((msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3000);
  }, []);

  const loadActionItems = useCallback(async () => {
    setIsLoading(true);
    const startTime = Date.now();
    try {
      const trimmedSearch = debouncedSearch.trim();
      const data = await ProjectApiService.getMyActionItems({
        all: viewAllTeam,
        search: trimmedSearch ? trimmedSearch : undefined,
      });
      setItems(data || []);
      if (!trimmedSearch) {
        setBaseItems(data || []);
      }
    } catch (err) {
      console.error('[useActionItems] Load action items error:', err);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 300) {
        await new Promise((resolve) => setTimeout(resolve, 300 - elapsed));
      }
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [viewAllTeam, debouncedSearch]);

  useEffect(() => {
    loadActionItems();
  }, [loadActionItems]);

  useEffect(() => {
    const openCount = items.filter((it) => it.status !== 'done').length;
    onActionItemsCountChangeRef.current?.(openCount);
  }, [items]);

  const handleStatusChange = useCallback(
    async (
      item: EnrichedActionItem,
      newStatus: 'todo' | 'in_progress' | 'done'
    ) => {
      if (item.status === newStatus || updatingItemId === item.id) return;

      if (newStatus === 'done' && !canMarkDone) {
        notify('Only Workspace Admin or Manager can mark action items as Done.');
        return;
      }

      const prevStatus = item.status;
      setUpdatingItemId(item.id);

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
      );
      setBaseItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
      );

      try {
        await ProjectApiService.updateActionItemStatus(
          item.id,
          newStatus,
          item.projectId,
          item.sprintId
        );

        const statusLabels = {
          todo: 'To Do',
          in_progress: 'In Progress',
          done: 'Completed',
        };
        notify(`Action item marked as ${statusLabels[newStatus]}`);
      } catch (err) {
        console.error('[useActionItems] Update failed:', err);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: prevStatus } : i))
        );
        setBaseItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: prevStatus } : i))
        );
        notify('Failed to update status. Please try again.');
      } finally {
        setUpdatingItemId(null);
      }
    },
    [updatingItemId, notify, canMarkDone]
  );

  const handleCycleStatus = useCallback(
    (item: EnrichedActionItem) => {
      const nextStatus: Record<string, 'todo' | 'in_progress' | 'done'> = canMarkDone
        ? {
            todo: 'in_progress',
            in_progress: 'done',
            done: 'todo',
          }
        : {
            todo: 'in_progress',
            in_progress: 'todo',
            done: 'todo',
          };
      handleStatusChange(item, nextStatus[item.status] || 'todo');
    },
    [handleStatusChange, canMarkDone]
  );

  const projectScopedBaseItems = useMemo(() => {
    const source = baseItems.length > 0 ? baseItems : items;
    if (selectedProject === 'all') return source;
    const pKey = selectedProject.toLowerCase();
    return source.filter(
      (i) =>
        i.projectKey?.toLowerCase() === pKey ||
        i.projectId?.toLowerCase() === pKey
    );
  }, [baseItems, items, selectedProject]);

  const metrics = useMemo(() => {
    const total = projectScopedBaseItems.length;
    const todo = projectScopedBaseItems.filter((i) => i.status === 'todo').length;
    const inProgress = projectScopedBaseItems.filter((i) => i.status === 'in_progress').length;
    const done = projectScopedBaseItems.filter((i) => i.status === 'done').length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, todo, inProgress, done, completionRate };
  }, [projectScopedBaseItems]);

  const statusCounts = useMemo(() => {
    let source = debouncedSearch.trim() ? items : projectScopedBaseItems;
    if (debouncedSearch.trim() && selectedProject !== 'all') {
      const pKey = selectedProject.toLowerCase();
      source = source.filter(
        (i) =>
          i.projectKey?.toLowerCase() === pKey ||
          i.projectId?.toLowerCase() === pKey
      );
    }
    if (selectedPriority !== 'all') {
      source = source.filter((i) => i.priority === selectedPriority);
    }
    const total = source.length;
    const todo = source.filter((i) => i.status === 'todo').length;
    const inProgress = source.filter((i) => i.status === 'in_progress').length;
    const done = source.filter((i) => i.status === 'done').length;
    return { total, todo, inProgress, done };
  }, [debouncedSearch, items, projectScopedBaseItems, selectedProject, selectedPriority]);

  const projectOptions = useMemo(() => {
    const source = baseItems.length > 0 ? baseItems : items;
    const map = new Map<string, { id: string; key: string; name: string }>();
    source.forEach((it) => {
      if (it.projectKey && !map.has(it.projectKey.toUpperCase())) {
        map.set(it.projectKey.toUpperCase(), {
          id: it.projectId || it.projectKey,
          key: it.projectKey.toUpperCase(),
          name: it.projectName || `Project ${it.projectKey}`,
        });
      }
    });
    return Array.from(map.values());
  }, [baseItems, items]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (selectedProject !== 'all') {
      const pKey = selectedProject.toLowerCase();
      result = result.filter(
        (i) =>
          i.projectKey?.toLowerCase() === pKey ||
          i.projectId?.toLowerCase() === pKey
      );
    }

    if (selectedStatus !== 'all') {
      result = result.filter((i) => i.status === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      result = result.filter((i) => i.priority === selectedPriority);
    }

    result.sort((a, b) => {
      if (sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      }
      if (sortBy === 'priority') {
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return result;
  }, [items, selectedProject, selectedStatus, selectedPriority, sortBy]);

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedProject !== 'all' ||
    selectedStatus !== 'all' ||
    selectedPriority !== 'all'
  );

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedProject('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSortBy('newest');
  }, []);

  const baseTotalCount = baseItems.length || items.length;

  return {
    items,
    baseTotalCount,
    filteredItems,
    isLoading,
    isInitialLoading,
    isSearching,
    updatingItemId,
    toastFeedback,
    metrics,
    statusCounts,
    projectOptions,
    searchQuery,
    setSearchQuery,
    selectedProject,
    setSelectedProject,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    sortBy,
    setSortBy,
    viewAllTeam,
    setViewAllTeam,
    hasActiveFilters,
    clearAllFilters,
    handleStatusChange,
    handleCycleStatus,
  };
}
