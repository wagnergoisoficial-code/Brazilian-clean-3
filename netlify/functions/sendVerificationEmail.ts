import { Handler } from '@netlify/functions';
import crypto from 'crypto';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) 
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid request body' })
    };
  }

  const { to, language = 'en' } = body;

  if (!to) {
    return { 
      statusCode: 400, 
      headers,
      body: JSON.stringify({ success: false, error: 'Missing recipient email' }) 
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error("[Backend] RESEND_API_KEY is missing.");
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Email service configuration error: API Key missing' 
      }) 
    };
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const subject = language === 'pt' 
    ? 'Seu código de verificação – Brazilian Clean' 
    : 'Confirm your request – Brazilian Clean';
  
  const text = language === 'pt'
    ? `Seu código de verificação é: ${code}\nEste código é válido por 10 minutos.`
    : `Your verification code is: ${code}\nThis code is valid for 10 minutes.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10b981; margin: 0;">Brazilian Clean</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px;">
          ${language === 'pt' ? 'Use o código abaixo para verificar sua solicitação:' : 'Use the code below to verify your request:'}
        </p>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center;">
          ${language === 'pt' ? 'Este código expira em 10 minutos.' : 'This code expires in 10 minutes.'}
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Brazilian Clean <no-reply@brazilianclean.org>',
        to: to,
        subject: subject,
        html: html,
        text: text
      })
    });

    const resText = await response.text();
    let resData;
    try {
      resData = JSON.parse(resText);
    } catch (e) {
      resData = { message: resText };
    }

    if (!response.ok) {
      console.error("[Backend] Resend API error:", resData);
      // Se o erro for de domínio não verificado, passamos a mensagem real adiante
      return { 
        statusCode: response.status, 
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: resData.message || 'Email provider error' 
        }) 
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, code: code })
    };
  } catch (error: any) {
    console.error("[Backend] Unexpected error:", error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ success: false, error: 'Internal server error during email dispatch' }) 
    };
  }
};