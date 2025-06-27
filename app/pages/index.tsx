'use client';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [processNumber, setProcessNumber] = useState('');
  const [requestType, setRequestType] = useState('');
  const [documents, setDocuments] = useState<{ id: string; text: string; type?: string }[]>([]);
  const [grokText, setGrokText] = useState('');
  const [grokResponse, setGrokResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [grokLoading, setGrokLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const requestTypes = [
    'Relatório de Apelação',
    'Minuta de Voto do Relatório de Apelação',
    'Relatório de Embargos de Declaração',
    'Teste de Documentos',
  ];

  const documentMap: { [key: string]: string[] } = {
    'Relatório de Apelação': ['Agravo', 'Contrarrazões', 'Apelação'],
    'Minuta de Voto do Relatório de Apelação': ['Acórdão', 'Sentença', 'Contrarrazões'],
    'Relatório de Embargos de Declaração': ['Acórdão', 'Recursos'],
    'Teste de Documentos': ['44ee91ba-de66-5c1a-acff-124d691843f0'],
  };

  const validateDocuments = (docs: { id: string; text: string; type?: string }[]) => {
    if (!docs || docs.length === 0) {
      return 'Nenhum documento encontrado para o número do processo fornecido.';
    }
    const hasValidText = docs.every((doc) => doc.text && doc.text.trim().length > 0);
    if (!hasValidText) {
      return 'Um ou mais documentos não possuem texto válido.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationError('');
    setDocuments([]);
    setGrokText('');
    setGrokResponse('');

    // Normalizar número do processo
    const normalizedProcessNumber = processNumber.replace(/[-\.]/g, '');

    try {
      const response = await axios.post('/api/documents', {
        processNumber: normalizedProcessNumber,
        documentTypes: documentMap[requestType] || ['Acórdão', 'Sentença'],
      });

      const { documents, grokText } = response.data;
      setDocuments(documents || []);
      setGrokText(grokText || '');

      // Validação dos documentos
      const validationResult = validateDocuments(documents);
      if (validationResult) {
        setValidationError(validationResult);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao processar a solicitação.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrokSubmit = async () => {
    setGrokLoading(true);
    setError('');
    setValidationError('');
    setGrokResponse('');

    // Validação dos documentos antes de enviar ao Grok
    const validationResult = validateDocuments(documents);
    if (validationResult) {
      setValidationError(validationResult);
      setGrokLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/grok', {
        grokText,
      });

      const { grokResponse } = response.data;
      setGrokResponse(grokResponse || 'Processamento concluído.');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao processar a solicitação no Grok.');
      console.error('Erro ao chamar Grok:', error);
    } finally {
      setGrokLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Consulta de Processos</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label htmlFor="processNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Número do Processo
          </label>
          <input
            type="text"
            id="processNumber"
            value={processNumber}
            onChange={(e) => setProcessNumber(e.target.value)}
            placeholder="Ex.: 740203-54.2024.8.07.0000"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            required
          />
        </div>
        <div>
          <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Pedido
          </label>
          <select
            id="requestType"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Carregando Documentos...
            </>
          ) : (
            'Carregar Documentos'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {validationError && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
          {validationError}
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Documentos Enviados</h2>
          {documents.map((doc, index) => (
            <div key={doc.id} className="mb-6 p-4 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Documento {index + 1} ({doc.type || 'Desconhecido'})
              </h3>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 overflow-auto max-h-96">
                {doc.text}
              </pre>
            </div>
          ))}
          <button
            onClick={handleGrokSubmit}
            disabled={grokLoading || validationError}
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center mt-4"
          >
            {grokLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Enviando para o Grok...
              </>
            ) : (
              'Enviar para o Grok'
            )}
          </button>
        </div>
      )}

      {grokResponse && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Resposta do Grok</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm text-gray-600">
            {grokResponse}
          </div>
        </div>
      )}
    </div>
  );
}