import { GoogleGenAI } from "@google/genai";
import { CleanerProfile, UserRole } from "../types";

// STATIC KNOWLEDGE BASE - The AI's "Source of Truth" about the app structure
const PORTAL_KNOWLEDGE = `
[SYSTEM KNOWLEDGE BASE - BRAZILIAN CLEAN]

1. NAVIGATION & STRUCTURE
Navbar links to Find a Cleaner, For Cleaners, Dashboard, Admin, and Support. The home page allows ZIP search and Express Match. Cleaners can register, be verified, manage subscriptions, and receive leads. Admins manage approvals, support tickets, and pricing exceptions.

2. KEY PROCESSES
American clients use the platform for free. Brazilian cleaners must subscribe. First two months cost $180 per month. From month three onward, the cost is $260 per month. Subscription is required to receive leads.

3. MERIT SYSTEM
Cleaners earn points based on performance and responsiveness. Levels are Bronze, Silver, and Gold. Levels update automatically and may go up or down.

4. SUPPORT
Clients receive support via email or phone. Cleaners receive support via WhatsApp.
`;

/**
 * generateBrianResponse
 * 
 * This service manages the communication with Luna (the system AI).
 */
export const generateBrianResponse = async (
  history: { role: string; text: string }[],
  userRole: UserRole,
  pageContext: string,
  cleanerData?: CleanerProfile[]
): Promise<string> => {

  // CORREÇÃO DEFINITIVA PARA VITE + NETLIFY
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY não encontrada. Verifique as variáveis de ambiente no Netlify.");

    if (userRole === UserRole.CLIENT) {
      return "I am currently offline due to a system configuration issue. Please contact support.";
    } else {
      return "Estou offline devido a um problema de configuração do sistema. Por favor, contate o suporte.";
    }
  }

  const ai = new GoogleGenAI({ apiKey });

  const verifiedCleaners = cleanerData?.filter(c => c.status === "VERIFIED") || [];
  const pendingCleaners = cleanerData?.filter(c => c.status === "PENDING") || [];

  const dynamicContext = `
CURRENT LIVE DATA
User Role: ${userRole}
Current Page: ${pageContext}
Verified Cleaners Available: ${verifiedCleaners.length}
Pending Applications: ${pendingCleaners.length}
Total Database: ${cleanerData?.length || 0}
`;

  const systemInstruction = `
You are LUNA, the Platform Intelligence for Brazilian Clean.

You are intelligent, objective, professional, and efficient.

You respond clearly, without emojis, without formatting, and without lists.

You adapt your language depending on the user:
American clients receive clear American English.
Brazilian cleaners receive professional Portuguese.

Knowledge Base:
${PORTAL_KNOWLEDGE}

Context:
${dynamicContext}

Your mission is to guide users, explain pricing, explain verification, explain Express Match, and provide support guidance.
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
      throw new Error("Empty response from AI.");
    }

    return text;

  } catch (error) {
    console.error("Luna AI Service Error:", error);

    if (userRole === UserRole.CLIENT) {
      return "I am currently calibrating my systems. Please use the support page if you need assistance.";
    } else {
      return "Estou calibrando meus sistemas. Por favor, utilize a página de suporte se precisar de ajuda.";
    }
  }
};
