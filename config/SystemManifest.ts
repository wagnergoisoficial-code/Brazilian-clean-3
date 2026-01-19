
/**
 * BRAZILIAN CLEAN - SYSTEM MANIFEST
 * =================================
 * DOCUMENT OF TRUTH
 * 
 * This file defines the immutable identity and governance rules of the platform.
 * It serves as the single source of truth for versioning and architecture.
 */

export const SYSTEM_IDENTITY = {
  NAME: "Brazilian Clean",
  VERSION: "1.3.0-PROTECTED", // Incremented for Deployment Hardening
  LAST_STABLE_BUILD: "2023-10-27",
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  CONTACT_EMAIL: "admin@brazilianclean.com"
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
