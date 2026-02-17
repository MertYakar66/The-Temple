import { useState } from 'react';
import { ChevronLeft, Zap, Target, Flame, Heart, Dumbbell } from 'lucide-react';
import type { TrainingGoal } from '../../types';

interface GoalsSetupProps {
  onNext: (goal: TrainingGoal) => void;
  onBack: () => void;
  initialGoal?: TrainingGoal;
}

const goals: { id: TrainingGoal; icon: React.ElementType; title: string; description: string }[] = [
  {
    id: 'strength',
    icon: Zap,
    title: 'Build Strength',
    description: 'Increase your max lifts and overall power',
  },
  {
    id: 'hypertrophy',
    icon: Dumbbell,
    title: 'Build Muscle',
    description: 'Focus on muscle growth and size',
  },
  {
    id: 'fat_loss',
    icon: Flame,
    title: 'Lose Fat',
    description: 'Burn calories and get leaner',
  },
  {
    id: 'endurance',
    icon: Heart,
    title: 'Improve Endurance',
    description: 'Increase stamina and cardiovascular health',
  },
  {
    id: 'general_fitness',
    icon: Target,
    title: 'General Fitness',
    description: 'Stay active and maintain overall health',
  },
];

export function GoalsSetup({ onNext, onBack, initialGoal }: GoalsSetupProps) {
  const [selectedGoal, setSelectedGoal] = useState<TrainingGoal | null>(
    initialGoal || null
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
      </header>

      <div className="flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            What's your main goal?
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We'll customize your experience based on what you want to achieve
          </p>
        </div>

        <div className="space-y-3">
          {goals.map(({ id, icon: Icon, title, description }) => (
            <button
              key={id}
              onClick={() => setSelectedGoal(id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                selectedGoal === id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedGoal === id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => selectedGoal && onNext(selectedGoal)}
          disabled={!selectedGoal}
          className="btn-primary w-full py-4 text-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
