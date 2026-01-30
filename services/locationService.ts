
/**
 * BRAZILIAN CLEAN - LOCATION ENGINE
 * =================================
 * Handles ZIP code matching and distance heuristics.
 */

// Heuristic: ZIP codes with same prefix are often within a certain radius.
// Real production would use a coordinate database or Google Distance Matrix API.
export const isZipInRange = (clientZip: string, cleanerBaseZip: string, radiusMiles: number): boolean => {
  const cz = clientZip.trim().substring(0, 5);
  const bz = cleanerBaseZip.trim().substring(0, 5);

  if (cz === bz) return true;

  // Prefix matching as a smart fallback for frontend demo
  // Same first 3 digits: roughly same county/region (usually 10-15 miles)
  const czPrefix = cz.substring(0, 3);
  const bzPrefix = bz.substring(0, 3);

  if (czPrefix === bzPrefix) {
    // If they share 3 digits, we consider them within 15 miles
    return radiusMiles >= 15;
  }

  // Same first 2 digits: roughly same area of state (usually 25+ miles)
  const czWidePrefix = cz.substring(0, 2);
  const bzWidePrefix = bz.substring(0, 2);
  if (czWidePrefix === bzWidePrefix) {
    return radiusMiles >= 25;
  }

  return false;
};

export const canCleanerServeZip = (cleaner: { 
  baseZip: string, 
  serviceRadius: number, 
  zipCodes: string[] 
}, targetZip: string): boolean => {
  const cz = targetZip.trim().substring(0, 5);
  
  // 1. Check manual list
  if (cleaner.zipCodes.includes(cz)) return true;

  // 2. Check radius from base ZIP
  if (cleaner.baseZip) {
    return isZipInRange(cz, cleaner.baseZip, cleaner.serviceRadius);
  }

  return false;
};
