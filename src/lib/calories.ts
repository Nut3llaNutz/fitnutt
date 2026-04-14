interface MacroStats {
  gender: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  activity_level: number;
  goal: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

/**
 * Calculates macro targets using the Mifflin-St Jeor Equation.
 * Much more accurate than crude weight-only calculations.
 */
export const calculateMacros = ({
  gender,
  weight_kg,
  height_cm,
  age_val, // Using age_val because the user might not have set it yet
  activity_level,
  goal
}: MacroStats & { age_val?: number }): MacroTargets => {
  const age = age_val || 25; // Default age if not provided
  
  // 1. Calculate BMR (Mifflin-St Jeor)
  let bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // 2. Calculate TDEE
  const tdee = bmr * activity_level;

  // 3. Set Calorie Target based on Goal
  let target = tdee;
  if (goal === 'bulk') {
    target = tdee + 300;
  } else if (goal === 'cut') {
    target = tdee - 500;
  }
  
  // Round to nearest 50 for a cleaner target
  const calorie_target = Math.round(target / 50) * 50;

  // 4. Set Macro Ratios (More realistic parameters)
  // Protein: Lowered slightly based on modern general fitness recommendations
  let proteinMultiplier;
  if (goal === 'bulk') proteinMultiplier = 1.4;
  else if (goal === 'cut') proteinMultiplier = 1.8;
  else proteinMultiplier = 1.6;

  // Fats: Healthy range (around 1.15g per kg balances out nicely)
  const fatMultiplier = 1.15; 

  // We explicitly round the macros
  let protein_target = Math.round(weight_kg * proteinMultiplier);
  let fat_target = Math.round(weight_kg * fatMultiplier);
  
  // 5. Remaining calories for carbs (4 kcal/g for protein and carbs, 9 kcal/g for fats)
  const remainingCals = calorie_target - (protein_target * 4) - (fat_target * 9);
  let carb_target = Math.max(0, Math.round(remainingCals / 4));

  // If maintaining macros, we generally round the macros to nice whole 5s or 10s based on preference,
  // but exact integer values are perfectly functional.
  return {
    calories: calorie_target,
    protein: protein_target,
    carbs: carb_target,
    fats: fat_target
  };
};
