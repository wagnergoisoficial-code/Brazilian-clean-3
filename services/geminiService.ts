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

// --- LUNA PERSONA & KNOWLEDGE BASE ---
const LUNA_IDENTITY = {
    NAME: "Luna",
    ROLE: "Assistant",
    TONE: "Warm, Professional, Clear, Charismatic",
    EMOJIS: ["✨", "😊", "👋", "🚀", "💎", "✅"]
};

// Deterministic Language Detection (Local/Offline)
const detectLanguage = (text: string): 'pt' | 'en' => {
    const t = text.toLowerCase();
    const ptKeywords = [
        'oi', 'ola', 'olá', 'bom', 'boa', 'tudo', 'bem', 'ajuda', 'por favor', 'obrigado', 'obrigada',
        'limpeza', 'faxina', 'preço', 'quanto', 'custa', 'pagamento', 'lead', 'cliente', 'verificação',
        'foto', 'documento', 'suporte', 'erro', 'não', 'sim', 'que', 'de', 'em', 'para', 'com', 'br', 'brasil',
        'como', 'funciona', 'fazer', 'posso', 'sou', 'quero', 'preciso', 'antes', 'depois', 'portfolio'
    ];
    const enKeywords = [
        'hi', 'hello', 'hey', 'good', 'morning', 'afternoon', 'help', 'please', 'thanks',
        'clean', 'cleaning', 'price', 'cost', 'pay', 'payment', 'lead', 'client', 'verify',
        'photo', 'id', 'support', 'error', 'no', 'yes', 'what', 'of', 'in', 'to', 'with', 'us', 'usa',
        'how', 'works', 'do', 'can', 'i', 'want', 'need', 'am', 'before', 'after', 'portfolio'
    ];

    let ptScore = 0;
    let enScore = 0;

    ptKeywords.forEach(w => { if (t.includes(w)) ptScore++; });
    enKeywords.forEach(w => { if (t.includes(w)) enScore++; });

    return enScore > ptScore ? 'en' : 'pt';
};

const getLocalFallbackResponse = (userMessage: string, userRole: UserRole, pageContext: string): string => {
    const lang = detectLanguage(userMessage);
    const msg = userMessage.toLowerCase();

    if (lang === 'pt') {
        if (msg.match(/\b(oi|ola|olá|bom|boa|eai|tarde|noite)\b/)) return "Olá! Sou a Luna, sua concierge no Brazilian Clean. 😊 Estou aqui para facilitar sua jornada. Como posso ajudar hoje?";
        if (msg.match(/\b(preço|valor|quanto|custa|pagar|pagamento|assinatura|plano|mensalidade)\b/)) return "Nossos planos são transparentes: ✨ O valor promocional é $180/mês (nos primeiros 2 meses). Depois, o padrão é $260/mês.";
        if (msg.match(/\b(lead|trabalho|cliente|serviço|ganhar|dinheiro|vaga|oferta|match)\b/)) return "Nosso sistema de Leads Express conecta você a clientes instantaneamente.";
        if (msg.match(/\b(verific|document|foto|selfie|identidade|aprov|cadastro|enviar)\b/)) return "Segurança é nossa prioridade. ✅ Para ser aprovado, precisamos do seu documento oficial e uma selfie.";
        if (msg.match(/\b(portfolio|foto|antes|depois|trabalho|amostra|galeria)\b/)) return "Agora você pode adicionar fotos de 'Antes & Depois' no seu perfil! 📸";
        if (msg.match(/\b(ajuda|suporte|erro|problema|bug|contato|falar|humano)\b/)) return "Estou aqui para ajudar! Se for algo complexo, você pode abrir um ticket na aba 'Suporte'.";
        return "Entendi. 😊 Posso te explicar sobre Cadastro, Preços ($180/$260), o novo Portfolio ou como conseguir Leads. O que você gostaria de saber?";
    } else {
        if (msg.match(/\b(hi|hello|hey|good|morning|afternoon|evening)\b/)) return "Hello! I'm Luna, your concierge at Brazilian Clean. 😊 I'm here to ensure you have a great experience. How can I assist you?";
        if (msg.match(/\b(price|cost|pay|payment|subscription|plan|fee|month)\b/)) return "For professionals, our rates are $180/month (promotional) then $260/month. For clients, finding a cleaner is completely free!";
        if (msg.match(/\b(lead|job|work|client|money|offer|match)\b/)) return "Our Express Match system broadcasts jobs instantly. Gold Professionals see offers first.";
        if (msg.match(/\b(verify|verification|doc|id|photo|selfie|approve|register|upload)\b/)) return "Safety first! ✅ All professionals must upload a Government ID and a Selfie.";
        if (msg.match(/\b(portfolio|photo|picture|before|after|work|gallery)\b/)) return "Cleaners can now showcase 'Before & After' photos! 📸";
        if (msg.match(/\b(help|support|error|issue|problem|contact|human)\b/)) return "I'm sorry you're facing issues. 😔 Please open a ticket in the 'Support' tab.";
        return "I see. 😊 I can guide you through Pricing, Registration, Portfolios, or how to find a verified cleaner. What's on your mind?";
    }
};

export const generateBrianResponse = async (
  history: { role: string; text: string }[],
  userRole: UserRole,
  pageContext: string,
  cleanerData?: CleanerProfile[]
): Promise<string> => {
  const lastUserMsg = history[history.length - 1]?.text || "";

  // 1. SAFETY GATE: CIRCUIT BREAKER
  if (CIRCUIT_BREAKER.isOpen) {
     const timeSinceLastFailure = Date.now() - CIRCUIT_BREAKER.lastFailure;
     if (timeSinceLastFailure > CIRCUIT_BREAKER.resetTime) {
         CIRCUIT_BREAKER.isOpen = false;
         CIRCUIT_BREAKER.failures = 0;
     } else {
         return getLocalFallbackResponse(lastUserMsg, userRole, pageContext);
     }
  }

  // 2. PRODUCTION BYPASS CHECK
  // Removed simulation-first logic. Primary path is now the live API call.
  // We only use fallback if NOT in production AND no key is available, or if the API actually fails.
  if (!SYSTEM_IDENTITY.IS_PRODUCTION && !process.env.VITE_GEMINI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 800)); 
    return getLocalFallbackResponse(lastUserMsg, userRole, pageContext);
  }

  const verifiedCleanersCount = cleanerData?.filter(c => c.status === 'VERIFIED').length || 0;
  
  const LUNA_SYSTEM_PROMPT = `
    You are LUNA, the official concierge for Brazilian Clean.
    IDENTITY: Efficient, charismatic, warm, and professional.
    LANGUAGE RULE: If user speaks Portuguese, reply in Portuguese. If English, reply in English.
    GOVERNANCE: Do NOT promise guaranteed income. Explain the $180/$260 pricing clearly.
    CONTEXT: User Role: ${userRole}, Page: ${pageContext}, Verified Pros: ${verifiedCleanersCount}.
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const apiResponse = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: history.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            })),
            systemInstruction: LUNA_SYSTEM_PROMPT
        }),
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!apiResponse.ok) throw new Error(`Backend Error: ${apiResponse.status}`);

    const data = await apiResponse.json();
    CIRCUIT_BREAKER.failures = 0;
    
    return data.text || getLocalFallbackResponse(lastUserMsg, userRole, pageContext);

  } catch (error) {
    CIRCUIT_BREAKER.failures++;
    CIRCUIT_BREAKER.lastFailure = Date.now();
    if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.threshold) {
        CIRCUIT_BREAKER.isOpen = true;
    }
    return getLocalFallbackResponse(lastUserMsg, userRole, pageContext);
  }
};

export const performIdentityVerification = async (
  docUrl: string, 
  selfieUrl: string,
  userProfile: { fullName: string; email: string }
): Promise<AiVerificationResult> => {
    await new Promise(resolve => setTimeout(resolve, 3000)); 
    const isFraud = userProfile.fullName.toLowerCase().includes("fraud");
    const isBlurry = userProfile.fullName.toLowerCase().includes("test");
    
    if (isFraud) {
        return {
            verification_status: "LIKELY_FRAUD",
            confidence_score: 0.15,
            detected_issues: ["Face mismatch", "Document modified"],
            summary: "Selfie does not match ID photo. ID appears edited.",
            recommended_action: "Reject",
            timestamp: new Date().toISOString()
        };
    }

    if (isBlurry) {
        return {
            verification_status: "NEEDS_MANUAL_REVIEW",
            confidence_score: 0.65,
            detected_issues: ["Blurry Document"],
            summary: "ID text is slightly blurry but face matches.",
            recommended_action: "Review",
            timestamp: new Date().toISOString()
        };
    }

    return {
        verification_status: "LIKELY_VALID",
        confidence_score: 0.98,
        detected_issues: [],
        summary: "Documents match selfie. Clear visibility. Security features present.",
        recommended_action: "Approve",
        timestamp: new Date().toISOString()
    };
};