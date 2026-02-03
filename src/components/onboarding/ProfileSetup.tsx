import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

interface ProfileSetupProps {
  onNext: (data: ProfileData) => void;
  onBack: () => void;
  initialData?: ProfileData;
}

export interface ProfileData {
  name: string;
  age: number;
  height: number;
  weight: number;
}

export function ProfileSetup({ onNext, onBack, initialData }: ProfileSetupProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [height, setHeight] = useState(initialData?.height?.toString() || '');
  const [weight, setWeight] = useState(initialData?.weight?.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!weight || parseInt(weight) < 30 || parseInt(weight) > 300) {
      newErrors.weight = 'Please enter a valid weight (30-300 kg)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onNext({
        name: name.trim(),
        age: parseInt(age),
        height: parseInt(height),
        weight: parseInt(weight),
      });
    }
  };

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
            Let's get to know you
          </h1>
          <p className="text-gray-600">
            Tell us about yourself so we can personalize your experience
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="input-label">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className={`input ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="input-label">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className={`input ${errors.age ? 'border-red-500' : ''}`}
            />
            {errors.age && (
              <p className="text-red-500 text-sm mt-1">{errors.age}</p>
            )}
          </div>

          <div>
            <label className="input-label">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Enter your height in cm"
              className={`input ${errors.height ? 'border-red-500' : ''}`}
            />
            {errors.height && (
              <p className="text-red-500 text-sm mt-1">{errors.height}</p>
            )}
          </div>

          <div>
            <label className="input-label">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter your weight in kg"
              className={`input ${errors.weight ? 'border-red-500' : ''}`}
            />
            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-200">
        <button onClick={handleSubmit} className="btn-primary w-full py-4 text-lg">
          Continue
        </button>
      </div>
    </div>
  );
}
