
/**
 * BRAZILIAN CLEAN - SYSTEM MANIFEST
 * =================================
 * DOCUMENT OF TRUTH
 * 
 * This file defines the immutable identity and governance rules of the platform.
 * It serves as the single source of truth for versioning and architecture.
 */

// Safe Runtime Environment Detection
const detectEnvironment = (): boolean => {
  // 1. Safety check for SSR or non-browser environments (force Studio Mode)
  if (typeof window === 'undefined') return true;

  const hostname = window.location.hostname;

  // 2. Production Hostname Whitelist
  // Checks for main domain, www subdomain, and any Netlify preview/production URL
  const isProductionDomain = 
    hostname.endsWith('netlify.app') || 
    hostname === 'brazilianclean.com' || 
    hostname === 'www.brazilianclean.com';

  // 3. Build-time injected flags (if available via bundler)
  // We use loose check to avoid crashing if process is undefined
  const isNetlifyEnv = typeof process !== 'undefined' && process.env && process.env.NETLIFY === 'true';

  const isProduction = isProductionDomain || isNetlifyEnv;

  // Default to Studio Mode (Safe Mode) unless explicitly in Production
  // This ensures Google AI Studio / Localhost always run in Mock Mode.
  return !isProduction;
};

export const SYSTEM_IDENTITY = {
  NAME: "Brazilian Clean",
  VERSION: "1.3.2-GUARD", // Incremented for Environment Switch Blindage
  LAST_STABLE_BUILD: "2023-10-27",
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  CONTACT_EMAIL: "admin@brazilianclean.com",
  // AUTO-SWITCH: True in Dev/Studio, False in Production
  IS_STUDIO_MODE: detectEnvironment()
};

export const CORE_RULES = [
  "1. The platform must always be recoverable.",
  "2. Payments must follow the $180/$260 logic rigidly.",
  "3. Verification is mandatory for cleaner visibility.",
  "4. No white screens allowed; fail gracefully.",
  "5. Data must be backed up locally before critical operations.",
  "6. No deployment allowed without passing Deploy Guard."
];

export const FEATURE_FLAGS = {
  ENABLE_PAYMENTS: true,
  ENABLE_AI_LUNA: true,
  ENABLE_EXPRESS_MATCH: true,
  ENABLE_AUTO_BACKUP: true,
  ENABLE_DEPLOY_GUARD: true
};

export const RECOVERY_PROTOCOL = {
  MAX_RETRIES: 3,
  FALLBACK_MODE: "SAFE_MODE",
  DATA_PERSISTENCE_KEY: "bc_master_backup"
};
