import React from 'react';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/ui';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-white font-sans antialiased selection:bg-[#5cb028] selection:text-white overflow-x-hidden">
      {/* Dynamic Animated Aurora & Dot Grid Background (Framer Motion) */}
      <AnimatedBackground />

      {/* Top Header with Brand Logo & Back to Home */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#5cb028] flex items-center justify-center text-white shadow-sm shadow-[#5cb028]/25 group-hover:scale-105 transition-transform">
            <svg
              className="w-4 h-4"
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
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            Retro<span className="text-[#5cb028]">Flow</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-[#5cb028] transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Center Content: Login / Signup Form with Card Border & Subtle Glass Backdrop */}
      <main className="relative z-10 my-auto py-8 px-4 sm:px-6 w-full flex items-center justify-center">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
          {children}
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} RetroFlow. All rights reserved.
      </footer>
    </div>
  );
}
