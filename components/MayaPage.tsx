
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, Bot, X, FileText, Trash2, Database, Plus, Search, 
  Radar, Globe, ExternalLink, Loader2, Paperclip, FileIcon
} from 'lucide-react';
import { chatWithMaya } from '../services/geminiService';
import { DataService } from '../services/dataService';
import { KnowledgeBaseDoc, BidStatus } from '../types';

interface MayaPageProps {
  initialContext?: { bidId?: string; initialPrompt?: string } | null;
}

const MayaPage: React.FC<MayaPageProps> = ({ initialContext }) => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'model', text: string, hasFile?: boolean, isAction?: boolean, sources?: any[] }[]>([
    { role: 'model', text: 'Olá, equipe **Kits Vital**! Sou **Maya AI**. Sincronizei agora mesmo com todos os dados da empresa. Posso analisar o financeiro, buscar novas licitações para o nosso radar ou redigir documentos. Como posso atuar agora?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ file: File, base64: string, mimeType: string } | null>(null);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeBaseDoc[]>(() => DataService.loadKnowledge());
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const masterInputRef = useRef<HTMLInputElement>(null);

  // Efeito para carregar contexto vindo de outras páginas (Foguete/IA)
  useEffect(() => {
    if (initialContext?.initialPrompt) {
      handleSend(initialContext.initialPrompt);
    }
  }, [initialContext]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat, isLoading]);

  const executeSystemAction = (call: any) => {
    const bids = DataService.loadBids() || [];
    if (call.name === 'update_bid_status') {
      const { bidId, newStatus } = call.args;
      const updatedBids = bids.map(b => b.id === bidId ? { ...b, status: newStatus as BidStatus } : b);
      DataService.persistBids(updatedBids);
      return `Status atualizado para ${newStatus}.`;
    }
    return "Ação executada.";
  };

  const handleSend = async (customMessage?: string) => {
    const finalMessage = customMessage || message;
    if ((!finalMessage.trim() && !selectedFile) || isLoading) return;
    
    const userMsg = finalMessage || (selectedFile ? `Analise este documento: ${selectedFile.file.name}` : '');
    const fileToSend = selectedFile;
    
    setMessage('');
    setSelectedFile(null);

    setChat(prev => [...prev, { role: 'user', text: userMsg, hasFile: !!fileToSend }]);
    setIsLoading(true);

    try {
      const history = chat.map(m => ({
        role: m.role,
        text: m.text
      }));

      const result = await chatWithMaya(
        userMsg, 
        history, 
        fileToSend ? { data: fileToSend.base64, mimeType: fileToSend.mimeType } : undefined
      );
      
      if (result.functionCalls) {
        for (const call of result.functionCalls) {
          const actionResult = executeSystemAction(call);
          setChat(prev => [...prev, { role: 'model', text: `⚙️ Ação: ${actionResult}`, isAction: true }]);
        }
      }

      setChat(prev => [...prev, { 
        role: 'model', 
        text: result.text || 'Processamento concluído.',
        sources: result.groundingChunks
      }]);
    } catch (error) {
      setChat(prev => [...prev, { role: 'model', text: 'Maya encontrou um problema técnico ao processar sua mensagem.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2"></div>;
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-blue-900">$1</strong>');
      return <div key={i} className="mb-1 text-sm font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isMaster = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (isMaster) {
        const newDoc: KnowledgeBaseDoc = { id: DataService.generateId(), name: file.name, mimeType: file.type, base64: base64, addedAt: new Date().toISOString() };
        const updatedKnowledge = [newDoc, ...knowledgeDocs];
        setKnowledgeDocs(updatedKnowledge);
        DataService.persistKnowledge(updatedKnowledge);
      } else {
        setSelectedFile({ file, base64, mimeType: file.type });
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 relative">
      {isKnowledgeOpen && (
        <div className="absolute inset-y-0 right-0 w-96 bg-white border-l border-slate-100 shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-500">
          <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800">Base Mestre</h3>
            <button onClick={() => setIsKnowledgeOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <button onClick={() => masterInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-50 transition-all text-slate-400">
              <Plus size={24} />
              <span className="text-[10px] font-black uppercase">Treinar Nova Proposta</span>
            </button>
            <input type="file" ref={masterInputRef} className="hidden" onChange={(e) => handleFileSelect(e, true)} />
            <div className="space-y-3">
              {knowledgeDocs.map(doc => (
                <div key={doc.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-blue-500" />
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">{doc.name}</p>
                  </div>
                  <button onClick={() => { const u = knowledgeDocs.filter(d => d.id !== doc.id); setKnowledgeDocs(u); DataService.persistKnowledge(u); }} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
               <Sparkles size={32} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Maya AI Intelligence</h2>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Radar Ativo</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSend("Maya, radar ativado! Busque no Google Search novas licitações para Kits Vital agendadas para os próximos 14 dias.")}
              className="px-6 py-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center gap-3 hover:bg-blue-600 hover:text-white transition-all group"
            >
               <Radar size={18} className="group-hover:animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest">Radar: Próximos 14 Dias</span>
            </button>
            <button onClick={() => setIsKnowledgeOpen(true)} className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-slate-300">
               <Database size={18} className="text-blue-400" />
               <span className="text-[10px] font-black uppercase tracking-widest">Base Mestre</span>
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50">
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] flex flex-col gap-2">
                <div className={`p-6 rounded-[2.5rem] shadow-sm flex gap-4 ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : msg.isAction ? 'bg-slate-950 text-emerald-400 rounded-tl-none font-mono text-[11px]' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                }`}>
                  {msg.role === 'model' && !msg.isAction && <Bot size={18} className="text-blue-600 shrink-0" />}
                  <div className="flex-1 text-sm font-medium leading-relaxed">{formatText(msg.text)}</div>
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="px-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-500">
                    <div className="w-full flex items-center gap-2 mb-1">
                      <Globe size={10} className="text-slate-400" />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fontes encontradas:</span>
                    </div>
                    {msg.sources.map((chunk, idx) => chunk.web && (
                      <a 
                        key={idx} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-bold text-blue-600 hover:bg-blue-50 transition-all shadow-sm group"
                      >
                        <ExternalLink size={10} />
                        <span className="truncate max-w-[150px]">{chunk.web.title || 'Ver Portal'}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] flex gap-3 items-center">
                <Loader2 size={18} className="text-blue-600 animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maya está varrendo os portais...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t bg-white">
          {selectedFile && (
            <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-2xl animate-in slide-in-from-bottom-2">
               <div className="p-2 bg-blue-600 text-white rounded-lg"><FileIcon size={16} /></div>
               <div className="flex-1">
                 <p className="text-xs font-bold text-blue-900 truncate">{selectedFile.file.name}</p>
                 <p className="text-[9px] text-blue-500 font-black uppercase">Arquivo pronto para envio</p>
               </div>
               <button onClick={() => setSelectedFile(null)} className="p-2 text-blue-400 hover:text-rose-500"><Trash2 size={18} /></button>
            </div>
          )}
          <div className="flex gap-4">
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e, false)} />
            <button onClick={() => fileInputRef.current?.click()} className="p-5 bg-slate-100 text-slate-400 hover:text-blue-600 rounded-[2rem] border border-slate-100">
              <Paperclip size={24} />
            </button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Pergunte ou peça para Maya agir..." 
                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-inner"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
            </div>
            <button onClick={() => handleSend()} disabled={isLoading} className="px-10 bg-slate-950 text-white rounded-[2rem] hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center">
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MayaPage;
