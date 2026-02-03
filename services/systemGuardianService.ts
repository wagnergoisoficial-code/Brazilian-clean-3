
import { SYSTEM_IDENTITY, RECOVERY_PROTOCOL } from "../config/SystemManifest";

/**
 * SYSTEM GUARDIAN SERVICE
 * Responsible for:
 * 1. Automated Backups
 * 2. Data Integrity Checks
 * 3. Disaster Recovery
 * 4. Resource & Credit Metrics (New)
 */

const STORAGE_KEYS = ['bc_cleaners', 'bc_clients', 'bc_leads', 'bc_posts', 'bc_support'];

export interface SystemMetrics {
  aiCredits: {
    used: number;
    total: number;
    percentage: number;
  };
  apiRequests: {
    count: number;
    limit: number;
    percentage: number;
  };
  storage: {
    usage: string;
    integrity: boolean;
  };
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  lastBackup: string | null;
  version: string;
  dataIntegrity: boolean;
  issues: string[];
  metrics: SystemMetrics;
}

// 1. RESOURCE METRICS (Simulated for Admin Dashboard)
export const getSystemMetrics = (): SystemMetrics => {
  // In a real environment, this would fetch from a billing or monitoring API
  // Using deterministic simulation based on current date for UI consistency
  const dayOfMonth = new Date().getDate();
  const usedCredits = (dayOfMonth * 142) % 1000;
  const reqCount = (dayOfMonth * 890) % 5000;

  return {
    aiCredits: {
      used: usedCredits,
      total: 1000,
      percentage: (usedCredits / 1000) * 100
    },
    apiRequests: {
      count: reqCount,
      limit: 5000,
      percentage: (reqCount / 5000) * 100
    },
    storage: {
      usage: "1.2MB",
      integrity: true
    }
  };
};

// 2. AUTOMATED BACKUP
export const performAutoBackup = (): boolean => {
  try {
    const timestamp = new Date().toISOString();
    const backupData: Record<string, any> = {};

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

    localStorage.setItem(RECOVERY_PROTOCOL.DATA_PERSISTENCE_KEY, JSON.stringify(backupData));
    console.log(`[System Guardian] Backup secured at ${timestamp}`);
    return true;

  } catch (error) {
    console.error("[System Guardian] Backup Failed:", error);
    return false;
  }
};

// 3. INTEGRITY CHECK
export const checkSystemHealth = (): SystemHealth => {
  const issues: string[] = [];
  let isHealthy = true;

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

  const backup = localStorage.getItem(RECOVERY_PROTOCOL.DATA_PERSISTENCE_KEY);
  if (!backup) {
    issues.push("No Restore Point found.");
  }

  return {
    status: isHealthy ? 'HEALTHY' : 'CRITICAL',
    lastBackup: backup ? JSON.parse(backup)._meta.timestamp : null,
    version: SYSTEM_IDENTITY.VERSION,
    dataIntegrity: isHealthy,
    issues,
    metrics: getSystemMetrics()
  };
};

// 4. DISASTER RECOVERY (RESTORE)
export const restoreFromBackup = (): boolean => {
  try {
    const backupRaw = localStorage.getItem(RECOVERY_PROTOCOL.DATA_PERSISTENCE_KEY);
    if (!backupRaw) throw new Error("No backup available");

    const backup = JSON.parse(backupRaw);

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

export const factoryReset = () => {
  localStorage.clear();
  window.location.reload();
};
