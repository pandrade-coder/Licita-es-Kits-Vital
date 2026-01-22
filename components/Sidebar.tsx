
import React, { useRef } from 'react';
import { LayoutDashboard, FileText, Calendar, PieChart, Settings, ShieldCheck, Box, DollarSign, Sparkles, BookOpen, DownloadCloud, UploadCloud, Database, ListTodo, User, UserCircle } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  currentUser: 'Marcos' | 'Pablo';
  setCurrentUser: (user: 'Marcos' | 'Pablo') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onExport, onImport, currentUser, setCurrentUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuItems = [
    { id: 'maya', label: 'Maya AI', icon: <Sparkles size={20} className="text-blue-400" /> },
    { id: 'dashboard', label: 'Painel Geral', icon: <LayoutDashboard size={20} /> },
    { id: 'activities', label: 'Atividades', icon: <ListTodo size={20} className="text-amber-500" /> },
    { id: 'bids', label: 'Licitações', icon: <FileText size={20} className="text-indigo-400" /> },
    { id: 'finance', label: 'Financeiro', icon: <DollarSign size={20} className="text-emerald-400" /> },
    { id: 'products', label: 'Produtos', icon: <Box size={20} /> },
    { id: 'docs', label: 'Documentação', icon: <ShieldCheck size={20} /> },
    { id: 'calendar', label: 'Calendário', icon: <Calendar size={20} /> },
    { id: 'analytics', label: 'Desempenho', icon: <PieChart size={20} className="text-rose-400" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings size={20} /> },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-900 z-50 shadow-2xl">
      <div className="p-6 border-b border-slate-900 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <BookOpen size={22} />
        </div>
        <div>
          <h1 className="text-white font-bold leading-none tracking-tight">Oráculo</h1>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Gestão de Licitações</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? currentUser === 'Marcos' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/40' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* SELETOR DE IDENTIDADE - REFINADO */}
      <div className="px-4 py-6 border-t border-slate-900 bg-slate-950/50">
        <div className="flex items-center gap-2 px-2 mb-4">
           <UserCircle size={14} className={currentUser === 'Marcos' ? 'text-rose-500' : 'text-blue-500'} />
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sócio Licitante</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
           <button 
             onClick={() => setCurrentUser('Marcos')}
             className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
               currentUser === 'Marcos' ? 'bg-rose-500 border-rose-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
             }`}
           >
             Marcos
           </button>
           <button 
             onClick={() => setCurrentUser('Pablo')}
             className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
               currentUser === 'Pablo' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
             }`}
           >
             Pablo
           </button>
        </div>
      </div>

      <div className="p-4 border-t border-slate-900 space-y-2">
        <div className="flex items-center gap-2 px-2 mb-2">
           <Database size={10} className={currentUser === 'Marcos' ? 'text-rose-500' : 'text-blue-500'} />
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Backups de Dados</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
           <button 
             onClick={onExport}
             title="Baixar Backup Completo (.json)"
             className="flex flex-col items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-white/5 hover:text-white rounded-xl border border-slate-800 transition-all text-slate-500"
           >
             <DownloadCloud size={16} />
             <span className="text-[8px] font-black uppercase">Exportar</span>
           </button>
           
           <button 
             onClick={() => fileInputRef.current?.click()}
             title="Restaurar de arquivo (.json)"
             className="flex flex-col items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-white/5 hover:text-white rounded-xl border border-slate-800 transition-all text-slate-500"
           >
             <UploadCloud size={16} />
             <span className="text-[8px] font-black uppercase">Importar</span>
           </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
      </div>

      <div className="p-4 border-t border-slate-900">
        <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50 text-center">
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Terminal Operacional v2.5</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
