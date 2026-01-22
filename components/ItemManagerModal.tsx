
import React, { useState } from 'react';
import { 
  X, 
  PackagePlus, 
  Plus, 
  Check, 
  Tag, 
  Cpu, 
  Factory, 
  DollarSign, 
  Trash2, 
  Edit2, 
  Box, 
  Search,
  Zap,
  TrendingUp,
  Target,
  Frown,
  RefreshCcw,
  Loader2,
  CloudDownload
} from 'lucide-react';
import { Bid, BidItem, Product } from '../types';

interface ItemManagerModalProps {
  bid: Bid;
  products: Product[];
  newItemData: any;
  setNewItemData: (data: any) => void;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  addItemToBid: (bidId: string) => void;
  startEditItem: (item: BidItem) => void;
  removeItemFromBid: (bidId: string, itemId: string) => void;
  onClose: () => void;
  formatCurrency: (val: number) => string;
  onForceRefresh?: () => Promise<void>;
}

const ItemManagerModal: React.FC<ItemManagerModalProps> = ({
  bid,
  products,
  newItemData,
  setNewItemData,
  editingItemId,
  setEditingItemId,
  addItemToBid,
  startEditItem,
  removeItemFromBid,
  onClose,
  formatCurrency,
  onForceRefresh
}) => {
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [isLostMode, setIsLostMode] = useState(!!newItemData.lostPrice);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredCatalog = products.filter(p => 
    p.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    p.manufacturer.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const selectProductFromCatalog = (product: Product) => {
    setNewItemData({
      ...newItemData,
      name: product.name,
      model: product.model,
      manufacturer: product.manufacturer,
      minPrice: product.minPrice.toString(),
      costPrice: product.costPrice?.toString() || '' // Integração Financeira: Puxa o custo cadastrado
    });
    setShowProductPicker(false);
    setPickerSearch('');
  };

  const handleLostToggle = () => {
    const nextMode = !isLostMode;
    setIsLostMode(nextMode);
    if (nextMode) {
      setNewItemData({ ...newItemData, winningPrice: '' });
    } else {
      setNewItemData({ ...newItemData, lostPrice: '' });
    }
  };

  const handleRefresh = async () => {
    if (!onForceRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onForceRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="px-10 py-8 border-b bg-slate-50 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-200">
                <PackagePlus size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-slate-800">Ficha Técnica de Participação</h3>
                  <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title="Puxar atualizações do sócio"
                    className="p-2 bg-white border border-slate-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-all shadow-sm active:scale-90 disabled:opacity-50"
                  >
                    {isRefreshing ? <RefreshCcw size={16} className="animate-spin" /> : <CloudDownload size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[400px]">Pregão {bid.biddingNumber} - {bid.title}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
              <X size={24} className="text-slate-400" />
           </button>
        </div>

        <div className="p-10 flex-1 overflow-y-auto space-y-10">
           <div className={`p-8 rounded-[2rem] border space-y-6 transition-all duration-300 relative ${editingItemId ? 'bg-amber-50 border-amber-200 shadow-inner' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4 px-1">
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Cadastrar Item da Disputa</span>
                 <button 
                  onClick={() => setShowProductPicker(!showProductPicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                 >
                   <Zap size={14} className="text-blue-400" />
                   Buscar no Catálogo
                 </button>
              </div>

              {showProductPicker && (
                <div className="absolute top-20 right-8 z-50 w-full max-w-sm bg-white border border-slate-200 rounded-[2rem] shadow-2xl animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                  <div className="p-4 border-b bg-slate-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Filtrar catálogo Kits Vital..." 
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                        value={pickerSearch}
                        onChange={e => setPickerSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                    {filteredCatalog.length > 0 ? filteredCatalog.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => selectProductFromCatalog(p)}
                        className="w-full text-left p-4 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100 group"
                      >
                        <div className="flex justify-between items-start mb-1">
                           <p className="font-bold text-slate-800 text-xs group-hover:text-blue-600 truncate flex-1">{p.name}</p>
                           <span className="text-[10px] font-black text-emerald-600 whitespace-nowrap ml-2">{formatCurrency(p.minPrice).split(',')[0]}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{p.manufacturer} • {p.model}</p>
                      </button>
                    )) : (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium italic">Nenhum produto encontrado</div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block px-1">Nº Item</label>
                  <input type="text" placeholder="01" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-center" value={newItemData.number} onChange={e => setNewItemData({...newItemData, number: e.target.value})} />
                </div>
                <div className="col-span-7">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block px-1">Descrição do Item</label>
                  <input type="text" placeholder="Ex: Luvas de Procedimento Estéreis" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold" value={newItemData.name} onChange={e => setNewItemData({...newItemData, name: e.target.value})} />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block px-1">Quantidade</label>
                  <input type="number" placeholder="00" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold" value={newItemData.quantity} onChange={e => setNewItemData({...newItemData, quantity: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                  <label className="text-[10px] font-black text-slate-700 uppercase mb-1 block px-1">Preço Mínimo (Licitante)</label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
                    <input type="number" step="0.01" placeholder="0,00" className="w-full pl-9 pr-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl outline-none font-black text-emerald-700" value={newItemData.minPrice} onChange={e => setNewItemData({...newItemData, minPrice: e.target.value})} />
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block px-1">Modelo</label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="Ex: 2024 V2" className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-medium" value={newItemData.model} onChange={e => setNewItemData({...newItemData, model: e.target.value})} />
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block px-1">Fabricante</label>
                  <div className="relative">
                    <Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="Ex: Indústria Médica S.A" className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-medium" value={newItemData.manufacturer} onChange={e => setNewItemData({...newItemData, manufacturer: e.target.value})} />
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block px-1">Referência Edital (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="number" step="0.01" placeholder="0,00" className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-600" value={newItemData.referencePrice} onChange={e => setNewItemData({...newItemData, referencePrice: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-[1.8rem] border transition-all ${!isLostMode ? 'bg-emerald-50 border-emerald-100 shadow-md' : 'bg-slate-50 border-slate-100 opacity-40 grayscale'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 ${!isLostMode ? 'bg-emerald-600' : 'bg-slate-400'} text-white rounded-lg`}>
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-black ${!isLostMode ? 'text-emerald-800' : 'text-slate-500'}`}>Arremate Ganho</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Informar se vencemos o item</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block px-1">Valor Unitário Ganho (R$)</label>
                    <div className="relative">
                      <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 ${!isLostMode ? 'text-emerald-500' : 'text-slate-300'}`} size={18} />
                      <input 
                        disabled={isLostMode}
                        type="number" 
                        step="0.01" 
                        placeholder="0,00" 
                        className={`w-full pl-12 pr-5 py-4 bg-white border rounded-2xl outline-none font-black transition-all ${!isLostMode ? 'border-emerald-200 text-emerald-600 focus:ring-4 focus:ring-emerald-500/10' : 'border-slate-200 text-slate-300'}`}
                        value={newItemData.winningPrice} 
                        onChange={e => setNewItemData({...newItemData, winningPrice: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-[1.8rem] border transition-all ${isLostMode ? 'bg-rose-50 border-rose-100 shadow-md ring-4 ring-rose-500/5' : 'bg-slate-50 border-slate-100 opacity-40 grayscale'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${isLostMode ? 'bg-rose-500' : 'bg-slate-400'} text-white rounded-lg`}>
                        <Frown size={16} />
                      </div>
                      <div>
                        <h4 className={`text-sm font-black ${isLostMode ? 'text-rose-800' : 'text-slate-500'}`}>Leilão Perdido</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Análise de competitividade</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={isLostMode} 
                        onChange={handleLostToggle}
                        className="w-5 h-5 rounded-lg border-rose-200 text-rose-500 focus:ring-rose-500 transition-all cursor-pointer"
                      />
                      <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest group-hover:underline">Ativar Perda</span>
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block px-1">Valor Vencedor de Concorrência (R$)</label>
                    <div className="relative">
                      <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLostMode ? 'text-rose-500' : 'text-slate-300'}`} size={18} />
                      <input 
                        disabled={!isLostMode}
                        type="number" 
                        step="0.01" 
                        placeholder="Valor final do concorrente" 
                        className={`w-full pl-12 pr-5 py-4 bg-white border rounded-2xl outline-none font-black transition-all ${isLostMode ? 'border-rose-200 text-rose-600 focus:ring-4 focus:ring-rose-500/10' : 'border-slate-200 text-slate-300'}`}
                        value={newItemData.lostPrice} 
                        onChange={e => setNewItemData({...newItemData, lostPrice: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => addItemToBid(bid.id)}
                  className="flex-1 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-700 transition-all active:scale-[0.98]"
                >
                  {editingItemId ? <Check size={24} /> : <Plus size={24} />}
                  {editingItemId ? 'Atualizar Item na Ficha' : 'Adicionar à Participação Kits Vital'}
                </button>
                {editingItemId && (
                  <button onClick={() => { setEditingItemId(null); setNewItemData({ number: '', name: '', quantity: '', model: '', minPrice: '', costPrice: '', referencePrice: '', winningPrice: '', lostPrice: '', manufacturer: '' }); setIsLostMode(false); }} className="px-8 bg-slate-200 text-slate-600 rounded-[1.5rem] font-bold hover:bg-slate-300 transition-colors">Cancelar</button>
                )}
              </div>
           </div>

           <div className="space-y-4 pb-10">
              <div className="flex items-center justify-between px-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Itens Confirmados ({bid.items.length}/07)</h4>
              </div>
              {bid.items.map((item) => (
                <div key={item.id} className={`flex rounded-[2rem] border bg-white p-6 items-center gap-6 group hover:shadow-2xl transition-all border-l-4 relative overflow-hidden ${
                  item.winningPrice ? 'border-emerald-500' : item.lostPrice ? 'border-rose-500 opacity-80' : 'border-blue-600'
                }`}>
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
                     item.winningPrice ? 'bg-emerald-600 text-white' : item.lostPrice ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'
                   }`}>
                     {item.number}
                   </div>
                   <div className="flex-1">
                      <p className="font-bold text-slate-800 text-lg leading-tight">{item.name}</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1.5">
                         <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5 uppercase"><Target size={12}/> Mín: {formatCurrency(item.minPrice || 0)}</span>
                         <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase"><Box size={12}/> {item.quantity} un</span>
                         
                         {item.winningPrice ? (
                           <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1.5 uppercase bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                             <TrendingUp size={12}/> GANHAMOS: {formatCurrency(item.winningPrice * item.quantity)}
                           </span>
                         ) : item.lostPrice ? (
                           <span className="text-[10px] font-black text-rose-600 flex items-center gap-1.5 uppercase bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                             <Frown size={12}/> PERDEMOS EM: {formatCurrency(item.lostPrice)}
                           </span>
                         ) : (
                           <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                             <DollarSign size={12}/> Edital: {formatCurrency(item.referencePrice || 0)}
                           </span>
                         )}
                      </div>
                   </div>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <button onClick={() => { setIsLostMode(!!item.lostPrice); startEditItem(item); }} className="p-4 text-blue-500 hover:bg-blue-50 rounded-2xl transition-colors" title="Editar Item"><Edit2 size={20} /></button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeItemFromBid(bid.id, item.id);
                        }} 
                        className="p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors" 
                        title="Excluir Item"
                      >
                        <Trash2 size={20} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
        <div className="p-10 bg-slate-50 border-t flex justify-end gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
           <button onClick={onClose} className="bg-slate-950 text-white px-16 py-5 rounded-[2rem] font-black hover:bg-black transition-all uppercase text-xs tracking-[0.3em] shadow-xl shadow-slate-200 active:scale-95">Finalizar Gestão</button>
        </div>
      </div>
    </div>
  );
};

export default ItemManagerModal;
