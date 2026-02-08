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
  Plus,
  TrendingUp,
  Library,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useDietStore } from '../store/useDietStore';
import { useDarkMode } from '../hooks/useDarkMode';
import type { TrainingGoal, ExperienceLevel, Equipment } from '../types';

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

export function Settings() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const updateUser = useStore((state) => state.updateUser);
  const workoutSessions = useStore((state) => state.workoutSessions);
  const routines = useStore((state) => state.routines);
  const weightEntries = useStore((state) => state.weightEntries);
  const addWeightEntry = useStore((state) => state.addWeightEntry);
  const personalRecords = useStore((state) => state.personalRecords);

  // Diet store data for export
  const dietStore = useDietStore.getState();

  // Dark mode
  const { theme, setTheme, isDark } = useDarkMode();

  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [newWeight, setNewWeight] = useState('');

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
      updateUser({ name: editValue });
    } else if (field === 'weight') {
      updateUser({ weight: parseFloat(editValue) });
    } else if (field === 'height') {
      updateUser({ height: parseFloat(editValue) });
    } else if (field === 'age') {
      updateUser({ age: parseInt(editValue) });
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
      exportedAt: new Date().toISOString(),
      version: '1.1.0',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittrack-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight);
    if (weight > 0) {
      addWeightEntry(weight);
      setNewWeight('');
      setShowWeightInput(false);
    }
  };

  const handleClearData = () => {
    if (
      window.confirm(
        'This will delete all your data including workouts, routines, and personal records. This cannot be undone. Are you sure?'
      )
    ) {
      localStorage.removeItem('workout-tracker-storage');
      window.location.reload();
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
              value={`${user.weight} kg`}
              onEdit={() => handleEdit('weight', user.weight)}
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

        {/* Body Weight Tracking */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Body Weight
          </h2>
          <div className="card dark:bg-gray-800 dark:border-gray-700 p-4">
            {showWeightInput ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Enter weight (kg)"
                  className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
                  autoFocus
                />
                <button onClick={handleAddWeight} className="btn-primary px-3">
                  Add
                </button>
                <button
                  onClick={() => setShowWeightInput(false)}
                  className="btn-secondary px-3"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white">Track Weight</span>
                  </div>
                  <button
                    onClick={() => setShowWeightInput(true)}
                    className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Log Weight
                  </button>
                </div>
                {weightEntries.length > 0 ? (
                  <div className="space-y-2">
                    {weightEntries.slice(0, 5).map((entry) => (
                      <div
                        key={entry.id}
                        className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <span className="text-gray-600 dark:text-gray-400 text-sm">{entry.date}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{entry.weight} kg</span>
                      </div>
                    ))}
                    {weightEntries.length > 5 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-1">
                        +{weightEntries.length - 5} more entries
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No weight entries yet. Start tracking your progress!
                  </p>
                )}
              </>
            )}
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

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
          <p>FitTrack v1.1.0</p>
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
