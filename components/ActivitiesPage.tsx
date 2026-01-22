
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Sun, Star, LayoutGrid, Plus, Circle, CheckCircle2, Trash2, 
  ChevronDown, ChevronUp, Calendar, UserCircle2,
  Edit3, X, Check, Gavel, Search, AlertCircle
} from 'lucide-react';
import { Activity, Bid } from '../types';

interface ActivitiesPageProps {
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  bids?: Bid[];
}

const ActivitiesPage: React.FC<ActivitiesPageProps> = ({ activities, setActivities, bids = [] }) => {
  const [activeUserFilter, setActiveUserFilter] = useState<'Marcos' | 'Pablo'>('Pablo');
  const [activeCategory, setActiveCategory] = useState<'meu-dia' | 'importante' | 'todas' | 'atrasadas'>('meu-dia');
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  
  const [inputValue, setInputValue] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newOwner, setNewOwner] = useState<'Marcos' | 'Pablo' | 'Ambos'>('Ambos');
  const [isNewImportant, setIsNewImportant] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBidId, setSelectedBidId] = useState<string | undefined>(undefined);
  
  const [isBidPickerOpen, setIsBidPickerOpen] = useState(false);
  const [bidSearch, setBidSearch] = useState('');
  const bidPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bidPickerRef.current && !bidPickerRef.current.contains(event.target as Node)) {
        setIsBidPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const playSuccessSound = () => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, context.currentTime);
      oscillator.frequency.exponentialRampToValueToTime(1046.50, context.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
    } catch (e) {}
  };

  const isDelayed = (dueDate?: string) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T12:00:00'); 
    return due < today;
  };

  const overdueCount = useMemo(() => {
    return activities.filter(a => 
      !a.completed && 
      isDelayed(a.dueDate) && 
      (a.owner === activeUserFilter || a.owner === 'Ambos')
    ).length;
  }, [activities, activeUserFilter]);

  const filteredBids = useMemo(() => {
    if (!bidSearch) return bids.slice(0, 10);
    const lowerSearch = bidSearch.toLowerCase();
    return bids.filter(b => 
      b.title.toLowerCase().includes(lowerSearch) || 
      b.biddingNumber.toLowerCase().includes(lowerSearch) ||
      b.organ.toLowerCase().includes(lowerSearch)
    ).slice(0, 20);
  }, [bids, bidSearch]);

  const activeActivities = useMemo(() => {
    return activities.filter(a => {
      if (a.completed) return false;
      const belongsToUser = a.owner === activeUserFilter || a.owner === 'Ambos';
      if (!belongsToUser) return false;
      if (activeCategory === 'todas') return true;
      if (activeCategory === 'meu-dia') return a.category === 'meu-dia';
      if (activeCategory === 'importante') return !!a.isImportant;
      if (activeCategory === 'atrasadas') return isDelayed(a.dueDate);
      return false;
    });
  }, [activities, activeUserFilter, activeCategory]);

  const completedActivities = useMemo(() => {
    return activities.filter(a => 
      a.completed && 
      (a.owner === activeUserFilter || a.owner === 'Ambos')
    );
  }, [activities, activeUserFilter]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    if (editingId) {
      setActivities(activities.map(a => a.id === editingId ? {
        ...a,
        title: inputValue,
        owner: newOwner,
        dueDate: newDueDate,
        isImportant: isNewImportant,
        bidId: selectedBidId,
        category: isNewImportant ? 'importante' : 'meu-dia'
      } : a));
      setEditingId(null);
    } else {
      const newAct: Activity = {
        id: Date.now().toString(),
        owner: newOwner,
        title: inputValue,
        category: isNewImportant ? 'importante' : 'meu-dia',
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: newDueDate,
        isImportant: isNewImportant,
        bidId: selectedBidId
      };
      setActivities([newAct, ...activities]);
    }

    setInputValue('');
    setIsNewImportant(false);
    setNewDueDate(new Date().toISOString().split('T')[0]);
    setNewOwner('Ambos');
    setSelectedBidId(undefined);
    setBidSearch('');
  };

  const startEdit = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    setEditingId(activity.id);
    setInputValue(activity.title);
    setNewDueDate(activity.dueDate || new Date().toISOString().split('T')[0]);
    setNewOwner(activity.owner);
    setIsNewImportant(!!activity.isImportant);
    setSelectedBidId(activity.bidId);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setInputValue('');
    setIsNewImportant(false);
    setNewDueDate(new Date().toISOString().split('T')[0]);
    setNewOwner('Ambos');
    setSelectedBidId(undefined);
  };

  const toggleComplete = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;
    if (!activity.completed) playSuccessSound();

    setActivities(activities.map(a => 
      a.id === id 
        ? { ...a, completed: !a.completed, completedAt: !a.completed ? new Date().toISOString().split('T')[0] : undefined } 
        : a
    ));
  };

  const deleteActivity = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Apagar atividade definitivamente?")) {
      setActivities(activities.filter(a => a.id !== id));
      if (editingId === id) cancelEdit();
    }
  };

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return "S/ DATA";
    const parts = dateStr.split('-');
    return parts.length !== 3 ? dateStr : `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const today = new Date();
  const weekDays = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];
  const months = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
      <aside className="w-72 border-r border-slate-50 flex flex-col bg-slate-50/20 shrink-0">
        <div className="p-6">
          <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 flex flex-col items-center gap-3">
             <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <UserCircle2 size={28} />
             </div>
             <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] text-center">Terminal de {activeUserFilter}</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <button onClick={() => setActiveCategory('todas')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${activeCategory === 'todas' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutGrid size={18} /> Todas</button>
          <button onClick={() => setActiveCategory('meu-dia')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${activeCategory === 'meu-dia' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><Sun size={18} /> Meu Dia</button>
          <button onClick={() => setActiveCategory('importante')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${activeCategory === 'importante' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><Star size={18} /> Importante</button>
          <button onClick={() => setActiveCategory('atrasadas')} className={`w-full flex items-center justify-between gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${activeCategory === 'atrasadas' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <div className="flex items-center gap-4"><AlertCircle size={18} /> Atrasadas</div>
            {overdueCount > 0 && <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse">{overdueCount}</span>}
          </button>
        </nav>
        <div className="p-6 border-t border-slate-100 space-y-2">
           <button onClick={() => setActiveUserFilter('Pablo')} className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeUserFilter === 'Pablo' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>Visualizar Pablo</button>
           <button onClick={() => setActiveUserFilter('Marcos')} className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeUserFilter === 'Marcos' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>Visualizar Marcos</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="p-10 pb-4">
          <div className="flex items-baseline gap-3">
            <h1 className={`text-4xl font-black tracking-tight uppercase ${activeCategory === 'atrasadas' ? 'text-rose-600' : 'text-slate-900'}`}>{activeCategory === 'meu-dia' ? 'MEU DIA' : activeCategory === 'importante' ? 'IMPORTANTE' : activeCategory === 'atrasadas' ? 'ATRASADAS' : 'ATIVIDADES'}</h1>
            <span className={`text-3xl font-black ${activeCategory === 'atrasadas' ? 'text-rose-600' : 'text-blue-600'}`}>/ {activeActivities.length}</span>
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{weekDays[today.getDay()]}, {today.getDate()} DE {months[today.getMonth()]}</p>
        </header>
        <div className="flex-1 overflow-y-auto px-10 py-6 space-y-6">
          <div className="space-y-4">
            {activeActivities.map(activity => {
              const delayed = isDelayed(activity.dueDate);
              const linkedBid = bids.find(b => b.id === activity.bidId);
              return (
                <div key={activity.id} className={`group flex items-center gap-5 p-5 bg-white border-2 rounded-[2.5rem] transition-all hover:shadow-xl ${editingId === activity.id ? 'border-amber-400 bg-amber-50/10' : delayed ? 'border-rose-400 bg-rose-50/5' : 'border-slate-50 shadow-sm'}`}>
                  <button onClick={() => toggleComplete(activity.id)} className={`p-1 transition-all ${activity.completed ? 'text-blue-500' : 'text-slate-200 hover:text-blue-500'}`}><Circle size={28} /></button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className={`text-base font-black leading-tight truncate ${delayed ? 'text-rose-900' : 'text-slate-800'}`}>{activity.title}</p>
                      {activity.isImportant && <span className="bg-rose-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm"><Star size={10} fill="currentColor" /> IMPORTANTE</span>}
                      {linkedBid && <span className="bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm"><Gavel size={10} /> PREGÃO: {linkedBid.biddingNumber}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      {activity.dueDate && <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${delayed ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}><Calendar size={10} /> {delayed ? `VENCIDO: ${formatDateLabel(activity.dueDate)}` : formatDateLabel(activity.dueDate)}</span>}
                      {activity.owner === 'Ambos' && <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><UserCircle2 size={10} /> PENDENTE DE AMBOS</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 transition-all opacity-40 group-hover:opacity-100">
                    <button onClick={(e) => startEdit(e, activity)} className="p-3 text-slate-400 hover:text-blue-600 transition-all hover:bg-blue-50 rounded-2xl"><Edit3 size={20} /></button>
                    <button onClick={(e) => deleteActivity(e, activity.id)} className="p-3 text-slate-400 hover:text-rose-500 transition-all hover:bg-rose-50 rounded-2xl"><Trash2 size={20} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          {completedActivities.length > 0 && activeCategory !== 'atrasadas' && (
            <div className="pt-6 pb-40">
               <button onClick={() => setIsCompletedOpen(!isCompletedOpen)} className="flex items-center gap-3 px-6 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all">
                 {isCompletedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} CONCLUÍDAS ({completedActivities.length})
               </button>
               {isCompletedOpen && (
                 <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    {completedActivities.map(activity => (
                      <div key={activity.id} className="group flex items-center gap-5 p-4 bg-slate-50/50 border border-slate-50 rounded-[2rem] opacity-60 grayscale hover:grayscale-0 transition-all">
                        <button onClick={() => toggleComplete(activity.id)} className="text-blue-500"><CheckCircle2 size={24} /></button>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-500 line-through truncate">{activity.title}</p>
                          {activity.completedAt && <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Concluída em: {formatDateLabel(activity.completedAt)}</p>}
                        </div>
                        <button onClick={(e) => deleteActivity(e, activity.id)} className="opacity-40 hover:opacity-100 p-2 text-rose-400 hover:text-rose-600"><Trash2 size={18} /></button>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}
        </div>
        <footer className="p-10 pt-4 bg-white border-t border-slate-50 sticky bottom-0 z-50">
          <div className={`bg-white rounded-[2.5rem] shadow-2xl border p-4 flex flex-col gap-4 transition-all ${editingId ? 'border-amber-400' : 'border-slate-100'}`}>
            <div className="flex items-center gap-4">
               <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner shrink-0">
                  <button onClick={() => setNewOwner('Pablo')} className={`w-10 h-10 flex items-center justify-center rounded-xl text-[11px] font-black transition-all ${newOwner === 'Pablo' ? 'bg-white text-blue-600 shadow-md border border-blue-100' : 'text-slate-400'}`}>P</button>
                  <button onClick={() => setNewOwner('Marcos')} className={`w-10 h-10 flex items-center justify-center rounded-xl text-[11px] font-black transition-all ${newOwner === 'Marcos' ? 'bg-white text-blue-600 shadow-md border border-blue-100' : 'text-slate-400'}`}>M</button>
                  <button onClick={() => setNewOwner('Ambos')} className={`w-10 h-10 flex items-center justify-center rounded-xl text-[11px] font-black transition-all ${newOwner === 'Ambos' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>A</button>
               </div>
               <input type="text" placeholder={editingId ? "Editando..." : "O que precisa ser feito?"} className="flex-1 px-4 py-3 bg-transparent text-slate-800 font-bold outline-none text-lg" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
               {editingId && <button onClick={cancelEdit} className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center"><X size={24} /></button>}
               <button onClick={handleSubmit} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl ${editingId ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>{editingId ? <Check size={28} /> : <Plus size={28} />}</button>
            </div>
            <div className="flex flex-wrap items-center justify-between px-2 pt-2 border-t border-slate-50 gap-4">
               <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Prazo</span>
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                       <Calendar size={14} className="text-blue-500" />
                       <input type="date" className="bg-transparent border-none outline-none text-[10px] font-black text-slate-700 p-0" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 relative" ref={bidPickerRef}>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Licitação</span>
                    <button onClick={() => setIsBidPickerOpen(!isBidPickerOpen)} className={`flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black h-[34px] ${selectedBidId ? 'text-blue-600 border-blue-200 bg-blue-50/50' : 'text-slate-500'}`}>
                       <Gavel size={14} className={selectedBidId ? 'text-blue-600' : 'text-blue-400'} /> {selectedBidId ? (bids.find(b => b.id === selectedBidId)?.biddingNumber || "LICITAÇÃO") : "SEM VÍNCULO"}
                       {selectedBidId && <X size={12} className="ml-1 hover:text-rose-500" onClick={(e) => { e.stopPropagation(); setSelectedBidId(undefined); }} />}
                    </button>
                    {isBidPickerOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-4 z-[100]">
                        <div className="relative mb-3">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                           <input autoFocus type="text" placeholder="Buscar Pregão..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold outline-none" value={bidSearch} onChange={(e) => setBidSearch(e.target.value)} />
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                           {filteredBids.map(bid => (
                             <button key={bid.id} onClick={() => { setSelectedBidId(bid.id); setIsBidPickerOpen(false); }} className={`w-full text-left p-3 rounded-xl border ${selectedBidId === bid.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent'}`}>
                               <div className="flex justify-between items-start"><span className="text-[10px] font-black text-slate-800 uppercase truncate flex-1">{bid.title}</span><span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 rounded ml-2">{bid.biddingNumber}</span></div>
                             </button>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Prioridade</span>
                    <button onClick={() => setIsNewImportant(!isNewImportant)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border h-[34px] ${isNewImportant ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      <Star size={14} fill={isNewImportant ? "currentColor" : "none"} /> {isNewImportant ? 'MÁXIMA' : 'IMPORTANTE'}
                    </button>
                  </div>
               </div>
               <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] hidden md:block">ENTER PARA SALVAR</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default ActivitiesPage;
