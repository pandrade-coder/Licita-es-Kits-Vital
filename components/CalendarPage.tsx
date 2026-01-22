
import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  DollarSign,
  Hash,
  Eye
} from 'lucide-react';
import { Bid, BidStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface CalendarPageProps {
  bids: Bid[];
  formatDate: (dateStr: string) => string;
  onViewBid: (bid: Bid) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ bids, formatDate, onViewBid }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();

  // Utilitários de Data
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Dom) a 6 (Sáb)

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    setViewDate(new Date());
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const calculateBidTotal = (bid: Bid) => {
    return bid.items.reduce((acc, item) => {
      const unitValue = item.winningPrice || item.referencePrice || item.minPrice || 0;
      return acc + (unitValue * item.quantity);
    }, 0);
  };

  // Mapear licitações para os dias do mês visível
  const bidsInCurrentMonth = useMemo(() => {
    return bids.filter(bid => {
      const bidDate = new Date(bid.date);
      return bidDate.getMonth() === currentMonth && bidDate.getFullYear() === currentYear;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bids, currentMonth, currentYear]);

  // Gerar array de dias para o grid (incluindo espaços vazios no início)
  const calendarDays = useMemo(() => {
    const days = [];
    // Ajuste para começar na Segunda-feira (0: Dom, 1: Seg...)
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Cabeçalho do Calendário */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Agenda Kits Vital</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Cronograma operacional de pregões e leilões</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleGoToToday}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Mês Atual
          </button>
          <div className="flex items-center gap-2 bg-slate-900 text-white p-2 rounded-2xl shadow-xl shadow-slate-200">
            <button 
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-black text-sm uppercase tracking-[0.2em] min-w-[180px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Dias */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="aspect-square md:h-52 bg-slate-50/50 rounded-3xl border border-dashed border-slate-100"></div>;
            
            const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
            const bidsOnThisDay = bidsInCurrentMonth.filter(b => new Date(b.date).getDate() === day);

            return (
              <div 
                key={day} 
                className={`min-h-[160px] md:h-52 rounded-3xl border p-3 md:p-4 transition-all hover:shadow-2xl group relative overflow-hidden flex flex-col ${
                  isToday 
                    ? 'border-blue-500 ring-4 ring-blue-500/5 bg-blue-50/20 shadow-blue-50' 
                    : 'border-slate-100 hover:border-blue-200 bg-white shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-lg md:text-2xl font-black ${isToday ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-800 transition-colors'}`}>
                    {day < 10 ? `0${day}` : day}
                  </span>
                  {isToday && (
                    <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter shadow-md">HOJE</span>
                  )}
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide pr-1">
                  {bidsOnThisDay.map(bid => {
                    const bidTotal = calculateBidTotal(bid);
                    return (
                      <div 
                        key={bid.id} 
                        onClick={() => onViewBid(bid)}
                        className={`p-2.5 rounded-2xl border-2 text-[10px] leading-tight shadow-md transition-all hover:scale-[1.03] cursor-pointer ${STATUS_COLORS[bid.status] || 'bg-slate-100 text-slate-800 border-slate-200'}`}
                        title={`${bid.title} | ${formatCurrency(bidTotal)}`}
                      >
                        <div className="flex justify-between items-start gap-1 mb-1">
                          <span className="font-black text-[8px] uppercase tracking-widest truncate opacity-80 bg-white/40 px-1 rounded">
                            {bid.order || 'S/N'}
                          </span>
                          <span className="font-black whitespace-nowrap text-blue-900">
                            {formatCurrency(bidTotal).split(',')[0]}
                          </span>
                        </div>
                        <div className="font-black truncate text-slate-900 group-hover:whitespace-normal group-hover:line-clamp-2 transition-all">{bid.title}</div>
                      </div>
                    );
                  })}
                  {bidsOnThisDay.length > 4 && (
                    <div className="text-[10px] text-center font-black text-slate-400 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                      + {bidsOnThisDay.length - 4} Licitações
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Próximos Pregões do Mês */}
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h3 className="text-3xl font-black text-white flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <CalendarIcon className="text-white" size={24} />
              </div>
              Cronograma Mensal
            </h3>
            <p className="text-slate-400 text-sm font-medium mt-2">Detalhamento técnico dos pregões para {monthNames[currentMonth]} {currentYear}</p>
          </div>
          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} />
              {bidsInCurrentMonth.length} Pregões agendados
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {bidsInCurrentMonth.length > 0 ? bidsInCurrentMonth.map(bid => {
            const bidTotal = calculateBidTotal(bid);
            return (
              <div key={bid.id} className="flex flex-col md:flex-row md:items-center gap-6 p-6 md:p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all group border-l-4 border-l-blue-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <CalendarIcon size={120} className="text-white" />
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white text-slate-900 rounded-[2rem] flex flex-col items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{monthNames[currentMonth].substring(0, 3)}</span>
                    <span className="text-3xl font-black">{new Date(bid.date).getDate()}</span>
                  </div>
                  <div className="h-12 w-px bg-white/10 hidden md:block"></div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                     <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500/30">
                        Pregão {bid.biddingNumber}
                     </span>
                     <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                        Ordem: {bid.order || 'N/A'}
                     </span>
                     <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest">• {bid.modality}</span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">{bid.title}</h4>
                  
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      <Clock size={14} className="text-blue-500" /> 
                      {new Date(bid.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      <MapPin size={14} className="text-blue-500" /> 
                      <span className="truncate max-w-[200px]">{bid.organ}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-black bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      <DollarSign size={14} /> 
                      {formatCurrency(bidTotal)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center z-10">
                   <button 
                    onClick={() => onViewBid(bid)}
                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20"
                   >
                      <Eye size={18} />
                      Abrir Ficha
                   </button>
                </div>
              </div>
            );
          }) : (
            <div className="py-24 text-center border-2 border-dashed border-white/10 rounded-[3.5rem] bg-white/5">
               <CalendarIcon size={64} className="mx-auto text-white/10 mb-6" />
               <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">Sem pregões para este período</p>
               <button onClick={handleGoToToday} className="mt-6 text-blue-500 font-bold hover:text-blue-400 transition-colors">Voltar para o Mês Atual</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
