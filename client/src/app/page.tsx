'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, ArrowRight, ShieldCheck, Zap, Target } from 'lucide-react';

export default function HomePage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Read the active theme initialized by the layout blocking script
  useEffect(() => {
    const activeTheme =
      (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') ||
      (localStorage.getItem('retroflow_theme') as 'dark' | 'light') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('retroflow_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white theme-bg">
      {/* Top Navigation Bar */}
      <header className="w-full border-b sticky top-0 z-50 theme-header backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              RF
            </div>
            <span className="font-extrabold text-xl tracking-tight theme-brand-name">
              Retro<span className="text-indigo-500">Flow</span>
            </span>
          </Link>

          {/* Right Controls: Theme Switcher & Auth Links */}
          <div className="flex items-center gap-3">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme mode"
              className="p-2 rounded-xl border cursor-pointer flex items-center justify-center transition-all theme-toggle-btn"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 transition-transform hover:rotate-45 duration-300" />
              ) : (
                <Moon className="w-4 h-4 transition-transform hover:-rotate-12 duration-300" />
              )}
            </button>

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
              className="px-4 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden text-center">
        {/* Ambient Gradient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-3xl pointer-events-none theme-glow" />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider theme-pill">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Continuous Improvement Platform
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight theme-heading">
            Turn Sprint Retrospectives Into{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Actionable Growth
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-sm sm:text-base max-w-xl mx-auto leading-relaxed theme-subtext">
            Collaborate in real-time, collect honest feedback, and eliminate team bottlenecks with
            high-impact agile retrospectives.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Start Free Retrospective</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl border font-bold text-xs sm:text-sm transition-all hover:scale-105 theme-btn-secondary"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl border backdrop-blur-sm space-y-2.5 transition-all duration-300 theme-card">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold theme-card-title">Live Agile Boards</h3>
            <p className="text-xs leading-relaxed theme-card-desc">
              Real-time sticky notes, live voting, and topic categorization for your entire engineering and product team.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl border backdrop-blur-sm space-y-2.5 transition-all duration-300 theme-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold theme-card-title">Enterprise Security</h3>
            <p className="text-xs leading-relaxed theme-card-desc">
              Brevo 6-digit OTP verification, bcrypt encryption, rate-limiting, and signed JWT authentication.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl border backdrop-blur-sm space-y-2.5 transition-all duration-300 theme-card">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
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
      <footer className="w-full border-t py-6 text-center text-xs theme-footer">
        © {new Date().getFullYear()} RetroFlow Inc. All rights reserved.
      </footer>
    </div>
  );
}
