import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Expense } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const formatText = (txt: string) => {
        return txt
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/\n/g, '<br />');
    };

    return <div dangerouslySetInnerHTML={{ __html: formatText(text) }} />;
};

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse [animation-delay:0.4s]"></div>
    </div>
);

interface AiAdvisorProps {
  budget: number;
  dailyLimit: number;
  expenses: Expense[];
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ budget, dailyLimit, expenses }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    chatHistoryRef.current?.scrollTo({ top: chatHistoryRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getFinancialAdvice(input, budget, dailyLimit, expenses);
      const modelMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: response.text,
        sources: response.sources,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: "Hubo un problema al conectar con el Asesor de Familia Jhonny."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[85vh] animate-fade-in bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header del Chat */}
      <div className="bg-indigo-600 p-4 text-white shadow-md z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🤖</span> Asesor Familia Jhonny
          </h2>
          <p className="text-indigo-100 text-xs mt-1">Inteligencia Artificial experta en finanzas ($U)</p>
      </div>
      
      {/* Área de Mensajes */}
      <div ref={chatHistoryRef} className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto flex flex-col space-y-4 scroll-smooth">
        {messages.length === 0 && (
            <div className="text-center text-gray-500 self-center m-auto max-w-xs">
                <div className="text-4xl mb-4">🇺🇾</div>
                <p className="font-semibold text-lg">¡Hola Familia Jhonny!</p>
                <p className="text-sm mt-2">Soy su asesor financiero personal. Analizaré sus gastos en Pesos Uruguayos y buscaré oportunidades de ahorro.</p>
                <p className="text-xs mt-4 text-indigo-500 font-medium">Pregúntame: "¿Cómo vamos hoy con el límite diario?"</p>
            </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-2xl p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-600'}`}>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <SimpleMarkdown text={msg.text} />
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-indigo-400/30 dark:border-gray-600">
                  <h4 className="text-xs font-semibold mb-1 opacity-80">Fuentes Consultadas:</h4>
                  <ul className="text-xs space-y-1">
                    {msg.sources.map((source, index) => (
                      <li key={index}>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="underline opacity-80 hover:opacity-100 truncate block">
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-4 rounded-2xl rounded-bl-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm">
              <LoadingSpinner />
              <span className="text-xs text-gray-400 mt-2 block">Analizando finanzas...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta..." 
            className="flex-1 pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-900 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-inner"
            disabled={isLoading}
            />
            <button 
            type="submit" 
            className="absolute right-2 top-1.5 bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={isLoading || !input.trim()}
            >
                <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
        </form>
      </div>
    </div>
  );
};