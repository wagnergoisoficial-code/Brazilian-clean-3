
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: 'OK'
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { to, code, language = 'en' } = JSON.parse(event.body || '{}');

  if (!to || !code) {
    return { statusCode: 400, body: 'Missing email or code' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  
  // Production requires a real API Key. If missing, we log but cannot send.
  if (!apiKey) {
    console.error("CRITICAL: RESEND_API_KEY is not defined in environment variables.");
    return { 
      statusCode: 200, 
      body: JSON.stringify({ success: false, error: 'Service Configuration Error' }) 
    };
  }

  const subject = language === 'pt' 
    ? 'Seu código de verificação – Brazilian Clean' 
    : 'Confirm your request – Brazilian Clean';
  
  const text = language === 'pt'
    ? `Seu código de verificação é: ${code}\nEste código é válido por 15 minutos.`
    : `Your verification code is: ${code}\nThis code is valid for 15 minutes.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10b981; font-size: 28px; font-weight: 800; margin: 0;">Brazilian Clean</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px; line-height: 24px; margin-bottom: 20px;">
          ${language === 'pt' ? 'Olá! Para prosseguir com segurança na plataforma, use o código de verificação abaixo:' : 'Hello! To securely proceed on our platform, please use the following verification code:'}
        </p>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 12px; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #0f172a;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center;">
          ${language === 'pt' ? 'Este código expira em 15 minutos.' : 'This code expires in 15 minutes.'}
        </p>
      </div>
      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8;">
        &copy; 2024 Brazilian Clean. All rights reserved.
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
        to: [to],
        subject: subject,
        html: html,
        text: text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API Error Details:", data);
      return { statusCode: 200, body: JSON.stringify({ success: false, error: data.message || 'Provider Error' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, id: data.id })
    };
  } catch (error) {
    console.error("Execution Exception:", error);
    return { statusCode: 200, body: JSON.stringify({ success: false, error: 'Internal Function Error' }) };
  }
};
