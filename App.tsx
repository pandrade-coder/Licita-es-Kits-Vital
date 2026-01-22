
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import BidsPage from './components/BidsPage';
import BidViewModal from './components/BidViewModal';
import BidModal from './components/BidModal';
import DocsPage from './components/DocsPage';
import ProductsPage from './components/ProductsPage';
import CalendarPage from './components/CalendarPage';
import AnalyticsPage from './components/AnalyticsPage';
import SettingsPage from './components/SettingsPage';
import FinancePage from './components/FinancePage';
import ActivitiesPage from './components/ActivitiesPage';
import LoginPage from './components/LoginPage';
import MayaPage from './components/MayaPage';
import ItemManagerModal from './components/ItemManagerModal';
import { MOCK_BIDS, MOCK_DOCS } from './constants';
import { Bid, CompanyDocument, Product, Notification, Activity, BidItem, AuditLog } from './types';
import { Loader2, Cloud, LogOut, RefreshCcw, WifiOff, Sparkles, AlertCircle, Database, CheckCircle2, DownloadCloud, Clock, ShieldCheck } from 'lucide-react';
import { DataService } from './services/dataService';
import { supabase, signOut } from './services/supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'idle' | 'offline'>('idle');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mayaContext, setMayaContext] = useState<{ bidId?: string; initialPrompt?: string } | null>(null);
  const [bidStatusFilter, setBidStatusFilter] = useState<string>('all');
  const [bidSearchTerm, setBidSearchTerm] = useState('');
  
  const [bids, setBids] = useState<Bid[]>([]);
  const [docs, setDocs] = useState<CompanyDocument[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  const [currentUser, setCurrentUser] = useState<'Marcos' | 'Pablo'>(() => {
    return (localStorage.getItem('@kits-vital:current-user') as 'Marcos' | 'Pablo') || 'Marcos';
  });

  const [toasts, setToasts] = useState<Notification[]>([]);
  const [now, setNow] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'manual' | 'ai'>('manual');
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [viewingBid, setViewingBid] = useState<Bid | null>(null);
  
  const [itemManagerBidId, setItemManagerBidId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemData, setNewItemData] = useState({
    number: '', name: '', quantity: '', brand: '', model: '', 
    minPrice: '', costPrice: '', referencePrice: '', winningPrice: '', lostPrice: '', manufacturer: ''
  });

  const isInitialized = useRef(false);
  const canSyncToCloud = useRef(false);

  const addLog = useCallback((action: AuditLog['action'], type: AuditLog['entityType'], name: string) => {
    const newLog: AuditLog = {
      id: DataService.generateId(),
      user: currentUser,
      action,
      entityType: type,
      entityName: name,
      timestamp: new Date().toISOString()
    };
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const nextLogs = [newLog, ...logs]
      .filter(log => new Date(log.timestamp).getTime() > sevenDaysAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
    setLogs(nextLogs);
    DataService.persistLogs(nextLogs);
  }, [currentUser, logs]);

  const triggerToast = useCallback((type: Notification['type'], message: string) => {
    const id = DataService.generateId();
    const newNotif: Notification = { id, type, message, createdAt: new Date().toISOString(), read: false };
    setToasts(prev => [...prev, newNotif].slice(-3)); 
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const handleExport = useCallback(() => {
    try {
      const backupData = { bids, docs, products, activities, logs, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KitsVital_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerToast('success', `Backup exportado.`);
    } catch (err) { triggerToast('error', 'Falha ao exportar backup.'); }
  }, [bids, docs, products, activities, logs, triggerToast]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.bids) { setBids(data.bids); DataService.persistBids(data.bids); }
        if (data.docs) { setDocs(data.docs); DataService.persistDocs(data.docs); }
        if (data.logs) {
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          const cleanedLogs = data.logs.filter((l: AuditLog) => new Date(l.timestamp).getTime() > sevenDaysAgo);
          setLogs(cleanedLogs); DataService.persistLogs(cleanedLogs);
        }
        triggerToast('success', 'Restauração concluída.');
        canSyncToCloud.current = true;
      } catch (err) { triggerToast('error', 'Arquivo inválido.'); }
    };
    reader.readAsText(file);
  }, [triggerToast]);

  const requestSync = useCallback(async () => {
    if (!session || !canSyncToCloud.current) return;
    setSyncStatus('syncing');
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const cleanedLogs = logs.filter(l => new Date(l.timestamp).getTime() > sevenDaysAgo);
    
    const result = await DataService.syncToCloud({ bids, docs, products, activities, logs: cleanedLogs }) as any;
    if (result.success) {
      setSyncStatus('synced');
    } else {
      setSyncStatus('error');
    }
  }, [bids, docs, products, activities, logs, session]);

  const initializeData = useCallback(async (userSession: any) => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    try {
      const localBids = DataService.loadBids();
      const localDocs = DataService.loadDocs();
      const localProds = DataService.loadProducts();
      const localActs = DataService.loadActivities();
      const localLogs = DataService.loadLogs();
      
      setBids(localBids || MOCK_BIDS);
      setDocs(localDocs || MOCK_DOCS);
      setProducts(localProds || []);
      setActivities(localActs || []);
      
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const cleanedLogs = (localLogs || []).filter((l: AuditLog) => new Date(l.timestamp).getTime() > sevenDaysAgo);
      setLogs(cleanedLogs);
      
      setLoading(false); 
      setSyncStatus('syncing');
      
      const cloudData = await DataService.loadFromCloud();
      if (cloudData) {
        setBids(prev => DataService.mergeCollections(prev, cloudData.bids));
        setDocs(prev => DataService.mergeCollections(prev, cloudData.docs));
        setProducts(prev => DataService.mergeCollections(prev, cloudData.products));
        setActivities(prev => DataService.mergeCollections(prev, cloudData.activities));
        
        const mergedLogs = DataService.mergeCollections(cleanedLogs, cloudData.logs || []);
        const finalLogs = mergedLogs.filter(l => new Date(l.timestamp).getTime() > sevenDaysAgo);
        setLogs(finalLogs);
        
        setSyncStatus('synced');
      }
      canSyncToCloud.current = true;
    } catch (err) { 
      setLoading(false); 
      canSyncToCloud.current = true; 
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) { setSession(s); initializeData(s); } else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) initializeData(s);
    });
    return () => subscription.unsubscribe();
  }, [initializeData]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (canSyncToCloud.current && session) {
      requestSync();
    }
  }, [bids, docs, products, activities, logs, session, requestSync]);

  const handleSaveBid = useCallback((bid: Bid) => {
    const nextBids = DataService.bids.save(bids, bid);
    addLog(bid.id ? 'update' : 'create', 'bid', bid.title);
    setBids(nextBids);
    setIsModalOpen(false);
    setEditingBid(null);
    triggerToast('success', 'Licitação salva.');
  }, [bids, triggerToast, addLog]);

  const handleUpdateDocs = (newDocs: CompanyDocument[]) => {
    const ts = new Date().toISOString();
    const timestamped = newDocs.map(d => ({ ...d, updated_at: ts }));
    addLog('update', 'doc', 'Documentação');
    setDocs(timestamped);
  };

  const handleUpdateProducts = (newProds: Product[]) => {
    const ts = new Date().toISOString();
    const timestamped = newProds.map(p => ({ ...p, updated_at: ts }));
    addLog('update', 'product', 'Produtos');
    setProducts(timestamped);
  };

  const handleUpdateActivities = (newActs: Activity[]) => {
    const ts = new Date().toISOString();
    const timestamped = newActs.map(a => ({ ...a, updated_at: ts }));
    addLog('update', 'activity', 'Atividades');
    setActivities(timestamped);
  };

  const handleDeleteBid = (id: string) => {
    if (!window.confirm("Deseja excluir esta licitação definitivamente? Esta ação será enviada para a nuvem.")) return;
    const bidToDelete = bids.find(b => b.id === id);
    const nextBids = bids.filter(b => b.id !== id);
    setBids(nextBids);
    if (bidToDelete) {
       addLog('delete', 'bid', bidToDelete.title);
    }
    triggerToast('success', 'Licitação removida do terminal e nuvem.');
  };

  const handleAddItemToBid = (bidId: string) => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;
    const nowTs = new Date().toISOString();

    const newItem: BidItem = {
      id: editingItemId || DataService.generateId(),
      number: newItemData.number,
      name: newItemData.name,
      quantity: parseInt(newItemData.quantity) || 0,
      brand: newItemData.brand,
      model: newItemData.model,
      minPrice: parseFloat(newItemData.minPrice) || 0,
      costPrice: parseFloat(newItemData.costPrice) || 0,
      referencePrice: parseFloat(newItemData.referencePrice) || 0,
      winningPrice: newItemData.winningPrice ? parseFloat(newItemData.winningPrice) : undefined,
      lostPrice: newItemData.lostPrice ? parseFloat(newItemData.lostPrice) : undefined,
      manufacturer: newItemData.manufacturer,
      updated_at: nowTs
    };

    let updatedItems;
    if (editingItemId) {
      updatedItems = bid.items.map(it => it.id === editingItemId ? newItem : it);
    } else {
      updatedItems = [...bid.items, newItem];
    }

    const updatedBid = { ...bid, items: updatedItems, updated_at: nowTs };
    addLog('update', 'bid', `Item editado em: ${bid.title}`);
    setBids(bids.map(b => b.id === bidId ? updatedBid : b));
    setEditingItemId(null);
    setNewItemData({
      number: '', name: '', quantity: '', brand: '', model: '', 
      minPrice: '', costPrice: '', referencePrice: '', winningPrice: '', lostPrice: '', manufacturer: ''
    });
  };

  const handleRemoveItemFromBid = (bidId: string, itemId: string) => {
    if (!window.confirm("Remover item?")) return;
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;
    const updatedBid = { ...bid, items: bid.items.filter(it => it.id !== itemId), updated_at: new Date().toISOString() };
    addLog('update', 'bid', `Item removido de: ${bid.title}`);
    setBids(bids.map(b => b.id === bidId ? updatedBid : b));
  };

  const changeUser = (user: 'Marcos' | 'Pablo') => {
    setCurrentUser(user);
    localStorage.setItem('@kits-vital:current-user', user);
    triggerToast('info', `Terminal operado agora por ${user}`);
  };

  const filteredBids = useMemo(() => {
    return (bids || []).filter(bid => {
      const term = (bidSearchTerm || '').toLowerCase().trim();
      const matchesSearch = !term || (
        (bid.title || '').toLowerCase().includes(term) ||
        (bid.biddingNumber || '').toLowerCase().includes(term) ||
        (bid.organ || '').toLowerCase().includes(term)
      );
      return matchesSearch && (bidStatusFilter === 'all' || bid.status === bidStatusFilter);
    });
  }, [bids, bidSearchTerm, bidStatusFilter]);

  const forceCloudRefresh = async () => {
    setSyncStatus('syncing');
    const cloudData = await DataService.loadFromCloud();
    if (cloudData) {
      setBids(prev => DataService.mergeCollections(prev, cloudData.bids));
      setDocs(prev => DataService.mergeCollections(prev, cloudData.docs));
      setProducts(prev => DataService.mergeCollections(prev, cloudData.products));
      setActivities(prev => DataService.mergeCollections(prev, cloudData.activities));
      setLogs(prev => DataService.mergeCollections(prev, cloudData.logs || []));
      addLog('sync', 'finance', 'Cloud Forçada');
      triggerToast('success', 'Nuvem sincronizada.');
    }
    setSyncStatus('synced');
  };

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <h2 className="text-white font-black text-xl tracking-widest uppercase">Oráculo Kits Vital</h2>
    </div>
  );

  if (!session) return <LoginPage onGuestLogin={(mock) => { setSession(mock); initializeData(mock); }} />;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "---" : d.toLocaleDateString('pt-BR');
  };

  const currentTimeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const currentDateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();

  const userColor = currentUser === 'Marcos' ? 'rose' : 'blue';
  const accentBgClass = currentUser === 'Marcos' ? 'bg-rose-500' : 'bg-blue-600';
  const accentTextClass = currentUser === 'Marcos' ? 'text-rose-500' : 'text-blue-600';

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(t) => { setActiveTab(t); if(t !== 'maya') setMayaContext(null); }} 
        onExport={handleExport} 
        onImport={handleImport} 
        currentUser={currentUser} 
        setCurrentUser={changeUser} 
      />
      
      <main className="flex-1 pl-64 h-screen overflow-hidden flex flex-col">
        <header className="h-16 bg-white border-b px-10 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-3">
                <div className={`p-0.5 ${accentBgClass} rounded-full transition-colors duration-500`}>
                   <ShieldCheck size={10} className="text-white" />
                </div>
                <div className="flex flex-col">
                   <h2 className={`${accentTextClass} text-[9px] font-black uppercase tracking-[0.3em] transition-colors duration-500`}>
                      ORÁCULO OPERACIONAL
                   </h2>
                   <p className="text-slate-400 font-bold text-[10px] tracking-tight">{session?.user?.email}</p>
                </div>
             </div>

             <div className="h-6 w-px bg-slate-100"></div>

             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <Clock size={12} className="text-slate-300" />
                   <span className="text-sm font-black text-slate-600 tracking-tight tabular-nums">{currentTimeStr}</span>
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{currentDateStr}</span>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
              syncStatus === 'syncing' ? `bg-${userColor}-50 text-${userColor}-500 border-${userColor}-100` : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
                {syncStatus === 'syncing' ? <RefreshCcw size={12} className="animate-spin" /> : <Cloud size={12} />}
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Salvando...' : 'Offline'}
                </span>
            </div>
            <button onClick={forceCloudRefresh} title="Baixar dados da Nuvem" className={`p-2 bg-slate-50 text-slate-300 hover:${accentBgClass} hover:text-white rounded-lg transition-all border border-slate-100`}>
              <DownloadCloud size={14} />
            </button>
            <button onClick={() => signOut()} className="p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all"><LogOut size={14} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          <div className="p-10 max-w-7xl mx-auto pb-40">
            {activeTab === 'maya' && <MayaPage initialContext={mayaContext} />}
            {activeTab === 'dashboard' && <DashboardPage bids={bids} docs={docs} setActiveTab={setActiveTab} openViewBid={setViewingBid} formatCurrency={formatCurrency} formatDate={formatDate} />}
            {activeTab === 'bids' && <BidsPage now={now} filteredBids={filteredBids} bidStatusFilter={bidStatusFilter} setBidStatusFilter={setBidStatusFilter} searchTerm={bidSearchTerm} setSearchTerm={setBidSearchTerm} openEditBid={(b) => { setEditingBid(b); setModalMode('manual'); setIsModalOpen(true); }} openViewBid={setViewingBid} handleDeleteBid={handleDeleteBid} handleGenerateProposal={async (bid) => { setMayaContext({ bidId: bid.id }); setActiveTab('maya'); }} setItemManagerBidId={setItemManagerBidId} setIsModalOpen={(open, mode) => { setModalMode(mode || 'manual'); setIsModalOpen(open); }} setEditingBid={setEditingBid} formatDate={formatDate} formatCurrency={formatCurrency} />}
            {activeTab === 'finance' && <FinancePage bids={bids} formatCurrency={formatCurrency} onUpdateBid={handleSaveBid} />}
            {activeTab === 'docs' && <DocsPage docs={docs} setDocs={handleUpdateDocs} notify={triggerToast} />}
            {activeTab === 'products' && <ProductsPage products={products} setProducts={handleUpdateProducts} notify={triggerToast} />}
            {activeTab === 'calendar' && <CalendarPage bids={bids} formatDate={formatDate} onViewBid={setViewingBid} />}
            {activeTab === 'analytics' && <AnalyticsPage bids={bids} docs={docs} formatCurrency={formatCurrency} />}
            {activeTab === 'activities' && <ActivitiesPage activities={activities} setActivities={handleUpdateActivities} bids={bids} />}
            {activeTab === 'settings' && <SettingsPage onMergeImport={(file) => handleImport(file)} logs={logs} syncStatus={syncStatus} />}
          </div>
        </div>
      </main>

      <div className="fixed bottom-10 right-10 z-[1000] space-y-4">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 animate-in slide-in-from-right border border-white/10 w-96">
            <div className={`p-3 rounded-2xl ${toast.type === 'success' ? 'bg-emerald-500' : currentUser === 'Marcos' ? 'bg-rose-500' : 'bg-blue-600'}`}><Sparkles size={18}/></div>
            <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">{toast.message}</p>
          </div>
        ))}
      </div>

      <BidModal isOpen={isModalOpen} launchMode={modalMode} onClose={() => setIsModalOpen(false)} onSave={handleSaveBid} initialData={editingBid} />
      
      {itemManagerBidId && (
        <ItemManagerModal 
          bid={bids.find(b => b.id === itemManagerBidId)!}
          products={products}
          newItemData={newItemData}
          setNewItemData={setNewItemData}
          editingItemId={editingItemId}
          setEditingItemId={setEditingItemId}
          addItemToBid={handleAddItemToBid}
          startEditItem={(it) => { setEditingItemId(it.id); setNewItemData({ ...it, quantity: it.quantity.toString() }); }}
          removeItemFromBid={handleRemoveItemFromBid}
          onForceRefresh={forceCloudRefresh}
          onClose={() => setItemManagerBidId(null)}
          formatCurrency={formatCurrency}
        />
      )}

      {viewingBid && <BidViewModal bid={viewingBid} onClose={() => setViewingBid(null)} onUpdateBid={handleSaveBid} onOpenEdit={(bid) => { setViewingBid(null); setEditingBid(bid); setModalMode('manual'); setIsModalOpen(true); }} formatCurrency={formatCurrency} formatDate={formatDate} />}
    </div>
  );
};

export default App;
