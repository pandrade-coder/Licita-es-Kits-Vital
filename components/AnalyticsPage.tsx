
import React, { useMemo } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  Target, 
  Award, 
  BarChart3, 
  Trophy, 
  Zap, 
  Activity,
  Flame,
  Layers,
  CheckCircle2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Bid, BidStatus, CompanyDocument } from '../types';
import { STATUS_COLORS } from '../constants';

interface AnalyticsPageProps {
  bids: Bid[];
  docs: CompanyDocument[];
  formatCurrency: (val: number) => string;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ bids, docs, formatCurrency }) => {
  
  // Cálculo de Métricas Reais
  const metrics = useMemo(() => {
    const totalCount = bids.length || 0;
    const wonBids = bids.filter(b => [
      BidStatus.WON_AUCTION, 
      BidStatus.PAID_CONCLUDED, 
      BidStatus.WAITING_PAYMENT,
      BidStatus.HOMOLOGATED,
      BidStatus.COMMITMENT_GENERATED,
      BidStatus.PRODUCT_SHIPPED
    ].includes(b.status));
    
    const lostBids = bids.filter(b => b.status === BidStatus.LOST);
    const inDispute = bids.filter(b => [BidStatus.IN_DISPUTE, BidStatus.IN_APPEAL, BidStatus.WAITING_SAMPLES].includes(b.status));
    
    const winRate = totalCount > 0 ? (wonBids.length / totalCount) * 100 : 0;
    
    const totalEstimatedValue = bids.reduce((acc, curr) => acc + (curr.value || 0), 0);
    
    const totalWonValue = wonBids.reduce((acc, curr) => {
      const bidWonValue = curr.items.reduce((sum, item) => {
        const unitVal = item.winningPrice || 0;
        return sum + (item.quantity * unitVal);
      }, 0);
      return acc + (bidWonValue > 0 ? bidWonValue : (curr.value || 0));
    }, 0);

    const ticketMedio = wonBids.length > 0 ? totalWonValue / wonBids.length : 0;

    const inDisputeValue = inDispute.reduce((acc, curr) => acc + (curr.value || 0), 0);

    // Conformidade Documental
    const now = new Date();
    const expiredDocs = docs.filter(d => new Date(d.expirationDate) < now);
    const docEfficiency = docs.length > 0 ? ((docs.length - expiredDocs.length) / docs.length) * 100 : 100;

    return {
      totalCount,
      wonCount: wonBids.length,
      lostCount: lostBids.length,
      inDisputeCount: inDispute.length,
      inDisputeValue,
      winRate,
      totalEstimatedValue,
      totalWonValue,
      ticketMedio,
      docEfficiency
    };
  }, [bids, docs]);

  // Performance Mensal Dinâmica (Últimos 6 Meses)
  const monthlyPerformance = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const mName = months[mIdx];
      
      const bidsInMonth = bids.filter(b => {
        const bidDate = new Date(b.date);
        return bidDate.getMonth() === mIdx && bidDate.getFullYear() === d.getFullYear();
      });

      const totalValue = bidsInMonth.reduce((acc, b) => acc + (b.value || 0), 0);
      const wonValue = bidsInMonth
        .filter(b => [BidStatus.WON_AUCTION, BidStatus.PAID_CONCLUDED, BidStatus.HOMOLOGATED, BidStatus.COMMITMENT_GENERATED].includes(b.status))
        .reduce((acc, b) => {
           const itemsWon = b.items.reduce((sum, it) => sum + (it.quantity * (it.winningPrice || 0)), 0);
           return acc + (itemsWon > 0 ? itemsWon : (b.value || 0));
        }, 0);

      result.push({
        month: mName,
        won: wonValue,
        total: totalValue || 1, // Evitar divisão por zero no gráfico
        percentage: totalValue > 0 ? (wonValue / totalValue) * 100 : 0
      });
    }
    return result;
  }, [bids]);

  // Distribuição por Status - Funil
  const statusDistribution = useMemo(() => {
    const total = bids.length || 1;
    return Object.values(BidStatus).map(status => {
      const count = bids.filter(b => b.status === status).length;
      const percentage = (count / total) * 100;
      return { status, count, percentage };
    }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  }, [bids]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header Estratégico */}
      <div className="bg-slate-950 p-10 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
            <TrendingUp size={240} className="text-blue-500" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg text-white">
                     <Zap size={18} />
                  </div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Dashboard Inteligente</span>
               </div>
               <h2 className="text-4xl font-black text-white tracking-tight">Desempenho Operacional</h2>
               <p className="text-slate-400 text-sm font-medium">Análise de conversão e saúde financeira da Kits Vital</p>
            </div>

            <div className="flex gap-4">
               <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Taxa de Sucesso</p>
                  <div className="flex items-center gap-3">
                     <span className="text-3xl font-black text-emerald-400">{metrics.winRate.toFixed(1)}%</span>
                     <Trophy className="text-emerald-500" size={24} />
                  </div>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Volume Arrematado</p>
                  <div className="flex items-center gap-3">
                     <span className="text-3xl font-black text-blue-400">{formatCurrency(metrics.totalWonValue)}</span>
                     <Flame className="text-blue-500" size={24} />
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Grid de Métricas Auxiliares */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Ticket Médio', value: formatCurrency(metrics.ticketMedio), icon: <Award className="text-blue-600" />, sub: 'Por Ganho Real' },
          { label: 'Em Disputa', value: formatCurrency(metrics.inDisputeValue), icon: <TrendingUp className="text-amber-500" />, sub: `${metrics.inDisputeCount} Licitações` },
          { label: 'Eficiência de Lances', value: `${metrics.winRate.toFixed(1)}%`, icon: <Activity className="text-emerald-500" />, sub: metrics.winRate > 50 ? 'Acima da Média' : 'Em Evolução' },
          { label: 'Pipeline Total', value: formatCurrency(metrics.totalEstimatedValue), icon: <Layers className="text-purple-500" />, sub: 'Volume em Radar' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">{stat.icon}</div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de Barras - Performance Mensal Dinâmica */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <BarChart3 size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800">Crescimento de Volume</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Comparativo Mensal (Ganhos vs Potencial Total)</p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Ganhos</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Potencial</span>
               </div>
            </div>
          </div>

          <div className="h-80 flex items-end justify-between gap-4 px-4 pt-10">
            {monthlyPerformance.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full group">
                <div className="flex-1 w-full flex items-end justify-center gap-1.5 relative">
                  {/* Barra de Potencial (Meta/Total) */}
                  <div 
                    className="w-4 bg-slate-100 rounded-t-xl group-hover:bg-slate-200 transition-all" 
                    style={{ height: `100%` }}
                    title={`Total do Mês: ${formatCurrency(data.total)}`}
                  ></div>
                  {/* Barra de Ganhos */}
                  <div 
                    className="w-4 bg-blue-600 rounded-t-xl shadow-lg shadow-blue-100 group-hover:bg-blue-700 transition-all absolute bottom-0" 
                    style={{ height: `${data.percentage}%` }}
                    title={`Ganhos: ${formatCurrency(data.won)}`}
                  ></div>
                  
                  {/* Tooltip Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap z-20">
                     {data.percentage.toFixed(0)}% Taxa Arremate
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Status - Funil */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <PieChart size={24} />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-800">Funil Oráculo</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Saúde de Fluxo por Etapa</p>
             </div>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[350px] pr-2 scrollbar-hide">
            {statusDistribution.slice(0, 8).map((item, i) => {
              const colorClass = (STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '').split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-500';
              
              return (
                <div key={i} className="space-y-2 group">
                  <div className="flex justify-between items-end px-1">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{item.status}</span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase">{item.count} Processos</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{item.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className={`h-full ${colorClass} transition-all duration-1000 shadow-inner`} 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t flex items-center justify-between">
             <div className="flex -space-x-3">
                {[1, 2, 3].map(n => (
                   <div key={n} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                   </div>
                ))}
             </div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IA Sincronizada em Tempo Real</p>
          </div>
        </div>
      </div>

      {/* Seção Final - Resumo de Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-emerald-600 p-10 rounded-[3rem] text-white flex items-center justify-between shadow-2xl shadow-emerald-100">
            <div>
               <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Conversão Anual 2024</h4>
               <p className="text-3xl font-black">{metrics.winRate.toFixed(1)}% Concluído</p>
               <div className="mt-4 flex items-center gap-3">
                  <div className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase border border-white/20">Pipeline Ativo</div>
                  <div className="px-4 py-1.5 bg-emerald-500 rounded-full text-[10px] font-black uppercase shadow-lg">Meta Operacional</div>
               </div>
            </div>
            <Trophy size={80} className="opacity-20" />
         </div>
         <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex items-center justify-between shadow-2xl shadow-slate-200">
            <div>
               <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Conformidade Documental</h4>
               <p className="text-3xl font-black">{metrics.docEfficiency.toFixed(0)}% Certidões OK</p>
               <div className="mt-4 flex items-center gap-3">
                  <div className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase border border-white/10">
                    {metrics.docEfficiency < 100 ? 'Atenção Pendências' : 'Zero Pendências'}
                  </div>
                  <div className="px-4 py-1.5 bg-blue-600 rounded-full text-[10px] font-black uppercase shadow-lg">Monitoramento Oráculo</div>
               </div>
            </div>
            {metrics.docEfficiency < 100 ? <AlertCircle size={80} className="opacity-20 text-rose-500" /> : <ShieldCheck size={80} className="opacity-20 text-blue-500" />}
         </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
