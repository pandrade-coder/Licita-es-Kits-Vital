
import React, { useState, useRef, useMemo } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Building2, 
  Shield, 
  Bell, 
  Cloud, 
  Globe, 
  MapPin, 
  FileText, 
  Briefcase,
  History,
  Coins,
  Scale,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Database,
  RefreshCw,
  UploadCloud,
  FileWarning,
  HandCoins,
  Sparkles,
  Map,
  ClipboardCheck,
  Tag,
  Merge,
  FileUp,
  Activity,
  Server,
  ChevronDown
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { AuditLog } from '../types';

interface SettingsPageProps {
  onMergeImport: (file: File) => void;
  logs: AuditLog[];
  syncStatus?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onMergeImport, logs, syncStatus }) => {
  const [activeTab, setActiveTab] = useState('company');
  const [recoveryJson, setRecoveryJson] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [visibleLogsCount, setVisibleLogsCount] = useState(7);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  // Ordenação garantida dos logs antes de exibir
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs]);

  const [notifSettings, setNotifSettings] = useState({
    pregao_2h: true,
    pregao_1h: true,
    certidao_30d: true,
    pendencia_tecnica: true,
    pagamento_pendente: true,
    arremate_confirmado: true,
    maya_analise: true
  });

  const toggleNotif = (key: keyof typeof notifSettings) => {
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleManualRecovery = () => {
    if (!recoveryJson.trim()) return alert("Cole o JSON do Supabase primeiro.");
    setIsRecovering(true);
    try {
      const parsed = JSON.parse(recoveryJson);
      const data = parsed.payload || parsed;
      
      if (data.bids) {
        DataService.persistBids(data.bids);
        if (data.docs) DataService.persistDocs(data.docs);
        if (data.products) DataService.persistProducts(data.products);
        if (data.logs) DataService.persistLogs(data.logs);
        alert("KITS VITAL: Recuperação concluída! A página será reiniciada.");
        window.location.reload();
      } else {
        alert("JSON inválido ou incompleto.");
      }
    } catch (e) {
      alert("Erro ao ler JSON.");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleMergeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onMergeImport(file);
      if (e.target) e.target.value = '';
    }
  };

  const NotificationToggle = ({ label, description, active, onToggle, icon }: any) => (
    <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-md transition-all group">
      <div className="flex items-center gap-5">
        <div className={`p-3 rounded-2xl ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-400'} transition-all duration-300`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{label}</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{description}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={`relative w-24 h-10 rounded-full p-1 transition-all duration-300 ${active ? 'bg-emerald-500' : 'bg-rose-500'}`}
      >
        <div className={`h-8 w-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${active ? 'translate-x-10' : 'translate-x-0'}`}>
           <span className={`text-[8px] font-black uppercase ${active ? 'text-emerald-600' : 'text-rose-600'}`}>
             {active ? 'ON' : 'OFF'}
           </span>
        </div>
      </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Configurações</h2>
          <p className="text-sm text-slate-500 font-medium">Controle de sistema e dados corporativos Kits Vital</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          {[
            { id: 'profile', label: 'Meu Perfil', icon: <User size={18}/> },
            { id: 'company', label: 'Empresa Kits Vital', icon: <Building2 size={18}/> },
            { id: 'logs', label: 'Histórico de Operações', icon: <History size={18} className="text-blue-500" /> },
            { id: 'notifications', label: 'Notificações', icon: <Bell size={18}/> },
            { id: 'recovery', label: 'Recuperação de Dados', icon: <Database size={18}/> },
            { id: 'integrations', label: 'IA & Integrações', icon: <Cloud size={18}/> },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
                  : 'text-slate-400 hover:bg-white hover:text-slate-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {activeTab === 'company' && (
            <div className="flex-1 animate-in fade-in duration-300 overflow-y-auto max-h-[75vh] scrollbar-hide">
              <div className="p-10 space-y-12">
                <section>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem] shadow-sm">
                      <Building2 size={24}/>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Identificação Corporativa</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Dados oficiais da matriz Kits Vital</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Razão Social</label>
                      <input type="text" readOnly className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700" value="Kits Vital Comercio de Produtos Para Saude, Tatico e Emergencia Ltda." />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">CNPJ</label>
                      <input type="text" readOnly className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700" value="42.394.438/0001-41" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Inscrição Estadual (PB)</label>
                      <input type="text" readOnly className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700" value="16.402.085-3" />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="flex-1 animate-in fade-in duration-300 p-10 space-y-8 overflow-y-auto max-h-[75vh]">
               <div className="flex items-center justify-between bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                     <Server size={180} />
                  </div>
                  <div className="relative z-10 flex items-center gap-5">
                     <div className="p-4 bg-rose-500 rounded-2xl shadow-xl shadow-rose-500/20">
                        <History size={32}/>
                     </div>
                     <div>
                        <h3 className="text-2xl font-black tracking-tight uppercase">Audit Log Oráculo</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                           <p className="text-[9px] text-rose-400 font-black uppercase tracking-[0.2em]">Monitoramento Real-Time (Retenção 7 Dias)</p>
                        </div>
                     </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total: {sortedLogs.length}</span>
                  </div>
               </div>

               <div className="space-y-3">
                 {sortedLogs.length > 0 ? (
                   <>
                    {sortedLogs.slice(0, visibleLogsCount).map((log) => (
                      <div key={log.id} className={`flex items-center gap-6 p-5 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl transition-all border-l-4 ${log.user === 'Marcos' ? 'border-l-rose-500' : 'border-l-blue-600'} group animate-in slide-in-from-top-2`}>
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs shadow-lg transition-transform group-hover:scale-110 ${log.user === 'Marcos' ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white'}`}>
                                {log.user.substring(0, 1)}
                            </div>
                            <span className={`text-[9px] font-black ${log.user === 'Marcos' ? 'text-rose-500' : 'text-slate-800'} uppercase tracking-tighter`}>{log.user}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1.5">
                              <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                log.action === 'create' ? 'bg-emerald-50 text-emerald-600' :
                                log.action === 'update' ? 'bg-blue-50 text-blue-600' :
                                log.action === 'delete' ? 'bg-rose-50 text-rose-600' :
                                'bg-amber-50 text-amber-600'
                              }`}>
                                {log.action === 'create' ? 'NOVO LANÇAMENTO' : log.action === 'update' ? 'EDIÇÃO SALVA' : log.action.toUpperCase()}
                              </span>
                              <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[9px] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                  <ShieldCheck size={10} />
                                  Sincronizado
                              </div>
                            </div>
                            <h4 className="text-base font-bold text-slate-800 truncate pr-4">{log.entityName}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Categoria: {log.entityType}</p>
                          </div>

                          <div className="text-right shrink-0 border-l border-slate-50 pl-8">
                            <div className="flex items-center justify-end gap-2 text-slate-800 font-black text-sm">
                                <Clock size={14} className={log.user === 'Marcos' ? 'text-rose-400' : 'text-blue-500'} />
                                {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{new Date(log.timestamp).toLocaleDateString('pt-BR')}</p>
                          </div>
                      </div>
                    ))}
                    
                    {sortedLogs.length > visibleLogsCount && (
                      <div className="pt-6 flex justify-center">
                        <button 
                          onClick={() => setVisibleLogsCount(prev => prev + 10)}
                          className="flex items-center gap-3 px-12 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95"
                        >
                          <ChevronDown size={18} /> Ver Mais Operações
                        </button>
                      </div>
                    )}
                   </>
                 ) : (
                   <div className="py-32 text-center text-slate-300 border-4 border-dashed border-slate-50 rounded-[4rem] bg-slate-50/20">
                      <Activity size={64} className="mx-auto mb-6 opacity-10" />
                      <p className="text-xs font-black uppercase tracking-[0.3em]">Aguardando primeiro sincronismo de nuvem</p>
                   </div>
                 )}
               </div>
            </div>
          )}

          {activeTab === 'recovery' && (
            <div className="flex-1 animate-in fade-in duration-300 p-10 space-y-12 overflow-y-auto">
              <section className="bg-blue-50 border border-blue-100 p-10 rounded-[2.5rem] space-y-6">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg">
                       <Merge size={24} />
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-blue-900 tracking-tight uppercase">Mesclar Backup Externo</h4>
                       <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Adicionar novas licitações/produtos aos atuais (Merge)</p>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-blue-100 space-y-4 shadow-sm">
                    <p className="text-xs text-slate-600 font-medium">Use esta opção para recuperar produtos ou licitações de arquivos antigos sem deletar o que você já cadastrou hoje. O sistema identifica duplicatas pelo ID e adiciona apenas o que falta.</p>
                    <div className="pt-2">
                      <button onClick={() => mergeFileInputRef.current?.click()} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95">
                         <FileUp size={18} /> Selecionar JSON para Mesclagem
                      </button>
                    </div>
                    <input type="file" ref={mergeFileInputRef} className="hidden" accept=".json" onChange={handleMergeFileChange} />
                 </div>
              </section>

              <section className="space-y-6 opacity-80">
                <div className="flex items-center gap-4 px-2">
                  <Database className="text-slate-400" size={24} />
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Substituição Total (Restauração)</h4>
                </div>
                <div className="space-y-4">
                  <textarea 
                    rows={6}
                    placeholder='Cole aqui o JSON para restauração completa. ATENÇÃO: Isso apagará os dados locais!'
                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[10px] outline-none focus:bg-white focus:border-rose-500 transition-all"
                    value={recoveryJson}
                    onChange={e => setRecoveryJson(e.target.value)}
                  />
                  <button 
                    onClick={handleManualRecovery}
                    disabled={isRecovering}
                    className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-700 transition-all shadow-xl disabled:opacity-50"
                  >
                    {isRecovering ? <RefreshCw className="animate-spin" /> : <UploadCloud />}
                    Sobrescrever Banco de Dados Local
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="flex-1 animate-in fade-in duration-300 overflow-y-auto">
              <div className="p-10 space-y-12 pb-20">
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem] shadow-sm">
                      <Bell size={24}/>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Central de Alertas</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Configure como você recebe os avisos do Oráculo</p>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Operacional & Pregões</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <NotificationToggle icon={<Clock size={20}/>} label="Início do Pregão (2h)" description="Aviso preventivo 2 horas antes da abertura do certame." active={notifSettings.pregao_2h} onToggle={() => toggleNotif('pregao_2h')} />
                        <NotificationToggle icon={<AlertTriangle size={20}/>} label="Contagem Regressiva (1h)" description="Alerta crítico de última hora para acesso ao portal." active={notifSettings.pregao_1h} onToggle={() => toggleNotif('pregao_1h')} />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-10 border-t flex justify-between items-center shrink-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestão Kits Vital • 2024</p>
            <button className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black hover:bg-black transition-all uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-slate-200 active:scale-95">
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
