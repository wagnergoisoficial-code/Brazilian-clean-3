
import { GoogleGenAI } from "@google/genai";

export const handler = async (event: any) => {
  // OBSERVABILITY: Request ID and Timer
  const REQUEST_ID = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const START_TIME = Date.now();
  const TIMEOUT_LIMIT = 6000; // STRICT 6s LIMIT (Leaves buffer for platform 10s limit)

  // 1. SET CORS HEADERS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // INTERNAL LOGGER
  const log = (status: string, details: string = "") => {
    const duration = Date.now() - START_TIME;
    console.log(`[Luna Backend] [${REQUEST_ID}] ${status} (${duration}ms) ${details}`);
  };

  // MANDATORY FALLBACK RESPONDER
  const returnFallback = (errorReason: string) => {
    log("FAILED", errorReason);
    // CRITICAL: Always return 200 with JSON to prevent frontend crashes/hangs
    // Contextual fallback for general errors
    return {
      statusCode: 200, 
      headers,
      body: JSON.stringify({ 
        text: "I am currently unable to access my primary knowledge base. However, you can find answers to most questions about Pricing, Registration, or Finding a Cleaner on our Home and Support pages." 
      })
    };
  };

  try {
    log("STARTED");

    // 2. PREFLIGHT & METHOD CHECK
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "OK" };
    if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };

    // 3. INPUT PARSING SAFEGUARD
    if (!event.body) throw new Error("Empty Body");
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (e) {
      throw new Error("Invalid JSON Body");
    }

    const { contents, systemInstruction } = parsedBody;

    // 4. API KEY & OFFLINE MODE CHECK
    const apiKey = process.env.API_KEY;
    const isOfflineMode = !apiKey;

    // ---------------------------------------------------------
    // OFFLINE MODE (SIMULATION)
    // ---------------------------------------------------------
    if (isOfflineMode) {
      log("OFFLINE_MODE");
      const lastUserMsg = contents.filter((c: any) => c.role === 'user').pop()?.parts?.[0]?.text?.toLowerCase() || "";
      let mockResponse = "I am currently operating in Safe Mode. I can assist with basic platform navigation.";

      // MATCH FRONTEND LOGIC FOR CONSISTENCY
      if (lastUserMsg.match(/\b(hello|hi|hey|olá|oi|bom dia|boa tarde|boa noite)\b/)) {
        mockResponse = "Hello. I am Luna (Safe Mode). I can help you navigate Brazilian Clean. Are you a Client looking for a cleaner, or a Professional looking to join?";
      } else if (lastUserMsg.match(/\b(price|cost|pay|subscription|fee|quanto|custo|valor|pagamento|assinatura)\b/)) {
        mockResponse = "For Cleaners: $180/month (first 2 months), then $260/month. For Clients: Free.";
      } else if (lastUserMsg.match(/\b(join|register|sign up|work|job|cadastro|cadastrar|trabalho|emprego)\b/)) {
        mockResponse = "Professionals can join our network by clicking 'For Cleaners' in the navigation menu. Verification is required.";
      } else if (lastUserMsg.match(/\b(find|search|looking for|need|hire|contract|busco|preciso|procurando|contratar|cleaner|limpeza|cleaning)\b/)) {
        mockResponse = "To find a verified cleaner, please use the search bar on our Home page. You can filter by ZIP code.";
      } else if (lastUserMsg.match(/\b(help|support|contact|issue|problem|ajuda|suporte|contato|problema|erro)\b/)) {
        mockResponse = "Please visit our Support page to contact our team directly via WhatsApp or Email.";
      } else {
        mockResponse = "I am in Safe Mode and can answer questions about: Finding a Cleaner, Registration, Pricing, or Support.";
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text: mockResponse })
      };
    }

    // ---------------------------------------------------------
    // LIVE AI EXECUTION WITH RACE CONDITION
    // ---------------------------------------------------------
    // Corrected: Initialization must use process.env.API_KEY directly in the named parameter.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const aiCallPromise = ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
        // maxOutputTokens requires a thinkingBudget for Gemini 3 series models.
        maxOutputTokens: 350,
        thinkingConfig: { thinkingBudget: 100 }
      }
    });

    // EXECUTION GUARD: Force rejection if time limit exceeded
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("EXECUTION_TIMEOUT")), TIMEOUT_LIMIT);
    });

    // RACE: AI vs CLOCK
    const response: any = await Promise.race([aiCallPromise, timeoutPromise]);

    log("SUCCESS");
    
    // Corrected: Extract text directly from the response object using the .text property.
    const text = response?.text || "I'm not sure how to answer that.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: text })
    };

  } catch (error: any) {
    // GLOBAL CATCH: Ensures we NEVER fail to return a response
    return returnFallback(error.message || "Unknown Error");
  }
};
