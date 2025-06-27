import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [processNumber, setProcessNumber] = useState('');
  const [requestType, setRequestType] = useState('');
  const [documents, setDocuments] = useState<{ id: string; text: string; type?: string }[]>([]);
  const [grokText, setGrokText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const requestTypes = [
    'Relatório de Apelação',
    'Minuta de Voto do Relatório de Apelação',
    'Relatório de Embargos de Declaração',
    'Teste de Documentos', // Para testes locais
  ];

  const documentMap: { [key: string]: string[] } = {
    'Relatório de Apelação': ['Agravo', 'Contrarrazões', 'Apelação'],
    'Minuta de Voto do Relatório de Apelação': ['Acórdão', 'Sentença', 'Contrarrazões'],
    'Relatório de Embargos de Declaração': ['Acórdão', 'Recursos'],
    'Teste de Documentos': ['44ee91ba-de66-5c1a-acff-124d691843f0'], // Exemplo de ID de documento para teste
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');
    setDocuments([]);
    setGrokText('');

    // Normalizar número do processo
    const normalizedProcessNumber = processNumber.replace(/[-\.]/g, '');

    try {
      // Fetch documents from API
      const response = await axios.post('/api/documents', {
        processNumber: normalizedProcessNumber,
        documentTypes: documentMap[requestType],
      });

      const { documents, grokText } = response.data;
      setDocuments(documents);
      setGrokText(grokText);

      // Placeholder para chamada ao Grok
      /*
      const grokResponse = await axios.post(process.env.GROK_API_URL || '', {
        documents: grokText,
        instructions: `Processar documentos para ${requestType}.`,
      });
      setResult(grokResponse.data.result || 'Processamento concluído.');
      */
      setResult('Textos dos documentos carregados. Verifique antes de enviar ao Grok.');
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
          {documents.map((doc, index) => (
            <div key={index} className="mt-2">
              <h3 className="text-md font-medium">Documento {index + 1} ({doc.type || 'Desconhecido'})</h3>
              <pre className="bg-gray-100 p-2 rounded">{doc.text}</pre>
            </div>
          ))}
        </div>
      )}
      {grokText && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Texto Preparado para Grok:</h2>
          <pre className="bg-gray-100 p-2 rounded">{grokText}</pre>
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