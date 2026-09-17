'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const toggleTheme = () => {
    if (typeof window === 'undefined') return;
    const isDark =
      document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';

    localStorage.setItem('retroflow_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

    // Broadcast change to other mounted components
    window.dispatchEvent(new Event('retroflow-theme-change'));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle light / dark mode"
      className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-colors duration-150 shrink-0 select-none
        bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-2xs
        dark:bg-slate-900/90 dark:border-slate-800 dark:text-amber-400 dark:hover:bg-slate-800 dark:hover:border-slate-700 dark:shadow-2xs
        ${className}`}
    >
      {/* Light mode: Moon icon (click to switch to dark mode) */}
      <Moon className="w-4 h-4 block dark:hidden text-slate-600 hover:-rotate-12 transition-transform shrink-0" />

      {/* Dark mode: Sun icon (click to switch to light mode) */}
      <Sun className="w-4 h-4 hidden dark:block text-amber-400 hover:rotate-45 transition-transform shrink-0" />
    </button>
  );
};

export default ThemeToggle;
