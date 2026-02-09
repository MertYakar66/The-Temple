import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Search,
  Trash2,
  Check,
  Beef,
  Wheat,
  Cookie,
  Salad,
  Milk,
  Apple,
  MoreHorizontal,
  Utensils,
} from 'lucide-react';
import { useDietStore } from '../store/useDietStore';
import type { Food, FoodCategory, MealItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

const categoryIcons: Record<FoodCategory, React.ElementType> = {
  protein: Beef,
  carbs: Wheat,
  fats: Cookie,
  vegetables: Salad,
  dairy: Milk,
  fruits: Apple,
  sides: Utensils,
  other: MoreHorizontal,
};

export function DietMealNew() {
  const navigate = useNavigate();
  const getAllFoods = useDietStore((s) => s.getAllFoods);
  const addMeal = useDietStore((s) => s.addMeal);

  const [mealName, setMealName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<MealItem[]>([]);
  const [showFoodPicker, setShowFoodPicker] = useState(false);

  const allFoods = getAllFoods();

  const filteredFoods = searchQuery
    ? allFoods.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allFoods;

  const addFoodToMeal = (food: Food) => {
    const newItem: MealItem = {
      id: uuidv4(),
      type: 'food',
      foodId: food.id,
      food,
      servings: 1,
      macros: { ...food.macros },
    };
    setItems([...items, newItem]);
    setShowFoodPicker(false);
    setSearchQuery('');
  };

  const updateItemServings = (itemId: string, servings: number) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        const baseFood = item.food!;
        return {
          ...item,
          servings,
          macros: {
            calories: baseFood.macros.calories * servings,
            protein: baseFood.macros.protein * servings,
            carbs: baseFood.macros.carbs * servings,
            fat: baseFood.macros.fat * servings,
          },
        };
      })
    );
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const totalMacros = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.macros.calories,
      protein: acc.protein + item.macros.protein,
      carbs: acc.carbs + item.macros.carbs,
      fat: acc.fat + item.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleSave = () => {
    if (!mealName.trim()) {
      alert('Please enter a meal name');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one food item');
      return;
    }

    addMeal({
      name: mealName.trim(),
      mealType: 'custom',
      items,
    });

    navigate('/diet/meals');
  };

  if (showFoodPicker) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
          <div className="flex items-center">
            <button
              onClick={() => {
                setShowFoodPicker(false);
                setSearchQuery('');
              }}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <h1 className="ml-4 font-semibold text-gray-900 dark:text-white">Add Food</h1>
          </div>
        </header>

        <div className="px-4 py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search foods..."
              className="input pl-10"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            {filteredFoods.map((food) => {
              const Icon = categoryIcons[food.category];
              return (
                <button
                  key={food.id}
                  onClick={() => addFoodToMeal(food)}
                  className="w-full card flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{food.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {food.macros.calories} cal • {food.macros.protein}g P
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/diet/meals')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-white">New Meal</h1>
          <button
            onClick={handleSave}
            disabled={!mealName.trim() || items.length === 0}
            className={`font-medium ${
              mealName.trim() && items.length > 0
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Meal Name */}
        <div>
          <label className="input-label">Meal Name</label>
          <input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="e.g., Chicken & Rice Bowl"
            className="input"
          />
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="input-label mb-0">Items</label>
            <button
              onClick={() => setShowFoodPicker(true)}
              className="text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Food
            </button>
          </div>

          {items.length === 0 ? (
            <div className="card text-center py-8">
              <Utensils className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No items added yet</p>
              <button
                onClick={() => setShowFoodPicker(true)}
                className="btn-primary"
              >
                Add First Item
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const Icon = item.food ? categoryIcons[item.food.category] : Utensils;
                return (
                  <div key={item.id} className="card">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.food?.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {Math.round(item.macros.calories)} cal • {Math.round(item.macros.protein)}g P
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateItemServings(item.id, Math.max(0.25, item.servings - 0.25))}
                            className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-12 text-center text-gray-900 dark:text-white">
                            {item.servings}x
                          </span>
                          <button
                            onClick={() => updateItemServings(item.id, item.servings + 0.25)}
                            className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Totals */}
        {items.length > 0 && (
          <div className="card bg-gray-100 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Total Nutrition</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(totalMacros.calories)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{Math.round(totalMacros.protein)}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{Math.round(totalMacros.carbs)}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{Math.round(totalMacros.fat)}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fat</p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!mealName.trim() || items.length === 0}
          className={`w-full py-4 text-lg flex items-center justify-center rounded-xl font-semibold transition-colors ${
            mealName.trim() && items.length > 0
              ? 'btn-primary'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <Check className="w-5 h-5 mr-2" />
          Save Meal
        </button>
      </div>
    </div>
  );
}
