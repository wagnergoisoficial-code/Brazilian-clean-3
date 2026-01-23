import { GoogleGenAI } from "@google/genai";
import { CleanerProfile, UserRole } from "../types";

// STATIC KNOWLEDGE BASE - The AI's "Source of Truth" about the app structure
const PORTAL_KNOWLEDGE = `
[SYSTEM KNOWLEDGE BASE - BRAZILIAN CLEAN]

1. NAVIGATION & STRUCTURE
Navbar links to Find a Cleaner, For Cleaners, Dashboard, Admin and Support.
Home page has ZIP Code search and Express Match.
Cleaner Search allows browsing verified cleaners with filters.
Registration is a 3-step onboarding.
Cleaner Dashboard shows status, billing and leads.
Support is available for clients and cleaners.
Admin Dashboard manages approvals, tickets and discounts.

2. KEY PROCESSES
Pricing:
American clients are free.
Brazilian cleaners pay subscription.
First 2 months: 180 USD.
After: 260 USD.

Express Match:
Clients create service requests.
Leads are broadcast to verified cleaners.

Verification:
Admin approval required.

3. MERIT SYSTEM
Bronze: 0–299
Silver: 300–699
Gold: 700+
Levels update automatically.

4. TROUBLESHOOTING
Unverified cleaners are hidden.
Pending requires admin approval.
Payment required blocks leads.
`;

/**
 * generateBrianResponse
 * Handles communication with Luna (AI)
 */
export const generateBrianResponse = async (
  history: { role: string; text: string }[],
  userRole: UserRole,
  pageContext: string,
  cleanerData?: CleanerProfile[]
): Promise<string> => {

  // ✅ FIXED: Correct way to read env variable in Vite + Netlify
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY not found. Check Netlify environment variables.");
    return userRole === UserRole.CLIENT
      ? "I am currently offline due to a system configuration issue. Please contact support."
      : "Estou offline devido a um problema de configuração. Por favor, contate o suporte.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const verifiedCleaners = cleanerData?.filter(c => c.status === "VERIFIED") || [];
  const pendingCleaners = cleanerData?.filter(c => c.status === "PENDING") || [];

  const dynamicContext = `
User Role: ${userRole}
Current Page: ${pageContext}
Verified Cleaners Available: ${verifiedCleaners.length}
Pending Applications: ${pendingCleaners.length}
Total Database: ${cleanerData?.length || 0}
`;

  const systemInstruction = `
You are LUNA, the platform intelligence for Brazilian Clean.

Rules:
Plain text only.
No emojis.
No markdown.
Professional tone.

Knowledge:
${PORTAL_KNOWLEDGE}

Context:
${dynamicContext}

Mission:
Provide accurate guidance.
Explain pricing and merit system when needed.
Maintain professional assistant behavior.
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
      throw new Error("Empty response from AI model.");
    }

    return response.text;

  } catch (error) {
    console.error("Luna AI error:", error);
    return userRole === UserRole.CLIENT
      ? "I am currently calibrating my systems. Please proceed to the support page if you need assistance."
      : "Estou calibrando meus sistemas. Por favor, utilize a página de suporte se precisar de ajuda.";
  }
};
