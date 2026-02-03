
import { GoogleGenAI, Type } from "@google/genai";
import { UserRole, AiVerificationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Tradução Server-side do Chat (Simulando Edge Function)
 * Recebe a mensagem e o papel do remetente para decidir o par de idiomas.
 */
export const translateChatMessage = async (
  message: string,
  senderRole: 'client' | 'cleaner'
): Promise<{ translatedText: string; sourceLang: 'en' | 'pt'; targetLang: 'en' | 'pt' }> => {
  
  const sourceLang = senderRole === 'client' ? 'en' : 'pt';
  const targetLang = senderRole === 'client' ? 'pt' : 'en';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: `You are a specialized translator for a high-end cleaning marketplace.
        Context: Chat between an American homeowner (Client) and a Brazilian professional (Cleaner).
        
        TASK:
        - Translate from ${sourceLang === 'en' ? 'English' : 'Portuguese (Brazil)'} to ${targetLang === 'en' ? 'English' : 'Portuguese (Brazil)'}.
        - Maintain a professional and friendly tone.
        - Preserving specific cleaning terms (e.g., "Deep Clean", "Move-out", "Faxina Pesada").
        - Output ONLY the translated text. No commentary.`,
        temperature: 0.1, // Low temperature for consistent translation
      }
    });

    return {
      translatedText: response.text || message,
      sourceLang,
      targetLang
    };
  } catch (error) {
    console.error("Critical Translation Error:", error);
    return { translatedText: message, sourceLang, targetLang }; // Fallback to original
  }
};

export const generateBrianResponse = async (
  history: { role: string; text: string }[],
  userRole: UserRole,
  pageContext: string
): Promise<string> => {
  const isProfessionalExperience = userRole === UserRole.CLEANER || userRole === UserRole.ADMIN;
  const languageTarget = isProfessionalExperience ? 'Portuguese (PT-BR)' : 'English (US)';
  const toneInstruction = isProfessionalExperience 
    ? 'Friendly, supportive, and clear for Brazilian cleaning professionals.'
    : 'Professional, trustworthy, and native for American homeowners.';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }]
      })),
      config: {
        systemInstruction: `You are LUNA, the native concierge for Brazilian Clean. 
        IDENTITY: ${toneInstruction}
        CONTEXT: You are currently assisting a ${userRole} on the ${pageContext} page.
        STRICT LANGUAGE RULE: You MUST speak ONLY in ${languageTarget}. Never mix languages.`,
        temperature: 0.7,
      }
    });

    return response.text || (isProfessionalExperience ? "Desculpe, não consegui gerar uma resposta." : "I'm sorry, I couldn't generate a response.");
  } catch (error) {
    return isProfessionalExperience ? "Olá! Estou operando em modo de segurança. Como posso ajudar?" : "Hi! I'm in safe mode. How can I help?";
  }
};

export const performIdentityVerification = async (
  assets: { docFront: string; docBack: string; facePhoto: string; selfieWithDoc: string },
  userProfile: { fullName: string; email: string }
): Promise<AiVerificationResult> => {
  // Simulating a successful AI verification process
  return { 
    verification_status: "LIKELY_VALID", 
    confidence_score: 0.95,
    summary: "Documentos conferem com a biometria facial.",
    user_reason_pt: "Identidade confirmada.",
    user_instruction_pt: "Aguarde a ativação final do administrador."
  };
};
