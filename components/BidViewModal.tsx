
import React, { useState, useMemo } from 'react';
import { X, Edit2, FileText, ClipboardList, Calendar as CalendarIcon, MapPin, Info, Box, ShieldAlert, Search, Factory, Tag, Cpu, DollarSign, TrendingUp, Target, Download, Eye, Paperclip, Loader2, Hash, Trash2, CheckCircle2, FlaskConical, ShieldCheck, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { Bid, BidStatus, BidDocument } from '../types';
import { STATUS_COLORS, STATUS_ICONS } from '../constants';
import { DataService } from '../services/dataService';

interface BidViewModalProps {
  bid: Bid;
  onClose: () => void;
  onOpenEdit: (bid: Bid) => void;
  onUpdateBid?: (bid: Bid) => void;
  formatCurrency: (val: number) => string;
  formatDate: (dateStr: string) => string;
}

const BidViewModal: React.FC<BidViewModalProps> = ({ bid, onClose, onOpenEdit, onUpdateBid, formatCurrency, formatDate }) => {
  const [viewingDoc, setViewingDoc] = useState<BidDocument | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // AGRUPAMENTO DE FASES PARA O STEPPER
  const phases = [
    { 
      label: 'Preparação', 
      statuses: [BidStatus.LAUNCHED, BidStatus.INSERT_MODEL, BidStatus.READY_WAITING] 
    },
    { 
      label: 'Disputa', 
      statuses: [BidStatus.WON_AUCTION, BidStatus.PROPOSAL_SENT, BidStatus.IN_DISPUTE] 
    },
    { 
      label: 'Habilitação', 
      statuses: [BidStatus.WAITING_SAMPLES, BidStatus.SAMPLES_SENT, BidStatus.WAITING_HOMOLOGATION, BidStatus.HOMOLOGATED] 
    },
    { 
      label: 'Logística', 
      statuses: [BidStatus.COMMITMENT_GENERATED, BidStatus.PRODUCT_ORDERED, BidStatus.PRODUCT_PICKED, BidStatus.PRODUCT_SHIPPED] 
    },
    { 
      label: 'Financeiro', 
      statuses: [BidStatus.WAITING_PAYMENT, BidStatus.PAID_CONCLUDED] 
    }
  ];

  const currentPhaseIndex = phases.findIndex(p => p.statuses.includes(bid.status));
  const isLost = bid.status === BidStatus.LOST;

  const calculateBidTotal = (bid: Bid) => {
    return bid.items.reduce((acc, item) => {
      const unitValue = item.winningPrice || item.referencePrice || item.minPrice || 0;
      return acc + (unitValue * item.quantity);
    }, 0);
  };

  const totalCalculado = calculateBidTotal(bid);

  // Use URL directly if available, otherwise fallback to base64 download
  const handleDownload = async (doc: BidDocument) => {
    if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (doc.base64) {
      setIsDownloading(doc.id);
      try {
        const link = document.createElement('a');
        link.href = `data:${doc.type || 'application/pdf'};base64,${doc.base64}`;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) { 
        alert("Erro ao processar download."); 
      } finally { 
        setIsDownloading(null); 
      }
    } else {
      alert("Arquivo não disponível para download.");
    }
  };

  // Preview handles either URL or base64 data
  const handlePreview = async (doc: BidDocument) => {
    if (doc.url || doc.base64) {
      setViewingDoc(doc);
    } else {
      alert("Arquivo não disponível para visualização.");
    }
  };

  const handleDeleteDoc = (docId: string) => {
    if (window.confirm("Deseja apagar este documento?")) {
      if (onUpdateBid) onUpdateBid({ ...bid, documents: bid.documents.filter(d => d.id !== docId) });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">
        
        {/* HEADER ESCURO ESTRATÉGICO */}
        <div className="relative bg-slate-950 p-10 overflow-hidden shrink-0">
           <div className="absolute top-0 right-0 p-10 opacity-5">
              <ClipboardList size={300} className="text-white" />
           </div>
           
           <div className="z-10 flex justify-between items-start relative">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${STATUS_COLORS[bid.status]}`}>
                    {STATUS_ICONS[bid.status]} {bid.status}
                  </span>
                  <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                    OI: {bid.order || '---'}
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                    Nº {bid.biddingNumber}
                  </div>
                </div>
                <h2 className="text-4xl font-black text-white leading-tight max-w-3xl tracking-tight">{bid.title}</h2>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin size={14} className="text-blue-500" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{bid.organ}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 min-w-fit">
                <button onClick={onClose} className="p-3 bg-white/5 hover:bg-rose-500 hover:text-white text-white rounded-2xl transition-all mb-6">
                  <X size={24} />
                </button>
                <div className="text-right bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
                  <p className="text-emerald-400 text-3xl font-black tracking-tight">{formatCurrency(totalCalculado)}</p>
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Valor Total Consolidado</p>
                </div>
              </div>
           </div>
        </div>

        {/* STEPPER COMPACTO POR FASES */}
        <div className="px-10 py-8 bg-slate-50 border-b shrink-0">
           <div className="max-w-4xl mx-auto">
              {isLost ? (
                <div className="flex items-center justify-center gap-4 py-4 bg-rose-50 border border-rose-100 rounded-3xl shadow-sm">
                   <AlertCircle size={24} className="text-rose-600" />
                   <h4 className="text-rose-800 font-black uppercase tracking-widest text-sm">Processo Finalizado: Licitação Perdida</h4>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jornada da Licitação Kits Vital</span>
                    <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full shadow-lg shadow-blue-200">
                       <Clock size={12} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Estágio: {bid.status}</span>
                    </div>
                  </div>
                  <div className="relative flex justify-between">
                    <div className="absolute top-5 left-0 w-full h-1.5 bg-slate-200 rounded-full -z-0"></div>
                    <div 
                      className="absolute top-5 left-0 h-1.5 bg-blue-600 rounded-full transition-all duration-1000 -z-0 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                      style={{ width: `${(currentPhaseIndex / (phases.length - 1)) * 100}%` }}
                    />
                    
                    {phases.map((phase, idx) => {
                      const isActive = idx <= currentPhaseIndex;
                      const isCurrent = idx === currentPhaseIndex;
                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                           <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm ${
                             isCurrent ? 'bg-blue-600 border-white ring-4 ring-blue-500/20 scale-110' : 
                             isActive ? 'bg-blue-600 border-white' : 'bg-white border-slate-300 text-slate-300'
                           }`}>
                             {isActive ? <CheckCircle2 size={20} className="text-white" /> : <div className="w-2 h-2 bg-slate-300 rounded-full" />}
                           </div>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                             {phase.label}
                           </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-white">
           
           {/* GRADE DE RESUMO TÉCNICO DETALHADO */}
           <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { icon: <ClipboardList />, label: 'Nº Pregão', value: bid.biddingNumber, color: 'bg-blue-50 text-blue-600' },
                { icon: <Hash />, label: 'UASG (Portal)', value: bid.uasg || '---', color: 'bg-emerald-50 text-emerald-600' },
                { icon: <CalendarIcon />, label: 'Data / Hora', value: formatDate(bid.date), color: 'bg-blue-50 text-blue-600' },
                { icon: <MapPin />, label: 'Órgão Licitante', value: bid.organ, color: 'bg-amber-50 text-amber-600' },
                { icon: <Info />, label: 'Ordem Interna (OI)', value: bid.order || '---', color: 'bg-purple-50 text-purple-600' },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-[2.5rem] border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${item.color} shadow-sm`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{item.label}</span>
                  <p className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{item.value}</p>
                </div>
              ))}
           </section>

           {/* PAINEL DE COMPLIANCE TÉCNICO */}
           <section className="bg-slate-900 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
                 <ShieldCheck size={200} className="text-white" />
              </div>
              <div className="flex-1 space-y-2 relative z-10">
                 <h3 className="text-white text-2xl font-black flex items-center gap-3">
                   <ShieldCheck className="text-blue-500" /> Compliance Tático
                 </h3>
                 <p className="text-slate-400 text-sm font-medium">Requisitos técnicos obrigatórios do edital</p>
              </div>
              <div className="flex gap-6 relative z-10">
                 <div className={`flex items-center gap-4 px-10 py-6 rounded-[2rem] border-2 transition-all shadow-xl ${bid.anvisa ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500 opacity-60 grayscale'}`}>
                    <ShieldCheck size={32} />
                    <div className="text-left">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Exigência</p>
                       <p className="text-lg font-black uppercase">ANVISA</p>
                    </div>
                    {bid.anvisa && <div className="ml-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg"><CheckCircle2 size={14}/></div>}
                 </div>
                 <div className={`flex items-center gap-4 px-10 py-6 rounded-[2rem] border-2 transition-all shadow-xl ${bid.sample ? 'bg-amber-600/10 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-slate-500 opacity-60 grayscale'}`}>
                    <FlaskConical size={32} />
                    <div className="text-left">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Exigência</p>
                       <p className="text-lg font-black uppercase">Amostra</p>
                    </div>
                    {bid.sample && <div className="ml-4 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg"><CheckCircle2 size={14}/></div>}
                 </div>
              </div>
           </section>

           <section>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8 px-4">
                <Paperclip className="text-blue-600" /> Documentos e Anexos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                {bid.documents && bid.documents.length > 0 ? bid.documents.map((doc) => (
                  <div key={doc.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col gap-5 group hover:bg-blue-50/50 transition-all shadow-sm border-b-4 border-b-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100"><FileText size={28} /></div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Documento PDF</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handlePreview(doc)} disabled={isDownloading === doc.id} className="flex-1 py-3.5 bg-white border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">Visualizar</button>
                       <button onClick={() => handleDownload(doc)} disabled={isDownloading === doc.id} className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm"><Download size={18} /></button>
                       <button onClick={() => handleDeleteDoc(doc.id)} className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-300 hover:text-rose-600 transition-all shadow-sm"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )) : <div className="col-span-3 py-16 text-center text-slate-300 uppercase font-black text-[10px] tracking-widest border-4 border-dashed border-slate-50 rounded-[3rem]">Nenhum arquivo anexado pela equipe</div>}
              </div>
           </section>

           <section className="pb-16">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8 px-4">
                <Box className="text-blue-600" /> Itens e Lotes para Disputa
              </h3>
              <div className="grid grid-cols-1 gap-6 px-4">
                {bid.items && bid.items.length > 0 ? bid.items.map((item) => (
                  <div key={item.id} className={`rounded-[2.5rem] p-10 border-2 transition-all ${item.winningPrice ? 'bg-emerald-50 border-emerald-100 shadow-lg' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
                       <div className="md:col-span-1"><div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-2xl font-black shadow-xl ${item.winningPrice ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white'}`}>{item.number}</div></div>
                       <div className="md:col-span-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Descrição do Objeto</span><h4 className="text-xl font-bold text-slate-800 leading-tight">{item.name}</h4><p className="text-sm text-slate-500 mt-2 font-medium bg-white/50 px-3 py-1 rounded-lg inline-block">Quantidade: {item.quantity} unidades</p></div>
                       <div className="md:col-span-4 grid grid-cols-2 gap-6">
                          <div className="space-y-5">
                            <div><span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Preço Mínimo</span><div className="text-emerald-700 font-black text-base">{formatCurrency(item.minPrice || 0)}</div></div>
                            <div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fabricante</span><div className="text-slate-700 font-bold text-sm truncate">{item.manufacturer || '---'}</div></div>
                          </div>
                          <div className="space-y-5">
                            <div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Modelo Tático</span><div className="text-slate-700 font-bold text-sm truncate">{item.model || '---'}</div></div>
                            <div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Referência Edital</span><div className="text-slate-700 font-black text-base">{formatCurrency(item.referencePrice || 0)}</div></div>
                          </div>
                       </div>
                       <div className="md:col-span-3 text-right">
                          {item.winningPrice ? (
                            <div className="space-y-1.5">
                               <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] block mb-1">Arrematado por</span>
                               <div className="text-3xl font-black text-emerald-700">{formatCurrency(item.winningPrice * item.quantity)}</div>
                               <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-100/50 inline-block px-3 py-1 rounded-lg mt-1">Unit: {formatCurrency(item.winningPrice)}</div>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm">
                               <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                               <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Em Aberto</span>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                )) : <div className="py-24 text-center border-4 border-dashed border-slate-50 rounded-[3.5rem] uppercase font-black text-[11px] text-slate-300 tracking-[0.3em]">Nenhum item vinculado à disputa</div>}
              </div>
           </section>
        </div>

        {/* FOOTER FIXO OPERACIONAL */}
        <div className="p-10 bg-slate-50 border-t flex justify-between items-center shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Sparkles size={20} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Monitoramento Ativo Maya AI</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sincronizado com servidores Kits Vital</p>
              </div>
           </div>
           <div className="flex gap-4">
              <button onClick={() => onOpenEdit(bid)} className="px-10 py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest flex items-center gap-2 active:scale-95 shadow-sm">
                <Edit2 size={16} /> Editar Licitação
              </button>
              <button onClick={onClose} className="px-16 py-5 bg-slate-950 text-white font-black rounded-3xl hover:bg-black transition-all uppercase text-[10px] tracking-widest shadow-2xl shadow-slate-300 active:scale-95">
                Fechar Ficha Técnica
              </button>
           </div>
        </div>
      </div>

      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex items-center justify-center p-8">
          <div className="bg-white w-full h-full rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300 border border-white/10">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200"><FileText size={24} /></div>
                <div><h4 className="font-black text-slate-800 tracking-tight text-lg">{viewingDoc.name}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visualização Segura Oráculo</p></div>
              </div>
              <button onClick={() => setViewingDoc(null)} className="p-4 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={24} /></button>
            </div>
            <div className="flex-1 bg-slate-200 p-2">
              <iframe src={viewingDoc.url || `data:${viewingDoc.type || 'application/pdf'};base64,${viewingDoc.base64}`} className="w-full h-full border-none rounded-2xl shadow-inner" title="Anexo Viewer" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidViewModal;
