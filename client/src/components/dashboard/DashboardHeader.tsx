'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { ProjectSwitcher } from '@/components/navigation/ProjectSwitcher';

interface DashboardHeaderProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  pendingApprovalsCount?: number;
  onCreateClick?: () => void;
  onOpenMobileMenu: () => void;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onOpenMobileMenu,
}) => {

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Mobile Hamburger + Project Switcher + Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Intuitive Project Switcher */}
        <ProjectSwitcher />
      </div>
    </header>
  );
};
