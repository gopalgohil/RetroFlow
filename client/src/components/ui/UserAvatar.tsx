'use client';

import React, { useState, useEffect, useMemo } from 'react';

export interface UserAvatarProps {
  name?: string;
  email?: string;
  title?: string;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
  const [imgError, setImgError] = useState(false);
  const tooltipText = title || email || name;

  // Reset img error if avatar URL changes
  useEffect(() => {
    setImgError(false);
  }, [avatar]);

  // Check if avatar is a valid web image URL
  const isImageUrl = Boolean(
    avatar &&
      typeof avatar === 'string' &&
      !imgError &&
      (avatar.startsWith('http://') ||
        avatar.startsWith('https://') ||
        avatar.startsWith('data:image/') ||
        avatar.startsWith('/'))
  );

  // Compute clean 1-2 letter uppercase initials safely (Never render a URL or long hash as text!)
  const initials = useMemo(() => {
    // If someone explicitly passed a 1-2 letter initial code
    if (
      avatar &&
      typeof avatar === 'string' &&
      avatar.length <= 2 &&
      !avatar.includes('/') &&
      !avatar.includes('.') &&
      !avatar.includes(':')
    ) {
      return avatar.toUpperCase();
    }

    // Derive from name or email
    const cleanName = (name && name.trim()) || '';
    const cleanEmail = (email && email.trim()) || '';

    if (cleanName && cleanName.toLowerCase() !== 'user' && !cleanName.includes('@')) {
      const parts = cleanName.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
      }
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    if (cleanEmail) {
      const prefix = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      return (prefix.slice(0, 2) || 'U').toUpperCase();
    }

    return 'U';
  }, [avatar, name, email]);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px] rounded-md',
    sm: 'w-7 h-7 text-[10px] rounded-lg',
    md: 'w-8 h-8 text-xs rounded-xl',
    lg: 'w-10 h-10 text-sm rounded-xl',
    xl: 'w-12 h-12 text-base rounded-2xl',
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  return (
    <div className="relative group/avatar inline-flex shrink-0">
      <div
        className={`${sizeClasses[size]} overflow-hidden bg-gradient-to-tr from-[#5cb028] via-[#52a622] to-[#6ec437] text-white dark:from-[#88c958] dark:via-[#7cb356] dark:to-[#6ea347] dark:text-white font-black flex items-center justify-center shadow-xs select-none cursor-default ${className}`}
      >
        {isImageUrl ? (
          <img
            src={avatar!}
            alt={name || 'Avatar'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="leading-none tracking-wider">{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-[#08090a] ${
            statusDotSizes[size]
          } ${status === 'online' ? 'bg-[#88c958]' : 'bg-slate-400'}`}
        />
      )}

      {/* Floating Tooltip displaying User Email on Hover */}
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
