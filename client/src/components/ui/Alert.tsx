'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface AlertProps {
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'error',
  title,
  message,
  children,
  className = '',
}) => {
  const styles = {
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
    info: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
  };

  const content = message || children;
  if (!content) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs font-medium leading-relaxed ${styles[variant]} ${className}`}
    >
      {icons[variant]}
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        <div>{content}</div>
      </div>
    </div>
  );
};
