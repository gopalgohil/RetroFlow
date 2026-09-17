'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const readActiveTheme = (): 'dark' | 'light' => {
      if (typeof window === 'undefined') return 'dark';
      const docTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
      if (docTheme === 'dark' || docTheme === 'light') return docTheme;
      const savedTheme = localStorage.getItem('retroflow_theme') as 'dark' | 'light';
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    setTheme(readActiveTheme());

    const handleThemeSync = () => {
      setTheme(readActiveTheme());
    };

    window.addEventListener('retroflow-theme-change', handleThemeSync);
    window.addEventListener('storage', handleThemeSync);

    return () => {
      window.removeEventListener('retroflow-theme-change', handleThemeSync);
      window.removeEventListener('storage', handleThemeSync);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
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

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={`w-9 h-9 rounded-xl border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 flex items-center justify-center text-slate-500 opacity-50 ${className}`}
      >
        <span className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
      className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center
        ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-slate-800 text-amber-400 hover:bg-slate-800 hover:border-slate-700 shadow-sm shadow-black/20'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs'
        } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};
