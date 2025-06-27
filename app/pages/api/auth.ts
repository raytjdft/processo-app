import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await axios.post(process.env.TOKEN_URL || '', {
      grant_type: 'client_credentials',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    });

    const token = response.data.access_token;
    if (!token) {
      return res.status(400).json({ error: 'Failed to obtain token' });
    }

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Error obtaining token' });
  }
}