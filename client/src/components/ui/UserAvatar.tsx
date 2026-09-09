'use client';

import React from 'react';

export interface UserAvatarProps {
  name?: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'User',
  avatar,
  size = 'md',
  status,
  className = '',
}) => {
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
    <div className="relative inline-flex shrink-0">
      <div
        className={`${sizeClasses[size]} bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 text-white font-bold flex items-center justify-center shadow-xs select-none ${className}`}
        title={name}
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
    </div>
  );
};

export default UserAvatar;
