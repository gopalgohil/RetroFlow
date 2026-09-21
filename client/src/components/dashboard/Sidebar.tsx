'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
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
      : Boolean(userRole === 'admin');

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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#08090a] border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand (Exact h-16 to align seamlessly with DashboardHeader) */}
        <div className="h-16 flex items-center pl-[38px] pr-6 border-b border-slate-200/80 dark:border-white/[0.08] shrink-0">
          <Link
            href="/dashboard"
            onClick={() => {
              setActiveTab('sessions');
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center cursor-pointer select-none"
            title="Go to Retrospective Sessions"
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
          </Link>
        </div>

        {/* Navigation Items Area */}
        <div className="px-4 pt-12 pb-6 flex-1 overflow-y-auto">
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
                  className={`w-full flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#5cb028] text-white shadow-sm shadow-[#5cb028]/25 dark:bg-[#88c958] dark:text-[#08090a] dark:font-black dark:shadow-md dark:shadow-[#88c958]/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-white dark:text-[#08090a]'
                          : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <div className="text-left min-w-0">
                      <p suppressHydrationWarning className="whitespace-nowrap tracking-tight">
                        {item.label}
                      </p>
                      {item.sublabel && !isActive && (
                        <p suppressHydrationWarning className="text-[10px] font-normal text-slate-400 dark:text-slate-500 whitespace-nowrap truncate">
                          {item.sublabel}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`shrink-0 ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap leading-tight ${
                        isActive
                          ? 'bg-white/25 text-white dark:bg-[#08090a]/15 dark:text-[#08090a] dark:font-black'
                          : 'bg-[#eaf5e3] dark:bg-[#88c958]/20 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30'
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
      </aside>
    </>
  );
};
