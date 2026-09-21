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
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#f4f6f9] dark:bg-[#08090a] text-slate-900 dark:text-white font-sans antialiased selection:bg-[#88c958] selection:text-[#08090a] transition-colors duration-200">
      {/* Top Header with Brand Logo, Theme Toggle & Back to Home */}
      <header className="w-full border-b border-slate-200/80 dark:border-white/[0.08] sticky top-0 z-50 bg-white/80 dark:bg-[#08090a]/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center" title="Return to Home">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={140}
              height={44}
              className="h-9 sm:h-10 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-[#88c958] dark:text-slate-400 dark:hover:text-[#88c958] transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Center Content: Centered Card Box (Fixed & Rock-solid, zero reload movement) */}
      <main className="flex-1 py-6 sm:py-10 px-4 sm:px-6 w-full flex items-center justify-center">
        <div
          className="w-full max-w-md bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-5 sm:p-7 shadow-lg shadow-slate-200/70 dark:shadow-2xl dark:shadow-black/50"
        >
          {children}
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} Digiflux. All rights reserved.
      </footer>
    </div>
  );
}

