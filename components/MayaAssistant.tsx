
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BrainCircuit, X, Minimize2, Maximize2, MessageSquare, ShieldCheck, TrendingUp, FileText } from 'lucide-react';
import { chatWithMaya } from '../services/geminiService';

const MayaAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'maya', text: string }[]>([
    { role: 'maya', text: 'Olá, equipe Kits Vital! Sou Maya, sua assistente estratégica. Em que posso ajudar na gestão de licitações hoje?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMsg = message;
    setMessage('');
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    // Mapeia o histórico do chat local para o formato de roles esperado pelo serviço (user/model)
    const historyForMaya = chat.map(m => ({
      role: (m.role === 'maya' ? 'model' : 'user') as 'user' | 'model',
      text: m.text
    }));

    // Fix: Access response.text as the service returns an object containing multiple properties
    const response = await chatWithMaya(userMsg, historyForMaya);
    setChat(prev => [...prev, { role: 'maya', text: response.text || 'Não consegui processar sua solicitação.' }]);
    setIsLoading(false);
  };

  return (
    <div className="mb-10 w-full animate-in fade-in slide-in-from-top-6 duration-700">
      <div className={`relative overflow-hidden transition-all duration-500 rounded-[3rem] border shadow-2xl ${
        isOpen ? 'h-[500px] bg-white border-blue-200' : 'h-32 bg-slate-950 border-slate-800'
      }`}>
        
        {/* Background Visual Effects */}
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
           <BrainCircuit size={300} className="text-blue-500" />
        </div>

        {/* Closed State Header */}
        {!isOpen && (
          <div className="h-full flex items-center justify-between px-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                  <Sparkles size={32} className="animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Maya: Cérebro Operacional Kits Vital</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Especialista em Licitações & Gestão Financeira</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="hidden lg:flex gap-3 mr-6">
                  <button onClick={() => { setMessage('Como calcular a margem líquida para este edital?'); setIsOpen(true); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">Análise Margem</button>
                  <button onClick={() => { setMessage('Redija uma impugnação por exigência abusiva de atestado técnico.'); setIsOpen(true); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">Impugnação</button>
               </div>
               <button 
                onClick={() => setIsOpen(true)}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
               >
                 Abrir Central Maya
               </button>
            </div>
          </div>
        )}

        {/* Open State Chat Interface */}
        {isOpen && (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Maya Intelligence</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Processando Contexto Kits Vital</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all">
                <Minimize2 size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-5 rounded-[2rem] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-50 mt-2 block">
                      {msg.role === 'maya' ? 'Maya Intelligence' : 'Kits Vital User'}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-5 rounded-[2rem] rounded-tl-none flex gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-white">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Pergunte sobre leis, cálculos ou peça para Maya redigir um documento..." 
                  className="flex-1 px-6 py-4 bg-slate-100 border-none rounded-2xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading}
                  className="p-4 bg-slate-950 text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MayaAssistant;
