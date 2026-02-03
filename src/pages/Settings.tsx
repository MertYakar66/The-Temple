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
} from 'lucide-react';
import { useStore } from '../store/useStore';
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

  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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
      exportedAt: new Date().toISOString(),
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="ml-4 font-semibold text-gray-900">Settings</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Section */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Profile
          </h2>
          <div className="card p-0 divide-y divide-gray-100">
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

        {/* Training Preferences */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Training Preferences
          </h2>
          <div className="card p-0 divide-y divide-gray-100">
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
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Data
          </h2>
          <div className="card p-0 divide-y divide-gray-100">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Export Data</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="text-red-600">Clear All Data</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>FitTrack v1.0.0</p>
          <p className="mt-1">
            {workoutSessions.length} workouts logged • {routines.length} routines
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
          <Icon className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-500">{label}</span>
        </div>
        <div className="flex gap-2">
          <input
            type={inputType}
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="input flex-1"
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
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-500" />
        <span className="text-gray-900">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{value}</span>
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
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-500" />
          <span className="text-gray-900">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{value}</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-4 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                  option.id === selectedId
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700'
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
