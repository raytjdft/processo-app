import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { processNumber, documentTypes } = req.body;

  if (!processNumber || !documentTypes) {
    return res.status(400).json({ error: 'Missing processNumber or documentTypes' });
  }

  try {
    // Get token
    const tokenResponse = await axios.post('http://localhost:3000/api/auth');
    const token = tokenResponse.data.token;

    // Fetch documents
    const apiUrl = `${process.env.API_URL}/${processNumber}/documentos`;
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    // Mock document filtering (replace with actual logic based on documentTypes)
    const documents = response.data.map((doc: any) => doc.text || 'Documento');
    res.status(200).json({ documents });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
}