'use client';

import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  isLoading?: boolean;
  spinnerOnly?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  spinnerOnly = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold text-sm rounded-xl px-4 py-2.5 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-2 focus:ring-offset-1';

  const variants = {
    primary:
      'bg-[#5cb028] hover:bg-[#4e9921] active:bg-[#43831c] text-white font-bold shadow-md shadow-[#5cb028]/25 focus:ring-[#5cb028] dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:active:bg-[#7cb356] dark:text-[#08090a] dark:shadow-[#88c958]/25 dark:focus:ring-[#88c958]',
    outline:
      'border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-white shadow-sm focus:ring-[#88c958]',
    ghost:
      'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] active:bg-slate-200 dark:active:bg-white/[0.1] focus:ring-[#88c958]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          {!spinnerOnly && <span>Loading...</span>}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
