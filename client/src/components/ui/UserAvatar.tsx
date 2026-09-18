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
        className={`${sizeClasses[size]} bg-gradient-to-tr from-[#5cb028] via-[#52a622] to-[#6ec437] text-white dark:from-[#88c958] dark:via-[#7cb356] dark:to-[#6ea347] dark:text-white font-black flex items-center justify-center shadow-xs select-none cursor-default ${className}`}
      >
        {initials}
      </div>

      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-[#08090a] ${
            statusDotSizes[size]
          } ${status === 'online' ? 'bg-[#88c958]' : 'bg-slate-400'}`}
        />
      )}

      {/* Floating Tooltip displaying User Email on Hover (Single, Clean, Top-Aligned without Left Clipping) */}
      {tooltipText && (
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover/avatar:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-semibold shadow-xl shadow-slate-950/25 whitespace-nowrap z-50 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
          <span>{tooltipText}</span>
          <div className="absolute top-full left-3.5 -mt-0.5 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
