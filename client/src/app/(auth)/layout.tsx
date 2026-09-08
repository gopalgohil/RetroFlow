import React from 'react';
import Link from 'next/link';
import { AuthShowcase } from '@/components/auth/AuthShowcase';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex bg-white font-sans antialiased">
      {/* Left Panel: Product Showcase & Brand (visible on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 h-screen sticky top-0">
        <AuthShowcase />
      </div>

      {/* Right Panel: Authentication Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-16 overflow-y-auto bg-white">
        {/* Mobile Header (Brand logo shown only on mobile when left panel is hidden) */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
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
              RetroFlow
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Center Content: Login / Signup Form */}
        <div className="my-auto py-4 flex items-center justify-center">
          {children}
        </div>

        {/* Mobile / General Footer */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} RetroFlow Inc.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600">Privacy</a>
            <a href="#" className="hover:text-slate-600">Terms</a>
            <a href="#" className="hover:text-slate-600">Help</a>
          </div>
        </div>
      </div>
    </div>
  );
}
