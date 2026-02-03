
import { GoogleGenAI } from "@google/genai";

export const handler = async (event: any) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("Missing API_KEY environment variable");
    }

    const ai = new GoogleGenAI({ apiKey });
    const body = JSON.parse(event.body || "{}");
    const { action } = body;

    // --- ROUTER: TRANSLATION (BILINGUAL CHAT BRIDGE) ---
    if (action === 'TRANSLATE') {
      const { message, sourceLang, targetLang } = body;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          systemInstruction: `You are a specialized translator for a high-end cleaning marketplace.
          Context: Chat between an American homeowner (Client) and a Brazilian professional (Cleaner).
          
          TASK:
          - Translate from ${sourceLang === 'en' ? 'English' : 'Portuguese (Brazil)'} to ${targetLang === 'en' ? 'English' : 'Portuguese (Brazil)'}.
          - Maintain a professional and friendly tone.
          - Preserve cleaning terms (e.g., "Deep Clean", "Faxina Pesada").
          - Output ONLY the translated text. No commentary.`,
          temperature: 0.1,
        }
      });
      return { statusCode: 200, headers, body: JSON.stringify({ text: response.text }) };
    }

    // --- ROUTER: LUNA CONCIERGE (NAVIGATION & SUPPORT) ---
    if (action === 'LUNA_CHAT') {
      const { history, userRole, pageContext } = body;
      const isProfessional = userRole === 'CLEANER' || userRole === 'ADMIN';
      const languageTarget = isProfessional ? 'Portuguese (PT-BR)' : 'English (US)';
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history.map((h: any) => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        })),
        config: {
          systemInstruction: `You are LUNA, the native concierge for Brazilian Clean.
          IDENTITY: ${isProfessional ? 'Friendly and supportive for Brazilian pros.' : 'Professional and native for American homeowners.'}
          CONTEXT: You are on the ${pageContext} page.
          STRICT LANGUAGE RULE: Speak ONLY in ${languageTarget}.`,
          temperature: 0.7,
        }
      });
      return { statusCode: 200, headers, body: JSON.stringify({ text: response.text }) };
    }

    // --- ROUTER: IDENTITY VERIFICATION ---
    if (action === 'VERIFY_IDENTITY') {
      const { assets, userProfile } = body;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: `Verify if these documents belong to ${userProfile.fullName}. 
                     Check for photo matches between ID and Selfie. 
                     Return JSON with verification_status, confidence_score, and summary.` },
            { inlineData: { mimeType: "image/jpeg", data: assets.facePhoto.split(',')[1] } },
            { inlineData: { mimeType: "image/jpeg", data: assets.docFront.split(',')[1] } },
            { inlineData: { mimeType: "image/jpeg", data: assets.selfieWithDoc.split(',')[1] } }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });
      return { statusCode: 200, headers, body: response.text };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid Action" }) };

  } catch (error: any) {
    console.error("[Backend AI Error]", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal Server Error" })
    };
  }
};
