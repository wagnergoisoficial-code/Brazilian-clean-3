import { GoogleGenAI } from "@google/genai";
import { CleanerProfile, UserRole } from "../types";

// STATIC KNOWLEDGE BASE - The AI's "Source of Truth" about the app structure
const PORTAL_KNOWLEDGE = `
[SYSTEM KNOWLEDGE BASE - BRAZILIAN CLEAN]

1. NAVIGATION & STRUCTURE
Navbar: Links to Find a Cleaner, For Cleaners, Dashboard, Admin and Support.
Home Page (/): ZIP Code search and Express Match.
Cleaner Search (/search): Browse verified cleaners with filters.
Registration (/join): 3-step professional onboarding.
Cleaner Dashboard (/dashboard): Status, billing, stats and leads inbox.
Support (/support): Client form and Cleaner WhatsApp support.
Admin Dashboard (/admin): Approvals, support tickets and discounts.

2. KEY PROCESSES
Pricing & Subscription:
American Clients: Free.
Brazilian Cleaners: Paid subscription.
First 2 months: 180 USD.
After: 260 USD.
Payment required to receive leads.

Express Match:
4-step client wizard.
Broadcasts leads to verified cleaners by ZIP.

Verification:
Manual admin approval.

Support Flow:
Clients via form.
Cleaners via WhatsApp.

3. MERIT SYSTEM & LEVELS
Bronze: 0–299
Silver: 300–699
Gold: 700+
Automatic upgrades and downgrades based on points.

4. TROUBLESHOOTING
Unverified cleaners are hidden.
Pending requires admin approval.
Payment Required blocks leads.
`;

/**
 * generateBrianResponse
 * This service manages the communication with Luna (the system AI).
 */
export const generateBrianResponse = async (
  history: { role: string; text: string }[],
  userRole: UserRole,
  pageContext: string,
  cleanerData?: CleanerProfile[]
): Promise<string> => {

  // ✅ CORRECT FOR VITE + NETLIFY
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY not found. Check Netlify Environment Variables.");
    if (userRole === UserRole.CLIENT) {
      return "I am currently offline due to a system configuration issue. Please contact support.";
    } else {
      return "Estou offline devido a um problema de configuração. Por favor, contate o suporte.";
    }
  }

  const ai = new GoogleGenAI({ apiKey });

  const verifiedCleaners = cleanerData?.filter(c => c.status === "VERIFIED") || [];
  const pendingCleaners = cleanerData?.filter(c => c.status === "PENDING") || [];

  const dynamicContext = `
[CURRENT LIVE DATA]
User Role: ${userRole}
Current Page: ${pageContext}
Verified Cleaners Available: ${verifiedCleaners.length}
Pending Applications: ${pendingCleaners.length}
Total Database: ${cleanerData?.length || 0}
`;

  const systemInstruction = `
You are LUNA, the Platform Intelligence for Brazilian Clean.

Identity:
Name: Luna.
Age: 28.
Gender: Female.
Persona: Intelligent, objective, professional.

Communication Rules:
Plain text only.
No emojis.
No markdown.
No lists.
Professional tone.

Knowledge Base:
${PORTAL_KNOWLEDGE}

Context:
${dynamicContext}

Mission:
Provide accurate assistance.
Guide users correctly.
Explain pricing and merit system when needed.
Maintain executive assistant persona.
`;

  try {
    const contents = history.map(msg => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });

    if (!response.text) {
      throw new Error("Empty response received from AI model.");
    }

    return response.text;

  } catch (error) {
    console.error("Luna AI Service Error:", error);
    if (userRole === UserRole.CLIENT) {
      return "I am currently calibrating my systems. Please proceed to the support page if you need assistance.";
    } else {
      return "Estou calibrando meus sistemas. Por favor, utilize a página de suporte se precisar de ajuda.";
    }
  }
};
