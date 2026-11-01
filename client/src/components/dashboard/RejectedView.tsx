'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, XCircle, AlertTriangle, UserPlus } from 'lucide-react';
import { LogoutConfirmModal } from './LogoutConfirmModal';

const WORKSPACE_SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@digiflux.io';

export interface RejectedViewProps {
  user?: { name?: string; email?: string };
  onLogout?: () => void;
  onRegisterAgain?: () => void;
}

export function RejectedView({ user, onLogout, onRegisterAgain }: RejectedViewProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      localStorage.removeItem('retroflow_token');
      localStorage.removeItem('retroflow_user');
      localStorage.removeItem('retroflow_rejected');
      localStorage.removeItem('retroflow_cached_active_project');
      localStorage.removeItem('retroflow_active_project_id');
      localStorage.removeItem('retroflow_cached_projects_list');
      sessionStorage.clear();
      document.cookie = 'retroflow_user=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'retroflow_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'retroflow_rejected=; path=/; max-age=0; SameSite=Lax';
    } catch {}
    window.location.href = '/login';
  };

  const handleRegisterAgain = () => {
    if (onRegisterAgain) {
      onRegisterAgain();
      return;
    }
    try {
      localStorage.removeItem('retroflow_token');
      localStorage.removeItem('retroflow_user');
      localStorage.removeItem('retroflow_rejected');
      sessionStorage.clear();
      document.cookie = 'retroflow_user=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'retroflow_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'retroflow_rejected=; path=/; max-age=0; SameSite=Lax';
    } catch {}
    window.location.href = '/signup';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF1F2] via-[#F8FAFC] to-[#FFFFFF] text-slate-900 flex flex-col justify-between selection:bg-rose-500 selection:text-white relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      <header className="px-6 py-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-md flex items-center justify-between relative z-10 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center">
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
          <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
            Request Rejected
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer border border-slate-200 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Back to Login</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-xl w-full rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
            <XCircle className="w-8 h-8 text-rose-600" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 tracking-wide uppercase">
              Access Request Rejected
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Request Not Approved
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Your workspace access request was not approved by the administrator. Your registration record has been removed from the system.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-left space-y-2 text-xs text-rose-900">
            <div className="flex items-center gap-2 font-bold text-rose-950">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>What should you do?</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              If you believe this was an error, please contact your workspace administrator at <strong className="font-semibold text-rose-950">{WORKSPACE_SUPPORT_EMAIL}</strong>, or you can submit a new registration.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRegisterAgain}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Again</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 relative z-10">
        Need immediate access? Contact workspace owner at{' '}
        <a href={`mailto:${WORKSPACE_SUPPORT_EMAIL}`} className="font-semibold text-[#5cb028] hover:underline">
          {WORKSPACE_SUPPORT_EMAIL}
        </a>
      </footer>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          handleLogout();
        }}
        user={user}
      />
    </div>
  );
}
