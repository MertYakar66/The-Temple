import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ChevronLeft,
  Search,
  Plus,
  Clock,
  Beef,
  Wheat,
  Cookie,
  Salad,
  Milk,
  Apple,
  MoreHorizontal,
  Check,
  Flame,
  Droplet,
  Utensils,
} from 'lucide-react';
import { useDietStore } from '../store/useDietStore';
import type { Food, MealType, FoodCategory } from '../types';

const mealTypeOptions: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
  { id: 'pre_workout', label: 'Pre-Workout' },
  { id: 'post_workout', label: 'Post-Workout' },
];

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

const categoryLabels: Record<FoodCategory, string> = {
  protein: 'Protein',
  carbs: 'Carbs',
  fats: 'Fats',
  vegetables: 'Vegetables',
  dairy: 'Dairy',
  fruits: 'Fruits',
  sides: 'Sides',
  other: 'Other',
};

export function DietLog() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const getAllFoods = useDietStore((s) => s.getAllFoods);
  const recentFoodIds = useDietStore((s) => s.recentFoodIds);
  const logFood = useDietStore((s) => s.logFood);
  const meals = useDietStore((s) => s.meals);
  const logMeal = useDietStore((s) => s.logMeal);
  const recipes = useDietStore((s) => s.recipes);
  const logRecipe = useDietStore((s) => s.logRecipe);
  const getFood = useDietStore((s) => s.getFood);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all' | 'recent' | 'meals' | 'recipes'>('recent');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servings, setServings] = useState(1);

  const allFoods = getAllFoods();
  const recentFoods = recentFoodIds.map((id) => getFood(id)).filter(Boolean) as Food[];

  // Filter foods based on search and category
  const getFilteredFoods = (): Food[] => {
    let foods = allFoods;

    if (selectedCategory === 'recent') {
      foods = recentFoods;
    } else if (selectedCategory !== 'all' && selectedCategory !== 'meals' && selectedCategory !== 'recipes') {
      foods = allFoods.filter((f) => f.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      foods = foods.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.category.toLowerCase().includes(query)
      );
    }

    return foods;
  };

  const filteredFoods = getFilteredFoods();

  const handleLogFood = () => {
    if (!selectedFood) return;

    logFood({
      date: today,
      mealType: selectedMealType,
      type: 'food',
      foodId: selectedFood.id,
      servings,
    });

    navigate('/diet');
  };

  const handleLogMeal = (mealId: string) => {
    logMeal(mealId, today, selectedMealType);
    navigate('/diet');
  };

  const handleLogRecipe = (recipeId: string) => {
    logRecipe(recipeId, 1, today, selectedMealType);
    navigate('/diet');
  };

  // Food selection modal
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

          {/* Meal Type */}
          <div>
            <label className="input-label">Meal</label>
            <div className="flex flex-wrap gap-2">
              {mealTypeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedMealType(option.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedMealType === option.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Servings */}
          <div>
            <label className="input-label">Servings</label>
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
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Nutrition</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{Math.round(macros.calories)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Calories</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Beef className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{Math.round(macros.protein)}g</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Protein</p>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Wheat className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{Math.round(macros.carbs)}g</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Carbs</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Droplet className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{Math.round(macros.fat)}g</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fat</p>
              </div>
            </div>
          </div>

          <button onClick={handleLogFood} className="btn-primary w-full py-4 text-lg flex items-center justify-center">
            <Check className="w-5 h-5 mr-2" />
            Log Food
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
          <button
            onClick={() => navigate('/diet/food/new')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1 hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Food
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Meal Type Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {mealTypeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedMealType(option.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedMealType === option.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search foods..."
            className="input pl-10"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('recent')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              selectedCategory === 'recent'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            Recent
          </button>
          <button
            onClick={() => setSelectedCategory('meals')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'meals'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Saved Meals
          </button>
          <button
            onClick={() => setSelectedCategory('recipes')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'recipes'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Recipes
          </button>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {(Object.keys(categoryLabels) as FoodCategory[]).map((cat) => {
            const Icon = categoryIcons[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedCategory === cat
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {categoryLabels[cat]}
              </button>
            );
          })}
        </div>

        {/* Saved Meals */}
        {selectedCategory === 'meals' && (
          <div className="space-y-2">
            {meals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No saved meals yet</p>
                <button
                  onClick={() => navigate('/diet/meals')}
                  className="btn-primary"
                >
                  Create Meal
                </button>
              </div>
            ) : (
              meals.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => handleLogMeal(meal.id)}
                  className="w-full card flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{meal.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(meal.totalMacros.calories)} cal • {Math.round(meal.totalMacros.protein)}g protein
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Recipes */}
        {selectedCategory === 'recipes' && (
          <div className="space-y-2">
            {recipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No recipes yet</p>
                <button
                  onClick={() => navigate('/diet/meals')}
                  className="btn-primary"
                >
                  Create Recipe
                </button>
              </div>
            ) : (
              recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleLogRecipe(recipe.id)}
                  className="w-full card flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{recipe.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(recipe.macrosPerServing.calories)} cal • {Math.round(recipe.macrosPerServing.protein)}g protein per serving
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Food List */}
        {selectedCategory !== 'meals' && selectedCategory !== 'recipes' && (
          <div className="space-y-2">
            {filteredFoods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery ? 'No foods found' : 'No recent foods'}
                </p>
                <button
                  onClick={() => navigate('/diet/food/new')}
                  className="btn-primary"
                >
                  Create Custom Food
                </button>
              </div>
            ) : (
              filteredFoods.map((food) => {
                const Icon = categoryIcons[food.category];
                return (
                  <button
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    className="w-full card flex items-center gap-3 hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{food.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {food.macros.calories} cal • {food.macros.protein}g P • {food.servingSize}{food.servingUnit}
                      </p>
                    </div>
                    {food.isCustom && (
                      <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                        Custom
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
