'use client';

import React from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  labelLeft?: React.ReactNode;
  labelRight?: React.ReactNode;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'gradient',
  size = 'sm',
  showLabel = false,
  labelLeft,
  labelRight,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeStyles = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  const variantStyles = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    gradient: 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600',
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {(showLabel || labelLeft || labelRight) && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>{labelLeft}</div>
          <div>{labelRight || `${percentage}%`}</div>
        </div>
      )}

      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`${sizeStyles[size]} rounded-full transition-all duration-500 ${variantStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
