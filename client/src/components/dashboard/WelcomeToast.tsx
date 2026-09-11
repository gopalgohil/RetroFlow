'use client';

import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

interface WelcomeToastProps {
  user: { name?: string; email?: string; role?: string } | null;
  isOpen: boolean;
  onClose: () => void;
  autoDismissMs?: number;
}

/**
 * WelcomeToast Component
 * Pure Light-Theme notification matching the reference design:
 * - Crisp white card background
 * - Left vertical emerald accent bar
 * - Floating circular close button on top-left
 * - Circular emerald checkmark icon
 * - Dark emerald title and slate-gray subtitle
 * - Role-specific greetings (Admin vs Member)
 * - Centered at the top of the viewport
 */
export const WelcomeToast: React.FC<WelcomeToastProps> = ({
  user,
  isOpen,
  onClose,
  autoDismissMs = 4500,
}) => {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [progress, setProgress] = useState(100);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setProgress(100);

    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout | null = null;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / autoDismissMs) * 100);
      setProgress(remainingPct);

      if (remainingPct <= 0) {
        clearInterval(interval);
        setIsVisible(false);
        timeoutId = setTimeout(() => {
          onCloseRef.current();
        }, 250);
      }
    }, 40);

    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, autoDismissMs]);

  if (!isOpen && !isVisible) return null;

  const isAdmin =
    user?.role === 'admin' ||
    user?.email === 'gopalgohel249@gmail.com' ||
    (user as any)?.role === 'admin';

  const displayName = user?.name?.trim() || (isAdmin ? 'Admin' : 'Team Member');

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onClose, 250);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[90vw] transition-all duration-300 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'
      }`}
    >
      {/* Toast Card - Crisp Light Theme */}
      <div className="relative flex items-center gap-3 bg-white text-slate-900 border border-slate-200/90 border-l-[5px] border-l-emerald-500 rounded-2xl shadow-xl shadow-slate-900/10 pl-3.5 pr-5 py-2.5 select-none">
        
        {/* Floating Circular Close Button at Top-Left */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-xs transition-colors cursor-pointer z-10"
        >
          <X className="w-2.5 h-2.5 stroke-[2.5]" />
        </button>

        {/* Circular Green Checkmark Badge */}
        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-500/30">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>

        {/* Text Content */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-bold text-xs sm:text-[13px] text-emerald-950 tracking-tight">
              Login successfully!
            </span>
            {isAdmin && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Admin
              </span>
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate mt-0.5 leading-tight">
            {isAdmin
              ? `Welcome back, ${displayName}! Full admin access enabled.`
              : `Welcome back, ${displayName}!`}
          </p>
        </div>

        {/* Subtle Animated Countdown Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100 rounded-b-2xl overflow-hidden">
          <div
            className={`h-full ${
              isAdmin
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600'
                : 'bg-emerald-500'
            }`}
            style={{
              width: `${progress}%`,
              transition: 'width 40ms linear',
            }}
          />
        </div>
      </div>
    </div>
  );
};
