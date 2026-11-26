'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

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
  const { isCollapsed, toggleSidebar } = useSidebar();
  const cachedUser = React.useMemo(() => {
    if (user?.email) return user;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return user || null;
  }, [user]);

  const activeUser = cachedUser || {
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
      : Boolean(userRole === 'admin');

  const isManager = Boolean(
    isAdmin ||
    userProjectRole === 'manager' ||
    userRole === 'manager' ||
    userRole.includes('manager')
  );

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

  const canViewMembers =
    propCanViewMembers !== undefined
      ? propCanViewMembers
      : (isAdmin || isManager) && !isProjectLead && !isDevOrQAOrDevOps;

  const navItems = [
    {
      id: 'projects',
      label: 'My Projects',
      icon: FolderKanban,
      sublabel: 'Sprints & Delivery',
    },
    {
      id: 'sessions',
      label: 'Retrospective Sessions',
      icon: LayoutDashboard,
      badge: isMounted && activeSessionsCount > 0 ? `${activeSessionsCount} Live` : undefined,
    },
    {
      id: 'action_items',
      label: 'Action Items',
      icon: CheckSquare,
      sublabel: 'Retrospective Deliverables',
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
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#08090a] border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col transition-all duration-300 lg:translate-x-0 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`h-16 flex items-center border-b border-slate-200/80 dark:border-white/[0.08] shrink-0 transition-all duration-300 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between pl-[34px] pr-4'
        }`}>
          {!isCollapsed && (
            <div
              className="flex items-center select-none overflow-hidden"
              title="Digiflux RetroFlow"
            >
              <Image
                src="/logo.svg"
                alt="Logo"
                width={140}
                height={42}
                className="h-9 sm:h-[38px] w-auto object-contain"
                priority
                unoptimized
              />
            </div>
          )}

          {isCollapsed && (
            <div className="flex items-center justify-center" title="Digiflux">
              <Image
                src="/favicon_1.svg"
                alt="Digiflux"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                priority
                unoptimized
              />
            </div>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden lg:flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer ${
              isCollapsed ? 'absolute -right-3.5 top-5 z-50 bg-white dark:bg-[#12151c] border border-slate-200/90 dark:border-white/[0.12] shadow-sm rounded-full p-1' : ''
            }`}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className={`pt-8 pb-6 flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <nav className="space-y-2">
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
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isCollapsed
                      ? 'justify-center p-3 relative group'
                      : 'justify-between gap-2 px-2.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#5cb028] text-white shadow-sm shadow-[#5cb028]/25 dark:bg-[#88c958] dark:text-[#08090a] dark:font-black dark:shadow-md dark:shadow-[#88c958]/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                    <Icon
                      className={`w-[19px] h-[19px] shrink-0 ${
                        isActive
                          ? 'text-white dark:text-[#08090a]'
                          : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    {!isCollapsed && (
                      <div className="text-left min-w-0">
                        <p suppressHydrationWarning className="whitespace-nowrap tracking-tight text-[13.5px]">
                          {item.label}
                        </p>
                        {item.sublabel && !isActive && (
                          <p suppressHydrationWarning className="text-[11.5px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap truncate mt-0.5">
                            {item.sublabel}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`shrink-0 ml-auto px-2 py-0.5 rounded-full text-[10.5px] font-bold whitespace-nowrap leading-tight ${
                        isActive
                          ? 'bg-white/25 text-white dark:bg-[#08090a]/15 dark:text-[#08090a] dark:font-black'
                          : 'bg-[#eaf5e3] dark:bg-[#88c958]/20 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && item.badge && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5cb028] dark:bg-[#88c958] ring-2 ring-white dark:ring-[#08090a]" />
                  )}

                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {item.label}
                      {item.badge ? ` (${item.badge})` : ''}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
