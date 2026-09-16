'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ProjectDetailSkeleton } from '@/components/project/ProjectSkeletons';

export default function ProjectLoading() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role?: string;
    projectRole?: string;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) setUser(JSON.parse(saved));
      } catch {}
    }
  }, [user]);

  const activeUser = user || {
    name: '',
    email: '',
    role: 'member',
    projectRole: 'Developer',
  };

  const isWorkspaceAdmin = Boolean(
    activeUser.role === 'admin' ||
    activeUser.email?.toLowerCase().trim() === 'gopalgohel249@gmail.com'
  );

  const initials = activeUser.name
    ? activeUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'G';

  const displayRole = isWorkspaceAdmin
    ? 'Admin'
    : (activeUser as any).projectRole || 'Manager';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#FFFFFF] text-slate-900 flex selection:bg-indigo-500 selection:text-white font-sans">
      {/* 1. Real persistent Sidebar - NO skeleton */}
      <Sidebar
        activeTab="projects"
        setActiveTab={() => {}}
        activeSessionsCount={1}
        user={activeUser}
        isAdmin={isWorkspaceAdmin}
        isOpen={false}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header - Real stable layout, NO skeleton */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center">
                PR
              </div>
              <span className="text-xs font-bold text-slate-800">Project Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs select-none">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {activeUser.name || 'Gopal'}
                </p>
                <p className="text-[11px] font-medium text-slate-400 capitalize leading-tight">
                  {displayRole}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 3. ONLY the redirected page content area renders the ProjectDetailSkeleton */}
        <div className="flex-1 overflow-y-auto">
          <ProjectDetailSkeleton activeTab="overview" />
        </div>
      </div>
    </div>
  );
}
