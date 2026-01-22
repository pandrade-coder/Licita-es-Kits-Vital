
import React, { useState, useMemo, useRef } from 'react';
import { 
  Box, 
  Plus, 
  Search, 
  Tag, 
  Cpu, 
  Factory, 
  DollarSign, 
  Edit2, 
  Trash2, 
  Eye, 
  Download, 
  X, 
  Upload, 
  CheckCircle2, 
  FileSearch, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { Product } from '../types';

interface ProductsPageProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  notify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ products, setProducts, notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<{ base64: string, name: string, mimeType: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    manufacturer: '',
    minPrice: '',
    costPrice: ''
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsReadingFile(true);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setFileData({ base64, name: file.name, mimeType: file.type });
        setIsReadingFile(false);
        notify('info', `Folder de "${file.name}" carregado.`);
      };
      reader.onerror = () => {
        setIsReadingFile(false);
        notify('error', 'Erro ao ler arquivo.');
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingProductId(null);
    setFileData(null);
    setFormData({ name: '', model: '', manufacturer: '', minPrice: '', costPrice: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setFileData(product.base64 ? { base64: product.base64, name: product.name, mimeType: product.mimeType || 'application/pdf' } : null);
    setFormData({
      name: product.name,
      model: product.model,
      manufacturer: product.manufacturer,
      minPrice: product.minPrice.toString(),
      costPrice: product.costPrice?.toString() || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const productBase = {
      name: formData.name,
      model: formData.model,
      manufacturer: formData.manufacturer,
      minPrice: parseFloat(formData.minPrice) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      base64: fileData?.base64,
      mimeType: fileData?.mimeType
    };

    if (editingProductId) {
      setProducts(products.map(p => p.id === editingProductId ? { ...p, ...productBase } : p));
      notify('success', 'Produto atualizado no catálogo (Sincronizado).');
    } else {
      const newProduct: Product = {
        ...productBase,
        id: Math.random().toString(36).substr(2, 9)
      };
      setProducts([newProduct, ...products]);
      notify('success', 'Novo produto cadastrado em nuvem.');
    }
    setIsModalOpen(false);
  };

  const downloadFolder = (product: Product) => {
    if (!product.base64) return notify('warning', 'Sem arquivo para download.');
    const link = document.createElement('a');
    link.href = `data:${product.mimeType || 'application/pdf'};base64,${product.base64}`;
    link.download = `Folder_${product.name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Catálogo de Produtos</h2>
          <p className="text-sm text-slate-500 font-medium">Itens técnicos em nuvem (Kits Vital)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar no catálogo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium min-w-[300px]"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col overflow-hidden">
            <div className="p-8 space-y-6 flex-1">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                  <Box size={24} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Preço Mínimo</span>
                  <span className="text-xl font-black text-emerald-600">{formatCurrency(product.minPrice)}</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-xl leading-tight group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Cpu size={14} className="text-slate-300" />
                    <span className="font-bold text-slate-700">Modelo:</span> {product.model}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Factory size={14} className="text-slate-300" />
                    <span className="font-bold text-slate-700">Fabricante:</span> {product.manufacturer}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex items-center gap-2">
              <button 
                onClick={() => setViewingProduct(product)}
                disabled={!product.base64}
                className={`flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${!product.base64 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:text-blue-600'}`}
              >
                <Eye size={16} /> Folder Técnico
              </button>
              <button 
                onClick={() => openEditModal(product)}
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
              >
                <Edit2 size={18} />
              </button>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(confirm("Excluir produto?")) setProducts(p => p.filter(x => x.id !== product.id)); }}
                className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Visualizador de Folder (Cloud Compatible) */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-8">
          <div className="bg-white w-full h-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                  <FileSearch size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">{viewingProduct.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Documento Recuperado da Nuvem</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => downloadFolder(viewingProduct)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all"
                >
                  <Download size={16} /> Baixar
                </button>
                <button 
                  onClick={() => setViewingProduct(null)} 
                  className="p-4 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-4">
               {viewingProduct.base64 ? (
                 <iframe 
                   src={`data:${viewingProduct.mimeType || 'application/pdf'};base64,${viewingProduct.base64}`} 
                   className="w-full h-full rounded-2xl border-none shadow-inner"
                   title="Folder Viewer"
                 />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <AlertCircle size={64} className="mb-4" />
                    <p className="font-bold">Este produto não possui folder técnico na nuvem.</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {editingProductId ? 'Editar Produto' : 'Novo Produto Kits Vital'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all"><X size={24} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Nome do Produto</label>
                  <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Modelo</label>
                  <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-500 transition-all" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Fabricante</label>
                  <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-blue-500 transition-all" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
                </div>
                
                {/* Campos Financeiros Integrados */}
                <div className="col-span-1">
                   <label className="text-[10px] font-black text-rose-500 uppercase mb-2 block px-1">Preço de Custo (R$)</label>
                   <input required type="number" step="0.01" className="w-full px-5 py-4 bg-rose-50/20 border border-rose-100 rounded-2xl outline-none font-black text-rose-600 focus:border-rose-500 transition-all" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} placeholder="0,00" />
                </div>
                <div className="col-span-1">
                   <label className="text-[10px] font-black text-emerald-600 uppercase mb-2 block px-1">Preço Mínimo Venda (R$)</label>
                   <input required type="number" step="0.01" className="w-full px-5 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl outline-none font-black text-emerald-600 focus:border-emerald-500 transition-all" value={formData.minPrice} onChange={e => setFormData({...formData, minPrice: e.target.value})} placeholder="0,00" />
                </div>
                
                <div onClick={() => !isReadingFile && fileInputRef.current?.click()} className={`col-span-2 p-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center gap-3 cursor-pointer transition-all ${fileData ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'}`}>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleFileChange} />
                  {isReadingFile ? <Loader2 className="animate-spin text-blue-500" size={40} /> : fileData ? <CheckCircle2 className="text-emerald-500" size={40} /> : <Upload className="text-blue-500" size={32} />}
                  <p className="text-xs font-bold text-slate-800">{fileData ? 'Arquivo Carregado' : 'Anexar Folder Técnico (Nuvem)'}</p>
                </div>
              </div>
              <button type="submit" disabled={isReadingFile} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl disabled:opacity-50 active:scale-95 transition-all">
                {editingProductId ? 'Atualizar na Nuvem' : 'Cadastrar na Kits Vital'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
