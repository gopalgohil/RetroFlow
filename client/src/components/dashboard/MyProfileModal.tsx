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
  } | null;
  onUserUpdated?: (updated: { name: string; email: string; role?: string }) => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [profileData, setProfileData] = useState<{
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    createdAt?: string;
    activeProjectsCount?: number;
    activeProjects?: Array<{ id: string; key: string; name: string }>;
  }>({
    name: user?.name || 'Gopal Gohel',
    email: user?.email || 'gopalgohel249@gmail.com',
    role: user?.role || 'admin',
    isVerified: true,
    activeProjectsCount: 1,
    activeProjects: [{ id: '1', key: 'RET', name: 'Retro' }],
  });

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

  // Fetch fresh profile data on open
  useEffect(() => {
    if (!isOpen) return;

    setName(user?.name || '');
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
  }, [isOpen, user]);

  if (!isOpen) return null;

  const isAdmin =
    profileData.role === 'admin' ||
    profileData.email === 'gopalgohel249@gmail.com' ||
    profileData.email?.toLowerCase().includes('admin');

  const initials = (profileData.name || user?.name || 'AD')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with User Overview & Close Button */}
        <div className="p-6 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-white border-b border-slate-200/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {profileData.name || 'Gopal Gohel'}
                </h2>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">
                    Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Developer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-slate-500 font-medium">{profileData.email}</p>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex border-b border-slate-200/80 px-6 pt-2 bg-slate-50/50 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`inline-flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
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
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
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
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Full Name
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isSavingName || name.trim() === profileData.name}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
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
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{nameSuccessMessage}</span>
                  </div>
                )}

                {nameErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{nameErrorMessage}</span>
                  </div>
                )}
              </form>

              {/* Email (Protected) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Email Address
                </label>
                <div className="mt-1.5 flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{profileData.email}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Primary Login</span>
                </div>
              </div>


              {/* Account Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Member Since</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-800">{memberSince}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Active Projects</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">
                      {profileData.activeProjectsCount || 1}
                    </span>
                    {profileData.activeProjects && profileData.activeProjects.length > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold">
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
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-900 text-xs">
                <p className="font-bold">Password Security Requirements</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Must be at least 8 characters long. After changing, remember to use your new password on subsequent logins.
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Current Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Confirm New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccessMessage}</span>
                </div>
              )}

              {passwordErrorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordErrorMessage}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !currentPassword || !newPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
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
