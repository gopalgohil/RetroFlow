'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '../ui/Badge';
import { RetroNoteCard, RetroNoteCardProps } from './RetroNoteCard';

export interface AuthShowcaseProps {
  title?: string;
  subtitle?: string;
  tagline?: string;
  sprintTitle?: string;
  sprintFacilitator?: string;
  notes?: RetroNoteCardProps[];
}

const DEFAULT_NOTES: RetroNoteCardProps[] = [
  {
    categoryTitle: 'What went well',
    categoryVariant: 'success',
    content: 'The new CI pipeline significantly reduced deploy friction. Great job team!',
    author: 'Dave',
  },
  {
    categoryTitle: 'What to improve',
    categoryVariant: 'danger',
    content: 'Daily standups are running over 15 minutes. We need to keep updates concise.',
    author: 'Alice',
    upvotes: 3,
  },
];

export const AuthShowcase: React.FC<AuthShowcaseProps> = ({
  title = 'RetroFlow',
  subtitle = 'Continuous Improvement for Modern Agile Teams',
  tagline = 'Empowering teams to reflect, align, and act.',
  sprintTitle = 'Sprint 42 Retrospective',
  sprintFacilitator = 'Facilitated by Sarah · 8 participants',
  notes = DEFAULT_NOTES,
}) => {
  return (
    <div className="relative flex flex-col justify-between h-full w-full bg-[#eef3fb] p-8 sm:p-12 lg:p-16 select-none overflow-hidden">
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

      {/* Middle Interactive Preview Card */}
      <div className="relative z-10 my-auto py-8">
        <div className="w-full max-w-xl mx-auto rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-indigo-950/5 p-6 sm:p-7">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {sprintTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {sprintFacilitator}
              </p>
            </div>
            <Badge variant="live">
              LIVE Retrospective
            </Badge>
          </div>

          {/* Retrospective Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            {notes.map((note, index) => (
              <RetroNoteCard key={index} {...note} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Tagline */}
      <div className="relative z-10 pt-4">
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          {tagline}
        </p>
      </div>
    </div>
  );
};
