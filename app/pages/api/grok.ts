import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    console.log('Método inválido:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { grokText } = req.body;

  // Validar grokText
  if (!grokText || typeof grokText !== 'string' || grokText.trim().length === 0) {
    console.error('Parâmetro grokText inválido:', grokText);
    return res.status(400).json({ error: 'Missing or invalid grokText' });
  }

  // Verificar variáveis de ambiente
  console.log('GROK_API_URL:', process.env.GROK_API_URL);
  console.log('GROK_API_SECRET presente:', !!process.env.GROK_API_SECRET);
  if (!process.env.GROK_API_URL || !process.env.GROK_API_SECRET) {
    console.error('Erro: GROK_API_URL ou GROK_API_SECRET não definido');
    return res.status(500).json({ error: 'Configuração inválida: GROK_API_URL ou GROK_API_SECRET não definido' });
  }

  try {
    console.log('Enviando grokText para GROK_API_URL:', process.env.GROK_API_URL);
    const grokResponse = await axios.post(
      process.env.GROK_API_URL,
      {
        messages: [
          {
            role: 'user',
            content: grokText,
          },
        ],
        max_completion_tokens: 2048,
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        model: 'grok-3-dev',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROK_API_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Resposta do Grok:', grokResponse.status, grokResponse.data);

    // Extrair a resposta do Grok
    const grokResponseText = grokResponse.data.choices?.[0]?.message?.content || 'Resposta do Grok não contém texto';

    res.status(200).json({ grokResponse: grokResponseText });
  } catch (error: any) {
    console.error('Erro ao chamar a API do Grok:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'Sem resposta do servidor',
    });
    res.status(500).json({ error: 'Error processing Grok request', details: error.message });
  }
}