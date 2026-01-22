
import React, { useState, useMemo } from 'react';
import { Search, Plus, MoreVertical, Trash2, Calendar as CalendarIcon, Clock, Loader2, Sparkles, Box, ShieldCheck, FlaskConical, ListFilter, Info, ChevronRight, History, CalendarDays } from 'lucide-react';
import { Bid, BidStatus } from '../types';
import { STATUS_COLORS, STATUS_ICONS } from '../constants';

interface BidsPageProps {
  filteredBids: Bid[];
  bidStatusFilter: string;
  setBidStatusFilter: (filter: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  openEditBid: (bid: Bid) => void;
  openViewBid: (bid: Bid) => void;
  handleDeleteBid: (bidId: string) => void;
  handleGenerateProposal: (bid: Bid) => Promise<void>;
  setItemManagerBidId: (bidId: string) => void;
  setIsModalOpen: (open: boolean, mode?: 'manual' | 'ai') => void;
  setEditingBid: (bid: Bid | null) => void;
  formatDate: (dateStr: string) => string;
  formatCurrency: (val: number) => string;
  now: Date;
}

const BidsPage: React.FC<BidsPageProps> = ({ 
  filteredBids, 
  bidStatusFilter, 
  setBidStatusFilter, 
  searchTerm,
  setSearchTerm,
  openEditBid, 
  openViewBid, 
  handleDeleteBid, 
  handleGenerateProposal, 
  setItemManagerBidId,
  setIsModalOpen,
  setEditingBid,
  formatDate,
  formatCurrency,
  now
}) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const calculateBidTotal = (bid: Bid) => {
    return bid.items.reduce((acc, item) => {
      if (item.lostPrice && item.lostPrice > 0) return acc;
      const unitValue = item.winningPrice || item.referencePrice || item.minPrice || 0;
      return acc + (unitValue * item.quantity);
    }, 0);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const onGenerateClick = async (e: React.MouseEvent, bid: Bid) => {
    e.stopPropagation();
    setGeneratingId(bid.id);
    try { await handleGenerateProposal(bid); } finally { setGeneratingId(null); }
  };

  const getStatusStyle = (status: BidStatus) => {
    switch(status) {
      case BidStatus.WON_AUCTION:
      case BidStatus.PAID_CONCLUDED:
      case BidStatus.HOMOLOGATED:
      case BidStatus.COMMITMENT_GENERATED:
        return 'border-emerald-400 shadow-emerald-100/50';
      case BidStatus.LOST:
        return 'border-rose-400 shadow-rose-100/50';
      case BidStatus.IN_DISPUTE:
      case BidStatus.IN_APPEAL:
      case BidStatus.WAITING_SAMPLES:
      case BidStatus.SAMPLES_SENT:
        return 'border-amber-400 shadow-amber-100/50';
      case BidStatus.PROPOSAL_SENT:
      case BidStatus.READY_WAITING:
      case BidStatus.WAITING_HOMOLOGATION:
        return 'border-blue-400 shadow-blue-100/50';
      default:
        return 'border-slate-200 shadow-slate-100/50';
    }
  };

  // Lógica de Agrupamento Cronológico
  const bidSections = useMemo(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hoje: Bid[] = [];
    const proximas: Bid[] = [];
    const passadas: Bid[] = [];

    filteredBids.forEach(bid => {
      const bidDate = new Date(bid.date);
      if (isNaN(bidDate.getTime())) {
        proximas.push(bid); // Sem data vai para próximas por segurança
        return;
      }

      if (bidDate >= today && bidDate < tomorrow) {
        hoje.push(bid);
      } else if (bidDate >= tomorrow) {
        proximas.push(bid);
      } else {
        passadas.push(bid);
      }
    });

    // Ordenação: 
    // Hoje: Mais cedo primeiro
    // Próximas: Mais próxima primeiro
    // Passadas: Mais recente primeiro
    return {
      hoje: hoje.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      proximas: proximas.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      passadas: passadas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [filteredBids, now]);

  const filterTabs = [
    { id: 'all', label: 'TODAS' },
    { id: BidStatus.LAUNCHED, label: 'LANÇADOS' },
    { id: BidStatus.INSERT_MODEL, label: 'MARCA/MODELO' },
    { id: BidStatus.READY_WAITING, label: 'AG. LEILÃO' },
    { id: BidStatus.WON_AUCTION, label: 'LEILÃO GANHO' },
    { id: BidStatus.PROPOSAL_SENT, label: 'PROP. ENVIADA' },
    { id: BidStatus.IN_DISPUTE, label: 'DISPUTA' },
    { id: BidStatus.WAITING_SAMPLES, label: 'AG. AMOSTRA' },
    { id: BidStatus.SAMPLES_SENT, label: 'AMOSTRA ENV.' },
    { id: BidStatus.WAITING_HOMOLOGATION, label: 'AG. HOMOLOGAÇÃO' },
    { id: BidStatus.HOMOLOGATED, label: 'HOMOLOGADO' },
    { id: BidStatus.COMMITMENT_GENERATED, label: 'EMPENHADO' },
    { id: BidStatus.PRODUCT_ORDERED, label: 'ENCOMENDADO' },
    { id: BidStatus.PRODUCT_PICKED, label: 'SEPARADO' },
    { id: BidStatus.PRODUCT_SHIPPED, label: 'ENVIADO' },
    { id: BidStatus.WAITING_PAYMENT, label: 'AG. PGTO' },
    { id: BidStatus.PAID_CONCLUDED, label: 'CONCLUÍDO' },
    { id: BidStatus.LOST, label: 'PERDIDOS' }
  ];

  // Fix: Converted local BidCard component to a function to avoid 'key' prop typing mismatch in lists
  const renderBidCard = (bid: Bid) => (
    <div key={bid.id} className={`bg-white rounded-[3rem] border-2 shadow-xl hover:shadow-2xl transition-all flex flex-col h-full relative group/card ${getStatusStyle(bid.status)}`}>
        <div className="p-8 pb-6 space-y-6">
          <div className="flex justify-between items-start">
            <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm ${STATUS_COLORS[bid.status]}`}>
              {STATUS_ICONS[bid.status]} {bid.status.toUpperCase()}
            </span>
            <div className="flex items-center gap-1 opacity-40 group-hover/card:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); handleDeleteBid(bid.id); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
              <button onClick={() => openEditBid(bid)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical size={20} /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>ORDEM: <span className="text-slate-600">{bid.order || '---'}</span></span>
            <span className="mx-1">|</span>
            <span>PREGÃO: <span className="text-blue-600">{bid.biddingNumber || '---'}</span></span>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-2xl leading-snug line-clamp-2 min-h-[4rem]">
              {bid.title}
            </h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-tight">
              {bid.organ}
            </p>
          </div>

          <button 
            onClick={() => setItemManagerBidId(bid.id)}
            className="w-full flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] group/item hover:bg-blue-50 transition-all overflow-hidden"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover/item:text-blue-600 transition-colors shrink-0">
                <Box size={20} />
              </div>
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover/item:text-blue-700 whitespace-nowrap overflow-hidden text-ellipsis">
                Editar Itens ({bid.items.length} itens)
              </span>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover/item:translate-x-1 transition-transform shrink-0" />
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${bid.anvisa ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300 opacity-50'}`}>
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">ANVISA</span>
            </div>
            <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${bid.sample ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-300 opacity-50'}`}>
              <FlaskConical size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">AMOSTRA</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-black text-slate-400 block tracking-widest">Data Pregão</span>
              <div className="text-[12px] font-bold text-slate-700 flex flex-col">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={14} className="text-blue-500" /> {formatDate(bid.date)}
                </div>
                <div className="flex items-center gap-2 text-slate-400 ml-5 mt-0.5 text-[11px]">
                  <Clock size={12} /> {formatTime(bid.date)}
                </div>
              </div>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[9px] uppercase font-black text-slate-400 block tracking-widest">Total Lote</span>
              <div className="text-[14px] font-black text-emerald-600">
                {formatCurrency(calculateBidTotal(bid))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto p-8 pt-2 flex items-center gap-3">
          <button 
            onClick={() => openViewBid(bid)} 
            className="flex-1 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all active:scale-95"
          >
            Abrir Ficha
          </button>
          <button 
            onClick={(e) => onGenerateClick(e, bid)} 
            className="p-5 bg-blue-600 text-white rounded-[1.5rem] hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 group/maya"
          >
            {generatingId === bid.id ? <Loader2 size={26} className="animate-spin" /> : <Sparkles size={26} className="group-hover/maya:scale-110 transition-transform" />}
          </button>
        </div>
    </div>
  );

  const SectionHeader = ({ title, icon: Icon, count, color }: any) => (
    <div className="flex items-center justify-between py-6 border-b border-slate-100 mb-8 sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 px-2">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${color} shadow-lg shadow-current/10`}>
          <Icon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{title}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Prioridade Cronológica</p>
        </div>
      </div>
      <div className="bg-white px-5 py-2 rounded-2xl border border-slate-100 shadow-sm">
        <span className="text-xs font-black text-slate-800">{count} Processos</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-700 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm min-w-fit">
            <ListFilter size={18} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Painel</span>
              <span className="text-sm font-black text-slate-800">{filteredBids.length} Licitações</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditingBid(null); setIsModalOpen(true, 'ai'); }} className="bg-slate-950 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl">
            <Sparkles size={18} className="text-blue-400" /> Maya IA
          </button>
          <button onClick={() => { setEditingBid(null); setIsModalOpen(true, 'manual'); }} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl">
            <Plus size={20} /> Lançar Manual
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-2 scrollbar-hide">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setBidStatusFilter(tab.id)}
              className={`whitespace-nowrap px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border flex items-center gap-2 ${
                bidStatusFilter === tab.id 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                  : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredBids.length > 0 ? (
        <div className="space-y-20 pb-40">
          {/* SEÇÃO HOJE */}
          {bidSections.hoje.length > 0 && (
            <section>
              <SectionHeader title="Hoje" icon={Clock} count={bidSections.hoje.length} color="bg-emerald-500 text-white" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {/* Fix: Using render function instead of JSX component to properly handle 'key' */}
                {bidSections.hoje.map(bid => renderBidCard(bid))}
              </div>
            </section>
          )}

          {/* SEÇÃO PRÓXIMAS */}
          {bidSections.proximas.length > 0 && (
            <section>
              <SectionHeader title="Próximas" icon={CalendarDays} count={bidSections.proximas.length} color="bg-blue-600 text-white" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {/* Fix: Using render function instead of JSX component to properly handle 'key' */}
                {bidSections.proximas.map(bid => renderBidCard(bid))}
              </div>
            </section>
          )}

          {/* SEÇÃO PASSADAS */}
          {bidSections.passadas.length > 0 && (
            <section>
              <SectionHeader title="Passadas" icon={History} count={bidSections.passadas.length} color="bg-slate-400 text-white" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {/* Fix: Using render function instead of JSX component to properly handle 'key' */}
                {bidSections.passadas.map(bid => renderBidCard(bid))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="py-40 text-center">
          <Info size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhuma licitação encontrada</p>
        </div>
      )}
    </div>
  );
};

export default BidsPage;
