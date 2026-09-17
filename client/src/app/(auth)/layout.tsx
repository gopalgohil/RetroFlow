'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-white dark:bg-[#0b0f17] text-slate-900 dark:text-white font-sans antialiased selection:bg-[#5cb028] selection:text-white transition-colors duration-200">
      {/* Top Header with Brand Logo, Theme Toggle & Back to Home */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-50 bg-white/80 dark:bg-[#0b0f17]/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={140}
              height={44}
              className="h-9 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-[#5cb028] dark:text-slate-400 dark:hover:text-[#5cb028] transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Center Content: Simple Centered Card Box with Dark Mode Surface & Smooth Open Animation */}
      <main className="my-auto py-4 sm:py-6 px-4 sm:px-6 w-full flex items-center justify-center">
        <div
          key={pathname}
          className="w-full max-w-md bg-white dark:bg-[#0f172a]/95 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-sm dark:shadow-2xl dark:shadow-black/40 animate-auth-open"
        >
          {children}
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} RetroFlow. All rights reserved.
      </footer>
    </div>
  );
}

