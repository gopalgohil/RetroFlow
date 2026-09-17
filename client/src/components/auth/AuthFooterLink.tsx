'use client';

import React from 'react';
import Link from 'next/link';

export interface AuthFooterLinkProps {
  prompt: string;
  actionText: string;
  href: string;
  className?: string;
}

export const AuthFooterLink: React.FC<AuthFooterLinkProps> = ({
  prompt,
  actionText,
  href,
  className = '',
}) => {
  return (
    <div className={`text-center pt-2 ${className}`}>
      <p className="text-sm text-slate-500">
        {prompt}{' '}
        <Link
          href={href}
          className="font-semibold text-[#5cb028] hover:text-[#4e9921] hover:underline transition-colors"
        >
          {actionText}
        </Link>
      </p>
    </div>
  );
};
