import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    console.log('Método inválido:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { processNumber, documentTypes } = req.body;

  // Logar parâmetros recebidos
  console.log('Parâmetros recebidos:', { processNumber, documentTypes });

  // Validar parâmetros
  if (!processNumber || !documentTypes || !Array.isArray(documentTypes)) {
    console.error('Parâmetros inválidos:', { processNumber, documentTypes });
    return res.status(400).json({ error: 'Missing or invalid processNumber or documentTypes' });
  }

  // Normalizar e validar número do processo (20 dígitos, apenas números)
  const normalizedProcessNumber = processNumber.replace(/[-\.]/g, '');
  const processNumberRegex = /^\d{20}$/;
  if (!processNumberRegex.test(normalizedProcessNumber)) {
    console.error('Formato de número de processo inválido:', normalizedProcessNumber);
    return res.status(400).json({ error: 'Invalid process number format (must be 20 digits)' });
  }

  // Verificar API_URL
  console.log('API_URL:', process.env.API_URL);
  if (!process.env.API_URL) {
    console.error('Erro: API_URL não definido');
    return res.status(500).json({ error: 'Configuração inválida: API_URL não definido' });
  }

  try {
    console.log('Obtendo token da rota /api/auth...');
    const tokenResponse = await axios.post('http://localhost:3000/api/auth');
    const token = tokenResponse.data.token;

    if (!token) {
      console.error('Erro: Token não retornado pela rota /api/auth');
      return res.status(400).json({ error: 'Failed to obtain token' });
    }
    console.log('Token obtido:', token);

    // Obter lista de documentos
    const apiUrl = `${process.env.API_URL}/${normalizedProcessNumber}/documentos`;
    console.log('Chamando API para lista de documentos:', apiUrl);
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    console.log('Resposta da API:', response.status);

    // Validar resposta
    if (!response.data.documentos || !Array.isArray(response.data.documentos)) {
      console.error('Resposta da API não contém array de documentos:', response.data);
      return res.status(500).json({ error: 'Invalid response format from API: documentos not found or not an array' });
    }

    // Buscar texto de cada documento
    const documents: { id: string; text: string; type?: string }[] = [];
    for (const doc of response.data.documentos) {
      if (!doc.id) {
        console.warn('Documento sem id:', doc);
        continue;
      }
      if (documentTypes.includes(doc.tipo?.nome) && doc.arquivo?.tamanhoTexto > 0) {
        const docUrl = `${process.env.API_URL}/${normalizedProcessNumber}/documentos/${doc.id}/texto`;
        console.log('Buscando texto do documento:', docUrl);
        try {
          const docResponse = await axios.get(docUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
          console.log('Texto do documento obtido:', docResponse.status);
          console.log('Processando documento:', doc.tipo?.nome, doc.id, doc.arquivo?.tamanhoTexto);

          // Verificar se o retorno é uma string (texto puro) ou JSON com campo 'text'
          const text = typeof docResponse.data === 'string' ? docResponse.data : docResponse.data.text || 'Documento sem texto';
          documents.push({
            id: doc.id,
            text,
            type: doc.tipo?.nome,
          });
        } catch (docError: any) {
          console.error('Erro ao buscar texto do documento:', docUrl, {
            message: docError.message,
            response: docError.response ? {
              status: docError.response.status,
              data: docError.response.data,
            } : 'Sem resposta do servidor',
          });
        }
      }
    }

    // Organizar texto para Grok
    const grokText = documents
      .map((doc, index) => `Documento ${index + 1} (${doc.type || 'Desconhecido'}):\n${doc.text}\n\n`)
      .join('---\n');
    console.log('Texto preparado para Grok:', grokText);

    res.status(200).json({ documents, grokText });
  } catch (error: any) {
    console.error('Erro ao buscar documentos:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'Sem resposta do servidor',
    });
    res.status(500).json({ error: 'Error fetching documents', details: error.message });
  }
}