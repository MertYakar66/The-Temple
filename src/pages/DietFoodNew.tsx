import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { useDietStore } from '../store/useDietStore';

export function DietFoodNew() {
  const navigate = useNavigate();
  const addCustomFood = useDietStore((s) => s.addCustomFood);

  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState(100);
  const [servingUnit, setServingUnit] = useState('g');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a food name');
      return;
    }
    if (calories <= 0) {
      setError('Please enter calories');
      return;
    }

    addCustomFood({
      name: name.trim(),
      category: 'other', // Simplified - no category selection
      servingSize,
      servingUnit,
      macros: {
        calories,
        protein,
        carbs,
        fat,
      },
    });

    navigate(-1);
  };

  const isValid = name.trim() && calories > 0;

  // Calculate calories from macros for validation hint
  const calculatedCalories = (protein * 4) + (carbs * 4) + (fat * 9);
  const calorieDiff = Math.abs(calculatedCalories - calories);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Food</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Food Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g., Homemade Protein Shake"
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
          />
        </div>

        {/* Serving Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serving Size</label>
            <input
              type="number"
              value={servingSize}
              onChange={(e) => setServingSize(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
            <select
              value={servingUnit}
              onChange={(e) => setServingUnit(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
            >
              <option value="g">grams (g)</option>
              <option value="ml">milliliters (ml)</option>
              <option value="oz">ounces (oz)</option>
              <option value="cup">cup</option>
              <option value="piece">piece</option>
              <option value="scoop">scoop</option>
              <option value="tbsp">tablespoon</option>
              <option value="slice">slice</option>
              <option value="serving">serving</option>
            </select>
          </div>
        </div>

        {/* Macros */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nutrition per Serving *</label>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-gray-900 dark:text-white">Calories</span>
              </div>
              <input
                type="number"
                value={calories || ''}
                onChange={(e) => {
                  setCalories(parseFloat(e.target.value) || 0);
                  setError('');
                }}
                className="w-24 text-right px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Beef className="w-5 h-5 text-red-500" />
                <span className="text-gray-900 dark:text-white">Protein (g)</span>
              </div>
              <input
                type="number"
                value={protein || ''}
                onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                className="w-24 text-right px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Wheat className="w-5 h-5 text-amber-500" />
                <span className="text-gray-900 dark:text-white">Carbs (g)</span>
              </div>
              <input
                type="number"
                value={carbs || ''}
                onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                className="w-24 text-right px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-900 dark:text-white">Fat (g)</span>
              </div>
              <input
                type="number"
                value={fat || ''}
                onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
                className="w-24 text-right px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Macro validation hint */}
        {(protein > 0 || carbs > 0 || fat > 0) && (
          <div className={`p-3 rounded-lg text-sm ${
            calorieDiff <= 20
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}>
            <p className="font-medium">Macro Check:</p>
            <p>
              {protein}g P × 4 + {carbs}g C × 4 + {fat}g F × 9 = {calculatedCalories} cal
              {calorieDiff > 20 && (
                <span className="block mt-1">
                  (Your entered calories: {calories})
                </span>
              )}
            </p>
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter the nutrition information from the food label. Values should be per serving.
        </p>
      </div>
    </div>
  );
}
