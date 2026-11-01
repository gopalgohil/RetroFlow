'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { api, ENDPOINTS } from '@/lib/api';

const WORKSPACE_SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@digiflux.io';

export interface WaitingForApprovalViewProps {
  user: { name?: string; email?: string };
  onLogout?: () => void;
  isCheckingStatus?: boolean;
  onCheckApprovalStatus?: () => void;
  approvalCheckMessage?: string | null;
}

export function WaitingForApprovalView({
  user: initialUser,
  onLogout,
  isCheckingStatus: externalIsChecking,
  onCheckApprovalStatus: externalCheckStatus,
  approvalCheckMessage: externalMessage,
}: WaitingForApprovalViewProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [internalChecking, setInternalChecking] = useState(false);
  const [internalMessage, setInternalMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(initialUser);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('retroflow_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          setCurrentUser(parsed);
          document.cookie = `retroflow_user=${encodeURIComponent(saved)}; path=/; max-age=2592000; SameSite=Lax`;
        }
      }
    } catch {}
  }, []);

  const isChecking = externalIsChecking !== undefined ? externalIsChecking : internalChecking;
  const message = externalMessage !== undefined ? externalMessage : internalMessage;

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

  const handleCheckStatus = async () => {
    if (externalCheckStatus) {
      externalCheckStatus();
      return;
    }
    setInternalChecking(true);
    setInternalMessage(null);
    try {
      const res = await api.get(ENDPOINTS.AUTH.ME);
      if (res?.data) {
        if (res.data.status === 'rejected') {
          try {
            localStorage.setItem('retroflow_rejected', 'true');
            document.cookie = 'retroflow_rejected=true; path=/; max-age=2592000; SameSite=Lax';
          } catch {}
          window.location.reload();
          return;
        }
        if (res.data.isApproved) {
          try {
            const userData = JSON.stringify(res.data);
            localStorage.setItem('retroflow_user', userData);
            document.cookie = `retroflow_user=${encodeURIComponent(userData)}; path=/; max-age=2592000; SameSite=Lax`;
            localStorage.removeItem('retroflow_rejected');
            document.cookie = 'retroflow_rejected=; path=/; max-age=0; SameSite=Lax';
          } catch {}
          window.location.reload();
        } else {
          setInternalMessage('Your account is still pending administrator review. Please check back shortly.');
        }
      }
    } catch (err: any) {
      setInternalMessage('Unable to verify approval status at this time. Please try again.');
    } finally {
      setInternalChecking(false);
    }
  };

  useEffect(() => {
    api
      .get(ENDPOINTS.AUTH.ME)
      .then((res) => {
        if (res?.data) {
          if (res.data.status === 'rejected') {
            try {
              localStorage.setItem('retroflow_rejected', 'true');
              document.cookie = 'retroflow_rejected=true; path=/; max-age=2592000; SameSite=Lax';
            } catch {}
            window.location.reload();
          } else if (res.data.isApproved) {
            try {
              const userData = JSON.stringify(res.data);
              localStorage.setItem('retroflow_user', userData);
              document.cookie = `retroflow_user=${encodeURIComponent(userData)}; path=/; max-age=2592000; SameSite=Lax`;
              localStorage.removeItem('retroflow_rejected');
              document.cookie = 'retroflow_rejected=; path=/; max-age=0; SameSite=Lax';
            } catch {}
            window.location.reload();
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#08090a] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-[#5cb028] selection:text-white relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[280px] bg-gradient-to-b from-[#88c958]/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      <header className="px-6 sm:px-10 py-4 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0e1015]/70 backdrop-blur-md flex items-center justify-between relative z-10">
        <Link href="/dashboard" className="flex items-center select-none">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={130}
            height={40}
            className="h-8 sm:h-9 w-auto object-contain dark:brightness-0 dark:invert"
            priority
            unoptimized
          />
        </Link>

        <button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-white/[0.08] cursor-pointer shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>Log Out</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-xl w-full rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] p-8 sm:p-12 shadow-2xl dark:shadow-2xl space-y-7 text-center animate-in zoom-in-95 duration-200">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Waiting for Approval
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              Welcome, <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser.name || 'there'}</span>! Your account has been verified and is awaiting review by a workspace administrator.
            </p>
          </div>

          <div className="px-5 py-4 rounded-2xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-4 text-left shadow-2xs">
            <div className="min-w-0">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Signed in as</p>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">{currentUser.email}</p>
            </div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Review
            </span>
          </div>

          {message && (
            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium border animate-in fade-in duration-150 ${
                message.includes('approved')
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
              }`}
            >
              {message}
            </div>
          )}

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#5cb028] hover:bg-[#4e9921] dark:bg-[#88c958] dark:hover:bg-[#76b846] text-white dark:text-[#08090a] text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking Status...' : 'Check Approval Status'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            Need immediate access? Contact{' '}
            <a href={`mailto:${WORKSPACE_SUPPORT_EMAIL}`} className="text-[#5cb028] dark:text-[#88c958] hover:underline font-semibold">
              {WORKSPACE_SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-slate-400 dark:text-slate-600 relative z-10">
        RetroFlow &bull; Enterprise Agile Retrospectives
      </footer>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          handleLogout();
        }}
        user={currentUser}
      />
    </div>
  );
}
