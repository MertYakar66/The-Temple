import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Utensils,
  BookOpen,
  Trash2,
  Edit2,
} from 'lucide-react';
import { useDietStore } from '../store/useDietStore';

type TabType = 'meals' | 'recipes';

export function DietMeals() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('meals');

  const meals = useDietStore((s) => s.meals);
  const recipes = useDietStore((s) => s.recipes);
  const deleteMeal = useDietStore((s) => s.deleteMeal);
  const deleteRecipe = useDietStore((s) => s.deleteRecipe);

  const handleDeleteMeal = (id: string) => {
    if (confirm('Delete this meal?')) {
      deleteMeal(id);
    }
  };

  const handleDeleteRecipe = (id: string) => {
    if (confirm('Delete this recipe?')) {
      deleteRecipe(id);
    }
  };

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
          <Link
            to={activeTab === 'meals' ? '/diet/meals/new' : '/diet/recipes/new'}
            className="text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1"
          >
            <Plus className="w-5 h-5" />
            New
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('meals')}
            className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'meals'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Utensils className="w-5 h-5 mx-auto mb-1" />
            Saved Meals
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'recipes'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-5 h-5 mx-auto mb-1" />
            Recipes
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Meals Tab */}
        {activeTab === 'meals' && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Saved meals let you log frequently eaten combinations with one tap.
            </p>

            {meals.length === 0 ? (
              <div className="card text-center py-12">
                <Utensils className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Saved Meals</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Create meals for quick logging of your regular combinations.
                </p>
                <Link to="/diet/meals/new" className="btn-primary">
                  Create First Meal
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div key={meal.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{meal.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {meal.items.length} items • {Math.round(meal.totalMacros.calories)} cal •{' '}
                          {Math.round(meal.totalMacros.protein)}g protein
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {meal.items.slice(0, 3).map((item) => (
                            <span
                              key={item.id}
                              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                            >
                              {item.food?.name || item.recipe?.name}
                            </span>
                          ))}
                          {meal.items.length > 3 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              +{meal.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Link
                          to={`/diet/meals/${meal.id}/edit`}
                          className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipes Tab */}
        {activeTab === 'recipes' && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Recipes combine multiple ingredients with proper portions.
            </p>

            {recipes.length === 0 ? (
              <div className="card text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Recipes</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Create recipes to track homemade dishes accurately.
                </p>
                <Link to="/diet/recipes/new" className="btn-primary">
                  Create First Recipe
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{recipe.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {recipe.ingredients.length} ingredients • {recipe.servings} servings
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Per serving: {Math.round(recipe.macrosPerServing.calories)} cal •{' '}
                          {Math.round(recipe.macrosPerServing.protein)}g P •{' '}
                          {Math.round(recipe.macrosPerServing.carbs)}g C •{' '}
                          {Math.round(recipe.macrosPerServing.fat)}g F
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Link
                          to={`/diet/recipes/${recipe.id}/edit`}
                          className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
