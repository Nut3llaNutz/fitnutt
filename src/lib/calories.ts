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
  const calorie_target = goal === 'bulk' 
    ? Math.round(tdee + 300) 
    : Math.round(tdee - 500);

  // 4. Set Macro Ratios (Revised to be more realistic per user's request)
  // Standard fitness recommendations: 1.6 - 2.2 g/kg of protein
  const proteinMultiplier = goal === 'cut' ? 2.0 : 1.6;
  const fatMultiplier = 0.9; // Standard healthy fat intake

  const protein_target = Math.round(weight_kg * proteinMultiplier);
  const fat_target = Math.round(weight_kg * fatMultiplier);
  
  // 5. Remaining calories for carbs (4 kcal per gram)
  const remainingCals = calorie_target - (protein_target * 4) - (fat_target * 9);
  const carb_target = Math.max(0, Math.round(remainingCals / 4));

  return {
    calories: calorie_target,
    protein: protein_target,
    carbs: carb_target,
    fats: fat_target
  };
};
