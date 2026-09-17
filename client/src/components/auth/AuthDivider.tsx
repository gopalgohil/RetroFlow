'use client';

import React from 'react';

export interface AuthDividerProps {
  label?: string;
  className?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({
  label = 'Or continue with email',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center justify-center my-4 ${className}`}>
      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
      <span className="absolute bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 dark:text-slate-500 select-none">
        {label}
      </span>
    </div>
  );
};
