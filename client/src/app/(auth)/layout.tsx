'use client';

import React from 'react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ui';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#f4f6f9] dark:bg-[#08090a] text-slate-900 dark:text-white font-sans antialiased selection:bg-[#88c958] selection:text-[#08090a] transition-colors duration-200">
      <header className="w-full border-b border-slate-200/80 dark:border-white/[0.08] sticky top-0 z-50 bg-white/80 dark:bg-[#08090a]/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none" title="RetroFlow by Digiflux">
            <Image
              src="/logo.svg"
              alt="Digiflux Logo"
              width={140}
              height={44}
              className="h-9 sm:h-10 w-auto object-contain"
              priority
              unoptimized
            />
            <span className="h-6 w-px bg-slate-200 dark:bg-white/[0.12]" aria-hidden="true" />
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
              RetroFlow
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 w-full flex items-center justify-center">
        <div
          className="w-full max-w-md bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] rounded-3xl px-6 sm:px-8 py-8 sm:py-11 shadow-lg shadow-slate-200/70 dark:shadow-2xl dark:shadow-black/50 min-h-[520px] sm:min-h-[560px] flex flex-col justify-center"
        >
          {children}
        </div>
      </main>

    </div>
  );
}

