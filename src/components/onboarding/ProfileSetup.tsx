import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { UnitSystem, Sex } from '../../types';

interface ProfileSetupProps {
  onNext: (data: ProfileData) => void;
  onBack: () => void;
  initialData?: ProfileData;
}

export interface ProfileData {
  name: string;
  sex: Sex;
  age: number;
  height: number;
  weight: number;
  unitSystem: UnitSystem;
}

export function ProfileSetup({ onNext, onBack, initialData }: ProfileSetupProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [sex, setSex] = useState<Sex>(initialData?.sex || 'male');
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [height, setHeight] = useState(initialData?.height?.toString() || '');
  const [weight, setWeight] = useState(initialData?.weight?.toString() || '');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialData?.unitSystem || 'metric');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Weight unit label based on selected unit system
  const weightUnit = unitSystem === 'imperial' ? 'lbs' : 'kg';
  const weightRange = unitSystem === 'imperial' ? '66-660' : '30-300';

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!age || parseInt(age) < 13 || parseInt(age) > 100) {
      newErrors.age = 'Please enter a valid age (13-100)';
    }
    if (!height || parseInt(height) < 100 || parseInt(height) > 250) {
      newErrors.height = 'Please enter a valid height (100-250 cm)';
    }

    // Validate weight based on unit system
    const weightVal = parseFloat(weight);
    if (unitSystem === 'imperial') {
      if (!weight || weightVal < 66 || weightVal > 660) {
        newErrors.weight = `Please enter a valid weight (${weightRange} ${weightUnit})`;
      }
    } else {
      if (!weight || weightVal < 30 || weightVal > 300) {
        newErrors.weight = `Please enter a valid weight (${weightRange} ${weightUnit})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // Convert weight to kg if entered in lbs
      let weightInKg = parseFloat(weight);
      if (unitSystem === 'imperial') {
        weightInKg = weightInKg * 0.453592; // lbs to kg
      }

      onNext({
        name: name.trim(),
        sex,
        age: parseInt(age),
        height: parseInt(height),
        weight: Math.round(weightInKg * 10) / 10, // Always store in kg
        unitSystem,
      });
    }
  };

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
            Let's get to know you
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us about yourself so we can personalize your experience
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="input-label dark:text-gray-300">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className={`input dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="input-label dark:text-gray-300">Sex</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSex('male')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  sex === 'male'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setSex('female')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  sex === 'female'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Female
              </button>
            </div>
          </div>

          <div>
            <label className="input-label dark:text-gray-300">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className={`input dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.age ? 'border-red-500' : ''}`}
            />
            {errors.age && (
              <p className="text-red-500 text-sm mt-1">{errors.age}</p>
            )}
          </div>

          <div>
            <label className="input-label dark:text-gray-300">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Enter your height in cm"
              className={`input dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.height ? 'border-red-500' : ''}`}
            />
            {errors.height && (
              <p className="text-red-500 text-sm mt-1">{errors.height}</p>
            )}
          </div>

          {/* Unit System Toggle */}
          <div>
            <label className="input-label dark:text-gray-300">Weight Unit</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  unitSystem === 'metric'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Metric (kg)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  unitSystem === 'imperial'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Imperial (lbs)
              </button>
            </div>
          </div>

          <div>
            <label className="input-label dark:text-gray-300">Weight ({weightUnit})</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={`Enter your weight in ${weightUnit}`}
              className={`input dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.weight ? 'border-red-500' : ''}`}
            />
            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button onClick={handleSubmit} className="btn-primary w-full py-4 text-lg">
          Continue
        </button>
      </div>
    </div>
  );
}
