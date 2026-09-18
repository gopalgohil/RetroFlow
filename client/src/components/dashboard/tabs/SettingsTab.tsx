'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { WorkspaceSettingsData } from '@/types/retro';

interface SettingsTabProps {
  settings: WorkspaceSettingsData;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (updated: WorkspaceSettingsData) => Promise<void>;
}

/**
 * SettingsTab Component
 * Manages organization branding and default agile retrospective governance rules.
 */
export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  isLoading,
  isSaving,
  onSave,
}) => {
  const [formData, setFormData] = useState<WorkspaceSettingsData>(settings);

  // Synchronize internal state if settings update from server
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-200 dark:border-white/[0.08] pb-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#5cb028] dark:text-[#88c958]" />
          Workspace Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure default agile retro parameters, voting restrictions, and automation rules
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Profile Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
            <div className="w-8 h-8 rounded-lg bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center font-bold text-xs">
              🏢
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Organization & Branding</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Visible on retrospective invitations and share links</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Workspace Name
              </label>
              <input
                type="text"
                value={formData.workspaceName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, workspaceName: e.target.value }))
                }
                required
                className="mt-1.5 w-full px-3.5 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Organization / Squad Name
              </label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, organizationName: e.target.value }))
                }
                className="mt-1.5 w-full px-3.5 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Retrospective Default Governance Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
            <div className="w-8 h-8 rounded-lg bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center font-bold text-xs">
              ⚙️
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Default Agile Governance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Applies to all newly generated retrospective boards</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Default Votes per Developer
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.defaultVotingLimit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultVotingLimit: Number(e.target.value) || 5,
                  }))
                }
                className="mt-1.5 w-full px-3.5 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Default Session Timer (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={formData.timerDefaultMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timerDefaultMinutes: Number(e.target.value) || 10,
                  }))
                }
                className="mt-1.5 w-full px-3.5 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#12151c] hover:bg-slate-100/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer border border-slate-100 dark:border-white/[0.08]">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Allow Anonymous Feedback</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Permits teammates to submit cards without revealing author name
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.allowAnonymousFeedback}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    allowAnonymousFeedback: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-[#88c958] text-[#88c958] rounded focus:ring-[#88c958]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#12151c] hover:bg-slate-100/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer border border-slate-100 dark:border-white/[0.08]">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Slack Notifications Sync</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dispatch alerts when retrospective sessions launch
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.enableSlackNotifications}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    enableSlackNotifications: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-[#88c958] text-[#88c958] rounded focus:ring-[#88c958]"
              />
            </label>
          </div>
        </div>

        {/* Save Action */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="px-6 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white disabled:opacity-50 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a] dark:font-black"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white dark:border-[#08090a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Save Workspace Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsTab;
