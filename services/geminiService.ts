
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

  // Fix: Initialize GoogleGenAI using a named parameter with process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // Fix: Access .text property directly from the response object
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    CIRCUIT_BREAKER.failures++;
    CIRCUIT_BREAKER.lastFailure = Date.now();
    if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.threshold) CIRCUIT_BREAKER.isOpen = true;
    return getLocalFallbackResponse(lastUserMsg, userRole, pageContext);
  }
};

export interface VerificationAssets {
  docFront: string;
  docBack: string;
  facePhoto: string;
  selfieWithDoc: string;
}

export const performIdentityVerification = async (
  assets: VerificationAssets,
  userProfile: { fullName: string; email: string }
): Promise<AiVerificationResult> => {
  // Fix: Initialize GoogleGenAI using a named parameter with process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const cleanBase64 = (url: string) => {
        if (!url) return "";
        const parts = url.split(',');
        return parts.length > 1 ? parts[1] : parts[0];
    };

    // Fix: Use 'gemini-3-pro-preview' for complex reasoning tasks like identity verification
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: `IDENTITY VERIFICATION PROTOCOL - ENTERPRISE SECURITY LEVEL
            
            Compare these four images to verify the identity of the professional "${userProfile.fullName}":
            1. Official Document (FRONT)
            2. Official Document (BACK)
            3. Professional Face Photo (clear, frontal)
            4. Selfie holding the document next to the face
            
            STRICT VERIFICATION STEPS:
            - FACE CONSISTENCY: Compare the face in (3) Professional Photo and (4) Selfie.
            - DOCUMENT MATCH: Compare the face printed on (1) Document Front with the person in (3) and (4).
            - NAME VALIDATION: Does it match "${userProfile.fullName}"?
            - CONTEXTUAL CHECK: In (4) Selfie with Doc, is the document the same as (1)?
            
            USER FEEDBACK GENERATION:
            Return ONLY a valid JSON object.
            
            If the verification status is NOT "LIKELY_VALID", provide reason and instruction in Portuguese:
            
            Templates:
            - Selfie: "Não conseguimos identificar seu rosto com clareza." / "Aproxime mais o rosto da câmera e tente novamente."
            - Documento: "Não foi possível ler as informações do documento." / "Tire uma nova foto em um local bem iluminado, sem reflexos."
            - Selfie com Doc: "O documento não está totalmente visível na selfie." / "Segure o documento próximo ao rosto, com a foto aparecendo."
            - Mismatch: "Não conseguimos confirmar que a pessoa da foto é a mesma do documento." / "Tente novamente sem acessórios e garanta boa iluminação."
            
            Return JSON:
            {
              "verification_status": "LIKELY_VALID" | "NEEDS_MANUAL_REVIEW" | "LIKELY_FRAUD",
              "confidence_score": number,
              "detected_issues": string[],
              "summary": string,
              "recommended_action": "Approve" | "Review" | "Reject",
              "user_reason_pt": string,
              "user_instruction_pt": string
            }` 
          },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(assets.docFront) } },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(assets.docBack) } },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(assets.facePhoto) } },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(assets.selfieWithDoc) } }
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
            recommended_action: { type: Type.STRING },
            user_reason_pt: { type: Type.STRING },
            user_instruction_pt: { type: Type.STRING }
          },
          required: ["verification_status", "confidence_score", "detected_issues", "summary", "recommended_action", "user_reason_pt", "user_instruction_pt"]
        }
      }
    });

    // Fix: Access .text property directly from the response object
    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("AI Verification Exception:", error);
    // CRITICAL: Guaranteed fallback to avoid frontend crash
    return {
      verification_status: "NEEDS_MANUAL_REVIEW",
      confidence_score: 0.0,
      detected_issues: ["Technical Processing Exception"],
      summary: "O processamento automático falhou devido a um erro técnico. O perfil será revisado manualmente.",
      recommended_action: "Review",
      timestamp: new Date().toISOString(),
      user_reason_pt: "Seus documentos foram recebidos, mas o processamento automático encontrou uma instabilidade.",
      user_instruction_pt: "Não se preocupe, nossa equipe fará a verificação manual em breve. Fique atento ao seu e-mail."
    };
  }
};
