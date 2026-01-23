import { GoogleGenAI } from "@google/genai";
import { CleanerProfile, UserRole } from "../types";

// STATIC KNOWLEDGE BASE - The AI's "Source of Truth" about the app structure
const PORTAL_KNOWLEDGE = `
[SYSTEM KNOWLEDGE BASE - BRAZILIAN CLEAN]

1. NAVIGATION & STRUCTURE
The platform includes Home, Search, Cleaner Registration, Dashboards, Express Match, Support and Admin areas.

2. KEY PROCESSES
American clients use the platform for free. Brazilian cleaners must subscribe to receive leads.
The first two months cost 180 USD per month. From the third month onward the cost is 260 USD per month.

3. VERIFICATION & MERIT
Cleaners must be verified by Admins.
Merit levels are Bronze, Silver and Gold and update automatically based on performance.

4. SUPPORT
Clients and cleaners can contact support through the Support page.
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

  // ✅ CORRECT WAY FOR VITE FRONTEND
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY not found. Check Netlify environment variables.");

    if (userRole === UserRole.CLIENT) {
      return "I am currently offline due to a system configuration issue. Please contact support.";
    } else {
      return "Estou offline devido a um problema na configuração do sistema. Por favor, contate o suporte.";
    }
  }

  const ai = new GoogleGenAI({ apiKey });

  const verifiedCleaners = cleanerData?.filter(c => c.status === "VERIFIED") || [];
  const pendingCleaners = cleanerData?.filter(c => c.status === "PENDING") || [];

  const dynamicContext = `
CURRENT LIVE DATA
User Role: ${userRole}
Current Page: ${pageContext}
Verified Cleaners: ${verifiedCleaners.length}
Pending Cleaners: ${pendingCleaners.length}
Total Cleaners: ${cleanerData?.length || 0}
`;

  const systemInstruction = `
You are Luna, the Platform Intelligence for Brazilian Clean.

You are professional, objective and efficient.
You answer clearly and politely.
You adapt language depending on whether the user is an American client or a Brazilian cleaner.

Knowledge Base:
${PORTAL_KNOWLEDGE}

Context:
${dynamicContext}
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

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini.");
    }

    return text;

  } catch (error) {
    console.error("Luna AI error:", error);

    if (userRole === UserRole.CLIENT) {
      return "I am calibrating my systems. Please contact support if you need help.";
    } else {
      return "Estou calibrando meus sistemas. Por favor, utilize a página de suporte se precisar de ajuda.";
    }
  }
};
