'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ArrowUpRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Project } from '@/types/project';
import { StatusPill, UserAvatar } from '@/components/ui';
import { formatDateDMY } from '@/lib/dateUtils';

interface RetrosTabProps {
  project: Project;
  onCreateRetroClick?: () => void;
}

export const RetrosTab: React.FC<RetrosTabProps> = ({ project, onCreateRetroClick }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Project Retrospectives
            <StatusPill status="upcoming" label={`${project.retrospectives.length} Sessions`} />
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Collaborative agile feedback boards attached to <strong>{project.name}</strong> ({project.key}).
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateRetroClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Retro for {project.key}</span>
        </button>
      </div>

      {/* Retrospectives Grid */}
      {project.retrospectives.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <UserAvatar name="RetroFlow" avatar="RF" size="lg" className="mx-auto" />
          <h4 className="text-sm font-bold text-slate-900">No Retrospectives Linked Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Schedule a retrospective session for this project to start gathering team feedback and generating action items.
          </p>
          <button
            type="button"
            onClick={onCreateRetroClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Launch First Retro</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.retrospectives.map((retro) => {
            const isActive = retro.status === 'active';

            return (
              <div
                key={retro.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Status & Sprint Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusPill status={retro.status} pulse={isActive} />

                      {retro.sprintName && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {retro.sprintName}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDateDMY(retro.scheduledDate)}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    {retro.title}
                  </h4>

                  {/* Stats Pills */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block">Topics</span>
                      <span className="text-xs font-bold text-slate-800">
                        {retro.topicsCount} Columns
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block">Thoughts</span>
                      <span className="text-xs font-bold text-slate-800">
                        {retro.cardsCount} Cards
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center">
                      <span className="text-[10px] text-indigo-500 block">Action Items</span>
                      <span className="text-xs font-bold text-indigo-700">
                        {retro.actionItemsCount} Items
                      </span>
                    </div>
                  </div>

                  {/* Export Link Status */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                    {retro.actionItemsExported ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Action items exported into sprint backlog
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Pending export to next sprint backlog
                      </span>
                    )}
                  </div>
                </div>

                {/* Launch Board Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Token: {retro.shareToken}
                  </span>

                  <Link
                    href={`/retro/${retro.shareToken}`}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      isActive
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Launch Board</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RetrosTab;
