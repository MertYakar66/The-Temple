import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ChevronLeft,
  Search,
  Plus,
  Clock,
  Check,
  Flame,
} from 'lucide-react';
import { useDietStore } from '../store/useDietStore';
import type { Food } from '../types';

export function DietLog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const mealParam = searchParams.get('meal') || 'Snacks';
  const logDate = dateParam || format(new Date(), 'yyyy-MM-dd');

  const getAllFoods = useDietStore((s) => s.getAllFoods);
  const recentFoodIds = useDietStore((s) => s.recentFoodIds);
  const logFood = useDietStore((s) => s.logFood);
  const getFood = useDietStore((s) => s.getFood);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servings, setServings] = useState(1);

  const allFoods = getAllFoods();
  const recentFoods = recentFoodIds.map((id) => getFood(id)).filter(Boolean) as Food[];

  // Filter foods based on search
  const getFilteredFoods = (): Food[] => {
    if (!searchQuery) {
      // Show recent foods when no search
      return recentFoods.length > 0 ? recentFoods : allFoods.slice(0, 20);
    }
    const query = searchQuery.toLowerCase();
    return allFoods.filter((f) => f.name.toLowerCase().includes(query));
  };

  const filteredFoods = getFilteredFoods();

  const handleLogFood = () => {
    if (!selectedFood) return;

    logFood({
      date: logDate,
      mealType: mealParam,
      type: 'food',
      foodId: selectedFood.id,
      servings,
    });

    navigate('/diet');
  };

  // Food selection view
  if (selectedFood) {
    const macros = {
      calories: selectedFood.macros.calories * servings,
      protein: selectedFood.macros.protein * servings,
      carbs: selectedFood.macros.carbs * servings,
      fat: selectedFood.macros.fat * servings,
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setSelectedFood(null)}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>
          </div>
        </header>

        <div className="px-4 py-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedFood.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {selectedFood.servingSize}{selectedFood.servingUnit} per serving
            </p>
          </div>

          {/* Meal slot (read-only) */}
          <div className="bg-primary-50 dark:bg-primary-900/30 px-4 py-3 rounded-lg">
            <p className="text-sm text-primary-600 dark:text-primary-400">Adding to</p>
            <p className="font-semibold text-primary-900 dark:text-primary-100">{mealParam}</p>
          </div>

          {/* Servings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Servings</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setServings(Math.max(0.25, servings - 0.25))}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full text-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
              >
                -
              </button>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(Math.max(0.25, parseFloat(e.target.value) || 0.25))}
                className="w-20 text-center text-2xl font-bold border-0 focus:ring-0 bg-transparent text-gray-900 dark:text-white"
                step="0.25"
              />
              <button
                onClick={() => setServings(servings + 0.25)}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full text-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
              >
                +
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              = {Math.round(selectedFood.servingSize * servings)}{selectedFood.servingUnit}
            </p>
          </div>

          {/* Macros Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Nutrition</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{Math.round(macros.calories)}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Cal</p>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{Math.round(macros.protein)}g</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Protein</p>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{Math.round(macros.carbs)}g</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Carbs</p>
              </div>
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{Math.round(macros.fat)}g</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Fat</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogFood}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white text-lg flex items-center justify-center rounded-xl font-semibold transition-colors"
          >
            <Check className="w-5 h-5 mr-2" />
            Add to {mealParam}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/diet')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <span className="font-medium text-gray-900 dark:text-white">{mealParam}</span>
          <button
            onClick={() => navigate('/diet/food/new')}
            className="text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1"
          >
            <Plus className="w-5 h-5" />
            New
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search foods..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
            autoFocus
          />
        </div>

        {/* Section Label */}
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">
            {searchQuery ? 'Search Results' : 'Recent Foods'}
          </span>
        </div>

        {/* Food List */}
        <div className="space-y-2">
          {filteredFoods.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery ? 'No foods found' : 'No recent foods yet'}
              </p>
              <button
                onClick={() => navigate('/diet/food/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Food
              </button>
            </div>
          ) : (
            filteredFoods.map((food) => (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{food.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {food.macros.calories} cal · {food.macros.protein}g protein · {food.servingSize}{food.servingUnit}
                  </p>
                </div>
                <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
