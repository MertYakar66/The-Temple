import type { UnitSystem } from '../types';

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

/**
 * Convert weight between kg and lbs
 */
export function convertWeight(value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;

  if (from === 'metric' && to === 'imperial') {
    // kg to lbs
    return value * KG_TO_LBS;
  } else {
    // lbs to kg
    return value * LBS_TO_KG;
  }
}

/**
 * Convert weight from stored value (always kg) to display value
 */
export function kgToDisplay(kg: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    return kg * KG_TO_LBS;
  }
  return kg;
}

/**
 * Convert weight from display value to storage value (always kg)
 */
export function displayToKg(value: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    return value * LBS_TO_KG;
  }
  return value;
}

/**
 * Format weight for display with appropriate rounding
 */
export function formatWeight(kg: number, unitSystem: UnitSystem, decimals: number = 1): string {
  const displayValue = kgToDisplay(kg, unitSystem);
  return displayValue.toFixed(decimals);
}

/**
 * Get the weight unit label
 */
export function getWeightUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'lbs' : 'kg';
}
