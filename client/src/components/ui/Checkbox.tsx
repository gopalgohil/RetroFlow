'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, id, className = '', ...props }, ref) => {
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={`mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 transition-all ${className}`}
            {...props}
          />
          {label && (
            <span className="text-xs sm:text-sm text-slate-600 leading-tight">
              {label}
            </span>
          )}
        </label>
        {description && <p className="text-xs text-slate-400 pl-6.5">{description}</p>}
        {error && <p className="text-xs text-rose-600 font-medium pl-6.5">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
