'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, ArrowRight, ShieldCheck, Zap, Target } from 'lucide-react';

export default function HomePage() {
  // Synchronously initialize theme from localStorage or document attribute to prevent any FOUC / dark flash
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('retroflow_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'light' || attr === 'dark') return attr;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [isMounted, setIsMounted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('retroflow_theme') as 'dark' | 'light' | null;
    const currentAttr = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
    const resolvedTheme = saved || currentAttr || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    setTheme(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setHasInteracted(true);
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('retroflow_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isDark = theme === 'dark';
  // Only apply animated transition after user clicks toggle button, not on page reload
  const transitionClass = hasInteracted ? 'transition-colors duration-300' : '';

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white ${transitionClass} ${
        isDark
          ? 'bg-[#0B0F17] text-slate-100'
          : 'bg-gradient-to-br from-[#F4F7FF] via-[#FAFCFF] to-[#FFFFFF] text-slate-900'
      }`}
    >
      {/* Top Navigation Bar */}
      <header
        className={`w-full border-b sticky top-0 z-50 ${transitionClass} ${
          isDark
            ? 'border-slate-800/80 bg-[#0B0F17]/80 backdrop-blur-md'
            : 'border-slate-200/90 bg-white/85 backdrop-blur-md shadow-2xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              RF
            </div>
            <span
              className={`font-extrabold text-xl tracking-tight ${transitionClass} ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Retro<span className="text-indigo-500">Flow</span>
            </span>
          </Link>

          {/* Right Controls: Theme Switcher & Auth Links */}
          <div className="flex items-center gap-3">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme mode"
              className={`p-2 rounded-xl border cursor-pointer flex items-center justify-center transition-all ${
                isDark
                  ? 'border-slate-800 bg-slate-900/80 text-amber-400 hover:bg-slate-800 hover:border-slate-700'
                  : 'border-slate-200 bg-white text-indigo-600 hover:bg-slate-100 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {isMounted && (
                isDark ? (
                  <Sun className="w-4 h-4 transition-transform hover:rotate-45 duration-300" />
                ) : (
                  <Moon className="w-4 h-4 transition-transform hover:-rotate-12 duration-300" />
                )
              )}
              {!isMounted && <div className="w-4 h-4" />}
            </button>

            {/* Sign In Link */}
            <Link
              href="/login"
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl ${transitionClass} ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
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
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-3xl pointer-events-none ${transitionClass} ${
            isDark
              ? 'bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 opacity-100'
              : 'bg-gradient-to-tr from-indigo-300/35 via-purple-200/35 to-pink-200/25 opacity-80'
          }`}
        />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Tag Pill */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${transitionClass} ${
              isDark
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Continuous Improvement Platform
          </div>

          {/* Main Hero Headline */}
          <h1
            className={`text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight ${transitionClass} ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Turn Sprint Retrospectives Into{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Actionable Growth
            </span>
          </h1>

          {/* Subtitle Description */}
          <p
            className={`text-sm sm:text-base max-w-xl mx-auto leading-relaxed ${transitionClass} ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
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
              className={`w-full sm:w-auto px-7 py-3.5 rounded-xl border font-bold text-xs sm:text-sm transition-all hover:scale-105 ${transitionClass} ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
              }`}
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          {/* Feature 1 */}
          <div
            className={`p-6 rounded-2xl border backdrop-blur-sm space-y-2.5 ${transitionClass} ${
              isDark
                ? 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                : 'bg-white/90 border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className={`text-base font-bold ${transitionClass} ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Live Agile Boards
            </h3>
            <p className={`text-xs leading-relaxed ${transitionClass} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Real-time sticky notes, live voting, and topic categorization for your entire engineering and product team.
            </p>
          </div>

          {/* Feature 2 */}
          <div
            className={`p-6 rounded-2xl border backdrop-blur-sm space-y-2.5 ${transitionClass} ${
              isDark
                ? 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                : 'bg-white/90 border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className={`text-base font-bold ${transitionClass} ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Enterprise Security
            </h3>
            <p className={`text-xs leading-relaxed ${transitionClass} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Brevo 6-digit OTP verification, bcrypt encryption, rate-limiting, and signed JWT authentication.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            className={`p-6 rounded-2xl border backdrop-blur-sm space-y-2.5 ${transitionClass} ${
              isDark
                ? 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                : 'bg-white/90 border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h3 className={`text-base font-bold ${transitionClass} ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Actionable Tracking
            </h3>
            <p className={`text-xs leading-relaxed ${transitionClass} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Convert retrospective takeaways into tracked action items integrated with your sprint deliverables.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`w-full border-t py-6 text-center text-xs ${transitionClass} ${
          isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200/80 text-slate-500'
        }`}
      >
        © {new Date().getFullYear()} RetroFlow Inc. All rights reserved.
      </footer>
    </div>
  );
}
