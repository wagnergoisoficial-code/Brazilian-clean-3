
export const handler = async (event: any) => {
  // Common CORS headers to ensure the browser accepts the response
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  // SECURITY: Only allow POST requests for the actual payload
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    // 1. CONFIGURATION CHECK
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Server Error: Missing API Key in Environment Variables");
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ error: "Server Configuration Error: Missing API Key" }) 
      };
    }

    // 2. PARSE INPUT
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing request body" }) };
    }
    const { contents, systemInstruction } = JSON.parse(event.body);

    // 3. CALL GEMINI API (REST)
    // Using REST API avoids 'node_modules' dependency issues on Netlify Functions
    const MODEL_NAME = 'gemini-3-flash-preview';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const payload = {
      contents: contents,
      // REST API expects systemInstruction to be wrapped in 'parts'
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: 0.3
      }
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // 4. HANDLE API ERRORS
    if (!response.ok) {
      console.error("Gemini API Error:", JSON.stringify(data));
      // Return the actual error from Google if available, or a generic one
      const errorMessage = data.error?.message || "Unknown AI Service Error";
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: errorMessage })
      };
    }

    // 5. EXTRACT CONTENT
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn("Gemini Response Empty:", JSON.stringify(data));
      // Fallback if the model returns safety blocks or no text
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text: "I apologize, but I cannot answer that query right now." })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: text })
    };

  } catch (error: any) {
    console.error("Netlify Function Runtime Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error: " + (error.message || "Unknown") })
    };
  }
};
