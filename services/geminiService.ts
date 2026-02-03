
import { UserRole, AiVerificationResult } from "../types";

/**
 * AI PROXY SERVICE (Frontend)
 * ==========================
 * This service no longer initializes the Gemini SDK directly.
 * It proxies all requests to Netlify Functions to ensure:
 * 1. API Keys are never exposed to the browser.
 * 2. The app does not crash due to browser-side SDK restrictions.
 */

const API_ENDPOINT = "/.netlify/functions/api";

export const translateChatMessage = async (
  message: string,
  senderRole: 'client' | 'cleaner'
): Promise<{ translatedText: string; sourceLang: 'en' | 'pt'; targetLang: 'en' | 'pt' }> => {
  
  const sourceLang = senderRole === 'client' ? 'en' : 'pt';
  const targetLang = senderRole === 'client' ? 'pt' : 'en';

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TRANSLATE',
        message,
        sourceLang,
        targetLang
      })
    });

    if (!response.ok) throw new Error("Translation service offline");
    
    const data = await response.json();
    return {
      translatedText: data.text || message,
      sourceLang,
      targetLang
    };
  } catch (error) {
    console.error("Critical Translation Error:", error);
    return { translatedText: message, sourceLang, targetLang }; 
  }
};

export const generateBrianResponse = async (
  history: { role: string; text: string }[],
  userRole: UserRole,
  pageContext: string
): Promise<string> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'LUNA_CHAT',
        history,
        userRole,
        pageContext
      })
    });

    if (!response.ok) throw new Error("Luna backend unreachable");
    
    const data = await response.json();
    return data.text || "Desculpe, tive um erro de conexão.";
  } catch (error) {
    console.error("Luna Proxy Error:", error);
    return userRole === UserRole.CLEANER 
      ? "Olá! Estou operando em modo de segurança. Como posso ajudar?" 
      : "Hi! I'm in safe mode. How can I help?";
  }
};

export const performIdentityVerification = async (
  assets: { docFront: string; docBack: string; facePhoto: string; selfieWithDoc: string },
  userProfile: { fullName: string; email: string }
): Promise<AiVerificationResult> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'VERIFY_IDENTITY',
        assets,
        userProfile
      })
    });

    if (!response.ok) throw new Error("Verification service failed");
    
    return await response.json();
  } catch (error) {
    console.error("Identity Verification Proxy Error:", error);
    // Safety Fallback for UI flow
    return { 
      verification_status: "NEEDS_MANUAL_REVIEW", 
      confidence_score: 0.5,
      summary: "Falha na conexão com IA. Necessário revisão manual.",
      user_reason_pt: "Erro técnico na verificação automática.",
      user_instruction_pt: "Seus documentos foram salvos. Um administrador revisará manualmente em até 24h."
    };
  }
};
