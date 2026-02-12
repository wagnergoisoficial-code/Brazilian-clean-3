
import { storageService } from "./storageService";
import { meritService } from "./meritService";
import { mockPaymentService } from "./mockPaymentService";
import { locationService } from "./locationService";
import { LeadStatus } from "../types";

export type LeadEvent =
  | "CREATE"
  | "VERIFY_EMAIL"
  | "START_MATCHING"
  | "UNLOCK"
  | "SEND_QUOTE"
  | "ACCEPT_QUOTE"
  | "MARK_COMPLETED"
  | "EXPIRE"
  | "REFUND";

/**
 * LEAD LIFECYCLE ENGINE
 * Sole Authority for Market State Transitions.
 */
class LeadLifecycleEngine {
  
  private log(leadId: string, event: LeadEvent, from: string, to: string) {
    console.info(`[Engine Audit] Lead:${leadId} | Event:${event} | ${from} -> ${to} | TS:${Date.now()}`);
  }

  async transition(leadId: string, event: LeadEvent, payload?: any) {
    const lead = await storageService.getLead(leadId);
    if (!lead) throw new Error("Lead not found");

    const previousStatus = lead.status;

    switch (event) {
      case "CREATE":
        lead.status = LeadStatus.VERIFYING;
        await storageService.updateLead(lead);
        break;

      case "VERIFY_EMAIL":
        if (lead.status !== LeadStatus.VERIFYING) throw new Error(`Illegal move from ${lead.status}`);
        lead.status = LeadStatus.VERIFIED;
        await storageService.updateLead(lead);
        await this.startMatching(lead);
        break;

      case "UNLOCK":
        // Security Rule: Pro must be in the broadcast list
        if (!lead.broadcastToIds?.includes(payload.proId)) {
          throw new Error("Professional not authorized for this lead yet.");
        }

        // State Guard: Only available in Waves or Open pool
        if (![LeadStatus.WAVE_1, LeadStatus.WAVE_2, LeadStatus.OPEN].includes(lead.status)) {
          throw new Error("Lead is no longer available for unlock.");
        }

        // Logic Authority: Process Payment -> Register Unlock -> Update Status
        await mockPaymentService.charge(payload.proId, lead.leadCost);
        await storageService.markUnlocked(leadId, payload.proId);

        lead.status = LeadStatus.UNLOCKED;
        await storageService.updateLead(lead);
        
        // Side Effect Authority: Ensure ChatRoom exists (Logic moved from AppContext)
        await this.initializeCommunication(leadId, payload.proId);
        break;

      case "SEND_QUOTE":
        if (![LeadStatus.UNLOCKED, LeadStatus.QUOTED].includes(lead.status)) {
           throw new Error("Cannot quote in current state.");
        }
        lead.status = LeadStatus.QUOTED;
        await storageService.updateLead(lead);
        break;

      case "ACCEPT_QUOTE":
        if (lead.status !== LeadStatus.QUOTED) throw new Error("No active quotes to accept.");
        lead.status = LeadStatus.ACCEPTED;
        await storageService.updateLead(lead);
        break;

      case "MARK_COMPLETED":
        if (lead.status !== LeadStatus.ACCEPTED) throw new Error("Job must be accepted before completion.");
        lead.status = LeadStatus.COMPLETED;
        lead.completedAt = Date.now();
        await storageService.updateLead(lead);
        break;

      default:
        throw new Error(`Engine does not support event: ${event}`);
    }

    this.log(leadId, event, previousStatus, lead.status);
  }

  private async startMatching(lead: any) {
    lead.status = LeadStatus.MATCHING;
    await storageService.updateLead(lead);

    const eligiblePros = await this.getEligiblePros(lead);
    const wave1 = eligiblePros.slice(0, 2);
    const wave2 = eligiblePros.slice(2, 4);

    await storageService.notifyPros(lead.id, wave1);
    lead.status = LeadStatus.WAVE_1;
    await storageService.updateLead(lead);

    // Persistence-safe timer simulated via AppContext background job or storage triggers
    // But for MVP, we keep the engine's delayed authority:
    setTimeout(async () => {
      const currentLead = await storageService.getLead(lead.id);
      if (currentLead && currentLead.status === LeadStatus.WAVE_1) {
        const unlockedCount = await storageService.getUnlockCount(lead.id);
        if (unlockedCount < 2) {
          await storageService.notifyPros(lead.id, wave2);
          currentLead.status = LeadStatus.WAVE_2;
          await storageService.updateLead(currentLead);
        }
      }
    }, 30 * 60 * 1000); 
  }

  private async initializeCommunication(leadId: string, proId: string) {
    const roomsRaw = localStorage.getItem('bc_chat_rooms');
    const rooms = roomsRaw ? JSON.parse(roomsRaw) : [];
    const lead = await storageService.getLead(leadId);
    
    if (lead && !rooms.find((r: any) => r.leadId === leadId && r.cleanerId === proId)) {
        rooms.push({
            id: Math.random().toString(36).substr(2, 9),
            leadId,
            clientId: lead.clientEmail,
            cleanerId: proId,
            createdAt: Date.now()
        });
        localStorage.setItem('bc_chat_rooms', JSON.stringify(rooms));
    }
  }

  private async getEligiblePros(lead: any) {
    const pros = await storageService.getActivePros();
    const filtered = pros.filter((pro: any) =>
      locationService.isWithinRadius(pro, lead.zipCode)
    );

    const ranked = filtered.sort((a: any, b: any) => {
      const scoreA = meritService.calculateScore(a);
      const scoreB = meritService.calculateScore(b);
      return scoreB - scoreA;
    });

    return ranked.slice(0, 4);
  }
}

export const leadLifecycleEngine = new LeadLifecycleEngine();
