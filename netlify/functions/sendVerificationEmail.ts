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
      body: JSON.stringify({ success: false, error: 'Corpo da requisição inválido' })
    };
  }

  const { to, language = 'en' } = body;
  if (!to) {
    return { 
      statusCode: 400, 
      headers,
      body: JSON.stringify({ success: false, error: 'E-mail do destinatário ausente' }) 
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  // ALINHAMENTO DE DOMÍNIO: O subdomínio 'mail.brazilianclean.org' é o único verificado no Resend.
  // Alterado o fallback de 'no-reply@brazilianclean.org' para 'no-reply@mail.brazilianclean.org'.
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@mail.brazilianclean.org';
  
  if (!apiKey) {
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ success: false, error: 'Configuração do servidor incompleta (API Key)' }) 
    };
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const subject = language === 'pt' ? 'Seu código: Brazilian Clean' : 'Your code: Brazilian Clean';
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h1 style="color: #10b981;">Brazilian Clean</h1>
      <p style="font-size: 16px;">${language === 'pt' ? 'Seu código de verificação é:' : 'Your verification code is:'}</p>
      <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${code}</span>
      </div>
      <p style="font-size: 12px; color: #64748b;">${language === 'pt' ? 'Expira em 10 minutos.' : 'Expires in 10 minutes.'}</p>
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
        from: `Brazilian Clean <${fromEmail}>`,
        to: to,
        subject: subject,
        html: html
      })
    });

    const resData: any = await response.json();

    if (!response.ok) {
      console.error("[Resend Error]", resData);
      return { 
        statusCode: response.status, 
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: resData.message || 'Erro no provedor de e-mail' 
        }) 
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, code: code })
    };
  } catch (error: any) {
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ success: false, error: 'Falha interna ao disparar e-mail' }) 
    };
  }
};