import { GoogleGenAI } from "@google/genai";
import { CleanerProfile, UserRole } from "../types";

const PORTAL_KNOWLEDGE = `
[SYSTEM KNOWLEDGE BASE - BRAZILIAN CLEAN]
(… seu texto grande continua igual aqui …)
`;

export const generateBrianResponse = async (
  history: { role: string; text: string }[],
  userRole: UserRole,
  pageContext: string,
  cleanerData?: CleanerProfile[]
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY not found. Check Netlify environment variables.");
    return userRole === UserRole.CLIENT
      ? "I am currently offline due to a system configuration issue. Please contact support."
      : "Estou offline devido a um problema na configuração do sistema. Por favor, contate o suporte.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const verifiedCleaners = cleanerData?.filter(c => c.status === "VERIFIED") || [];
  const pendingCleaners = cleanerData?.filter(c => c.status === "PENDING") || [];

  const dynamicContext = `
[CURRENT LIVE DATA]
- User Role: ${userRole}
- Current Page: ${pageContext}
- Verified Cleaners Available: ${verifiedCleaners.length}
- Pending Applications: ${pendingCleaners.length}
- Total Database: ${cleanerData?.length || 0}
`;

  const systemInstruction = `
You are LUNA, the Platform Intelligence for "Brazilian Clean".

KNOWLEDGE BASE:
${PORTAL_KNOWLEDGE}

CONTEXT:
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
    if (!text) throw new Error("Empty response received from AI model.");
    return text;

  } catch (error) {
    console.error("Luna AI Service Error:", error);
    return userRole === UserRole.CLIENT
      ? "I am currently calibrating my systems. Please proceed to the support page if you need assistance."
      : "Estou calibrando meus sistemas. Por favor, utilize a página de suporte se precisar de ajuda.";
  }
};
