
import React, { useMemo, useState } from 'react';
import { 
  DollarSign, TrendingUp, Clock, CheckCircle2, Building2, Hash, ArrowRight, Filter, FileSpreadsheet, CalendarDays, X, PieChart, Wallet, Percent, Truck, Receipt, Users, Save, ChevronLeft, ChevronRight, BarChart3, ArrowUpRight, Target, FileCheck, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { Bid, BidStatus, BidItem } from '../types';
import { STATUS_COLORS, STATUS_ICONS } from '../constants';
import MarginCalculationModal from './MarginCalculationModal';

interface FinancePageProps {
  bids: Bid[];
  formatCurrency: (val: number) => string;
  onUpdateBid: (bid: Bid) => void;
}

const FinancePage: React.FC<FinancePageProps> = ({ bids, formatCurrency, onUpdateBid }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBidForFinance, setSelectedBidForFinance] = useState<Bid | null>(null);
  const [activeFinanceTab, setActiveFinanceTab] = useState<'previstas' | 'ganhas'>('ganhas');

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const nextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (next.getFullYear() <= 2030) setCurrentDate(next);
  };

  const prevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prev);
  };

  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  const statusLists = {
    previstas: [
      BidStatus.WON_AUCTION, 
      BidStatus.PROPOSAL_SENT, 
      BidStatus.IN_DISPUTE, 
      BidStatus.WAITING_SAMPLES, 
      BidStatus.SAMPLES_SENT, 
      BidStatus.WAITING_HOMOLOGATION,
      BidStatus.HOMOLOGATED
    ],
    ganhas: [
      BidStatus.COMMITMENT_GENERATED, 
      BidStatus.PRODUCT_ORDERED, 
      BidStatus.PRODUCT_PICKED, 
      BidStatus.PRODUCT_SHIPPED, 
      BidStatus.WAITING_PAYMENT,
      BidStatus.PAID_CONCLUDED
    ]
  };

  const financialBids = useMemo(() => {
    const targetStatuses = statusLists[activeFinanceTab];

    return bids.filter(bid => {
      const isStatusFinancial = targetStatuses.includes(bid.status);
      const dateToCompareStr = activeFinanceTab === 'ganhas' 
        ? (bid.paymentDate || bid.date)
        : bid.date;

      const dateToCompare = new Date(dateToCompareStr);
      if (isNaN(dateToCompare.getTime())) return false;

      const matchesYear = dateToCompare.getFullYear() === selectedYear;
      const matchesMonth = dateToCompare.getMonth() === selectedMonth;

      return isStatusFinancial && matchesYear && matchesMonth;
    }).sort((a, b) => {
      const dA = activeFinanceTab === 'ganhas' ? (a.paymentDate || a.date) : a.date;
      // Fix: corrected typo 'pamentDate' to 'paymentDate'
      const dB = activeFinanceTab === 'ganhas' ? (b.paymentDate || b.date) : b.date;
      return new Date(dB).getTime() - new Date(dA).getTime();
    });
  }, [bids, selectedMonth, selectedYear, activeFinanceTab]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCustoTotal = 0;
    let totalLucroKV = 0;

    financialBids.forEach(bid => {
      bid.items.forEach(item => {
        const unitPrice = item.winningPrice || item.referencePrice || 0;
        const rev = unitPrice * item.quantity;
        const cost = ((item.costPrice || 0) * item.quantity) + (item.shippingCost || 0) + (rev * ((item.taxPercentage || 0) / 100));
        const margin = rev - cost;
        const inv = margin > 0 ? margin * ((item.investorPercentage || 0) / 100) : 0;
        const finalProfit = margin - inv;

        totalRevenue += rev;
        totalCustoTotal += cost;
        totalLucroKV += finalProfit;
      });
    });

    const roi = totalCustoTotal > 0 ? (totalLucroKV / totalCustoTotal) * 100 : 0;
    return { totalRevenue, totalCustoTotal, totalLucroKV, roi, count: financialBids.length };
  }, [financialBids]);

  const annualReportData = useMemo(() => {
    const targetStatuses = statusLists[activeFinanceTab];

    return Array.from({ length: 12 }, (_, monthIndex) => {
      let monthRevenue = 0;
      let monthCost = 0;
      let monthProfit = 0;

      bids.forEach(bid => {
        const dateStr = activeFinanceTab === 'ganhas' ? (bid.paymentDate || bid.date) : bid.date;
        const d = new Date(dateStr);
        
        if (!isNaN(d.getTime()) && targetStatuses.includes(bid.status) && d.getFullYear() === selectedYear && d.getMonth() === monthIndex) {
          bid.items.forEach(item => {
            const unitPrice = item.winningPrice || item.referencePrice || 0;
            const rev = unitPrice * item.quantity;
            const cost = ((item.costPrice || 0) * item.quantity) + (item.shippingCost || 0) + (rev * ((item.taxPercentage || 0) / 100));
            const margin = rev - cost;
            const inv = margin > 0 ? margin * ((item.investorPercentage || 0) / 100) : 0;

            monthRevenue += rev;
            monthCost += cost;
            monthProfit += (margin - inv);
          });
        }
      });

      return {
        month: months[monthIndex].substring(0, 3),
        revenue: monthRevenue,
        cost: monthCost,
        profit: monthProfit
      };
    });
  }, [bids, selectedYear, activeFinanceTab]);

  const calculateBidProfit = (bid: Bid) => {
    return bid.items.reduce((acc, item) => {
      const rev = (item.winningPrice || item.referencePrice || 0) * item.quantity;
      const cost = ((item.costPrice || 0) * item.quantity) + (item.shippingCost || 0) + (rev * ((item.taxPercentage || 0) / 100));
      const margin = rev - cost;
      const inv = margin > 0 ? margin * ((item.investorPercentage || 0) / 100) : 0;
      return acc + (margin - inv);
    }, 0);
  };

  const calculateBidTotal = (bid: Bid) => {
    return bid.items.reduce((acc, item) => {
      const unitValue = item.winningPrice || item.referencePrice || item.minPrice || 0;
      return acc + (unitValue * item.quantity);
    }, 0);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-600 text-white rounded-[1.8rem] shadow-xl shadow-blue-100">
            <Wallet size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Fluxo Financeiro</h2>
            <p className="text-sm text-slate-400 font-medium font-mono uppercase tracking-widest">DRE OPERACIONAL KV</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={prevMonth} className="p-3 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><ChevronLeft size={24} /></button>
            <div className="bg-slate-950 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.3em] min-w-[240px] text-center shadow-lg">
              {months[selectedMonth].toUpperCase()} de {selectedYear}
            </div>
            <button onClick={nextMonth} className="p-3 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><ChevronRight size={24} /></button>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-slate-100 p-1.5 rounded-[2.5rem] flex gap-2 border border-slate-200 shadow-inner">
          <button 
            onClick={() => setActiveFinanceTab('ganhas')}
            className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${
              activeFinanceTab === 'ganhas' 
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 scale-105' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckCircle2 size={18} />
            Execução (Garantidas)
          </button>
          <button 
            onClick={() => setActiveFinanceTab('previstas')}
            className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${
              activeFinanceTab === 'previstas' 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Target size={18} />
            Projeção (Previstas)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-800">
          <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] mb-1">
            {activeFinanceTab === 'ganhas' ? 'Receita Realizada' : 'Receita Prevista'}
          </p>
          <h3 className="text-3xl font-black text-white leading-tight">{formatCurrency(stats.totalRevenue)}</h3>
          <p className="text-slate-500 text-[8px] font-bold uppercase mt-3 tracking-widest flex items-center gap-2">
            📈 {stats.count} Processos na Aba
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-rose-500 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Custos Totais</p>
          <h3 className="text-3xl font-black text-slate-800 leading-tight">{formatCurrency(stats.totalCustoTotal)}</h3>
          <p className="text-slate-400 text-[8px] font-bold uppercase mt-3 tracking-widest">Compromissos Financeiros</p>
        </div>

        <div className={`${activeFinanceTab === 'ganhas' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-blue-600 shadow-blue-100'} p-8 rounded-[2.5rem] shadow-xl transition-colors`}>
          <p className={`${activeFinanceTab === 'ganhas' ? 'text-emerald-200' : 'text-blue-200'} text-[9px] font-black uppercase tracking-[0.3em] mb-1`}>Lucro Líquido KV</p>
          <h3 className="text-3xl font-black text-white leading-tight">{formatCurrency(stats.totalLucroKV)}</h3>
          <p className={`${activeFinanceTab === 'ganhas' ? 'text-emerald-100/60' : 'text-blue-100/60'} text-[8px] font-bold uppercase mt-3 tracking-widest`}>Margem Pura Kits Vital</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-blue-600 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Performance (ROI)</p>
          <h3 className="text-3xl font-black text-slate-800 leading-tight">{stats.roi.toFixed(1)}%</h3>
          <div className="mt-3 flex items-center gap-1.5">
             <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${activeFinanceTab === 'ganhas' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(stats.roi, 100)}%` }}></div>
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase">{activeFinanceTab === 'ganhas' ? 'REAL' : 'EST.'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Desempenho Financeiro Anual</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Comparativo de Faturamento, Custos e Lucro ({selectedYear})</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro</span>
            </div>
          </div>
        </div>

        <div className="h-72 flex items-end justify-between gap-3 px-4 border-b border-slate-100 pb-2">
          {annualReportData.map((data, i) => {
            const maxVal = Math.max(...annualReportData.map(d => Math.max(d.revenue, d.cost, d.profit))) || 1;
            const revHeight = (data.revenue / maxVal) * 100;
            const costHeight = (data.cost / maxVal) * 100;
            const profitHeight = (Math.max(0, data.profit) / maxVal) * 100;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full group">
                <div className="flex-1 w-full flex items-end justify-center gap-1.5 relative h-full">
                  <div 
                    className="w-2.5 bg-blue-600 rounded-t-lg transition-all duration-500 group-hover:scale-x-125 shadow-sm" 
                    style={{ height: `${revHeight}%` }}
                    title={`Receita: ${formatCurrency(data.revenue)}`}
                  ></div>
                  <div 
                    className="w-2.5 bg-rose-500 rounded-t-lg transition-all duration-500 group-hover:scale-x-125 shadow-sm" 
                    style={{ height: `${costHeight}%` }}
                    title={`Custos: ${formatCurrency(data.cost)}`}
                  ></div>
                  <div 
                    className="w-2.5 bg-emerald-500 rounded-t-lg transition-all duration-500 group-hover:scale-x-125 shadow-sm" 
                    style={{ height: `${profitHeight}%` }}
                    title={`Lucro: ${formatCurrency(data.profit)}`}
                  ></div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${i === selectedMonth ? 'text-blue-600' : 'text-slate-300'}`}>
                  {data.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {financialBids.length > 0 ? financialBids.map(bid => {
          const profit = calculateBidProfit(bid);
          const total = calculateBidTotal(bid);
          return (
            <div 
              key={bid.id} 
              onClick={() => setSelectedBidForFinance(bid)}
              className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer"
            >
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 font-black text-2xl group-hover:bg-blue-50 group-hover:text-blue-200 transition-colors">
                  #
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black text-slate-500 uppercase">PROCESSO</span>
                    <span className="text-xs font-black text-slate-800">{bid.order || 'S/N'}</span>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${STATUS_COLORS[bid.status]}`}>
                      {bid.status}
                    </span>
                  </div>
                  <h5 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{bid.title}</h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{bid.organ}</p>
                </div>
              </div>

              <div className="flex items-center gap-12 text-right">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL</p>
                  <p className="text-base font-black text-slate-800">{formatCurrency(total)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">
                    {activeFinanceTab === 'ganhas' ? 'LUCRO FINAL' : 'LUCRO ESTIMADO'}
                  </p>
                  <p className="text-lg font-black text-blue-600">{formatCurrency(profit)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ChevronRightIcon size={24} />
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center border-4 border-dashed border-slate-100 rounded-[3rem]">
             <DollarSign size={40} className="mx-auto text-slate-100 mb-4" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhuma movimentação para este período</p>
          </div>
        )}
      </div>

      {selectedBidForFinance && (
        <MarginCalculationModal 
          isOpen={!!selectedBidForFinance}
          bid={selectedBidForFinance}
          activeTab={activeFinanceTab}
          onClose={() => setSelectedBidForFinance(null)}
          onSave={onUpdateBid}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

export default FinancePage;
