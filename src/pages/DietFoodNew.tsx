import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { useDietStore } from '../store/useDietStore';
import type { FoodCategory } from '../types';

const categoryOptions: { id: FoodCategory; label: string }[] = [
  { id: 'protein', label: 'Protein' },
  { id: 'carbs', label: 'Carbs' },
  { id: 'fats', label: 'Fats' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'other', label: 'Other' },
];

export function DietFoodNew() {
  const navigate = useNavigate();
  const addCustomFood = useDietStore((s) => s.addCustomFood);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('other');
  const [servingSize, setServingSize] = useState(100);
  const [servingUnit, setServingUnit] = useState('g');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  const handleSave = () => {
    if (!name.trim()) return;

    addCustomFood({
      name: name.trim(),
      category,
      servingSize,
      servingUnit,
      macros: {
        calories,
        protein,
        carbs,
        fat,
      },
    });

    navigate('/diet/log');
  };

  const isValid = name.trim() && calories > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="text-primary-600 font-medium flex items-center gap-1 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Save
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Custom Food</h1>

        {/* Name */}
        <div>
          <label className="input-label">Food Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Homemade Protein Shake"
            className="input"
          />
        </div>

        {/* Category */}
        <div>
          <label className="input-label">Category</label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setCategory(option.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === option.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Serving Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Serving Size</label>
            <input
              type="number"
              value={servingSize}
              onChange={(e) => setServingSize(parseFloat(e.target.value) || 0)}
              className="input"
            />
          </div>
          <div>
            <label className="input-label">Unit</label>
            <select
              value={servingUnit}
              onChange={(e) => setServingUnit(e.target.value)}
              className="input"
            >
              <option value="g">grams (g)</option>
              <option value="ml">milliliters (ml)</option>
              <option value="oz">ounces (oz)</option>
              <option value="cup">cup</option>
              <option value="piece">piece</option>
              <option value="scoop">scoop</option>
              <option value="tbsp">tablespoon</option>
            </select>
          </div>
        </div>

        {/* Macros */}
        <div>
          <label className="input-label">Nutrition per Serving</label>
          <div className="card p-0 divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-900">Calories</span>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                className="w-24 text-right input py-1"
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-900">Protein (g)</span>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                className="w-24 text-right input py-1"
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-900">Carbs (g)</span>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                className="w-24 text-right input py-1"
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-900">Fat (g)</span>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
                className="w-24 text-right input py-1"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Enter the nutrition information from the food label. Values should be per serving.
        </p>
      </div>
    </div>
  );
}
