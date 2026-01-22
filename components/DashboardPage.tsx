
import React from 'react';
import { TrendingUp, Clock, BrainCircuit, AlertCircle, ChevronRight, Calendar as CalendarIcon, FileCheck, ShoppingCart, Target } from 'lucide-react';
import { Bid, CompanyDocument, BidStatus } from '../types';
import { STATUS_COLORS, STATUS_ICONS } from '../constants';

interface DashboardPageProps {
  bids: Bid[];
  docs: CompanyDocument[];
  setActiveTab: (tab: string) => void;
  openViewBid: (bid: Bid) => void;
  formatCurrency: (val: number) => string;
  formatDate: (dateStr: string) => string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ bids, docs, setActiveTab, openViewBid, formatCurrency, formatDate }) => {
  const getDynamicStatus = (expStr: string): 'valid' | 'expired' | 'expiring' => {
    if (!expStr) return 'valid';
    const [year, month, day] = expStr.split('-').map(Number);
    const expDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    const now = new Date();
    if (now > expDate) return 'expired';
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 30 ? 'expiring' : 'valid';
  };

  const calculateBidTotal = (bid: Bid) => {
    return bid.items.reduce((acc, item) => {
      const unitValue = item.winningPrice || item.referencePrice || item.minPrice || 0;
      return acc + (unitValue * item.quantity);
    }, 0);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const totalWonValue = bids
    .filter(b => [
      BidStatus.WON_AUCTION, 
      BidStatus.PAID_CONCLUDED, 
      BidStatus.COMMITMENT_GENERATED, 
      BidStatus.PRODUCT_ORDERED, 
      BidStatus.PRODUCT_PICKED, 
      BidStatus.PRODUCT_SHIPPED, 
      BidStatus.WAITING_PAYMENT
    ].includes(b.status))
    .reduce((acc, curr) => acc + calculateBidTotal(curr), 0);

  const totalToBuyValue = bids
    .filter(b => [
      BidStatus.WON_AUCTION, 
      BidStatus.COMMITMENT_GENERATED
    ].includes(b.status))
    .reduce((acc, curr) => acc + calculateBidTotal(curr), 0);

  const totalForecastValue = bids
    .filter(b => [
      BidStatus.LAUNCHED, 
      BidStatus.INSERT_MODEL, 
      BidStatus.READY_WAITING, 
      BidStatus.WAITING_SAMPLES, 
      BidStatus.SAMPLES_SENT, 
      BidStatus.IN_DISPUTE, 
      BidStatus.IN_APPEAL
    ].includes(b.status))
    .reduce((acc, curr) => acc + calculateBidTotal(curr), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Ganhos Acumulados', 
            value: formatCurrency(totalWonValue), 
            icon: <TrendingUp className="text-emerald-600" />, 
            color: 'bg-emerald-50',
            sub: 'Consolidado KV'
          },
          { 
            label: 'A Comprar (Investir)', 
            value: formatCurrency(totalToBuyValue), 
            icon: <ShoppingCart className="text-amber-600" />, 
            color: 'bg-amber-50',
            sub: 'Aguardando Pedido'
          },
          { 
            label: 'Projeção (Radar)', 
            value: formatCurrency(totalForecastValue), 
            icon: <Target className="text-blue-600" />, 
            color: 'bg-blue-50',
            sub: 'Oportunidades Ativas'
          },
          { 
            label: 'Docs Vencendo', 
            value: `${docs.filter(d => getDynamicStatus(d.expirationDate) === 'expiring').length} Alertas`, 
            icon: <AlertCircle className="text-rose-500" />, 
            color: 'bg-rose-50',
            sub: 'Próximos 30 dias'
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-4 rounded-2xl ${stat.color}`}>{stat.icon}</div>
              <ChevronRight className="text-slate-200" size={16} />
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</h3>
            <p className="text-xl font-black text-slate-800 mt-1">{stat.value}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Pregões em Destaque</h2>
            <button onClick={() => setActiveTab('bids')} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>
                  <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Pregão</th>
                  <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                  <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bids.slice(0, 8).map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => openViewBid(bid)}>
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-800 line-clamp-1 text-sm">{bid.title}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">OI: {bid.order || 'S/N'} • UASG: {bid.uasg || '---'}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs text-slate-600 font-bold flex flex-col">
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={14} className="text-blue-500" />
                          {formatDate(bid.date)}
                        </div>
                        <div className="text-[10px] text-slate-400 ml-5 flex items-center gap-1">
                          <Clock size={10} /> {formatTime(bid.date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-black text-emerald-600">{formatCurrency(calculateBidTotal(bid))}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest ${STATUS_COLORS[bid.status]}`}>
                        {STATUS_ICONS[bid.status]}
                        {bid.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Alertas de Certidões</h2>
            <FileCheck className="text-blue-500" />
          </div>
          <div className="space-y-4">
            {docs.length > 0 ? docs.map((doc) => {
              const dynamicStatus = getDynamicStatus(doc.expirationDate);
              return (
                <div key={doc.id} className={`p-5 rounded-2xl border flex flex-col gap-2 transition-all ${
                  dynamicStatus === 'expired' ? 'bg-rose-50 border-rose-100 ring-2 ring-rose-500/5' :
                  dynamicStatus === 'expiring' ? 'bg-amber-50 border-amber-100 ring-2 ring-amber-500/5' :
                  'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1">{doc.name}</span>
                    {dynamicStatus !== 'valid' && <AlertCircle size={14} className={dynamicStatus === 'expired' ? 'text-rose-500' : 'text-amber-500'} />}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <span>{doc.category}</span>
                    <span className={dynamicStatus === 'expired' ? 'text-rose-600' : dynamicStatus === 'expiring' ? 'text-amber-600' : ''}>
                      {dynamicStatus === 'expired' ? 'Vencido' : 'Vence em'}: {doc.expirationDate}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center text-slate-300">
                <FileCheck size={40} className="mx-auto mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sem documentos cadastrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
