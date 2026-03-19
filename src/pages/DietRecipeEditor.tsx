import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import type { Food, FoodCategory, RecipeIngredient } from '../types';

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

export function DietRecipeEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const getAllFoods = useDietStore((s) => s.getAllFoods);
  const addRecipe = useDietStore((s) => s.addRecipe);
  const updateRecipe = useDietStore((s) => s.updateRecipe);
  const getRecipe = useDietStore((s) => s.getRecipe);

  // Load existing recipe for edit mode
  const existing = id ? getRecipe(id) : undefined;

  const [recipeName, setRecipeName] = useState(existing?.name ?? '');
  const [servings, setServings] = useState(existing?.servings ?? 1);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(existing?.ingredients ?? []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFoodPicker, setShowFoodPicker] = useState(false);

  const allFoods = getAllFoods();

  const filteredFoods = searchQuery
    ? allFoods.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allFoods;

  const addFoodToRecipe = (food: Food) => {
    const newIngredient: RecipeIngredient = {
      foodId: food.id,
      food,
      quantity: 1,
    };
    setIngredients([...ingredients, newIngredient]);
    setShowFoodPicker(false);
    setSearchQuery('');
  };

  const updateIngredientQuantity = (foodId: string, quantity: number) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.foodId === foodId ? { ...ing, quantity } : ing
      )
    );
  };

  const removeIngredient = (foodId: string) => {
    setIngredients(ingredients.filter((ing) => ing.foodId !== foodId));
  };

  const totalMacros = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.food.macros.calories * ing.quantity,
      protein: acc.protein + ing.food.macros.protein * ing.quantity,
      carbs: acc.carbs + ing.food.macros.carbs * ing.quantity,
      fat: acc.fat + ing.food.macros.fat * ing.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const perServing = {
    calories: servings > 0 ? totalMacros.calories / servings : 0,
    protein: servings > 0 ? totalMacros.protein / servings : 0,
    carbs: servings > 0 ? totalMacros.carbs / servings : 0,
    fat: servings > 0 ? totalMacros.fat / servings : 0,
  };

  const handleSave = () => {
    if (!recipeName.trim()) {
      alert('Please enter a recipe name');
      return;
    }
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }
    if (servings <= 0) {
      alert('Servings must be at least 1');
      return;
    }

    if (isEditing && id) {
      updateRecipe(id, {
        name: recipeName.trim(),
        ingredients,
        servings,
      });
    } else {
      addRecipe({
        name: recipeName.trim(),
        ingredients,
        servings,
      });
    }

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
            <h1 className="ml-4 font-semibold text-gray-900 dark:text-white">Add Ingredient</h1>
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
                  onClick={() => addFoodToRecipe(food)}
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
          <h1 className="font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Recipe' : 'New Recipe'}
          </h1>
          <button
            onClick={handleSave}
            disabled={!recipeName.trim() || ingredients.length === 0}
            className={`font-medium ${
              recipeName.trim() && ingredients.length > 0
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Recipe Name */}
        <div>
          <label className="input-label">Recipe Name</label>
          <input
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder="e.g., Protein Overnight Oats"
            className="input"
          />
        </div>

        {/* Servings */}
        <div>
          <label className="input-label">Servings</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
            >
              -
            </button>
            <span className="text-lg font-semibold w-12 text-center text-gray-900 dark:text-white">
              {servings}
            </span>
            <button
              onClick={() => setServings(servings + 1)}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
            >
              +
            </button>
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="input-label mb-0">Ingredients</label>
            <button
              onClick={() => setShowFoodPicker(true)}
              className="text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Ingredient
            </button>
          </div>

          {ingredients.length === 0 ? (
            <div className="card text-center py-8">
              <Utensils className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No ingredients added yet</p>
              <button
                onClick={() => setShowFoodPicker(true)}
                className="btn-primary"
              >
                Add First Ingredient
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {ingredients.map((ing) => {
                const Icon = categoryIcons[ing.food.category];
                return (
                  <div key={ing.foodId} className="card">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{ing.food.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {Math.round(ing.food.macros.calories * ing.quantity)} cal • {Math.round(ing.food.macros.protein * ing.quantity)}g P
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateIngredientQuantity(ing.foodId, Math.max(0.25, ing.quantity - 0.25))}
                            className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-12 text-center text-gray-900 dark:text-white">
                            {ing.quantity}x
                          </span>
                          <button
                            onClick={() => updateIngredientQuantity(ing.foodId, ing.quantity + 0.25)}
                            className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeIngredient(ing.foodId)}
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

        {/* Nutrition Summary */}
        {ingredients.length > 0 && (
          <div className="card bg-gray-100 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Per Serving</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(perServing.calories)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{Math.round(perServing.protein)}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{Math.round(perServing.carbs)}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{Math.round(perServing.fat)}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fat</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Total: {Math.round(totalMacros.calories)} cal • {Math.round(totalMacros.protein)}g P • {Math.round(totalMacros.carbs)}g C • {Math.round(totalMacros.fat)}g F
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!recipeName.trim() || ingredients.length === 0}
          className={`w-full py-4 text-lg flex items-center justify-center rounded-xl font-semibold transition-colors ${
            recipeName.trim() && ingredients.length > 0
              ? 'btn-primary'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <Check className="w-5 h-5 mr-2" />
          {isEditing ? 'Update Recipe' : 'Save Recipe'}
        </button>
      </div>
    </div>
  );
}
