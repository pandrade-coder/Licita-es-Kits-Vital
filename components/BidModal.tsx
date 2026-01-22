
import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, CheckCircle2, Loader2, Sparkles, FileText, Trash2, Eye, ShieldCheck, FlaskConical, ClipboardList, Hash, MapPin, Info, Tag, Calendar, DollarSign, FileUp } from 'lucide-react';
import { BidStatus, Bid, BidDocument } from '../types';
import { extractBidMetadata } from '../services/geminiService';
import { DataService } from '../services/dataService';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bid: any) => void;
  initialData?: Bid | null;
  launchMode?: 'manual' | 'ai';
}

const BidModal: React.FC<BidModalProps> = ({ isOpen, onClose, onSave, initialData, launchMode = 'manual' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentView, setCurrentView] = useState<'upload' | 'form'>(launchMode === 'ai' && !initialData ? 'upload' : 'form');
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    order: '', uasg: '', title: '', biddingNumber: '', organ: '',
    disputedItem: '', date: '', value: 0, anvisa: false, sample: false,
    status: BidStatus.LAUNCHED, notes: ''
  });

  const [bidDocuments, setBidDocuments] = useState<BidDocument[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        order: initialData.order || '', uasg: initialData.uasg || '',
        title: initialData.title || '', biddingNumber: initialData.biddingNumber || '',
        organ: initialData.organ || '',
        disputedItem: initialData.disputedItem || '',
        date: initialData.date ? initialData.date.substring(0, 16) : '',
        value: initialData.value || 0, anvisa: !!initialData.anvisa,
        sample: !!initialData.sample, status: initialData.status || BidStatus.LAUNCHED,
        notes: initialData.notes || ''
      });
      setBidDocuments(initialData.documents || []);
      setCurrentView('form');
    } else {
      setFormData({
        order: '', uasg: '', title: '', biddingNumber: '', organ: '',
        disputedItem: '', date: '', value: 0, anvisa: false, sample: false,
        status: BidStatus.LAUNCHED, notes: ''
      });
      setBidDocuments([]);
      setCurrentView(launchMode === 'ai' ? 'upload' : 'form');
    }
  }, [initialData, isOpen, launchMode]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const publicUrl = await DataService.uploadFile(file, 'bids');
      if (!publicUrl) throw new Error("Erro ao enviar arquivo para o servidor.");

      const newDoc: BidDocument = {
        id: DataService.generateId(),
        name: file.name,
        type: file.type,
        uploadDate: new Date().toISOString(),
        url: publicUrl 
      };

      // Atualiza a lista de documentos imediatamente para evitar que "suma"
      setBidDocuments(prev => [...prev, newDoc]);

      if (currentView === 'upload') {
        const reader = new FileReader();
        reader.onload = async () => {
          const b64 = (reader.result as string).split(',')[1];
          try {
            const extracted = await extractBidMetadata(b64, file.type);
            setFormData(prev => ({
              ...prev,
              organ: extracted.organ || prev.organ,
              biddingNumber: extracted.biddingNumber || prev.biddingNumber,
              title: extracted.title || prev.title,
              date: extracted.date ? extracted.date.substring(0, 16) : prev.date,
              notes: extracted.notes || prev.notes
            }));
          } catch (err) {
            console.warn("IA não conseguiu extrair dados, procedendo manualmente.");
          }
          setCurrentView('form');
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      alert("Falha no upload: " + err.message);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...initialData,
      ...formData,
      id: initialData?.id || DataService.generateId(),
      documents: bidDocuments,
      items: initialData?.items || []
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col border border-slate-100">
        
        <div className="flex items-center justify-between p-8 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {currentView === 'upload' ? 'Processar com Maya IA' : (initialData ? 'Editar Licitação' : 'Nova Licitação Kits Vital')}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">Módulo de Lançamento Estratégico</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-300 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          {currentView === 'upload' ? (
            <div className="p-20 flex flex-col items-center justify-center text-center space-y-10 bg-white h-full">
              <div className="w-24 h-24 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center shadow-2xl">
                {isProcessing ? <Loader2 size={40} className="animate-spin text-blue-400" /> : <FileUp size={40} />}
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Análise de Edital</h3>
                <p className="text-sm text-slate-400 font-medium">Maya fará a leitura do PDF e preencherá os campos automaticamente.</p>
              </div>
              <div className="flex flex-col items-center gap-6 w-full max-w-xs">
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                  {isProcessing ? 'Extraindo Dados...' : 'SELECIONAR EDITAL'}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
                <button onClick={() => setCurrentView('form')} className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pular para Lançamento Manual</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-10 space-y-12">
              
              {/* SEÇÃO 1: PROTOCOLO */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                   <Hash size={14} className="text-blue-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação Básica</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Ordem Interna (OI)</label>
                    <input required type="text" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold shadow-sm focus:border-blue-500 transition-all" value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})} placeholder="000/2024" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Pregão Nº</label>
                    <input required type="text" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold shadow-sm focus:border-blue-500 transition-all" value={formData.biddingNumber} onChange={e => setFormData({...formData, biddingNumber: e.target.value})} placeholder="00/2024" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">UASG</label>
                    <input type="text" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold shadow-sm focus:border-blue-500 transition-all" value={formData.uasg} onChange={e => setFormData({...formData, uasg: e.target.value})} placeholder="987654" />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: TÍTULO (LARGURA TOTAL) */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                   <Tag size={14} className="text-blue-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objeto da Disputa</span>
                </div>
                <div className="w-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Título / Objeto Completo do Edital</label>
                    <textarea 
                      required 
                      rows={3}
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-[2rem] outline-none font-bold shadow-sm focus:border-blue-500 transition-all resize-none" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                      placeholder="Descreva detalhadamente o que está sendo licitado..." 
                    />
                </div>
              </div>

              {/* SEÇÃO 3: ÓRGÃO, DATA E VALOR */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                   <MapPin size={14} className="text-blue-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Órgão e Vigência</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Órgão Licitante</label>
                    <input required type="text" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold shadow-sm focus:border-blue-500 transition-all" value={formData.organ} onChange={e => setFormData({...formData, organ: e.target.value})} placeholder="Nome da Prefeitura ou Secretaria..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Data/Hora Disputa</label>
                    <input required type="datetime-local" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold shadow-sm focus:border-blue-500 transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-emerald-600 uppercase mb-2 block px-1">Valor Estimado (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                      <input required type="number" step="0.01" className="w-full pl-12 pr-5 py-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl outline-none font-black text-emerald-700 shadow-sm focus:border-emerald-500 transition-all" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} placeholder="0,00" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 4: ITENS E OBSERVAÇÕES (LARGURA TOTAL) */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2 px-2">
                    <ClipboardList size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhamento Técnico</span>
                 </div>
                 <div className="w-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Itens / Lotes de Interesse</label>
                    <input type="text" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold shadow-sm focus:border-blue-500 transition-all" value={formData.disputedItem} onChange={e => setFormData({...formData, disputedItem: e.target.value})} placeholder="Ex: Lote 01, Lote 02..." />
                 </div>
                 <div className="w-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Observações Operacionais e Exigências Técnicas</label>
                    <textarea 
                      rows={6} 
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-[2rem] outline-none font-medium shadow-sm focus:border-blue-500 transition-all" 
                      value={formData.notes} 
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="Cole aqui exigências de atestados, marcas proibidas, prazos de entrega específicos ou observações de margem..."
                    />
                 </div>
              </div>

              {/* SEÇÃO 5: COMPLIANCE E STATUS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-2">
                      <ShieldCheck size={14} className="text-blue-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={() => setFormData({...formData, anvisa: !formData.anvisa})} className={`flex items-center justify-center gap-3 py-6 rounded-[2rem] border-2 transition-all ${formData.anvisa ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-100' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-200'}`}>
                        <ShieldCheck size={24} />
                        <span className="text-xs font-black uppercase tracking-widest">Exige ANVISA</span>
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, sample: !formData.sample})} className={`flex items-center justify-center gap-3 py-6 rounded-[2rem] border-2 transition-all ${formData.sample ? 'bg-amber-500 border-amber-400 text-white shadow-xl shadow-amber-100' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-200'}`}>
                        <FlaskConical size={24} />
                        <span className="text-xs font-black uppercase tracking-widest">Exige Amostra</span>
                      </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-2">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Situação de Fluxo</span>
                  </div>
                  <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold shadow-sm focus:border-blue-500 appearance-none cursor-pointer transition-all" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    {Object.values(BidStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* SEÇÃO 6: ARQUIVOS */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                   <FileText size={14} className="text-blue-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arquivos do Processo ({bidDocuments.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bidDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm animate-in zoom-in">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shrink-0"><FileText size={20} /></div>
                        <span className="text-xs font-bold text-slate-700 truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {doc.url && <button type="button" onClick={() => setViewingUrl(doc.url!)} className="p-2 text-blue-400 hover:text-blue-600"><Eye size={16} /></button>}
                        <button type="button" onClick={() => setBidDocuments(prev => prev.filter(d => d.id !== doc.id))} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-all min-h-[64px] group">
                    {isProcessing ? <Loader2 size={20} className="animate-spin text-blue-500" /> : <Upload size={20} className="text-slate-300 group-hover:text-blue-500" />}
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">Adicionar Anexo</p>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.png" />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-10 border-t border-slate-100 bg-white flex gap-6 shrink-0">
          <button onClick={onClose} className="px-12 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
          <button onClick={handleSubmit} disabled={isProcessing} className="flex-1 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
            {initialData ? 'Salvar Alterações' : 'Confirmar Lançamento'}
          </button>
        </div>
      </div>

      {viewingUrl && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[250] flex items-center justify-center p-8">
          <div className="bg-white w-full h-full rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <h4 className="font-black text-slate-800 text-lg uppercase px-4">Visualização de Arquivo</h4>
              <button onClick={() => setViewingUrl(null)} className="p-4 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <iframe src={viewingUrl} className="flex-1 border-none" title="PDF Viewer" />
          </div>
        </div>
      )}
    </div>
  );
};

export default BidModal;
