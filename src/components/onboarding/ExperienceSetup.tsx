import { useState } from 'react';
import { ChevronLeft, Baby, User, Award } from 'lucide-react';
import type { ExperienceLevel } from '../../types';

interface ExperienceSetupProps {
  onNext: (level: ExperienceLevel) => void;
  onBack: () => void;
  initialLevel?: ExperienceLevel;
}

const levels: { id: ExperienceLevel; icon: React.ElementType; title: string; description: string }[] = [
  {
    id: 'beginner',
    icon: Baby,
    title: 'Beginner',
    description: 'New to strength training or returning after a long break',
  },
  {
    id: 'intermediate',
    icon: User,
    title: 'Intermediate',
    description: '1-3 years of consistent training experience',
  },
  {
    id: 'advanced',
    icon: Award,
    title: 'Advanced',
    description: '3+ years of serious training with solid technique',
  },
];

export function ExperienceSetup({ onNext, onBack, initialLevel }: ExperienceSetupProps) {
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(
    initialLevel || null
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
      </header>

      <div className="flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            What's your experience level?
          </h1>
          <p className="text-gray-600">
            This helps us suggest appropriate exercises and progression
          </p>
        </div>

        <div className="space-y-3">
          {levels.map(({ id, icon: Icon, title, description }) => (
            <button
              key={id}
              onClick={() => setSelectedLevel(id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                selectedLevel === id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedLevel === id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-200">
        <button
          onClick={() => selectedLevel && onNext(selectedLevel)}
          disabled={!selectedLevel}
          className="btn-primary w-full py-4 text-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
