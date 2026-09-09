'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showCloseButton?: boolean;
  variant?: 'default' | 'danger';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'md',
  showCloseButton = true,
  variant = 'default',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || icon || showCloseButton) && (
          <div
            className={`px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between shrink-0 ${
              variant === 'danger'
                ? 'bg-gradient-to-r from-rose-50 via-slate-50/50 to-white'
                : 'bg-gradient-to-r from-indigo-50/50 via-slate-50/50 to-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0 ${
                    variant === 'danger'
                      ? 'bg-rose-600 text-white shadow-rose-600/25'
                      : 'bg-indigo-600 text-white shadow-indigo-600/20'
                  }`}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                    {title}
                  </h3>
                )}
                {description && <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

export default Modal;
