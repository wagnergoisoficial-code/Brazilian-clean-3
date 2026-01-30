
import { GoogleGenAI, Type } from "@google/genai";
import { CleanerProfile, UserRole, AiVerificationResult } from "../types";
import { SYSTEM_IDENTITY } from "../config/SystemManifest";

// --- RELIABILITY ARCHITECTURE ---
const CIRCUIT_BREAKER = {
  failures: 0,
  threshold: 3,
  isOpen: false,
  lastFailure: 0,
  resetTime: 60000 // 60 seconds cooldown
};

const detectLanguage = (text: string): 'pt' | 'en' => {
    const t = text.toLowerCase();
    const ptKeywords = ['oi', 'ola', 'olá', 'limpeza', 'faxina', 'preço', 'pagamento', 'preciso'];
    const enKeywords = ['hi', 'hello', 'cleaning', 'price', 'payment', 'need'];
    let ptScore = ptKeywords.filter(w => t.includes(w)).length;
    let enScore = enKeywords.filter(w => t.includes(w)).length;
    return enScore > ptScore ? 'en' : 'pt';
};

const getLocalFallbackResponse = (userMessage: string, userRole: UserRole, pageContext: string): string => {
    const lang = detectLanguage(userMessage);
    if (lang === 'pt') {
        return "Olá! Sou a Luna. Estou operando em modo de segurança agora, mas posso ajudar com informações básicas sobre preços ($180/$260) e cadastro. 😊";
    }
    return "Hi! I'm Luna. I'm in safe mode right now, but I can help with basic info about pricing ($180/$260) and registration. 😊";
};

export const generateBrianResponse = async (
  history: { role: string; text: string }[],
  userRole: UserRole,
  pageContext: string,
  cleanerData?: CleanerProfile[]
): Promise<string> => {
  const lastUserMsg = history[history.length - 1]?.text || "";

  if (CIRCUIT_BREAKER.isOpen) {
     if (Date.now() - CIRCUIT_BREAKER.lastFailure > CIRCUIT_BREAKER.resetTime) {
         CIRCUIT_BREAKER.isOpen = false;
         CIRCUIT_BREAKER.failures = 0;
     } else {
         return getLocalFallbackResponse(lastUserMsg, userRole, pageContext);
     }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }]
      })),
      config: {
        systemInstruction: `You are LUNA, the concierge for Brazilian Clean. Identity: Warm, professional, helpful. Role: ${userRole}. Page: ${pageContext}. If user speaks Portuguese, reply in Portuguese.`,
        temperature: 0.7,
      }
    });

    CIRCUIT_BREAKER.failures = 0;
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    CIRCUIT_BREAKER.failures++;
    CIRCUIT_BREAKER.lastFailure = Date.now();
    if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.threshold) CIRCUIT_BREAKER.isOpen = true;
    return getLocalFallbackResponse(lastUserMsg, userRole, pageContext);
  }
};

export const performIdentityVerification = async (
  docUrl: string, 
  selfieUrl: string,
  userProfile: { fullName: string; email: string }
): Promise<AiVerificationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  try {
    const cleanBase64 = (url: string) => url.split(',')[1] || url;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: `IDENTITY VERIFICATION PROTOCOL - PRODUCTION CRITICAL
            
            Compare these two images:
            1. Government-issued ID (DL, Passport, or RG).
            2. Real-time selfie of the professional.
            
            STRICT VERIFICATION STEPS:
            - FACE COMPARISON: Is the face in the selfie the SAME as the face printed on the ID? Analyze features, age, and proportions.
            - NAME VALIDATION: Does the name printed on the document match "${userProfile.fullName}"? If it's a completely different name (e.g., "John Doe" on ID vs "Maria Silva" on profile), mark as LIKELY_FRAUD.
            - LIVENESS/ANTI-SPOOF: Is the second image a real selfie or a photo of a photo/screen? Detect any digital manipulation.
            - DOCUMENT AUTHENTICITY: Does the ID look like a real physical document or a downloaded/generic image?
            
            RESPONSE RULES:
            - If both photos are clearly different people: "LIKELY_FRAUD".
            - If names are completely different: "LIKELY_FRAUD".
            - If photos are blurry but potentially match: "NEEDS_MANUAL_REVIEW".
            - If faces match and name matches: "LIKELY_VALID".
            
            Return a JSON object:
            {
              "verification_status": "LIKELY_VALID" | "NEEDS_MANUAL_REVIEW" | "LIKELY_FRAUD",
              "confidence_score": number (0 to 1),
              "detected_issues": string[],
              "summary": string,
              "recommended_action": "Approve" | "Review" | "Reject"
            }` 
          },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(docUrl) } },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(selfieUrl) } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verification_status: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            detected_issues: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            recommended_action: { type: Type.STRING }
          },
          required: ["verification_status", "confidence_score", "detected_issues", "summary", "recommended_action"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("AI Verification Error:", error);
    return {
      verification_status: "NEEDS_MANUAL_REVIEW",
      confidence_score: 0.5,
      detected_issues: ["AI system timeout"],
      summary: "Manual verification required due to processing lag.",
      recommended_action: "Review",
      timestamp: new Date().toISOString()
    };
  }
};
