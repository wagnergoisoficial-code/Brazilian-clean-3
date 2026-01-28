/**
 * BRAZILIAN CLEAN - SYSTEM MANIFEST
 * =================================
 * DOCUMENT OF TRUTH
 * 
 * This file defines the immutable identity and governance rules of the platform.
 * Aligned with Netlify Production Environment variables.
 */

export const SYSTEM_IDENTITY = {
  NAME: "Brazilian Clean",
  VERSION: "2.2.0-PROD",
  LAST_STABLE_BUILD: "2024-05-22",
  // Standard environment detection using process.env
  ENVIRONMENT: process.env.NODE_ENV || 'production',
  CONTACT_EMAIL: "support@brazilianclean.org",
  // Strictly production if NODE_ENV is set to 'production'
  IS_PRODUCTION: process.env.NODE_ENV === 'production'
};

/**
 * RECOVERY_PROTOCOL defines keys for system persistence and recovery.
 */
export const RECOVERY_PROTOCOL = {
  DATA_PERSISTENCE_KEY: 'bc_recovery_master_store'
};

export const CORE_RULES = [
  "1. The platform must always be recoverable.",
  "2. Payments follow the $180/$260 logic rigidly.",
  "3. Real email verification is mandatory in production.",
  "4. Graceful failure on third-party API issues.",
  "5. No hardcoded credentials or verification bypasses."
];