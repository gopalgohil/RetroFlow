'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  KeyRound,
  CheckCircle2,
  Calendar,
  FolderKanban,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api, ENDPOINTS } from '@/lib/api';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name?: string;
    email?: string;
    role?: string;
    projectRole?: string;
  } | null;
  onUserUpdated?: (updated: { name: string; email: string; role?: string; projectRole?: string }) => void;
}

interface ProfileState {
  name: string;
  email: string;
  role: string;
  projectRole?: string;
  isVerified: boolean;
  createdAt?: string;
  activeProjectsCount?: number;
  activeProjects?: Array<{ id: string; key: string; name: string }>;
}

const getInitialProfileData = (u: MyProfileModalProps['user']): ProfileState => {
  let fallbackName = u?.name || '';
  let fallbackEmail = u?.email || '';
  let fallbackRole = u?.role || 'member';
  let fallbackProjectRole = (u as any)?.projectRole || 'Developer';

  if (typeof window !== 'undefined' && (!fallbackEmail || !fallbackName)) {
    try {
      const saved = localStorage.getItem('retroflow_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (!fallbackName && parsed.name) fallbackName = parsed.name;
          if (!fallbackEmail && parsed.email) fallbackEmail = parsed.email;
          if (!u?.role && parsed.role) fallbackRole = parsed.role;
          if (!(u as any)?.projectRole && (parsed.projectRole || parsed.role)) {
            fallbackProjectRole = parsed.projectRole || parsed.role;
          }
        }
      }
    } catch {}
  }

  return {
    name: fallbackName || 'Member',
    email: fallbackEmail || '',
    role: fallbackRole,
    projectRole: fallbackProjectRole,
    isVerified: true,
    activeProjectsCount: 0,
    activeProjects: [],
  };
};

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile fields initialized strictly with the current user context (zero flash of other users)
  const [name, setName] = useState(user?.name || '');
  const [profileData, setProfileData] = useState<ProfileState>(() => getInitialProfileData(user));

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSuccessMessage, setNameSuccessMessage] = useState('');
  const [nameErrorMessage, setNameErrorMessage] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');

  // Fetch fresh profile data on open & immediately sync current user props
  useEffect(() => {
    if (!isOpen) return;

    // Instant local synchronization from active user prop and stored session
    const current = getInitialProfileData(user);
    setProfileData((prev) => ({
      ...prev,
      ...current,
      name: user?.name || current.name,
      email: user?.email || current.email,
      role: user?.role || current.role,
      projectRole: (user as any)?.projectRole || current.projectRole,
    }));
    setName(user?.name || current.name || '');

    setNameSuccessMessage('');
    setNameErrorMessage('');
    setPasswordSuccessMessage('');
    setPasswordErrorMessage('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    let isMounted = true;
    setIsLoadingProfile(true);

    api
      .get(ENDPOINTS.AUTH.ME)
      .then((res) => {
        if (isMounted && res?.data) {
          setProfileData(res.data);
          if (res.data.name) {
            setName(res.data.name);
          }
        }
      })
      .catch(() => {
        // Fallback gracefully to passed user prop
      })
      .finally(() => {
        if (isMounted) setIsLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const userEmail = profileData.email?.toLowerCase().trim();
  const userRole = profileData.role?.toLowerCase().trim();
  const isAdmin = Boolean(userRole === 'admin');

  const displayName = profileData.name || user?.name || 'Member';
  const displayEmail = profileData.email || user?.email || '';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // Handle Save Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameErrorMessage('Full name cannot be empty.');
      return;
    }

    setIsSavingName(true);
    setNameErrorMessage('');
    setNameSuccessMessage('');

    try {
      const res = await api.put(ENDPOINTS.AUTH.UPDATE_PROFILE, { name: name.trim() });
      const updatedUser = res?.data || { ...profileData, name: name.trim() };

      setProfileData((prev) => ({ ...prev, name: updatedUser.name }));
      setNameSuccessMessage('Your profile name has been updated successfully.');

      // Sync with localStorage
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.name = updatedUser.name;
          localStorage.setItem('retroflow_user', JSON.stringify(parsed));
        }
      } catch {}

      if (onUserUpdated) {
        onUserUpdated({
          name: updatedUser.name,
          email: profileData.email,
          role: profileData.role,
          projectRole: profileData.projectRole,
        });
      }

      setTimeout(() => setNameSuccessMessage(''), 4000);
    } catch (err: any) {
      setNameErrorMessage(err?.message || 'Failed to update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMessage('');
    setPasswordSuccessMessage('');

    if (!currentPassword) {
      setPasswordErrorMessage('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordErrorMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMessage('New passwords do not match. Please verify.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await api.put(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
        email: profileData.email || user?.email,
      });

      setPasswordSuccessMessage('Password changed successfully! Keep your credentials safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMessage(''), 5000);
    } catch (err: any) {
      setPasswordErrorMessage(err?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Format creation date
  const memberSince = profileData.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'September 2026';

  const userProjectRole =
    (profileData as any).projectRole ||
    (user as any)?.projectRole ||
    'Developer';

  const displayRole = isAdmin ? 'Admin' : userProjectRole;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/15 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with User Overview & Close Button */}
        <div className="p-6 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5cb028] via-[#52a622] to-[#6ec437] text-white font-black text-xl flex items-center justify-center shadow-md shadow-[#5cb028]/25 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {displayName}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    isAdmin || displayRole.toLowerCase() === 'admin'
                      ? 'bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#5cb028] border-[#cdeac0] dark:border-[#5cb028]/30'
                      : displayRole.toLowerCase() === 'manager'
                      ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : displayRole.toLowerCase() === 'project lead'
                      ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                      : displayRole.toLowerCase().includes('qa') || displayRole.toLowerCase().includes('tester')
                      ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : displayRole.toLowerCase() === 'devops'
                      ? 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                      : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {displayRole}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{displayEmail}</p>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Verified
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 px-6 pt-2 bg-slate-50/50 dark:bg-slate-900/50 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`inline-flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#5cb028] text-[#5cb028]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`inline-flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#5cb028] text-[#5cb028]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* Name Edit Form */}
              <form onSubmit={handleSaveName} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Full Name
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-[#5cb028]/20 focus:border-[#5cb028] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isSavingName || name.trim() === profileData.name}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSavingName ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                {nameSuccessMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{nameSuccessMessage}</span>
                  </div>
                )}

                {nameErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{nameErrorMessage}</span>
                  </div>
                )}
              </form>

              {/* Email (Protected) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Email Address
                </label>
                <div className="mt-1.5 flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-white">{displayEmail}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Primary Login</span>
                </div>
              </div>

              {/* Account Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Member Since</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">{memberSince}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-medium">
                    <FolderKanban className="w-3.5 h-3.5 text-[#5cb028]" />
                    <span>Active Projects</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                      {profileData.activeProjectsCount || 0}
                    </span>
                    {profileData.activeProjects && profileData.activeProjects.length > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30 text-[#3d8318] dark:text-[#5cb028] text-[10px] font-bold">
                        {profileData.activeProjects[0].key} - {profileData.activeProjects[0].name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Security & Password Tab */
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs">
                <p className="font-bold">Password Security Requirements</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Must be at least 8 characters long. After changing, remember to use your new password on subsequent logins.
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Current Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-[#5cb028]/20 focus:border-[#5cb028] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-[#5cb028]/20 focus:border-[#5cb028] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Confirm New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      setPasswordErrorMessage('Copy-paste is disabled. Please type your password manually.');
                    }}
                    onDrop={(e) => e.preventDefault()}
                    placeholder="Re-type new password"
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-[#5cb028]/20 focus:border-[#5cb028] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccessMessage}</span>
                </div>
              )}

              {passwordErrorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordErrorMessage}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !currentPassword || !newPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5cb028] to-[#4e9921] hover:from-[#4e9921] hover:to-[#5cb028] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#5cb028]/20 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfileModal;
