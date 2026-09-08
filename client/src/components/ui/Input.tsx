'use client';

import React, { forwardRef, useState, InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      showPasswordToggle = true,
      className = '',
      id,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPasswordField = type === 'password';
    const computedType = isPasswordField && isPasswordVisible ? 'text' : type;
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-slate-800">
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={computedType}
            className={`w-full rounded-xl border bg-white py-2.5 text-sm text-slate-900 placeholder:text-slate-400 
              transition-all duration-150 outline-none
              ${startIcon ? 'pl-10' : 'pl-3.5'}
              ${endIcon || (isPasswordField && showPasswordToggle) ? 'pr-10' : 'pr-3.5'}
              ${
                error
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
              }
              ${className}`}
            {...props}
          />
          {isPasswordField && showPasswordToggle ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              >
                {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          ) : endIcon ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {endIcon}
            </div>
          ) : null}
        </div>
        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
