
import React, { useState, useMemo, useRef } from 'react';
import { 
  Upload, Download, Edit2, Search, Eye, Plus, X, Calendar, FileText, Trash2, Loader2, Tag, CheckCircle2, 
  Building2, AlertTriangle, ShieldCheck, Info, MapPin, Hash, ClipboardList, Clock
} from 'lucide-react';
import { CompanyDocument } from '../types';
import { DataService } from '../services/dataService';

interface DocsPageProps {
  docs: CompanyDocument[];
  setDocs: (docs: CompanyDocument[]) => void;
  notify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const DocsPage: React.FC<DocsPageProps> = ({ docs, setDocs, notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [tempFileName, setTempFileName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', 
    organ: '', 
    category: 'Jurídico', 
    issueDate: '', 
    expirationDate: '',
    importance: 'Alta' as 'Baixa' | 'Média' | 'Alta', 
    notes: ''
  });

  const CATEGORIES = ['Jurídico', 'Fiscal', 'Técnico', 'Trabalhista', 'ANVISA', 'Outros'];

  const getDynamicStatus = (expStr: string): 'valid' | 'expired' | 'expiring' => {
    if (!expStr) return 'valid';
    const expDate = new Date(expStr + 'T23:59:59');
    const now = new Date();
    if (now > expDate) return 'expired';
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 30 ? 'expiring' : 'valid';
  };

  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = doc.name.toLowerCase().includes(term) || (doc.organ || '').toLowerCase().includes(term);
      const matchesCategory = activeCategory === 'Todas' || doc.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [docs, searchTerm, activeCategory]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await DataService.uploadFile(file, 'docs');
      if (url) {
        setUploadedUrl(url);
        setTempFileName(file.name);
        notify('success', 'Documento carregado no Storage.');
      }
    } catch (err) {
      notify('error', 'Falha no upload para o servidor.');
    } finally {
      setIsUploading(false);
    }
  };

  const openEdit = (doc: CompanyDocument) => {
    setEditingDocId(doc.id);
    setFormData({
      name: doc.name,
      organ: doc.organ || '',
      category: doc.category,
      issueDate: doc.issueDate,
      expirationDate: doc.expirationDate,
      importance: doc.importance,
      notes: doc.notes || ''
    });
    setUploadedUrl(doc.fileUrl || null);
    setIsModalOpen(true);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const status = getDynamicStatus(formData.expirationDate);
    const docData: CompanyDocument = { 
      ...formData, 
      id: editingDocId || DataService.generateId(),
      status, 
      fileUrl: uploadedUrl || undefined
    };

    if (editingDocId) {
      setDocs(docs.map(d => d.id === editingDocId ? docData : d));
      notify('success', 'Certidão atualizada com sucesso.');
    } else {
      setDocs([docData, ...docs]);
      notify('success', 'Nova certidão arquivada no Oráculo.');
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDocId(null);
    setUploadedUrl(null);
    setTempFileName(null);
    setFormData({
      name: '', organ: '', category: 'Jurídico', issueDate: '', expirationDate: '',
      importance: 'Alta', notes: ''
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Certidões & Compliance</h2>
          <p className="text-sm text-slate-500 font-medium">Gestão documental técnica Kits Vital</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Buscar por nome ou órgão..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none min-w-[320px] font-bold text-slate-700 shadow-sm focus:border-blue-500 transition-all"
             />
          </div>
          <button onClick={() => { closeModal(); setIsModalOpen(true); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-blue-700 transition-all active:scale-95">
            <Plus size={20} /> Nova Certidão
          </button>
        </div>
      </div>

      {/* FILTROS POR CATEGORIA */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {['Todas', ...CATEGORIES].map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredDocs.map((doc) => {
          const status = getDynamicStatus(doc.expirationDate);
          return (
            <div key={doc.id} className={`group bg-white rounded-[3rem] border-2 shadow-sm hover:shadow-2xl transition-all flex flex-col p-8 gap-6 relative overflow-hidden ${
              status === 'expired' ? 'border-rose-400' : status === 'expiring' ? 'border-amber-400' : 'border-slate-50'
            }`}>
              <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl shadow-sm ${
                  status === 'expired' ? 'bg-rose-50 text-rose-500' : status === 'expiring' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                }`}>
                  <FileText size={24} />
                </div>
                <div className="flex flex-col items-end gap-2">
                   <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-sm ${
                     status === 'expired' ? 'bg-rose-600 text-white' : status === 'expiring' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                   }`}>
                     {status === 'expired' ? 'VENCIDO' : status === 'expiring' ? 'VENCENDO' : 'VÁLIDO'}
                   </span>
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${
                     doc.importance === 'Alta' ? 'bg-rose-100 text-rose-600' : doc.importance === 'Média' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                   }`}>
                     Prioridade {doc.importance}
                   </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-black text-slate-800 text-xl leading-tight truncate" title={doc.name}>{doc.name}</h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                    <Building2 size={12} /> {doc.organ || 'Emissor não informado'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Emissão</p>
                      <p className="text-xs font-bold text-slate-700">{doc.issueDate ? new Date(doc.issueDate + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Vencimento</p>
                      <p className={`text-xs font-black ${status === 'expired' ? 'text-rose-600' : status === 'expiring' ? 'text-amber-600' : 'text-slate-700'}`}>
                        {doc.expirationDate ? new Date(doc.expirationDate + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}
                      </p>
                   </div>
                </div>

                {doc.notes && (
                  <p className="text-[10px] text-slate-500 font-medium italic line-clamp-2">"{doc.notes}"</p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-auto">
                {doc.fileUrl && (
                  <button onClick={() => setViewingUrl(doc.fileUrl!)} className="flex-1 py-4 bg-slate-950 text-white hover:bg-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl">
                    <Eye size={16} /> Abrir Pasta
                  </button>
                )}
                <button onClick={() => openEdit(doc)} className="p-4 bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all"><Edit2 size={18} /></button>
                <button onClick={() => { if(confirm("Deseja remover esta certidão definitivamente?")) setDocs(docs.filter(d => d.id !== doc.id)); }} className="p-4 bg-rose-50 text-rose-300 hover:bg-rose-600 hover:text-white rounded-2xl transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* VISUALIZADOR STORAGE */}
      {viewingUrl && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-8">
          <div className="bg-white w-full h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-white/10">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><CheckCircle2 size={24} /></div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Visualização Storage Kits Vital</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Documento Seguro Verificado</p>
                 </div>
              </div>
              <button onClick={() => setViewingUrl(null)} className="p-4 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"><X size={24} /></button>
            </div>
            <div className="flex-1 bg-slate-200">
               <iframe src={viewingUrl} className="w-full h-full border-none" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO EXPANDIDO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[95vh]">
            <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
               <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                    {editingDocId ? 'Editar Certidão' : 'Nova Certidão de Compliance'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Armazenamento em Storage Cloud</p>
               </div>
               <button onClick={closeModal} className="p-4 hover:bg-slate-200 rounded-3xl transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-white">
              <form id="docForm" onSubmit={handleSaveDoc} className="space-y-10">
                
                <section className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <ClipboardList size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados do Documento</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Título da Certidão</label>
                      <input required type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-bold text-slate-800 focus:border-blue-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Certidão Negativa de Débitos Estaduais" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Órgão Emissor</label>
                      <div className="relative">
                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input required type="text" className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-bold text-slate-800 focus:border-blue-500 transition-all" value={formData.organ} onChange={e => setFormData({...formData, organ: e.target.value})} placeholder="Secretaria de Fazenda / ANVISA" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Categoria</label>
                      <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-bold text-slate-800 focus:border-blue-500 transition-all appearance-none cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <Calendar size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cronologia de Validade</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Data de Emissão</label>
                      <input required type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-bold text-slate-800" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-rose-500 uppercase mb-2 block px-1">Data de Vencimento</label>
                      <input required type="date" className="w-full px-6 py-4 bg-rose-50/30 border border-rose-100 rounded-[2rem] outline-none font-black text-rose-700" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} />
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Compliance</span>
                  </div>
                  <div className="flex gap-4">
                    {['Baixa', 'Média', 'Alta'].map(lvl => (
                      <button 
                        key={lvl}
                        type="button" 
                        onClick={() => setFormData({...formData, importance: lvl as any})}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.importance === lvl ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-200' : 'bg-white border-slate-100 text-slate-300'}`}
                      >
                        {lvl} Prioridade
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">Notas e Restrições</label>
                    <textarea rows={3} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-medium text-slate-600" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Observações sobre renovação ou uso restrito..." />
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <Upload size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arquivo Digital (Cloud Storage)</span>
                  </div>
                  <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()} 
                    className={`p-10 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center gap-3 cursor-pointer transition-all hover:bg-slate-50 ${uploadedUrl ? 'bg-emerald-50 border-emerald-200 shadow-xl' : 'bg-blue-50/20 border-blue-100'}`}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleFileChange} />
                    {isUploading ? <Loader2 className="animate-spin text-blue-500" size={40} /> : uploadedUrl ? <CheckCircle2 className="text-emerald-500" size={40} /> : <Upload className="text-blue-500" size={40} />}
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{uploadedUrl ? (tempFileName || 'Arquivo Substituído') : 'Anexar Certidão PDF / Imagem'}</p>
                    {uploadedUrl && <p className="text-[9px] text-emerald-600 font-bold uppercase">Arquivo Sincronizado com a Nuvem</p>}
                  </div>
                </section>
              </form>
            </div>

            <div className="p-10 border-t bg-slate-50 flex gap-6 shrink-0 shadow-2xl">
               <button onClick={closeModal} className="px-12 py-5 bg-white border border-slate-200 text-slate-500 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">Cancelar</button>
               <button type="submit" form="docForm" disabled={isUploading} className="flex-1 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95">
                 {isUploading ? 'Aguardando Upload...' : editingDocId ? 'Atualizar no Oráculo' : 'Salvar no Oráculo'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocsPage;
