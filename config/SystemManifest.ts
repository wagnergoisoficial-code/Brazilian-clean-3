

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

  // If we are on a production domain, we MUST be in production mode
  if (isProductionDomain) return false;

  // Otherwise, default to the NODE_ENV check
  return process.env.NODE_ENV !== 'production';
};

export const SYSTEM_IDENTITY = {
  NAME: "Brazilian Clean",
  VERSION: "2.0.0-PROD",
  LAST_STABLE_BUILD: "2024-05-20",
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  CONTACT_EMAIL: "support@brazilianclean.org",
  // REAL MODE: Forces production behavior on deployment
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
  "4. Graceful failure on third-party API issues."
];
