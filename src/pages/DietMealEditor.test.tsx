import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useDietStore } from '../store/useDietStore';
import { defaultFoods } from '../data/foods';
import { DietMealEditor } from './DietMealEditor';
import type { Meal } from '../types';

// First component test in the repo. Pattern: store seeded directly via
// useDietStore.getState() (no mocks); component rendered inside a
// MemoryRouter pinned to the route under test. Future component tests
// for /diet/* can copy this shape.
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/diet/meals/new" element={<DietMealEditor />} />
        <Route path="/diet/meals/:id/edit" element={<DietMealEditor />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DietMealEditor', () => {
  beforeEach(() => {
    useDietStore.getState().resetStore();
  });

  it('renders empty form on /diet/meals/new (create mode)', () => {
    renderAt('/diet/meals/new');

    expect(screen.getByRole('heading', { name: 'New Meal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Meal/ })).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('e.g., Chicken & Rice Bowl') as HTMLInputElement;
    expect(nameInput.value).toBe('');
  });

  it('pre-populates form fields on /diet/meals/:id/edit (edit mode)', () => {
    const food = defaultFoods[0];
    useDietStore.getState().addMeal({
      name: 'My Test Meal',
      mealType: 'custom',
      items: [
        {
          id: 'item-1',
          type: 'food',
          foodId: food.id,
          food,
          servings: 1,
          macros: { ...food.macros },
        },
      ],
    });

    const meal = useDietStore.getState().meals[0] as Meal;
    renderAt(`/diet/meals/${meal.id}/edit`);

    // Header + bottom button reflect edit mode.
    expect(screen.getByRole('heading', { name: 'Edit Meal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Meal/ })).toBeInTheDocument();

    // Name input pre-populated; food item visible.
    const nameInput = screen.getByPlaceholderText('e.g., Chicken & Rice Bowl') as HTMLInputElement;
    expect(nameInput.value).toBe('My Test Meal');
    expect(screen.getByText(food.name)).toBeInTheDocument();
  });

  it('renders empty form on /diet/meals/:id/edit when the id does not exist', () => {
    // Edge case: stale link or hand-typed URL. Recipe editor falls
    // through to empty defaults too — same behavior here.
    renderAt('/diet/meals/nonexistent-id/edit');

    expect(screen.getByRole('heading', { name: 'Edit Meal' })).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText('e.g., Chicken & Rice Bowl') as HTMLInputElement;
    expect(nameInput.value).toBe('');
  });
});
