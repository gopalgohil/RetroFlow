'use client';

import React, { useState, memo } from 'react';

export interface ParticipantNameModalProps {
  isOpen: boolean;
  onJoin: (name: string) => void;
}

/**
 * Clean Modal dialog prompting guest developers to provide a display name
 */
export const ParticipantNameModal: React.FC<ParticipantNameModalProps> = memo(
  function ParticipantNameModal({ isOpen, onJoin }) {
    const [nameInput, setNameInput] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = nameInput.trim();
      if (!trimmed) return;
      onJoin(trimmed);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md font-black">
              RF
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Join Retrospective</h3>
              <p className="text-xs text-slate-500">Enter your name to contribute sticky notes</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. Alex Rivera, Dev Vishal..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:bg-indigo-300"
            >
              Join Retrospective Board →
            </button>
          </form>
        </div>
      </div>
    );
  }
);

export default ParticipantNameModal;
