'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { LogoutConfirmModal } from './LogoutConfirmModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSessionsCount: number;
  user: { name: string; email: string; role?: string } | null;
  onLogout: () => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeSessionsCount,
  user,
  onLogout,
  isOpen,
  onCloseMobile,
}) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isAdmin = Boolean(
    user && (user.role === 'admin' || user.email === 'gopalgohel249@gmail.com')
  );

  const navItems = [
    {
      id: 'sessions',
      label: isAdmin ? 'Retrospective Sessions' : 'My Retrospectives',
      icon: LayoutDashboard,
      badge: activeSessionsCount > 0 ? `${activeSessionsCount} Live` : undefined,
    },
    {
      id: 'members',
      label: isAdmin ? 'Team Members & Whitelist' : 'Team Directory',
      icon: Users,
      sublabel: isAdmin ? 'Access Controls' : 'Collaborators',
    },
    ...(isAdmin
      ? [
          {
            id: 'settings',
            label: 'Workspace Settings',
            icon: Settings,
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform">
              RF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Retro<span className="text-indigo-600">Flow</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Pro
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">Enterprise Workspace</p>
            </div>
          </Link>

          {/* Workspace Quick Status Pill */}
          <div className="mt-6 p-3 rounded-xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white border border-indigo-100/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">Sprint 42 Active</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100 shadow-xs">
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
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <div className="text-left">
                      <p>{item.label}</p>
                      {item.sublabel && !isActive && (
                        <p className="text-[10px] font-normal text-slate-400">{item.sublabel}</p>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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

        {/* Bottom Profile Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'AD'}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.name || 'Gopal Gohel'}
                  </p>
                  {isAdmin ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                      Admin
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      Developer
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'gopalgohel249@gmail.com'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Popup */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          onLogout();
        }}
        user={user}
      />
    </>
  );
};
