import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [processNumber, setProcessNumber] = useState('');
  const [requestType, setRequestType] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const requestTypes = [
    'Relatório de Apelação',
    'Minuta de Voto do Relatório de Apelação',
    'Relatório de Embargos de Declaração',
  ];

  const documentMap: { [key: string]: string[] } = {
    'Relatório de Apelação': ['Acórdão', 'Sentença', 'Apelação'],
    'Minuta de Voto do Relatório de Apelação': ['Acórdão', 'Sentença', 'Contrarrazões'],
    'Relatório de Embargos de Declaração': ['Acórdão', 'Recursos'],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      // Fetch documents from API
      const response = await axios.post('/api/documents', {
        processNumber,
        documentTypes: documentMap[requestType],
      });

      const fetchedDocs = response.data.documents;
      setDocuments(fetchedDocs);

      // Prepare instructions for Grok based on request type
      const instructions = `Processar documentos para ${requestType}. Documentos: ${fetchedDocs.join(', ')}.`;
      // Replace with actual Grok API call
      const grokResponse = await axios.post(process.env.GROK_API_URL || '', {
        documents: fetchedDocs,
        instructions,
      });

      setResult(grokResponse.data.result || 'Processamento concluído.');
    } catch (error) {
      setResult('Erro ao processar a solicitação.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Consulta de Processo</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Número do Processo</label>
          <input
            type="text"
            value={processNumber}
            onChange={(e) => setProcessNumber(e.target.value)}
            placeholder="Ex.: 740203-54.2024.8.07.0000"
            className="mt-1 p-2 border rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tipo de Pedido</label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
            required
          >
            <option value="">Selecione...</option>
            {requestTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Processando...' : 'Enviar'}
        </button>
      </form>
      {documents.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Documentos Obtidos:</h2>
          <ul className="list-disc pl-5">
            {documents.map((doc, index) => (
              <li key={index}>{doc}</li>
            ))}
          </ul>
        </div>
      )}
      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Resultado:</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}