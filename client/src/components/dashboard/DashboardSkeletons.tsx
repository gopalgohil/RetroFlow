'use client';

/**
 * Dashboard Skeletons
 * 
 * Modular skeleton loaders for all dashboard views, tabs, and layout shells.
 * The implementation has been split into clean, single-responsibility components in `./skeletons/`:
 * - SessionsSkeleton: Retrospective sessions tab overview & card grid
 * - MembersSkeleton: Workspace roster & whitelist table
 * - SettingsSkeleton: Workspace settings form
 * - RetroBoardSkeleton: Live retrospective session board canvas
 * - ProjectsSkeleton: Agile projects tab, project cards, and sprints
 * - ActionItemsSkeleton: Retrospective action items, metrics, and cards
 * - TabSkeleton: Dynamic tab loader switcher
 * - DashboardLayoutSkeleton: Full layout shell with persistent header logo
 */
export * from './skeletons';
