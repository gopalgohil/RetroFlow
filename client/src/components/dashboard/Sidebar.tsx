'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSessionsCount: number;
  openActionItemsCount?: number;
  user?: { name: string; email: string; role?: string; projectRole?: string } | null;
  isAdmin?: boolean;
  canViewMembers?: boolean;
  onLogout?: () => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeSessionsCount,
  openActionItemsCount = 0,
  user,
  isAdmin: propIsAdmin,
  canViewMembers: propCanViewMembers,
  onLogout,
  isOpen,
  onCloseMobile,
}) => {
  const activeUser = user || {
    name: '',
    email: '',
    role: 'member',
    projectRole: 'Developer',
  };

  const userEmail = activeUser.email?.toLowerCase().trim();
  const userRole = (activeUser.role || '').toLowerCase().trim();
  const userProjectRole = ((activeUser as any).projectRole || '').toLowerCase().trim();

  const isAdmin =
    propIsAdmin !== undefined
      ? propIsAdmin
      : Boolean(
          userRole === 'admin' ||
          (userEmail && userEmail === 'gopalgohel249@gmail.com')
        );

  const isManager = Boolean(
    isAdmin ||
    userProjectRole === 'manager' ||
    userRole === 'manager' ||
    userRole.includes('manager')
  );

  // Check if role is Project Lead, Developer, QA, or DevOps
  const isProjectLead = Boolean(
    !isManager && (
      userProjectRole === 'project lead' ||
      userProjectRole === 'team lead' ||
      userProjectRole.includes('lead') ||
      userRole === 'project lead' ||
      userRole === 'team lead' ||
      userRole.includes('lead')
    )
  );

  const isDevOrQAOrDevOps = Boolean(
    !isAdmin &&
    !isManager &&
    !isProjectLead &&
    ['developer', 'qa', 'tester', 'devops'].some(
      (r) => userProjectRole?.includes(r) || (userRole !== 'member' && userRole?.includes(r))
    )
  );

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Strictly Workspace Admin and Manager only!
  // Project Lead, Developer, QA Engineer, and DevOps are explicitly excluded from Team Directory
  // Guarded by isMounted to guarantee 100% hydration matching between SSR and initial client render
  const canViewMembers =
    isMounted &&
    (propCanViewMembers !== undefined
      ? propCanViewMembers
      : (isAdmin || isManager) && !isProjectLead && !isDevOrQAOrDevOps);

  const navItems = [
    {
      id: 'sessions',
      label: 'Retrospective Sessions',
      icon: LayoutDashboard,
      badge: activeSessionsCount > 0 ? `${activeSessionsCount} Live` : undefined,
    },
    {
      id: 'projects',
      label: 'My Projects',
      icon: FolderKanban,
      sublabel: 'Sprints & Delivery',
    },
    {
      id: 'action_items',
      label: 'Action Items',
      icon: CheckSquare,
      sublabel: 'Retrospective Deliverables',
      badge: openActionItemsCount > 0 ? `${openActionItemsCount} Open` : undefined,
    },
    ...(canViewMembers
      ? [
          {
            id: 'members',
            label: isAdmin ? 'Team Members' : 'Team Directory',
            icon: Users,
            sublabel: isAdmin ? 'Access Controls' : 'Collaborators',
          },
          {
            id: 'analytics',
            label: 'Retro Analytics',
            icon: BarChart3,
            sublabel: 'Attendance & Insights',
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-6 flex-1 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#5cb028] flex items-center justify-center font-black text-white text-sm shadow-sm shadow-[#5cb028]/30 group-hover:scale-105 transition-transform">
              RF
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Retro<span className="text-[#5cb028]">Flow</span>
              </span>
              <p className="text-[11px] font-medium text-slate-400">Enterprise Workspace</p>
            </div>
          </Link>

          {/* Workspace Quick Status Pill */}
          <div className="mt-6 p-3 rounded-xl bg-[#f2f9ed] border border-[#cdeac0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSessionsCount > 0 ? 'bg-[#5cb028] animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-semibold text-slate-700">
                {activeSessionsCount > 0
                  ? `${activeSessionsCount} Live Session${activeSessionsCount !== 1 ? 's' : ''}`
                  : 'Workspace Ready'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#3d8318] bg-white px-2 py-0.5 rounded-full border border-[#cdeac0] shadow-2xs">
              Live Sync
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="mt-6 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#5cb028] text-white shadow-sm shadow-[#5cb028]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <div className="text-left">
                      <p suppressHydrationWarning>{item.label}</p>
                      {item.sublabel && !isActive && (
                        <p suppressHydrationWarning className="text-[10px] font-normal text-slate-400">{item.sublabel}</p>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#eaf5e3] text-[#3d8318] border border-[#cdeac0]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sign Out (Matching Digiflux reference screenshot) */}
        {onLogout && (
          <div className="p-4 border-t border-slate-200/80 bg-white">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50/70 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
