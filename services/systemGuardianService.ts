
import { SYSTEM_IDENTITY, RECOVERY_PROTOCOL } from "../config/SystemManifest";

/**
 * SYSTEM GUARDIAN SERVICE
 * Responsible for:
 * 1. Automated Backups
 * 2. Data Integrity Checks
 * 3. Disaster Recovery
 */

const STORAGE_KEYS = ['bc_cleaners', 'bc_clients', 'bc_leads', 'bc_posts', 'bc_support'];
const BACKUP_PREFIX = 'bc_backup_';

interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  lastBackup: string | null;
  version: string;
  dataIntegrity: boolean;
  issues: string[];
}

// 1. AUTOMATED BACKUP
export const performAutoBackup = (): boolean => {
  try {
    const timestamp = new Date().toISOString();
    const backupData: Record<string, any> = {};

    // Collect all critical data
    STORAGE_KEYS.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        backupData[key] = JSON.parse(data);
      }
    });

    backupData['_meta'] = {
      timestamp,
      version: SYSTEM_IDENTITY.VERSION,
      type: 'AUTO'
    };

    // Save to backup slot (Rotational strategy: keep last 3)
    // For simplicity in this env, we keep one Master Backup
    localStorage.setItem(RECOVERY_PROTOCOL.DATA_PERSISTENCE_KEY, JSON.stringify(backupData));
    console.log(`[System Guardian] Backup secured at ${timestamp}`);
    return true;

  } catch (error) {
    console.error("[System Guardian] Backup Failed:", error);
    return false;
  }
};

// 2. INTEGRITY CHECK
export const checkSystemHealth = (): SystemHealth => {
  const issues: string[] = [];
  let isHealthy = true;

  // Check if critical data is parseable
  STORAGE_KEYS.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        JSON.parse(data);
      } catch (e) {
        isHealthy = false;
        issues.push(`Corrupted Data detected in ${key}`);
      }
    }
  });

  // Check Backup Existence
  const backup = localStorage.getItem(RECOVERY_PROTOCOL.DATA_PERSISTENCE_KEY);
  if (!backup) {
    issues.push("No Restore Point found.");
  }

  return {
    status: isHealthy ? 'HEALTHY' : 'CRITICAL',
    lastBackup: backup ? JSON.parse(backup)._meta.timestamp : null,
    version: SYSTEM_IDENTITY.VERSION,
    dataIntegrity: isHealthy,
    issues
  };
};

// 3. DISASTER RECOVERY (RESTORE)
export const restoreFromBackup = (): boolean => {
  try {
    const backupRaw = localStorage.getItem(RECOVERY_PROTOCOL.DATA_PERSISTENCE_KEY);
    if (!backupRaw) throw new Error("No backup available");

    const backup = JSON.parse(backupRaw);

    // Restore keys
    STORAGE_KEYS.forEach(key => {
      if (backup[key]) {
        localStorage.setItem(key, JSON.stringify(backup[key]));
      }
    });

    console.log("[System Guardian] System Restored successfully.");
    return true;
  } catch (error) {
    console.error("[System Guardian] Restore Failed:", error);
    return false;
  }
};

// 4. FACTORY RESET (NUCLEAR OPTION)
export const factoryReset = () => {
  console.warn("[System Guardian] Initiating Factory Reset...");
  localStorage.clear();
  window.location.reload();
};
