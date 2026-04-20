interface PrescribedMedication {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

// Base de données des dosages maximums par substance active (en mg/jour)
const MAX_DAILY_DOSES: Record<string, number> = {
  // Antalgiques
  "paracétamol": 3000,
  "ibuprofène": 1200,
  "aspirine": 3000,
  
  // Antibiotiques
  "amoxicilline": 3000,
  "azithromycine": 500,
  "ciprofloxacine": 1500,
  
  // Autres
  "salbutamol": 32,
  "oméprazole": 40,
};

// Base de données des interactions médicamenteuses dangereuses
const DANGEROUS_INTERACTIONS: Record<string, string[]> = {
  "paracétamol": ["alcool"],
  "ibuprofène": ["aspirine", "anticoagulant"],
  "amoxicilline": ["méthotrexate"],
};

// Interface pour le résultat de vérification
export interface DosageCheckResult {
  isValid: boolean;
  dailyDoseMg: number;
  maxDoseMg: number;
  percentage: number;
  severity: "safe" | "warning" | "danger";
  message: string;
}

/**
 * Extrait le nom de la substance active du nom commercial
 */
function extractActiveSubstance(medicineName: string): string {
  const normalizedName = medicineName.toLowerCase();
  
  const mapping: Record<string, string> = {
    "doliprane": "paracétamol",
    "efferalgan": "paracétamol",
    "dafalgan": "paracétamol",
    "paracétamol": "paracétamol",
    
    "advil": "ibuprofène",
    "nurofen": "ibuprofène",
    "ibuprofène": "ibuprofène",
    
    "amoxicilline": "amoxicilline",
    "clamoxyl": "amoxicilline",
    
    "ventoline": "salbutamol",
    "salbutamol": "salbutamol",
    
    "aspirine": "aspirine",
    "aspégic": "aspirine",
  };
  
  for (const [commercial, active] of Object.entries(mapping)) {
    if (normalizedName.includes(commercial)) {
      return active;
    }
  }
  
  return normalizedName;
}

/**
 * Extrait la dose en milligrammes
 */
function extractDoseMg(dosageStr: string): number {
  const normalized = dosageStr.toLowerCase().trim();
  
  const numberMatch = normalized.match(/(\d+\.?\d*)/);
  if (!numberMatch) return 0;
  
  const value = parseFloat(numberMatch[1]);
  
  if (normalized.includes("g") && !normalized.includes("mg") && !normalized.includes("µg")) {
    return value * 1000;
  } else if (normalized.includes("µg")) {
    return value / 1000;
  } else {
    return value;
  }
}

/**
 * Extrait le nombre de prises par jour
 */
function extractTimesPerDay(frequency: string): number {
  const normalized = frequency.toLowerCase();
  
  const patterns = [
    { regex: /(\d+)\s*x\s*par\s*jour/, multiplier: 1 },
    { regex: /(\d+)\s*fois\s*par\s*jour/, multiplier: 1 },
    { regex: /toutes\s*les\s*(\d+)\s*heures/, multiplier: (n: number) => 24 / n },
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      const value = parseInt(match[1]);
      return typeof pattern.multiplier === 'function' 
        ? pattern.multiplier(value) 
        : value * pattern.multiplier;
    }
  }
  
  if (normalized.includes("matin et soir") || normalized.includes("matin soir")) {
    return 2;
  }
  if (normalized.includes("matin midi et soir") || normalized.includes("3 fois")) {
    return 3;
  }
  if (normalized.includes("si besoin") || normalized.includes("en cas de")) {
    return 1;
  }
  
  return 1;
}

/**
 * Vérifie si un dosage est sûr
 */
export function checkDosage(medication: PrescribedMedication): DosageCheckResult {
  const activeSubstance = extractActiveSubstance(medication.medicineName);
  const maxDoseMg = MAX_DAILY_DOSES[activeSubstance];
  
  if (!maxDoseMg) {
    return {
      isValid: true,
      dailyDoseMg: 0,
      maxDoseMg: 0,
      percentage: 0,
      severity: "safe",
      message: "Substance inconnue - Vérification manuelle requise",
    };
  }
  
  const dosePerTakeMg = extractDoseMg(medication.dosage);
  const timesPerDay = extractTimesPerDay(medication.frequency);
  const dailyDoseMg = dosePerTakeMg * timesPerDay;
  const percentage = (dailyDoseMg / maxDoseMg) * 100;
  
  let severity: "safe" | "warning" | "danger";
  let message: string;
  let isValid: boolean;
  
  if (percentage <= 80) {
    severity = "safe";
    message = `✓ Dosage correct : ${dailyDoseMg}mg/jour (max ${maxDoseMg}mg)`;
    isValid = true;
  } else if (percentage <= 100) {
    severity = "warning";
    message = `⚠️ Attention : proche du maximum (${percentage.toFixed(0)}% du max)`;
    isValid = true;
  } else {
    severity = "danger";
    message = `❌ SURDOSAGE : ${dailyDoseMg}mg/jour dépasse le max de ${maxDoseMg}mg (${percentage.toFixed(0)}%)`;
    isValid = false;
  }
  
  return {
    isValid,
    dailyDoseMg,
    maxDoseMg,
    percentage,
    severity,
    message,
  };
}