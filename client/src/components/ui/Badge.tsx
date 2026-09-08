'use client';

import React from 'react';

export interface BadgeProps {
  variant?: 'live' | 'success' | 'danger' | 'warning' | 'neutral';
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  pulse = false,
  children,
  className = '',
}) => {
  const variantStyles = {
    live: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const dotColors = {
    live: 'bg-emerald-500',
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    warning: 'bg-amber-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold select-none ${variantStyles[variant]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${
          pulse || variant === 'live' ? 'animate-pulse' : ''
        }`}
      />
      {children}
    </span>
  );
};
