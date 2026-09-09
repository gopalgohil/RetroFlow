'use client';

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
}) => {
  const variantIcons = {
    danger: <AlertTriangle className="w-5 h-5 text-rose-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    primary: <Info className="w-5 h-5 text-indigo-600" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  };

  const buttonStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      showCloseButton={false}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${buttonStyles[variant]}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
          {variantIcons[variant]}
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 leading-tight">{title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
