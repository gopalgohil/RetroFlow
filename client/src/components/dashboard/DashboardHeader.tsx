'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { ProjectSwitcher } from '@/components/navigation/ProjectSwitcher';
import { ThemeToggle } from '@/components/ui';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { MyProfileModal } from './MyProfileModal';

interface DashboardHeaderProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  pendingApprovalsCount?: number;
  onCreateClick?: () => void;
  onOpenMobileMenu: () => void;
  isAdmin?: boolean;
  isLoading?: boolean;
  user?: { name?: string; email?: string; role?: string; projectRole?: string } | null;
  onLogout?: () => void;
  onUserUpdated?: (updated: { name: string; email: string; role?: string; projectRole?: string }) => void;
  isSessionsTab?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onOpenMobileMenu,
  user,
  isAdmin,
  onLogout,
  onUserUpdated,
  isSessionsTab = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeUser = user || {
    name: '',
    email: '',
    role: 'member',
    projectRole: 'Developer',
  };

  const userEmail = activeUser.email?.toLowerCase().trim();
  const userRole = activeUser.role?.toLowerCase().trim();
  const isRealAdmin = Boolean(
    userRole === 'admin' ||
    (userEmail && userEmail === 'gopalgohel249@gmail.com')
  );

  const isUserAdmin = isAdmin !== undefined ? (isAdmin && isRealAdmin) : isRealAdmin;

  const displayRole = isUserAdmin
    ? 'Admin'
    : (activeUser as any).projectRole &&
      (activeUser as any).projectRole !== 'member' &&
      (activeUser as any).projectRole !== 'Unassigned'
    ? (activeUser as any).projectRole
    : 'Developer';

  const initials = activeUser.name
    ? activeUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#08090a]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-colors duration-200">
        {/* Left: Mobile Hamburger + Project Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] lg:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Intuitive Project Switcher */}
          <ProjectSwitcher user={activeUser} />
        </div>

        {/* Right: Theme Toggle & User Profile Dropdown Pill */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Universal Theme Switcher */}
          <ThemeToggle />

          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-2.5 pr-2.5 sm:pr-3 py-1.5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] hover:dark:border-white/[0.16] hover:bg-slate-50/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none"
            >
              {/* User Initials Avatar */}
              <div
                suppressHydrationWarning
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5cb028] via-[#52a622] to-[#6ec437] text-white dark:from-[#88c958] dark:to-[#6ea347] dark:text-[#08090a] flex items-center justify-center font-bold dark:font-black text-xs shrink-0 shadow-xs"
              >
                {initials}
              </div>

              {/* User Name & Role */}
              <div className="text-left hidden sm:block">
                <p suppressHydrationWarning className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {activeUser.name || 'Gopal'}
                </p>
                <p suppressHydrationWarning className="text-[11px] font-medium text-slate-400 dark:text-slate-400 capitalize leading-tight">
                  {displayRole}
                </p>
              </div>

              {/* Chevron icon toggles up/down on open */}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-[#5cb028]' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/60 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Profile Overview Box */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      suppressHydrationWarning
                      className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5cb028] via-[#52a622] to-[#6ec437] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                    >
                      {initials}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5">
                        <p suppressHydrationWarning className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {activeUser.name || 'Gopal'}
                        </p>
                        <span
                          suppressHydrationWarning
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 leading-none ${
                            displayRole.toLowerCase() === 'admin'
                              ? 'bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#86efac] border border-[#cdeac0] dark:border-[#5cb028]/30'
                              : displayRole.toLowerCase() === 'manager'
                              ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : displayRole.toLowerCase() === 'project lead'
                              ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : displayRole.toLowerCase().includes('qa') || displayRole.toLowerCase().includes('tester')
                              ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : displayRole.toLowerCase() === 'devops'
                              ? 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {displayRole}
                        </span>
                      </div>
                      <p
                        suppressHydrationWarning
                        className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5"
                        title={activeUser.email}
                      >
                        {activeUser.email || 'gopalgohel249@gmail.com'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action items */}
                <div className="pt-1 space-y-0.5">
                  {/* My Profile Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#5cb028] dark:hover:text-[#5cb028] hover:bg-[#eaf5e3] dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-left group"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-[#5cb028] transition-colors" />
                    <span>My Profile</span>
                  </button>

                  <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

                  {/* Logout Button */}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span>Log Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* My Profile Modal */}
      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={activeUser}
        onUserUpdated={onUserUpdated}
      />

      {/* Logout Confirmation Modal */}
      {onLogout && (
        <LogoutConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={() => {
            setIsLogoutModalOpen(false);
            onLogout();
          }}
          user={activeUser}
        />
      )}
    </>
  );
};
