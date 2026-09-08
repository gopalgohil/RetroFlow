'use client';

import React from 'react';

export interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        {title}
      </h1>
      {subtitle && <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>}
    </div>
  );
};
