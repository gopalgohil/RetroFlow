'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ProjectApiService } from '@/services/projectApi';
import { EnrichedActionItem } from '@/types/project';
import { useDebounce } from '@/hooks/useDebounce';

export interface UseActionItemsOptions {
  user?: { name: string; email: string; role?: string; projectRole?: string } | null;
  isAdmin?: boolean;
  isManager?: boolean;
  onActionItemsCountChange?: (count: number) => void;
}

export function useActionItems({
  onActionItemsCountChange,
}: UseActionItemsOptions = {}) {
  const [items, setItems] = useState<EnrichedActionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Keep a stable ref to callback to eliminate infinite re-render fetch loops
  const onActionItemsCountChangeRef = useRef(onActionItemsCountChange);
  useEffect(() => {
    onActionItemsCountChangeRef.current = onActionItemsCountChange;
  }, [onActionItemsCountChange]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'newest'>('dueDate');
  const [viewAllTeam, setViewAllTeam] = useState<boolean>(false);

  const notify = useCallback((msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3000);
  }, []);


  // 2. Fetch action items with backend search & team toggle
  const loadActionItems = useCallback(async () => {
    setIsLoading(true);
    const startTime = Date.now();
    try {
      const data = await ProjectApiService.getMyActionItems({
        all: viewAllTeam,
        search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
      });
      setItems(data || []);

      const openCount = (data || []).filter((it) => it.status !== 'done').length;
      onActionItemsCountChangeRef.current?.(openCount);
    } catch (err) {
      console.error('[useActionItems] Load action items error:', err);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 350) {
        await new Promise((resolve) => setTimeout(resolve, 350 - elapsed));
      }
      setIsLoading(false);
    }
  }, [viewAllTeam, debouncedSearch]);

  useEffect(() => {
    loadActionItems();
  }, [loadActionItems]);

  // 3. Status update
  const handleStatusChange = useCallback(
    async (
      item: EnrichedActionItem,
      newStatus: 'todo' | 'in_progress' | 'done'
    ) => {
      if (item.status === newStatus || updatingItemId === item.id) return;

      const prevStatus = item.status;
      setUpdatingItemId(item.id);

      // Optimistic update
      setItems((prev) =>
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

        setItems((latestItems) => {
          const openCount = latestItems.filter((i) => i.status !== 'done').length;
          onActionItemsCountChangeRef.current?.(openCount);
          return latestItems;
        });
      } catch (err) {
        console.error('[useActionItems] Update failed:', err);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: prevStatus } : i))
        );
        notify('Failed to update status. Please try again.');
      } finally {
        setUpdatingItemId(null);
      }
    },
    [updatingItemId, notify]
  );

  const handleCycleStatus = useCallback(
    (item: EnrichedActionItem) => {
      const nextStatus: Record<string, 'todo' | 'in_progress' | 'done'> = {
        todo: 'in_progress',
        in_progress: 'done',
        done: 'todo',
      };
      handleStatusChange(item, nextStatus[item.status] || 'todo');
    },
    [handleStatusChange]
  );

  // Derived KPI Metrics
  const metrics = useMemo(() => {
    const total = items.length;
    const todo = items.filter((i) => i.status === 'todo').length;
    const inProgress = items.filter((i) => i.status === 'in_progress').length;
    const done = items.filter((i) => i.status === 'done').length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, todo, inProgress, done, completionRate };
  }, [items]);

  // Project selector options derived directly from active action items
  const projectOptions = useMemo(() => {
    const map = new Map<string, { id: string; key: string; name: string }>();
    items.forEach((it) => {
      if (it.projectKey && !map.has(it.projectKey.toUpperCase())) {
        map.set(it.projectKey.toUpperCase(), {
          id: it.projectId || it.projectKey,
          key: it.projectKey.toUpperCase(),
          name: it.projectName || `Project ${it.projectKey}`,
        });
      }
    });
    return Array.from(map.values());
  }, [items]);

  // Filtered & Sorted items (text search is handled directly by backend API)
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
  }, [items, searchQuery, selectedProject, selectedStatus, selectedPriority, sortBy]);

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
    setSortBy('dueDate');
  }, []);

  return {
    items,
    filteredItems,
    isLoading,
    updatingItemId,
    toastFeedback,
    metrics,
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
