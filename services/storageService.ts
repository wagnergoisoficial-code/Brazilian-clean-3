
import { Lead, CleanerProfile, LeadStatus, CleanerStatus } from '../types';

/**
 * Mock Storage Service
 * ---------------------
 * Authority: Data Persistence Layer.
 * Rule: This layer MUST NOT decide status transitions.
 */

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

export const uploadDocument = (base64Data: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        if (!base64Data) {
          throw new Error("Cannot upload empty data.");
        }
        const blob = base64ToBlob(base64Data);
        const url = URL.createObjectURL(blob);
        resolve(url);
      } catch (error) {
        reject(new Error("File processing failed. Please try again."));
      }
    }, 1200);
  });
};

export const cleanupStorageUrl = (url: string) => {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};

const getItems = (key: string) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const setItems = (key: string, items: any[]) => {
  localStorage.setItem(key, JSON.stringify(items));
};

export const storageService = {
  getLead: async (id: string): Promise<Lead | undefined> => {
    const leads = getItems('bc_leads');
    return leads.find((l: Lead) => l.id === id);
  },
  
  updateLead: async (lead: Lead): Promise<void> => {
    const leads = getItems('bc_leads');
    const index = leads.findIndex((l: Lead) => l.id === lead.id);
    if (index !== -1) {
      leads[index] = lead;
    } else {
      leads.push(lead);
    }
    setItems('bc_leads', leads);
    window.dispatchEvent(new CustomEvent('bc_storage_update', { detail: { type: 'leads' } }));
  },

  // Authority Fix: This function ONLY handles ID assignment now.
  markUnlocked: async (leadId: string, proId: string): Promise<void> => {
    const lead = await storageService.getLead(leadId);
    if (lead && !lead.unlockedBy.includes(proId)) {
      lead.unlockedBy.push(proId);
      await storageService.updateLead(lead);
    }
  },

  getUnlockCount: async (leadId: string): Promise<number> => {
    const lead = await storageService.getLead(leadId);
    return lead ? lead.unlockedBy.length : 0;
  },

  getActivePros: async (): Promise<CleanerProfile[]> => {
    const cleaners = getItems('bc_cleaners');
    return cleaners.filter((c: CleanerProfile) => c.status === CleanerStatus.ACTIVE && c.isAvailable);
  },

  notifyPros: async (leadId: string, pros: CleanerProfile[]): Promise<void> => {
    const lead = await storageService.getLead(leadId);
    if (!lead) return;
    
    const existingBroadCast = lead.broadcastToIds || [];
    const newIds = pros.map(p => p.id);
    lead.broadcastToIds = Array.from(new Set([...existingBroadCast, ...newIds]));
    
    await storageService.updateLead(lead);
  }
};
