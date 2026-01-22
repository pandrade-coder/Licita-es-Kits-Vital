
import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Percent, Truck, Receipt, Users, Calculator, Info, Calendar, Hash, Package } from 'lucide-react';
import { Bid, BidItem } from '../types';

interface MarginCalculationModalProps {
  isOpen: boolean;
  bid: Bid;
  onClose: () => void;
  onSave: (updatedBid: Bid) => void;
  formatCurrency: (val: number) => string;
  activeTab: 'previstas' | 'ganhas';
}

const MarginCalculationModal: React.FC<MarginCalculationModalProps> = ({ 
  isOpen, 
  bid, 
  onClose, 
  onSave, 
  formatCurrency,
  activeTab
}) => {
  const [items, setItems] = useState<BidItem[]>(bid.items);
  const [logisticData, setLogisticData] = useState({
    commitmentDate: bid.commitmentDate || '',
    paymentDate: bid.paymentDate || '',
    trackingCode: bid.trackingCode || '',
    deliveryDeadline: bid.deliveryDeadline || ''
  });

  useEffect(() => {
    setItems(bid.items);
    setLogisticData({
      commitmentDate: bid.commitmentDate || '',
      paymentDate: bid.paymentDate || '',
      trackingCode: bid.trackingCode || '',
      deliveryDeadline: bid.deliveryDeadline || ''
    });
  }, [bid]);

  if (!isOpen) return null;

  const handleUpdateItem = (itemId: string, field: keyof BidItem, value: number) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  };

  const handleSave = () => {
    onSave({ 
      ...bid, 
      items,
      ...logisticData
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Calculator size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cálculo de Margem: {activeTab === 'previstas' ? 'Projeção' : 'Execução'}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[600px]">{bid.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
          
          {/* LOGÍSTICA E DATAS FINANCEIRAS */}
          <div className="bg-white rounded-[2.5rem] border border-blue-100 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <Calendar size={18} />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Controle Logístico e Datas</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest px-1">Data Empenho Gerado</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                  value={logisticData.commitmentDate}
                  onChange={e => setLogisticData({...logisticData, commitmentDate: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-blue-600 uppercase mb-1.5 block tracking-widest px-1">Data Prevista Pagamento</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-black text-sm text-blue-700"
                  value={logisticData.paymentDate}
                  onChange={e => setLogisticData({...logisticData, paymentDate: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest px-1">Código de Rastreio</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input 
                    type="text"
                    placeholder="Ex: BR123456789"
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                    value={logisticData.trackingCode}
                    onChange={e => setLogisticData({...logisticData, trackingCode: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest px-1">Data Limite Entrega</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                  value={logisticData.deliveryDeadline}
                  onChange={e => setLogisticData({...logisticData, deliveryDeadline: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* ITENS FINANCEIROS */}
          {items.map((item, idx) => {
            const revenue = (item.winningPrice || item.referencePrice || 0) * item.quantity;
            const costTotalQtd = (item.costPrice || 0) * item.quantity;
            const taxTotal = revenue * ((item.taxPercentage || 0) / 100);
            const subtotalCost = costTotalQtd + (item.shippingCost || 0) + taxTotal;
            const margin = revenue - subtotalCost;
            const investorPart = margin > 0 ? margin * ((item.investorPercentage || 0) / 100) : 0;
            const finalProfit = margin - investorPart;

            return (
              <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 space-y-6">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center font-black">{item.number}</div>
                      <div>
                         <h4 className="font-bold text-slate-800">{item.name}</h4>
                         <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Quantidade: {item.quantity} unidades</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receita Item</p>
                      <p className="text-xl font-black text-slate-800">{formatCurrency(revenue)}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest px-1">Custo Unitário</label>
                    <input 
                      type="number" step="0.01" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                      value={item.costPrice || ''}
                      onChange={e => handleUpdateItem(item.id, 'costPrice', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest px-1">Custo Total (QTD)</label>
                    <div className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl font-bold text-slate-600 text-sm">
                      {formatCurrency(costTotalQtd)}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest px-1">Frete Total</label>
                    <input 
                      type="number" step="0.01" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                      value={item.shippingCost || ''}
                      onChange={e => handleUpdateItem(item.id, 'shippingCost', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest px-1">Imposto %</label>
                    <input 
                      type="number" step="0.1" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                      value={item.taxPercentage || ''}
                      onChange={e => handleUpdateItem(item.id, 'taxPercentage', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest px-1">Investidor %</label>
                    <input 
                      type="number" step="0.1" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-sm"
                      value={item.investorPercentage || ''}
                      onChange={e => handleUpdateItem(item.id, 'investorPercentage', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 p-5 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Parte Investidor</p>
                    <p className="text-lg font-black text-rose-600">{formatCurrency(investorPart)}</p>
                  </div>
                  <div className="flex-[1.5] p-5 rounded-[1.5rem] bg-blue-600 text-white shadow-xl shadow-blue-100 flex flex-col justify-center relative overflow-hidden">
                    <div className="relative z-10">
                       <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">Lucro KV Final</p>
                       <p className="text-2xl font-black">{formatCurrency(finalProfit)}</p>
                    </div>
                    <DollarSign size={80} className="absolute right-[-20px] top-[-10px] text-white/10 rotate-12" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-10 border-t bg-slate-950 flex justify-end shrink-0 shadow-2xl">
          <button 
            onClick={handleSave}
            className="px-16 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95"
          >
            <Save size={18} />
            Salvar Detalhamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarginCalculationModal;
