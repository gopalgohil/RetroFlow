'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  Palette,
  Smile,
  Frown,
  Lightbulb,
  Puzzle,
  Rocket,
  Anchor,
  Target,
  Flag,
  Calendar,
  EyeOff,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Check,
} from 'lucide-react';
import { RetroTopic, RetroBoard, CreateRetroPayload } from '@/types/retro';

export interface ProjectRetroContext {
  id: string;
  name: string;
  key: string;
  sprintName?: string;
  members: Array<{ name: string; email: string; role: string }>;
}

interface CustomizeRetroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateRetroPayload) => Promise<void>;
  initialData?: RetroBoard | null;
  projectContext?: ProjectRetroContext | null;
}

// Available Color Swatches matching login accents
const COLOR_PALETTE = [
  { label: 'Emerald Green', hex: '#10B981' },
  { label: 'Crimson Rose', hex: '#F43F5E' },
  { label: 'Sky Blue', hex: '#0EA5E9' },
  { label: 'Amber Gold', hex: '#F59E0B' },
  { label: 'Royal Indigo', hex: '#4F46E5' },
  { label: 'Deep Purple', hex: '#8B5CF6' },
  { label: 'Hot Pink', hex: '#EC4899' },
  { label: 'Teal Cyan', hex: '#06B6D4' },
];

// Available Icons for Topics
const AVAILABLE_ICONS = [
  { id: 'smile', label: 'Smile', icon: Smile },
  { id: 'frown', label: 'Frown', icon: Frown },
  { id: 'bulb', label: 'Idea', icon: Lightbulb },
  { id: 'puzzle', label: 'Puzzle', icon: Puzzle },
  { id: 'target', label: 'Target', icon: Target },
  { id: 'rocket', label: 'Speed', icon: Rocket },
  { id: 'anchor', label: 'Anchor', icon: Anchor },
  { id: 'flag', label: 'Milestone', icon: Flag },
];

// Pre-packaged TeamRetro Templates
const TEMPLATE_PRESETS = [
  {
    id: 'went_well',
    name: 'Standard Retrospective',
    icon: Smile,
    theme: 'standard',
    topics: [
      { title: 'What went well?', description: 'Things we are happy or proud of', icon: 'smile', color: '#10B981' },
      { title: 'What could be improved?', description: 'Blockers, frictions, or slowdowns', icon: 'frown', color: '#F43F5E' },
      { title: 'Action Items', description: 'Concrete tasks for the next sprint', icon: 'target', color: '#0EA5E9' },
    ],
  },
];

export const CustomizeRetroModal: React.FC<CustomizeRetroModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  projectContext,
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'topics' | 'process' | 'options'>('topics');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [revealMode, setRevealMode] = useState(false);
  const [votingLimit, setVotingLimit] = useState(5);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [whitelistInput, setWhitelistInput] = useState('');
  const [approvedMembers, setApprovedMembers] = useState<string[]>([]);
  const [backgroundTheme, setBackgroundTheme] = useState<'sailboat' | 'standard' | 'space' | 'mountain' | 'minimal'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Topics list state
  const [topics, setTopics] = useState<RetroTopic[]>([]);

  // Popover selectors
  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);
  const [iconPickerIndex, setIconPickerIndex] = useState<number | null>(null);

  // Dragging state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setScheduledDate(initialData.scheduledDate ? new Date(initialData.scheduledDate).toISOString().slice(0, 16) : '');
      setRevealMode(initialData.revealMode || false);
      setVotingLimit(initialData.votingLimit || 5);
      setApprovalRequired(initialData.approvalRequired || false);
      setApprovedMembers(initialData.approvedMembers || []);
      setBackgroundTheme(initialData.backgroundTheme || 'standard');
      setTopics(initialData.topics || []);
    } else if (projectContext) {
      // Linked Project mode: Auto-fill project title, sprint, and auto-whitelist project members
      const sprintTag = projectContext.sprintName || 'Sprint 14';
      setTitle(`${projectContext.name} - ${sprintTag} Retrospective`);
      setDescription(`Agile feedback & sprint retrospective for ${projectContext.name} (${projectContext.key}).`);
      const today = new Date();
      setScheduledDate(today.toISOString().slice(0, 16));
      setRevealMode(false);
      setVotingLimit(5);
      setApprovalRequired(true); // Project privacy: restrict access to project members
      const memberEmails = (projectContext.members || []).map((m) => m.email.toLowerCase().trim());
      setApprovedMembers(memberEmails);
      setBackgroundTheme('standard');
      setTopics([
        {
          topicId: 'topic-1',
          title: 'What went well?',
          description: 'Things we are happy or proud of in this sprint',
          icon: 'smile',
          color: '#10B981',
          order: 0,
        },
        {
          topicId: 'topic-2',
          title: 'What could be improved?',
          description: 'Blockers, frictions, or slowdowns encountered',
          icon: 'frown',
          color: '#F43F5E',
          order: 1,
        },
        {
          topicId: 'topic-3',
          title: 'Action Items',
          description: 'Concrete backlog deliverables for upcoming sprint',
          icon: 'target',
          color: '#0EA5E9',
          order: 2,
        },
      ]);
    } else {
      // Default initial state
      setTitle(`Sprint 42 Retrospective`);
      setDescription('Continuous alignment session for Engineering & Product team');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      setScheduledDate(tomorrow.toISOString().slice(0, 16));
      setRevealMode(false);
      setVotingLimit(5);
      setApprovalRequired(false);
      setApprovedMembers([]);
      setBackgroundTheme('standard');
      setTopics([
        {
          topicId: 'topic-1',
          title: 'What went well?',
          description: 'Things we are happy or proud of',
          icon: 'smile',
          color: '#10B981',
          order: 0,
        },
        {
          topicId: 'topic-2',
          title: 'What could be improved?',
          description: 'Bottlenecks, frictions, or slowdowns',
          icon: 'frown',
          color: '#F43F5E',
          order: 1,
        },
        {
          topicId: 'topic-3',
          title: 'Action Items',
          description: 'Concrete deliverables for the upcoming sprint',
          icon: 'target',
          color: '#0EA5E9',
          order: 2,
        },
      ]);
    }
  }, [initialData, projectContext, isOpen]);

  if (!isOpen || !mounted) return null;

  // Topic manipulation methods
  const handleUpdateTopic = (index: number, field: keyof RetroTopic, value: any) => {
    setTopics((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddTopic = () => {
    const newOrder = topics.length;
    const colors = ['#10B981', '#0EA5E9', '#F43F5E', '#F59E0B', '#8B5CF6'];
    const chosenColor = colors[newOrder % colors.length];

    setTopics((prev) => [
      ...prev,
      {
        topicId: `topic-${Date.now()}`,
        title: 'New Discussion Topic',
        description: 'Add discussion prompt or guidelines here',
        icon: 'bulb',
        color: chosenColor,
        order: newOrder,
      },
    ]);
  };

  const handleDeleteTopic = (index: number) => {
    if (topics.length <= 1) return; // Must keep at least 1 topic
    setTopics((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveTopic = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= topics.length) return;
    setTopics((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return updated.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  // Drag and Drop reordering handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    handleMoveTopic(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleApplyPreset = (preset: (typeof TEMPLATE_PRESETS)[0]) => {
    setBackgroundTheme(preset.theme as any);
    setTopics(
      preset.topics.map((t, idx) => ({
        topicId: `topic-${Date.now()}-${idx}`,
        title: t.title,
        description: t.description,
        icon: t.icon,
        color: t.color,
        order: idx,
      }))
    );
  };

  const handleAddWhitelistEmail = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = whitelistInput.trim().toLowerCase();
      if (val && !approvedMembers.includes(val) && val.includes('@')) {
        setApprovedMembers((prev) => [...prev, val]);
        setWhitelistInput('');
      }
    }
  };

  const handleRemoveWhitelistEmail = (email: string) => {
    setApprovedMembers((prev) => prev.filter((e) => e !== email));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMessage('Please provide a retrospective session title.');
      setActiveTab('general');
      return;
    }
    if (topics.length === 0) {
      setErrorMessage('Please configure at least one topic column.');
      setActiveTab('topics');
      return;
    }

    let validDate: string | undefined = undefined;
    if (scheduledDate) {
      const d = new Date(scheduledDate);
      if (!isNaN(d.getTime())) {
        validDate = d.toISOString();
      }
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        scheduledDate: validDate,
        status: initialData?.status || 'active',
        approvalRequired,
        revealMode,
        votingLimit,
        backgroundTheme,
        topics: topics.map((t, idx) => ({ ...t, order: idx })),
        approvedMembers,
        projectId: projectContext?.id,
        projectKey: projectContext?.key,
        sprintName: projectContext?.sprintName,
        isProjectScoped: !!projectContext,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save retrospective session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              RF
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">
                {initialData ? 'Edit Retrospective Session' : 'Customize Retrospective'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Inspired by TeamRetro — configure topics, voting, and participant permissions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Linked Project Banner */}
        {projectContext && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/50 border-b border-indigo-100/90 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono font-bold text-[10px] uppercase shadow-2xs">
                {projectContext.key}
              </span>
              <span className="font-bold text-slate-900">
                Initiative: {projectContext.name}
              </span>
              {projectContext.sprintName && (
                <span className="text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 font-semibold text-[11px]">
                  {projectContext.sprintName}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              🔒 {projectContext.members.length} Team Members Auto-Whitelisted (Strict Privacy)
            </span>
          </div>
        )}

        {/* 4 Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-8">
          {[
            { id: 'general', label: 'GENERAL' },
            { id: 'topics', label: 'TOPICS' },
            { id: 'process', label: 'PROCESS' },
            { id: 'options', label: 'OPTIONS' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body Tabs Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
              <span>⚠️ {errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-800 font-bold ml-2 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Session Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sprint 42 Retrospective"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description & Context
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the sprint focus, release notes, or objectives..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Scheduled Date & Time
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOPICS (Active Builder) */}
          {activeTab === 'topics' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Preset Template Selectors */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Quick Presets (TeamRetro Templates):
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {TEMPLATE_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-all cursor-pointer shadow-2xs"
                      >
                        <Icon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column Rows List */}
              <div className="space-y-3">
                {topics.map((topic, index) => {
                  const CurrentIcon =
                    AVAILABLE_ICONS.find((i) => i.id === topic.icon)?.icon || Smile;
                  const isDragging = draggedIndex === index;

                  return (
                    <div
                      key={topic.topicId || index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative p-4 rounded-xl bg-white border transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3.5 ${
                        isDragging
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 opacity-60 scale-[0.99]'
                          : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      {/* Drag Handle & Order */}
                      <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 shrink-0">
                        <GripVertical className="w-5 h-5" />
                        <span className="font-mono text-xs font-bold text-slate-400 w-4">
                          {index + 1}
                        </span>
                      </div>

                      {/* Custom Icon & Color Badge */}
                      <div className="relative shrink-0 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIconPickerIndex(iconPickerIndex === index ? null : index);
                            setColorPickerIndex(null);
                          }}
                          title="Change Icon"
                          style={{ backgroundColor: `${topic.color}15`, color: topic.color }}
                          className="w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                        >
                          <CurrentIcon className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setColorPickerIndex(colorPickerIndex === index ? null : index);
                            setIconPickerIndex(null);
                          }}
                          title="Change Color"
                          style={{ backgroundColor: topic.color }}
                          className="w-4 h-4 rounded-full border-2 border-white ring-1 ring-slate-200 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                        />

                        {/* Color Picker Dropdown Popover */}
                        {colorPickerIndex === index && (
                          <div className="absolute top-12 left-0 z-50 p-2.5 bg-white border border-slate-200 rounded-xl shadow-xl grid grid-cols-4 gap-2 w-36">
                            {COLOR_PALETTE.map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => {
                                  handleUpdateTopic(index, 'color', c.hex);
                                  setColorPickerIndex(null);
                                }}
                                style={{ backgroundColor: c.hex }}
                                className="w-6 h-6 rounded-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center text-white"
                              >
                                {topic.color === c.hex && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Icon Picker Dropdown Popover */}
                        {iconPickerIndex === index && (
                          <div className="absolute top-12 left-0 z-50 p-2.5 bg-white border border-slate-200 rounded-xl shadow-xl grid grid-cols-4 gap-2 w-44">
                            {AVAILABLE_ICONS.map((i) => {
                              const PopIcon = i.icon;
                              return (
                                <button
                                  key={i.id}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateTopic(index, 'icon', i.id);
                                    setIconPickerIndex(null);
                                  }}
                                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  <PopIcon className="w-4 h-4" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Editable Topic Title & Subtitle */}
                      <div className="flex-1 w-full space-y-1.5">
                        <input
                          type="text"
                          value={topic.title}
                          onChange={(e) => handleUpdateTopic(index, 'title', e.target.value)}
                          placeholder="e.g. What went well?"
                          className="w-full font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
                        />
                        <input
                          type="text"
                          value={topic.description}
                          onChange={(e) =>
                            handleUpdateTopic(index, 'description', e.target.value)
                          }
                          placeholder="Subtitle: Things we are proud of or happy about"
                          className="w-full text-[11px] text-slate-500 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
                        />
                      </div>

                      {/* Right-Side Reordering & Delete Actions */}
                      <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveTopic(index, index - 1)}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTopic(index, index + 1)}
                          disabled={index === topics.length - 1}
                          title="Move Down"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(index)}
                          disabled={topics.length <= 1}
                          title="Delete Column"
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Distinct Circular Add Button */}
              <div className="flex flex-col items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-indigo-50 border-2 border-dashed border-indigo-300 hover:border-indigo-500 text-xs font-bold text-indigo-700 shadow-xs transition-all hover:scale-105 cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs group-hover:rotate-90 transition-transform">
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Add New Topic Column</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PROCESS */}
          {activeTab === 'process' && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              {/* Reveal Mode Toggle */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Reveal Cards Mode (Silent Brainstorming)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-md">
                    Keep retrospective feedback cards blurred until the facilitator chooses to reveal them to avoid team bias.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={revealMode}
                  onChange={(e) => setRevealMode(e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Voting Limits */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Voting Limits per Developer
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Restrict how many votes each participant can cast during the prioritization phase.
                    </p>
                  </div>
                  <span className="font-mono text-base font-bold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-200">
                    {votingLimit} Votes
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={votingLimit}
                  onChange={(e) => setVotingLimit(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 4: OPTIONS (Waiting room & whitelist) */}
          {activeTab === 'options' && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              {/* Approval Required Toggle */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Require Admin Approval to Join (Waiting Room)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-md">
                    Guests and unauthorized teammates must be explicitly accepted by the session facilitator before entering.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={approvalRequired}
                  onChange={(e) => setApprovalRequired(e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Permanent Whitelist Emails */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Whitelisted Teammates (Auto-Approved)
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Type email and press Enter to allow permanent access without waiting room approval.
                  </p>
                </div>

                <input
                  type="email"
                  value={whitelistInput}
                  onChange={(e) => setWhitelistInput(e.target.value)}
                  onKeyDown={handleAddWhitelistEmail}
                  placeholder="e.g. teammate@company.com (Press Enter)"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />

                <div className="flex flex-wrap gap-2 pt-1">
                  {approvedMembers.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-medium"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveWhitelistEmail(email)}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {approvedMembers.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No whitelisted members added yet.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Action Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/25 disabled:opacity-50 transition-all hover:scale-[1.02] cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Launch Retro Session →'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

