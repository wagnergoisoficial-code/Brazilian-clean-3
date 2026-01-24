import { GoogleGenAI } from "@google/genai";

export const handler = async (event: any) => {
  // SECURITY: Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // SECURITY: The API Key is read here, on the server. 
    // It is NEVER sent to the client.
    // Ensure you have a Netlify Environment Variable named "API_KEY" or "GEMINI_API_KEY".
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Server Error: Missing API Key in Environment Variables");
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "Server Configuration Error" }) 
      };
    }

    const { contents, systemInstruction } = JSON.parse(event.body);

    const ai = new GoogleGenAI({ apiKey });
    
    // Call Google Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Updated to the recommended model
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: response.text })
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate content" })
    };
  }
};