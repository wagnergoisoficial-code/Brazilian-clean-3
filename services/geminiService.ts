import { GoogleGenAI } from "@google/genai";
import { CleanerProfile, UserRole } from "../types";

// STATIC KNOWLEDGE BASE
const PORTAL_KNOWLEDGE = `
[SYSTEM KNOWLEDGE BASE - BRAZILIAN CLEAN]
... (seu texto inteiro permanece igual)
`;

export const generateBrianResponse = async (
  history: { role: string; text: string }[],
  userRole: UserRole,
  pageContext: string,
  cleanerData?: CleanerProfile[]
): Promise<string> => {

  // 🔐 PEGANDO A API KEY DO JEITO CERTO NO VITE
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  // 🚨 ALARME: se não existir, você SABE NA HORA
  if (!apiKey) {
    console.error("VITE_GOOGLE_API_KEY não foi carregada no build.");
    throw new Error("API Key ausente.");
  }

  // ✅ Inicialização correta para WEB
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

COMMUNICATION STYLE:
Use plain text only. No emojis. No markdown. Be objective and professional.

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
      model: "gemini-1.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });

    if (!response.text) {
      throw new Error("Resposta vazia do modelo.");
    }

    return response.text;

  } catch (error) {
    console.error("Luna AI Service Error:", error);

    if (userRole === UserRole.CLIENT) {
      return "I am currently calibrating my systems. Please proceed to the support page if you need assistance.";
    }

    return "Estou calibrando meus sistemas. Por favor, utilize a página de suporte se precisar de ajuda.";
  }
};
