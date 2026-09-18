'use client';

import React from 'react';

export interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  unit?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'indigo' | 'violet';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  subtitle?: React.ReactNode;
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  variant = 'default',
  trend,
  subtitle,
  progress,
  children,
  className = '',
  onClick,
}) => {
  const iconVariantStyles = {
    default: 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300',
    success: 'bg-[#88c958]/10 dark:bg-[#88c958]/15 text-[#88c958]',
    warning: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400',
    indigo: 'bg-[#88c958]/10 dark:bg-[#88c958]/15 text-[#88c958]',
    violet: 'bg-[#88c958]/10 dark:bg-[#88c958]/15 text-[#88c958]',
  };

  const percentage = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xl space-y-3 transition-all ${
        onClick ? 'cursor-pointer hover:border-[#88c958]/60 hover:shadow-2xl' : 'hover:border-white/[0.16]'
      } ${className}`}
    >
      {/* Top Title & Icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconVariantStyles[variant]}`}
        >
          {icon}
        </div>
      </div>

      {/* Main Value & Unit / Trend */}
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{unit}</span>}
        {trend && (
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
              trend.isPositive !== false
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {/* Optional Progress Bar */}
      {progress && (
        <div className="space-y-1 pt-0.5">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#5cb028] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span>{progress.label || `${progress.current}/${progress.total}`}</span>
            <span>{percentage}% complete</span>
          </div>
        </div>
      )}

      {/* Subtitle / Microcopy */}
      {subtitle && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">{subtitle}</p>
      )}

      {children}
    </div>
  );
};

export default MetricCard;
