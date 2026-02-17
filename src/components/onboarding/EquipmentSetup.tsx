import { useState } from 'react';
import { ChevronLeft, Building2, Home, Package, User } from 'lucide-react';
import type { Equipment } from '../../types';

interface EquipmentSetupProps {
  onNext: (equipment: Equipment) => void;
  onBack: () => void;
  initialEquipment?: Equipment;
}

const equipmentOptions: { id: Equipment; icon: React.ElementType; title: string; description: string }[] = [
  {
    id: 'full_gym',
    icon: Building2,
    title: 'Full Gym',
    description: 'Access to all machines, barbells, dumbbells, and cables',
  },
  {
    id: 'home_gym',
    icon: Home,
    title: 'Home Gym',
    description: 'Basic equipment like dumbbells, bench, and maybe a rack',
  },
  {
    id: 'minimal',
    icon: Package,
    title: 'Minimal Equipment',
    description: 'A few dumbbells or resistance bands only',
  },
  {
    id: 'bodyweight',
    icon: User,
    title: 'Bodyweight Only',
    description: 'No equipment, just using your own body',
  },
];

export function EquipmentSetup({ onNext, onBack, initialEquipment }: EquipmentSetupProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    initialEquipment || null
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
            What equipment do you have?
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We'll recommend exercises based on your available gear
          </p>
        </div>

        <div className="space-y-3">
          {equipmentOptions.map(({ id, icon: Icon, title, description }) => (
            <button
              key={id}
              onClick={() => setSelectedEquipment(id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                selectedEquipment === id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedEquipment === id
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
          onClick={() => selectedEquipment && onNext(selectedEquipment)}
          disabled={!selectedEquipment}
          className="btn-primary w-full py-4 text-lg"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
}
