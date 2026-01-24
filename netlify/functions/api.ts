import { GoogleGenAI } from "@google/genai";

export const handler = async (event: any) => {
  // 1. SET CORS HEADERS (Vital for Web Access)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // 2. HANDLE PREFLIGHT
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  // 3. SECURITY CHECK
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    // 4. API KEY EXTRACTION & SAFE MODE CHECK
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    const isOfflineMode = !apiKey;

    // 5. INPUT PARSING
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Request body is empty" }) };
    }
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON in request body" }) };
    }

    const { contents, systemInstruction } = parsedBody;

    // ---------------------------------------------------------
    // FALLBACK PROTOCOL: OFFLINE MODE (SIMULATION)
    // ---------------------------------------------------------
    if (isOfflineMode) {
      console.warn("[Backend] API Key missing. Engaging Safe Mode (Simulation).");
      
      // Extract the last user message
      const lastUserMsg = contents
        .filter((c: any) => c.role === 'user')
        .pop()
        ?.parts?.[0]?.text?.toLowerCase() || "";

      let mockResponse = "I am currently operating in Safe Mode (Offline). I can assist with basic navigation.";

      // Simple Keyword Matching for Simulation
      if (lastUserMsg.includes("hello") || lastUserMsg.includes("hi") || lastUserMsg.includes("ola")) {
        mockResponse = "Hello. I am Luna (Safe Mode). How can I assist you with Brazilian Clean today?";
      } else if (lastUserMsg.includes("price") || lastUserMsg.includes("cost") || lastUserMsg.includes("pay")) {
        mockResponse = "Cleaners pay $180/month for the first 2 months, then $260/month. Clients use the platform for free.";
      } else if (lastUserMsg.includes("join") || lastUserMsg.includes("register") || lastUserMsg.includes("cadastro")) {
        mockResponse = "Professionals can register by clicking 'For Cleaners' in the navigation bar.";
      } else if (lastUserMsg.includes("support") || lastUserMsg.includes("help") || lastUserMsg.includes("ajuda")) {
        mockResponse = "Please visit our Support page for direct assistance.";
      } else {
        mockResponse = "I understand. Since I am in Safe Mode, I recommend checking the Dashboard or Support page for more details.";
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text: mockResponse })
      };
    }

    // ---------------------------------------------------------
    // LIVE PROTOCOL: GOOGLE GEMINI API (SDK)
    // ---------------------------------------------------------
    
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 500,
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: response.text })
    };

  } catch (error: any) {
    console.error("[Backend] Critical Runtime Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Internal Server Error", 
        details: error.message 
      })
    };
  }
};