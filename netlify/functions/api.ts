
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
    // 4. API KEY EXTRACTION
    // We check both naming conventions to be safe
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[Backend] Error: API_KEY is missing in Netlify Environment Variables.");
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ error: "Configuration Error: API Key missing on server." }) 
      };
    }

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

    // 6. CONSTRUCT GOOGLE API PAYLOAD (STRICT REST FORMAT)
    // IMPORTANT: The REST API uses snake_case (system_instruction), NOT camelCase.
    const MODEL_NAME = 'gemini-3-flash-preview';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const googlePayload: any = {
      contents: contents,
      generation_config: {
        temperature: 0.3,
        // Optional: limit tokens to prevent timeouts
        max_output_tokens: 500 
      }
    };

    // Correctly format system_instruction for REST API
    if (systemInstruction) {
      googlePayload.system_instruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    console.log("[Backend] Sending request to Google Gemini...", { model: MODEL_NAME });

    // 7. EXECUTE REQUEST
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googlePayload)
    });

    const data = await response.json();

    // 8. ERROR HANDLING (UPSTREAM)
    if (!response.ok) {
      console.error("[Backend] Google API Error:", JSON.stringify(data, null, 2));
      const googleError = data.error?.message || data.error?.status || "Unknown Upstream Error";
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Google AI Error: ${googleError}` })
      };
    }

    // 9. EXTRACT & RETURN
    // Safety check for deep nesting
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn("[Backend] Empty content received.", JSON.stringify(data));
      // Even if empty, we return 200 to valid parsing, but with a fallback text
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text: "I processed your request, but I have no response text. (Safety Filter triggered?)" })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: text })
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
