import { SYSTEM_IDENTITY, RECOVERY_PROTOCOL } from "../config/SystemManifest";

/**
 * SYSTEM GUARDIAN SERVICE
 * Responsibilities:
 * - Automated Backups
 * - Data Integrity Validation
 * - Disaster Recovery
 * - Controlled Factory Reset
 */

/* ------------------------------------------------------------------
   SAFE ENVIRONMENT CHECKS
-------------------------------------------------------------------*/

const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

const safeGetItem = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
  } catch {}
};

/* ------------------------------------------------------------------
   CONSTANTS & TYPES
-------------------------------------------------------------------*/

const STORAGE_KEYS = ["bc_cleaners", "bc_clients", "bc_leads", "bc_posts", "bc_support"] as const;
const BACKUP_PREFIX = "bc_backup_";
const MAX_BACKUPS = 3;

interface SystemHealth {
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  lastBackup: string | null;
  version: string;
  dataIntegrity: boolean;
  issues: string[];
}

/* ------------------------------------------------------------------
   1. AUTOMATED BACKUP (ROTATIONAL)
-------------------------------------------------------------------*/

export const performAutoBackup = (): boolean => {
  if (!isBrowser) return false;

  try {
    const timestamp = new Date().toISOString();
    const backupPayload: Record<string, unknown> = {};

    STORAGE_KEYS.forEach(key => {
      const raw = safeGetItem(key);
      if (raw) {
        try {
          backupPayload[key] = JSON.parse(raw);
        } catch {
          backupPayload[key] = null;
        }
      }
    });

    backupPayload["_meta"] = {
      timestamp,
      version: SYSTEM_IDENTITY.VERSION,
      type: "AUTO"
    };

    const backupKey = `${BACKUP_PREFIX}${timestamp}`;
    safeSetItem(backupKey, JSON.stringify(backupPayload));

    // Maintain rotational backups
    const existingBackups = Object.keys(localStorage)
      .filter(k => k.startsWith(BACKUP_PREFIX))
      .sort();

    while (existingBackups.length > MAX_BACKUPS) {
      const oldest = existingBackups.shift();
      if (oldest) localStorage.removeItem(oldest);
    }

    // Store latest pointer
    safeSetItem(RECOVERY_PROTOCOL.DATA_PERSISTENCE_KEY, backupKey);

    return true;
  } catch {
    return false;
  }
};

/* ------------------------------------------------------------------
   2. SYSTEM HEALTH CHECK
-------------------------------------------------------------------*/

export const checkSystemHealth = (): SystemHealth => {
  const issues: string[] = [];
  let corruptedData = false;

  STORAGE_KEYS.forEach(key => {
    const raw = safeGetItem(key);
    if (!raw) return;

    try {
      JSON.parse(raw);
    } catch {
      corruptedData = true;
      issues.push(`Corrupted data detected in "${key}"`);
    }
  });

  const latestBackupKey = safeGetItem(RECOVERY_PROTOCOL.DATA_PERSISTENCE_KEY);
  let lastBackupTimestamp: string | null = null;

  if (latestBackupKey) {
    const backupRaw = safeGetItem(latestBackupKey);
    if (backupRaw) {
      try {
        const parsed = JSON.parse(backupRaw);
        lastBackupTimestamp = parsed?._meta?.timestamp ?? null;
      } catch {
        issues.push("Latest backup is corrupted.");
      }
    }
  } else {
    issues.push("No backup reference found.");
  }

  let status: SystemHealth["status"] = "HEALTHY";
  if (corruptedData && lastBackupTimestamp) status = "DEGRADED";
  if (corruptedData && !lastBackupTimestamp) status = "CRITICAL";

  return {
    status,
    lastBackup: lastBackupTimestamp,
    version: SYSTEM_IDENTITY.VERSION,
    dataIntegrity: !corruptedData,
    issues
  };
};

/* ------------------------------------------------------------------
   3. DISASTER RECOVERY
-------------------------------------------------------------------*/

export const restoreFromBackup = (): boolean => {
  if (!isBrowser) return false;

  try {
    const latestBackupKey = safeGetItem(RECOVERY_PROTOCOL.DATA_PERSISTENCE_KEY);
    if (!latestBackupKey) throw new Error("No backup pointer");

    const backupRaw = safeGetItem(latestBackupKey);
    if (!backupRaw) throw new Error("Backup not found");

    const backup = JSON.parse(backupRaw);

    STORAGE_KEYS.forEach(key => {
      if (backup[key] !== undefined) {
        safeSetItem(key, JSON.stringify(backup[key]));
      }
    });

    return true;
  } catch {
    return false;
  }
};

/* ------------------------------------------------------------------
   4. FACTORY RESET (GUARDED)
-------------------------------------------------------------------*/

export const factoryReset = (confirmToken: string): boolean => {
  if (!isBrowser) return false;

  // Simple protection to avoid accidental calls
  if (confirmToken !== SYSTEM_IDENTITY.ID) {
    console.warn("[System Guardian] Factory reset blocked: invalid token.");
    return false;
  }

  localStorage.clear();
  window.location.reload();
  return true;
};
