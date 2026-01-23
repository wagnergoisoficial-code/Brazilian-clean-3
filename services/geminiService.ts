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

    const response = await fetch("/.netlify/functions/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        history: contents,
        systemInstruction
      })
    });

    if (!response.ok) {
      throw new Error("Gemini function failed");
    }

    const data = await response.json();

    if (!data.text) {
      throw new Error("Empty response from Gemini function");
    }

    return data.text;

  } catch (error) {
    console.error("Luna AI Frontend Error:", error);

    return userRole === UserRole.CLIENT
      ? "I am currently calibrating my systems. Please proceed to the support page if you need assistance."
      : "Estou calibrando meus sistemas. Por favor, utilize a página de suporte se precisar de ajuda.";
  }
};
