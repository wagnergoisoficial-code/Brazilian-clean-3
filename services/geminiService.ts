import { GoogleGenAI } from "@google/genai";
import { CleanerProfile, UserRole } from "../types";

/*
  Knowledge base used by the platform intelligence.
  Contains only descriptive information about the system.
*/
const PORTAL_KNOWLEDGE = `
Brazilian Clean is a service platform that connects American clients with Brazilian cleaning professionals.

Clients can search for cleaners by ZIP code or use the Express Match feature.
Cleaners must register, submit verification documents, and activate a paid subscription to receive leads.

Pricing model for cleaners:
The first two months cost 180 dollars per month.
From the third month onward, the price is 260 dollars per month.

Cleaners earn merit points based on performance and responsiveness.
Merit levels are Bronze, Silver, and Gold.

Clients receive support via email or phone.
Cleaners receive support via WhatsApp.
`;

export const generateBrianResponse = async (
  history: { role: string; text: string }[],
  userRole: UserRole,
  pageContext: string,
  cleanerData?: CleanerProfile[]
): Promise<string> => {

  /*
    IMPORTANT:
    This project runs on Vite.
    Environment variables MUST be accessed using import.meta.env
    Only variables prefixed with VITE_ are available at runtime.
  */
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!geminiKey) {
    console.warn("Gemini key not configured in environment variables.");

    if (userRole === UserRole.CLIENT) {
      return "The system is temporarily unavailable. Please contact support.";
    }

    return "O sistema está temporariamente indisponível. Por favor, entre em contato com o suporte.";
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });

  const verifiedCleaners =
    cleanerData?.filter(c => c.status === "VERIFIED") ?? [];

  const pendingCleaners =
    cleanerData?.filter(c => c.status === "PENDING") ?? [];

  const liveContext = `
User role: ${userRole}
Current page: ${pageContext}
Verified cleaners available: ${verifiedCleaners.length}
Pending applications: ${pendingCleaners.length}
Total records: ${cleanerData?.length ?? 0}
`;

  const systemInstruction = `
You are Luna, the platform intelligence of Brazilian Clean.

You communicate in a clear, professional and objective way.
You do not use emojis or formatting.
You adapt language based on the user type.

Knowledge:
${PORTAL_KNOWLEDGE}

Live context:
${liveContext}

Your task is to guide users, explain how the platform works, and direct them to the correct next step.
`;

  try {
    const contents = history.map(item => ({
      role: item.role === "model" ? "model" : "user",
      parts: [{ text: item.text }]
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
      throw new Error("Empty response from Gemini.");
    }

    return response.text;

  } catch (err) {
    console.error("Gemini service error:", err);

    if (userRole === UserRole.CLIENT) {
      return "The system is currently calibrating. Please use the support page.";
    }

    return "O sistema está em calibração. Utilize a página de suporte se necessário.";
  }
};
