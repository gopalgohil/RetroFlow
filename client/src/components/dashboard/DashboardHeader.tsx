'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { ProjectSwitcher } from '@/components/navigation/ProjectSwitcher';
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
  user?: { name?: string; email?: string; role?: string } | null;
  onLogout?: () => void;
  onUserUpdated?: (updated: { name: string; email: string; role?: string }) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onOpenMobileMenu,
  user,
  isAdmin,
  onLogout,
  onUserUpdated,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeUser = user || {
    name: 'Gopal',
    email: 'gopalgohel249@gmail.com',
    role: 'admin',
  };

  const userEmail = activeUser.email?.toLowerCase().trim();
  const userRole = activeUser.role?.toLowerCase().trim();
  const isUserAdmin =
    isAdmin !== undefined
      ? isAdmin
      : Boolean(
          userRole === 'admin' ||
          (userEmail && userEmail === 'gopalgohel249@gmail.com') ||
          (userEmail && userEmail.includes('admin'))
        );

  const initials = activeUser.name
    ? activeUser.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'G';

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Hamburger + Project Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Intuitive Project Switcher */}
          <ProjectSwitcher />
        </div>

        {/* Right: User Profile Dropdown Pill */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-2.5 pr-2.5 sm:pr-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50/90 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none"
          >
            {/* User Initials Avatar */}
            <div
              suppressHydrationWarning
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
            >
              {initials}
            </div>

            {/* User Name & Role */}
            <div className="text-left hidden sm:block">
              <p suppressHydrationWarning className="text-xs font-bold text-slate-900 leading-tight">
                {activeUser.name || 'Gopal'}
              </p>
              <p suppressHydrationWarning className="text-[11px] font-medium text-slate-400 capitalize leading-tight">
                {isUserAdmin ? 'Admin' : 'Developer'}
              </p>
            </div>

            {/* Chevron icon toggles up/down on open */}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Overview Box */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 mb-1">
                <div className="flex items-center gap-2.5">
                  <div
                    suppressHydrationWarning
                    className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                  >
                    {initials}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center gap-1.5">
                      <p suppressHydrationWarning className="text-xs font-bold text-slate-900 truncate">
                        {activeUser.name || 'Gopal'}
                      </p>
                      {isUserAdmin ? (
                        <span suppressHydrationWarning className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0 leading-none">
                          Admin
                        </span>
                      ) : (
                        <span suppressHydrationWarning className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 leading-none">
                          Developer
                        </span>
                      )}
                    </div>
                    <p
                      suppressHydrationWarning
                      className="text-[11px] text-slate-500 font-medium truncate mt-0.5"
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 transition-colors cursor-pointer text-left group"
                >
                  <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  <span>My Profile</span>
                </button>

                <div className="my-1 h-px bg-slate-100" />

                {/* Logout Button */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
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
