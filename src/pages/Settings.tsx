import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Target,
  Dumbbell,
  Scale,
  Ruler,
  Calendar,
  Download,
  Trash2,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Library,
  LogOut,
  Mail,
  Mic,
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  Key,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useDietStore } from '../store/useDietStore';
import { useCalendarStore } from '../store/useCalendarStore';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../contexts/AuthContext';
import { kgToDisplay, displayToKg, getWeightUnit } from '../utils/weight';
import { deleteUserCloudData } from '../lib/firestoreSync';
import { ReauthModal } from '../components/ReauthModal';
import { validatePassword } from '../lib/passwordValidation';
import type { TrainingGoal, ExperienceLevel, Equipment, UnitSystem, Sex } from '../types';

const goalLabels: Record<TrainingGoal, string> = {
  strength: 'Build Strength',
  hypertrophy: 'Build Muscle',
  fat_loss: 'Lose Fat',
  endurance: 'Improve Endurance',
  general_fitness: 'General Fitness',
};

const experienceLabels: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const equipmentLabels: Record<Equipment, string> = {
  full_gym: 'Full Gym',
  home_gym: 'Home Gym',
  minimal: 'Minimal Equipment',
  bodyweight: 'Bodyweight Only',
};

const unitLabels: Record<UnitSystem, string> = {
  metric: 'Metric (kg)',
  imperial: 'Imperial (lbs)',
};

const sexLabels: Record<Sex, string> = {
  male: 'Male',
  female: 'Female',
};

export function Settings() {
  const navigate = useNavigate();
  const { currentUser, logout, sendVerificationEmail, changePassword, deleteAccount, reauthenticate } = useAuth();
  const user = useStore((state) => state.user);
  const updateUser = useStore((state) => state.updateUser);
  const workoutSessions = useStore((state) => state.workoutSessions);
  const routines = useStore((state) => state.routines);
  const weightEntries = useStore((state) => state.weightEntries);
  const personalRecords = useStore((state) => state.personalRecords);

  // Diet & Calendar store data for export
  const dietStore = useDietStore.getState();
  const calendarStore = useCalendarStore.getState();

  // Dark mode
  const { theme, setTheme, isDark } = useDarkMode();

  // Unit system
  const unitSystem = user?.unitSystem || 'metric';
  const weightUnit = getWeightUnit(unitSystem);

  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Security state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [showReauthForPassword, setShowReauthForPassword] = useState(false);

  const isEmailProvider = currentUser?.providerData.some(p => p.providerId === 'password');
  const isEmailVerified = currentUser?.emailVerified ?? false;

  const handleSendVerification = async () => {
    setVerificationLoading(true);
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
    } catch {
      alert('Failed to send verification email. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleChangePassword = async (currentPassword: string) => {
    // Re-authenticate, then change password
    await reauthenticate(currentPassword);
    await changePassword(newPassword);
    setShowReauthForPassword(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setPasswordSuccess('Password changed successfully');
    setTimeout(() => setPasswordSuccess(''), 3000);
  };

  const handleDeleteAccount = async (password: string) => {
    await deleteAccount(password);
    navigate('/login');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  if (!user) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-gray-500">Please complete onboarding first</p>
      </div>
    );
  }

  const handleEdit = (field: string, currentValue: string | number) => {
    setEditMode(field);
    setEditValue(currentValue.toString());
  };

  const handleSave = (field: string) => {
    if (field === 'name') {
      const trimmed = editValue.trim().slice(0, 50);
      if (!trimmed) return;
      updateUser({ name: trimmed });
    } else if (field === 'weight') {
      const val = parseFloat(editValue);
      const min = unitSystem === 'imperial' ? 66 : 30;
      const max = unitSystem === 'imperial' ? 660 : 300;
      if (isNaN(val) || val < min || val > max) return;
      const weightInKg = displayToKg(val, unitSystem);
      updateUser({ weight: weightInKg });
    } else if (field === 'height') {
      const val = parseFloat(editValue);
      if (isNaN(val) || val < 100 || val > 250) return;
      updateUser({ height: val });
    } else if (field === 'age') {
      const val = parseInt(editValue);
      if (isNaN(val) || val < 13 || val > 100) return;
      updateUser({ age: val });
    }
    setEditMode(null);
  };

  const handleExportData = () => {
    const data = {
      user,
      workoutSessions,
      routines,
      personalRecords,
      weightEntries,
      diet: {
        foodLog: dietStore.foodLog,
        recipes: dietStore.recipes,
        meals: dietStore.meals,
        customFoods: dietStore.customFoods,
        dietSettings: dietStore.dietSettings,
      },
      calendar: {
        events: calendarStore.events,
        calendars: calendarStore.calendars,
        settings: calendarStore.settings,
      },
      exportedAt: new Date().toISOString(),
      version: '1.2.0',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thetemple-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    if (
      window.confirm(
        'This will permanently delete all your data including workouts, routines, nutrition logs, and personal records from both this device and the cloud. This cannot be undone. Are you sure?'
      )
    ) {
      try {
        // Delete cloud data if user is authenticated
        if (currentUser?.uid) {
          await deleteUserCloudData(currentUser.uid);
        }
        // Clear local storage
        localStorage.removeItem('workout-tracker-storage');
        localStorage.removeItem('diet-tracker-storage');
        localStorage.removeItem('calendar-storage');
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to delete cloud data. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="ml-4 font-semibold text-gray-900 dark:text-white">Settings</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Section */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Profile
          </h2>
          <div className="card dark:bg-gray-800 dark:border-gray-700 p-0 divide-y divide-gray-100 dark:divide-gray-700">
            {/* Name */}
            <SettingsRow
              icon={User}
              label="Name"
              value={user.name}
              onEdit={() => handleEdit('name', user.name)}
              editMode={editMode === 'name'}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onSave={() => handleSave('name')}
              onCancel={() => setEditMode(null)}
            />

            {/* Sex */}
            <SelectRow
              icon={User}
              label="Sex"
              value={sexLabels[user.sex || 'male']}
              options={Object.entries(sexLabels).map(([id, label]) => ({
                id,
                label,
              }))}
              selectedId={user.sex || 'male'}
              onChange={(value) => updateUser({ sex: value as Sex })}
            />

            {/* Age */}
            <SettingsRow
              icon={Calendar}
              label="Age"
              value={`${user.age} years`}
              onEdit={() => handleEdit('age', user.age)}
              editMode={editMode === 'age'}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onSave={() => handleSave('age')}
              onCancel={() => setEditMode(null)}
              inputType="number"
            />

            {/* Height */}
            <SettingsRow
              icon={Ruler}
              label="Height"
              value={`${user.height} cm`}
              onEdit={() => handleEdit('height', user.height)}
              editMode={editMode === 'height'}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onSave={() => handleSave('height')}
              onCancel={() => setEditMode(null)}
              inputType="number"
            />

            {/* Weight */}
            <SettingsRow
              icon={Scale}
              label="Weight"
              value={`${Math.round(kgToDisplay(user.weight, unitSystem) * 10) / 10} ${weightUnit}`}
              onEdit={() => handleEdit('weight', Math.round(kgToDisplay(user.weight, unitSystem) * 10) / 10)}
              editMode={editMode === 'weight'}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onSave={() => handleSave('weight')}
              onCancel={() => setEditMode(null)}
              inputType="number"
            />
          </div>
        </div>

        {/* Appearance */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Appearance
          </h2>
          <div className="card dark:bg-gray-800 dark:border-gray-700 p-0">
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                {isDark ? (
                  <Moon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-500" />
                )}
                <span className="text-gray-900 dark:text-white">Theme</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                    theme === 'system'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  Auto
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Units */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Units
          </h2>
          <div className="card dark:bg-gray-800 dark:border-gray-700 p-0">
            <SelectRow
              icon={Scale}
              label="Weight Unit"
              value={unitLabels[user.unitSystem || 'metric']}
              options={Object.entries(unitLabels).map(([id, label]) => ({
                id,
                label,
              }))}
              selectedId={user.unitSystem || 'metric'}
              onChange={(value) => updateUser({ unitSystem: value as UnitSystem })}
            />
          </div>
        </div>

        {/* Workout Templates */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Quick Start
          </h2>
          <button
            onClick={() => navigate('/templates')}
            className="w-full card dark:bg-gray-800 dark:border-gray-700 p-0 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Library className="w-5 h-5 text-primary-500" />
                <div className="text-left">
                  <span className="text-gray-900 dark:text-white block">Workout Templates</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Browse pre-built programs</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Integrations */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Integrations
          </h2>
          <button
            onClick={() => navigate('/settings/siri')}
            className="w-full card dark:bg-gray-800 dark:border-gray-700 p-0 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-purple-500" />
                <div className="text-left">
                  <span className="text-gray-900 dark:text-white block">Siri Integration</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Ask Siri about your day</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Training Preferences */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Training Preferences
          </h2>
          <div className="card dark:bg-gray-800 dark:border-gray-700 p-0 divide-y divide-gray-100 dark:divide-gray-700">
            {/* Goal */}
            <SelectRow
              icon={Target}
              label="Training Goal"
              value={goalLabels[user.trainingGoal]}
              options={Object.entries(goalLabels).map(([id, label]) => ({
                id,
                label,
              }))}
              selectedId={user.trainingGoal}
              onChange={(value) => updateUser({ trainingGoal: value as TrainingGoal })}
            />

            {/* Experience */}
            <SelectRow
              icon={User}
              label="Experience Level"
              value={experienceLabels[user.experienceLevel]}
              options={Object.entries(experienceLabels).map(([id, label]) => ({
                id,
                label,
              }))}
              selectedId={user.experienceLevel}
              onChange={(value) => updateUser({ experienceLevel: value as ExperienceLevel })}
            />

            {/* Equipment */}
            <SelectRow
              icon={Dumbbell}
              label="Equipment"
              value={equipmentLabels[user.equipment]}
              options={Object.entries(equipmentLabels).map(([id, label]) => ({
                id,
                label,
              }))}
              selectedId={user.equipment}
              onChange={(value) => updateUser({ equipment: value as Equipment })}
            />
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Data
          </h2>
          <div className="card dark:bg-gray-800 dark:border-gray-700 p-0 divide-y divide-gray-100 dark:divide-gray-700">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-white">Export Data</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="text-red-600 dark:text-red-400">Clear All Data</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Email Verification Banner */}
        {isEmailProvider && !isEmailVerified && (
          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Verify your email</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Verify your email to secure your account and enable password recovery.
                </p>
                <button
                  onClick={handleSendVerification}
                  disabled={verificationLoading || verificationSent}
                  className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/60 disabled:opacity-50 transition-colors"
                >
                  {verificationSent ? 'Verification email sent!' : verificationLoading ? 'Sending...' : 'Send verification email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account & Security */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Account & Security
          </h2>
          <div className="card dark:bg-gray-800 dark:border-gray-700 p-0 divide-y divide-gray-100 dark:divide-gray-700">
            {/* Email + verification status */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <span className="text-gray-900 dark:text-white block">Signed in as</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.email}</span>
                </div>
              </div>
              {isEmailVerified ? (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Verified</span>
                </div>
              ) : isEmailProvider ? (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Unverified</span>
                </div>
              ) : null}
            </div>

            {/* Change Password (only for email/password users) */}
            {isEmailProvider && (
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">Change Password</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            )}

            {passwordSuccess && (
              <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-sm text-green-600 dark:text-green-400">
                {passwordSuccess}
              </div>
            )}

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="text-red-600 dark:text-red-400">Sign Out</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* Delete Account */}
            {isEmailProvider && (
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <span className="text-red-600 dark:text-red-400 block">Delete Account</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Permanently delete account and all data</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
              </div>

              {passwordError && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {passwordError}
                </div>
              )}

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 10 chars, upper, lower, number, symbol"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPasswordError('');
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const error = validatePassword(newPassword);
                    if (error) {
                      setPasswordError(error);
                      return;
                    }
                    if (newPassword !== confirmNewPassword) {
                      setPasswordError('Passwords do not match');
                      return;
                    }
                    setPasswordError('');
                    // Close this modal, open re-auth modal
                    setShowChangePassword(false);
                    setShowReauthForPassword(true);
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Re-auth modal for password change */}
        {showReauthForPassword && (
          <ReauthModal
            title="Verify Identity"
            description="Enter your current password to change it."
            confirmLabel="Change Password"
            onConfirm={handleChangePassword}
            onCancel={() => {
              setShowReauthForPassword(false);
              setNewPassword('');
              setConfirmNewPassword('');
            }}
          />
        )}

        {/* Delete Account Modal */}
        {showDeleteAccount && (
          <ReauthModal
            title="Delete Account"
            description="This will permanently delete your account, all workout data, nutrition logs, calendar events, and Siri tokens. This cannot be undone."
            confirmLabel="Delete Everything"
            destructive
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteAccount(false)}
          />
        )}

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
          <p>The Temple v1.2.0</p>
          <p className="mt-1">
            {workoutSessions.length} workouts • {routines.length} routines • {personalRecords.length} PRs
          </p>
        </div>
      </div>
    </div>
  );
}

interface SettingsRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  onEdit: () => void;
  editMode: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  inputType?: string;
}

function SettingsRow({
  icon: Icon,
  label,
  value,
  onEdit,
  editMode,
  editValue,
  onEditValueChange,
  onSave,
  onCancel,
  inputType = 'text',
}: SettingsRowProps) {
  if (editMode) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        </div>
        <div className="flex gap-2">
          <input
            type={inputType}
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
            autoFocus
          />
          <button onClick={onSave} className="btn-primary px-3">
            Save
          </button>
          <button onClick={onCancel} className="btn-secondary px-3">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onEdit}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <span className="text-gray-900 dark:text-white">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 dark:text-gray-300">{value}</span>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  );
}

interface SelectRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  options: { id: string; label: string }[];
  selectedId: string;
  onChange: (value: string) => void;
}

function SelectRow({
  icon: Icon,
  label,
  value,
  options,
  selectedId,
  onChange,
}: SelectRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-900 dark:text-white">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-300">{value}</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-4 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  option.id === selectedId
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
