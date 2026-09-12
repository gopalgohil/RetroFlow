'use client';

import React from 'react';
import Link from 'next/link';

export interface AuthShowcaseProps {
  title?: string;
  subtitle?: string;
  tagline?: string;
  imageSrc?: string;
  imageAlt?: string;
  sprintTitle?: string;
  sprintFacilitator?: string;
  notes?: any[];
}

export const AuthShowcase: React.FC<AuthShowcaseProps> = ({
  title = 'RetroFlow',
  subtitle = 'Continuous Improvement for Modern Agile Teams',
  tagline = 'Empowering teams to reflect, align, and act.',
  imageSrc = '/auth-illustration.png',
  imageAlt = 'Agile Team Retrospective & Innovation',
}) => {
  return (
    <div className="relative flex flex-col justify-between h-full w-full bg-[#eef3fb] p-8 sm:p-12 lg:p-14 select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Section */}
      <div className="relative z-10 space-y-1">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 8h10" />
              <path d="M7 12h4" />
              <path d="M7 16h7" />
              <circle cx="16" cy="14" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </span>
        </Link>
        <p className="text-slate-600 text-sm font-normal pt-1">
          {subtitle}
        </p>
      </div>

      {/* Middle Illustration Showcase Card */}
      <div className="relative z-10 my-auto py-4">
        <div className="w-full max-w-lg mx-auto rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/75 shadow-lg shadow-indigo-950/5 p-6 sm:p-8 flex flex-col items-center text-center">
          <div className="w-full max-w-[400px] flex items-center justify-center">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-auto max-h-72 object-contain filter drop-shadow-sm hover:scale-[1.02] transition-transform duration-300"
            />
          </div>

          <div className="mt-6 space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Collaborative Sprint Retrospectives
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Unite your team to reflect on past sprints, spark innovative solutions, and continuously improve team performance.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Tagline */}
      <div className="relative z-10 pt-2">
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          {tagline}
        </p>
      </div>
    </div>
  );
};
