
import { Handler } from '@netlify/functions';

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
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid Request Body' }) };
  }

  const { to, firstName } = body;

  if (!to || !firstName) {
    return { 
      statusCode: 400, 
      headers,
      body: JSON.stringify({ success: false, error: 'Missing recipient email or name' }) 
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@mail.brazilianclean.org';

  if (!apiKey) {
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ success: false, error: 'Server configuration error' }) 
    };
  }

  const subject = `Bem-vinda à Brazilian Clean, ${firstName} 💙`;
  
  const html = `
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #002868; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Brazilian Clean</h1>
        <div style="height: 4px; width: 60px; background: #009739; margin: 15px auto; border-radius: 2px;"></div>
      </div>
      
      <p style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 24px;">Olá, ${firstName},</p>
      
      <p style="margin-bottom: 20px;">Seja muito bem-vinda à <strong>Brazilian Clean</strong>.</p>
      
      <p style="margin-bottom: 20px;">Receber você aqui é motivo de gratidão. Mais do que fazer parte de uma plataforma, você agora faz parte de uma caminhada, de uma história que está sendo construída com propósito, trabalho e respeito.</p>
      
      <p style="margin-bottom: 20px;">Acreditamos no cuidado brasileiro, no valor do seu trabalho e no crescimento que acontece quando caminhamos juntos. Nossa missão é abrir portas, conectar oportunidades e criar um ambiente onde você possa crescer com segurança, dignidade e reconhecimento.</p>
      
      <p style="margin-bottom: 32px;">Muito obrigado por escolher caminhar conosco. Estamos felizes por ter você fazendo parte da nossa história.</p>
      
      <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #f1f5f9; font-style: italic;">
        <p style="margin: 0; color: #64748b; font-size: 15px;">Com carinho e gratidão,</p>
        <p style="margin: 5px 0 0 0; color: #002868; font-weight: 700; font-size: 16px;">Equipe Brazilian Clean</p>
      </div>
      
      <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">
        Brazilian Service • American Quality
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
        from: `Brazilian Clean <${fromEmail}>`,
        to: to,
        subject: subject,
        html: html
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Resend Error]", errorData);
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Email service failure' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Internal server error' }) };
  }
};
