'use client';

import React from 'react';

export interface UserAvatarProps {
  name?: string;
  email?: string;
  title?: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'User',
  email,
  title,
  avatar,
  size = 'md',
  status,
  className = '',
}) => {
  const tooltipText = title || email || name;
  const initials =
    avatar ||
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px] rounded-md',
    sm: 'w-7 h-7 text-[10px] rounded-lg',
    md: 'w-8 h-8 text-xs rounded-xl',
    lg: 'w-10 h-10 text-sm rounded-xl',
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div className="relative group/avatar inline-flex shrink-0">
      <div
        className={`${sizeClasses[size]} bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 text-white font-bold flex items-center justify-center shadow-xs select-none cursor-default ${className}`}
        title={tooltipText}
      >
        {initials}
      </div>

      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white ${
            statusDotSizes[size]
          } ${status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}
        />
      )}

      {/* Floating Tooltip displaying User Email on Hover */}
      {tooltipText && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/avatar:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/95 backdrop-blur-xs text-white text-[11px] font-medium shadow-xl whitespace-nowrap z-50 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
          <span>{tooltipText}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
