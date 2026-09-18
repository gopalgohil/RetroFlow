'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Zap, Target } from 'lucide-react';
import { ThemeToggle } from '@/components/ui';

export default function HomePage() {

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col selection:bg-[#88c958] selection:text-[#08090a] theme-bg">
      {/* Top Navigation Bar */}
      <header className="w-full border-b shrink-0 sticky top-0 z-50 theme-header backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
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

          {/* Right Controls: Theme Switcher & Auth Links */}
          <div className="flex items-center gap-3">
            {/* Dark / Light Mode Toggle Button */}
            <ThemeToggle />

            {/* Sign In Link */}
            <Link
              href="/login"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl theme-nav-link transition-colors"
            >
              Sign In
            </Link>

            {/* Get Started Free Button */}
            <Link
              href="/signup"
              className="px-4 py-2 text-xs sm:text-sm font-bold bg-[#5cb028] hover:bg-[#4e9921] text-white rounded-xl shadow-md shadow-[#5cb028]/20 transition-all duration-200 hover:scale-105 dark:bg-[#88c958] dark:hover:bg-[#76b846] dark:text-[#08090a] dark:shadow-[#88c958]/20"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-6 pb-4 sm:pt-10 sm:pb-6 lg:pt-12 lg:pb-8 relative overflow-hidden text-center">
        {/* Ambient Gradient Glow */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none theme-glow" />

        <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider theme-pill">
            <span className="w-2 h-2 rounded-full bg-[#5cb028] dark:bg-[#88c958] animate-pulse" />
            Continuous Improvement Platform
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight theme-heading">
            Turn Sprint Retrospectives Into{' '}
            <span className="bg-gradient-to-r from-[#5cb028] via-[#4e9921] to-[#3d8318] dark:from-[#88c958] dark:via-[#96dc63] dark:to-[#76b846] bg-clip-text text-transparent">
              Actionable Growth
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed theme-subtext">
            Collaborate in real-time, collect honest feedback, and eliminate team bottlenecks with
            high-impact agile retrospectives.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 sm:pt-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#5cb028]/25 hover:shadow-xl hover:shadow-[#5cb028]/35 transition-all duration-200 flex items-center justify-center gap-2 dark:bg-[#88c958] dark:hover:bg-[#76b846] dark:text-[#08090a] dark:shadow-[#88c958]/25 dark:hover:shadow-[#88c958]/35"
            >
              <span>Start Free Retrospective</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl border font-bold text-xs sm:text-sm transition-colors duration-200 theme-btn-secondary"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mt-8 sm:mt-10 lg:mt-12 text-left">
          {/* Feature 1 */}
          <div className="p-5 sm:p-6 rounded-2xl border backdrop-blur-sm space-y-2.5 transition-all duration-300 theme-card">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold theme-card-title">Live Agile Boards</h3>
            <p className="text-xs leading-relaxed theme-card-desc">
              Real-time sticky notes, live voting, and topic categorization for your entire engineering and product team.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 sm:p-6 rounded-2xl border backdrop-blur-sm space-y-2.5 transition-all duration-300 theme-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold theme-card-title">Enterprise Security</h3>
            <p className="text-xs leading-relaxed theme-card-desc">
              Brevo 6-digit OTP verification, bcrypt encryption, rate-limiting, and signed JWT authentication.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 sm:p-6 rounded-2xl border backdrop-blur-sm space-y-2.5 transition-all duration-300 theme-card">
            <div className="w-10 h-10 rounded-xl bg-[#88c958]/10 text-[#88c958] flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold theme-card-title">Actionable Tracking</h3>
            <p className="text-xs leading-relaxed theme-card-desc">
              Convert retrospective takeaways into tracked action items integrated with your sprint deliverables.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t shrink-0 py-3.5 sm:py-4 text-center text-xs theme-footer">
        © {new Date().getFullYear()} RetroFlow Inc. All rights reserved.
      </footer>
    </div>
  );
}
