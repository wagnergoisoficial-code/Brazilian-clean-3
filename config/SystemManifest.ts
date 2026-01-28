/**
 * BRAZILIAN CLEAN - SYSTEM MANIFEST
 * =================================
 * DOCUMENT OF TRUTH
 * 
 * This file defines the immutable identity and governance rules of the platform.
 */

const detectEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;

  // Production Hostname Whitelist
  const isProductionDomain = 
    hostname === 'brazilianclean.org' || 
    hostname === 'www.brazilianclean.org' ||
    hostname.endsWith('netlify.app');

  // Strict production check: if we are on a production domain, we are NEVER in studio mode.
  if (isProductionDomain) return false;

  // Localhost/Preview check
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

export const SYSTEM_IDENTITY = {
  NAME: "Brazilian Clean",
  VERSION: "2.1.0-PROD",
  LAST_STABLE_BUILD: "2024-05-21",
  ENVIRONMENT: process.env.NODE_ENV || 'production',
  CONTACT_EMAIL: "support@brazilianclean.org",
  // REAL MODE: Forces production behavior
  IS_STUDIO_MODE: detectEnvironment()
};

/**
 * Added RECOVERY_PROTOCOL to define keys for system persistence and recovery.
 */
export const RECOVERY_PROTOCOL = {
  DATA_PERSISTENCE_KEY: 'bc_recovery_master_store'
};

export const CORE_RULES = [
  "1. The platform must always be recoverable.",
  "2. Payments follow the $180/$260 logic rigidly.",
  "3. Real email verification is mandatory.",
  "4. Graceful failure on third-party API issues.",
  "5. No hardcoded credentials or verification bypasses."
];