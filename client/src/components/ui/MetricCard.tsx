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
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  const percentage = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 transition-all ${
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-sm' : ''
      } ${className}`}
    >
      {/* Top Title & Icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
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
        <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
        {trend && (
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
              trend.isPositive !== false
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {/* Optional Progress Bar */}
      {progress && (
        <div className="space-y-1 pt-0.5">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>{progress.label || `${progress.current}/${progress.total}`}</span>
            <span>{percentage}% complete</span>
          </div>
        </div>
      )}

      {/* Subtitle / Microcopy */}
      {subtitle && (
        <p className="text-[11px] text-slate-500 leading-relaxed font-normal">{subtitle}</p>
      )}

      {children}
    </div>
  );
};

export default MetricCard;
