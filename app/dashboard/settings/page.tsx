'use client';

import { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { updateUserSettingsAction, deleteUserAccountAction, getUserProfileStatsAction } from '../actions';
import { 
  Settings, Sliders, Video, ShieldAlert, Trash2, Check, Loader2, Sparkles, User, Bell, Volume2, Globe, Laptop 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'general' | 'meeting' | 'privacy' | 'danger'>('general');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'en',
    notificationsEnabled: true,
    cameraEnabled: true,
    micEnabled: true,
    videoQuality: 'high',
    backgroundBlur: false,
    allowInvitations: true,
    showOnlineStatus: true,
    notificationSounds: true
  });

  const fetchSettings = async () => {
    const res = await getUserProfileStatsAction();
    if (res.success && res.user && res.user.settings) {
      setSettings(prev => ({ ...prev, ...res.user.settings }));
    }
  };

  useEffect(() => {
    if (userLoaded && user) {
      fetchSettings();
    }
  }, [userLoaded, user]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    
    // Save settings via server action
    const res = await updateUserSettingsAction(settings);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert(`Save failed: ${res.error}`);
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim() !== 'delete my account') {
      alert('Please type "delete my account" exactly to confirm deletion.');
      return;
    }

    if (!confirm('WARNING: Deleting your account will remove your user profile, all scheduled meetings, and invitations permanently. This cannot be undone. Are you sure?')) {
      return;
    }

    setDeleting(true);
    const res = await deleteUserAccountAction();
    if (res.success) {
      alert('Your account and all associated data have been permanently deleted.');
      await signOut(() => router.push('/'));
    } else {
      alert(`Deletion failed: ${res.error}`);
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-4xl mx-auto text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-500" />
          <span>Platform Settings</span>
        </h1>
        <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
          Customize NeuraMeet UI preferences, video/audio defaults, invitation gatekeeper, and privacy details.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-2">
        {/* Mobile Dropdown Navigator */}
        <div className="md:hidden w-full relative">
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value as any)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-4 py-2.5 rounded-xl text-xs font-bold focus:outline-none cursor-pointer appearance-none"
          >
            <option value="general">⚙️ General Settings</option>
            <option value="meeting">📹 Meeting Settings</option>
            <option value="privacy">🔒 Privacy Settings</option>
            <option value="danger">⚠️ Danger Zone</option>
          </select>
        </div>

        {/* Desktop Navigation Sidebar Tabs */}
        <div className="hidden md:flex w-full md:w-56 shrink-0 flex-col gap-1.5 bg-white/40 dark:bg-[#111827]/10 p-2 rounded-2xl border border-zinc-200/50 dark:border-zinc-900/60 self-start">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer w-full text-left shrink-0 ${
              activeTab === 'general'
                ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-500/10'
                : 'text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>General</span>
          </button>
          <button
            onClick={() => setActiveTab('meeting')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer w-full text-left shrink-0 ${
              activeTab === 'meeting'
                ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-500/10'
                : 'text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Meeting</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer w-full text-left shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-500/10'
                : 'text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Privacy</span>
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer w-full text-left shrink-0 ${
              activeTab === 'danger'
                ? 'bg-rose-650 text-white shadow-lg shadow-rose-500/10'
                : 'text-rose-550 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-350 hover:bg-rose-50 dark:hover:bg-rose-955/10'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Configurations Forms Container */}
        <div className="flex-1 glass-panel border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#111827]/20 p-6 rounded-3xl flex flex-col justify-between min-h-[380px]">
          
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-5"
                >
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-900">
                    <Sliders className="w-4.5 h-4.5" />
                    <span>General Preferences</span>
                  </h3>

                  {/* Theme Select */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white">Active UI Theme</span>
                      <span className="text-[10px] text-zinc-500">Choose light or dark visual dashboard preference.</span>
                    </div>
                    <select
                      value={settings.theme}
                      onChange={e => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="dark">Dark Space</option>
                      <option value="light">Light Slate</option>
                    </select>
                  </div>

                  {/* Language select */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        <span>System Language</span>
                      </span>
                      <span className="text-[10px] text-zinc-500">Configure language of dashboard tags and headings.</span>
                    </div>
                    <select
                      value={settings.language}
                      onChange={e => setSettings(prev => ({ ...prev, language: e.target.value }))}
                      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  {/* Notifications toggle */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white flex items-center gap-1">
                        <Bell className="w-3.5 h-3.5" />
                        <span>Enable Push Alerts</span>
                      </span>
                      <span className="text-[10px] text-zinc-500">Allow system banners when dashboard receives invites.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notificationsEnabled}
                      onChange={e => setSettings(prev => ({ ...prev, notificationsEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'meeting' && (
                <motion.div
                  key="meeting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-5"
                >
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-900">
                    <Video className="w-4.5 h-4.5" />
                    <span>Video & Audio Settings</span>
                  </h3>

                  {/* Video Quality */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white">Default Video Feed Quality</span>
                      <span className="text-[10px] text-zinc-500">Resolution quality of output WebRTC streams.</span>
                    </div>
                    <select
                      value={settings.videoQuality}
                      onChange={e => setSettings(prev => ({ ...prev, videoQuality: e.target.value }))}
                      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="high">HD 720p (Ideal)</option>
                      <option value="medium">Standard 480p</option>
                      <option value="low">Data Saver 360p</option>
                    </select>
                  </div>

                  {/* Audio Device Selector defaults */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white">Auto Enable Mic on Entry</span>
                      <span className="text-[10px] text-zinc-550 dark:text-zinc-500">Automatically activate audio devices when entering rooms.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.micEnabled}
                      onChange={e => setSettings(prev => ({ ...prev, micEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Camera source selector defaults */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white">Auto Enable Camera on Entry</span>
                      <span className="text-[10px] text-zinc-550 dark:text-zinc-500">Automatically capture video streams when entering rooms.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.cameraEnabled}
                      onChange={e => setSettings(prev => ({ ...prev, cameraEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Background blur */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white">Software Background Blur (Beta)</span>
                      <span className="text-[10px] text-zinc-550 dark:text-zinc-500">Enable default blur filter on local camera source.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.backgroundBlur}
                      onChange={e => setSettings(prev => ({ ...prev, backgroundBlur: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-5"
                >
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-900">
                    <Laptop className="w-4.5 h-4.5" />
                    <span>Privacy Configurations</span>
                  </h3>

                  {/* Allow invites */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white">Allow Meeting Invitations</span>
                      <span className="text-[10px] text-zinc-550 dark:text-zinc-500">Allow other users to search and add your username to rooms.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allowInvitations}
                      onChange={e => setSettings(prev => ({ ...prev, allowInvitations: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Show online status */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white">Show Real-Time Online Status</span>
                      <span className="text-[10px] text-zinc-550 dark:text-zinc-500">Let other users see when you are online, in-meeting, or busy.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showOnlineStatus}
                      onChange={e => setSettings(prev => ({ ...prev, showOnlineStatus: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Notification Sounds */}
                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Notification Ring Sounds</span>
                      </span>
                      <span className="text-[10px] text-zinc-550 dark:text-zinc-500">Play tone indicators when real-time popup toasts trigger.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notificationSounds}
                      onChange={e => setSettings(prev => ({ ...prev, notificationSounds: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'danger' && (
                <motion.div
                  key="danger"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-5"
                >
                  <h3 className="text-sm font-black uppercase tracking-widest text-rose-500 dark:text-rose-400 flex items-center gap-1.5 pb-2 border-b border-zinc-250 dark:border-zinc-900">
                    <ShieldAlert className="w-4.5 h-4.5" />
                    <span>Danger Zone Operations</span>
                  </h3>

                  <div className="flex flex-col gap-4 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-xs select-none">
                    <p className="text-rose-600 dark:text-rose-400 leading-relaxed font-semibold">
                      Kicking off account deletion will permanently prune your profile stats, clean scheduled rooms, remove invitation responses, and delete your credentials. This operation is absolute and cannot be reverted.
                    </p>

                    <div className="flex flex-col gap-2 mt-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider text-left">
                        Type <strong className="text-rose-600 dark:text-rose-400">delete my account</strong> to unlock deletion
                      </label>
                      <input
                        type="text"
                        placeholder="Type verification phrase..."
                        value={deleteConfirm}
                        onChange={e => setDeleteConfirm(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-850 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-rose-605 dark:text-rose-400 font-bold"
                      />
                      
                      <div className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest border border-dashed border-rose-500/30 p-3.5 rounded-xl bg-rose-500/[0.02] mt-1 text-left leading-normal">
                        ⚠️ WARNING: This will permanently revoke all Clerk, WebRTC tokens, and Whitelisted DB access.
                      </div>
                    </div>

                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirm !== 'delete my account'}
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-900 disabled:text-zinc-400 text-white font-extrabold text-xs shadow-md transition-all active:scale-98 mt-2 cursor-pointer flex items-center justify-center gap-1"
                    >
                      {deleting ? (
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Permanently Delete Account</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Form Save Button */}
          {activeTab !== 'danger' && (
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 pt-4 border-t border-zinc-150/40 dark:border-zinc-900/60">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4.5 h-4.5" />
                )}
                <span>Save Configuration</span>
              </button>

              <AnimatePresence>
                {success && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-emerald-500 font-bold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>Configuration saved successfully!</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
