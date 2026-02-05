
export const normalizeZip = (zip: string): string => {
  const digits = zip.trim().replace(/\D/g, '');
  return digits.padStart(5, '0').substring(0, 5);
};

export const isZipInRange = (clientZip: string, cleanerBaseZip: string, radiusMiles: number): boolean => {
  const cz = normalizeZip(clientZip);
  const bz = normalizeZip(cleanerBaseZip);

  if (cz === bz) return true;

  // Simple heuristic: Same prefix (first 3 digits) usually implies proximity (10-15 miles)
  const czPrefix = cz.substring(0, 3);
  const bzPrefix = bz.substring(0, 3);

  if (czPrefix === bzPrefix) {
    return radiusMiles >= 15;
  }

  // Wider heuristic: Same region (first 2 digits) implies larger radius (25+ miles)
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
  const cz = normalizeZip(targetZip);
  
  // 1. Check manual list
  const normalizedManualZips = (cleaner.zipCodes || []).map(normalizeZip);
  if (normalizedManualZips.includes(cz)) return true;

  // 2. Check radius
  if (cleaner.baseZip) {
    return isZipInRange(cz, cleaner.baseZip, cleaner.serviceRadius);
  }

  return false;
};
