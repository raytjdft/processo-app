import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    console.log('Método inválido:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Logar variáveis de ambiente para depuração
  // console.log('Variáveis de ambiente:');
  // console.log('TOKEN_URL:', process.env.TOKEN_URL);
  // console.log('CLIENT_ID:', process.env.CLIENT_ID);
  // console.log('CLIENT_SECRET:', process.env.CLIENT_SECRET ? '[HIDDEN]' : 'UNDEFINED');

  // Verificar se as variáveis de ambiente estão definidas
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    console.log('Erro: Variáveis de ambiente faltando');
    return res.status(500).json({ error: 'Configuração inválida: variáveis de ambiente faltando' });
  }

  try {
    console.log('Iniciando requisição para obter token...');
    const response = await axios.post(process.env.TOKEN_URL, {
      grant_type: 'client_credentials',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('Resposta da requisição:', response.status);

    const token = response.data.access_token;
    if (!token) {
      console.log('Erro: Token não encontrado na resposta');
      return res.status(400).json({ error: 'Failed to obtain token' });
    }
    res.status(200).json({ token });
  } catch (error: any) {
    console.error('Erro ao obter token:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'Sem resposta do servidor',
    });
    res.status(500).json({ error: 'Error obtaining token', details: error.message });
  }
}