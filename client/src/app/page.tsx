'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d0f17] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="w-full border-b border-slate-800/80 bg-[#0d0f17]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-600/30">
              RF
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Retro<span className="text-indigo-400">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden text-center">
        {/* Ambient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Continuous Improvement Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turn Sprint Retrospectives Into{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Actionable Growth
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Collaborate in real-time, collect honest feedback, and eliminate team bottlenecks with high-impact agile retrospectives.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              Start Free Retrospective →
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all hover:scale-105"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="text-base font-bold text-white">Live Agile Boards</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time sticky notes, live voting, and categorization for your entire engineering and product team.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm space-y-2">
            <div className="text-2xl">🔒</div>
            <h3 className="text-base font-bold text-white">Enterprise Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Brevo 6-digit OTP verification, bcrypt encryption, rate-limiting, and JWT authentication.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm space-y-2">
            <div className="text-2xl">🎯</div>
            <h3 className="text-base font-bold text-white">Actionable Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Convert retrospective takeaways into tracked action items integrated with your sprint workflows.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} RetroFlow Inc. All rights reserved.
      </footer>
    </div>
  );
}
