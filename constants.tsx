
import React from 'react';
import { 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  FileBadge, 
  AlertTriangle, 
  XCircle, 
  Package, 
  Truck, 
  DollarSign, 
  ClipboardList, 
  Edit3,
  Search,
  FlaskConical,
  Send,
  Trophy,
  FileCheck,
  CheckCircle,
  ShoppingBag,
  ArrowRightCircle
} from 'lucide-react';
import { Bid, BidStatus, BidModality, CompanyDocument } from './types';

export const MOCK_BIDS: Bid[] = [
  {
    id: '1',
    order: '001/2024',
    title: 'Fornecimento de Kits de Primeiros Socorros',
    biddingNumber: '15/2024',
    organ: 'Prefeitura Municipal de São Paulo',
    modality: BidModality.PREGAO_ELETRONICO,
    disputedItem: 'Lote 01 - Gazes e Esparadrapos',
    items: [
      {
        id: 'i1',
        number: '01',
        name: 'Gaze Estéril 7,5x7,5',
        quantity: 5000,
        brand: 'Kits Vital',
        model: 'Premium',
        minPrice: 1.50,
        winningPrice: 1.35,
        manufacturer: 'Kits Vital Ind.'
      }
    ],
    date: '2024-06-15T09:00:00',
    value: 16500,
    anvisa: true,
    sample: true,
    status: BidStatus.WON_AUCTION,
    documents: [],
    notes: 'Licitação arrematada com sucesso.'
  }
];

export const MOCK_DOCS: CompanyDocument[] = [
  {
    id: 'd1',
    name: 'CNPJ - Cartão Atualizado',
    category: 'Jurídico',
    issueDate: '2024-01-01',
    expirationDate: '2024-12-31',
    status: 'valid',
    importance: 'Alta',
    notes: 'Documento base.',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
];

export const STATUS_COLORS = {
  [BidStatus.LAUNCHED]: 'bg-slate-100 text-slate-600 border-slate-200',
  [BidStatus.INSERT_MODEL]: 'bg-slate-200 text-slate-700 border-slate-300',
  [BidStatus.READY_WAITING]: 'bg-blue-50 text-blue-600 border-blue-100',
  [BidStatus.WON_AUCTION]: 'bg-blue-600 text-white border-blue-700',
  [BidStatus.PROPOSAL_SENT]: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  [BidStatus.IN_DISPUTE]: 'bg-amber-100 text-amber-700 border-amber-200',
  [BidStatus.WAITING_SAMPLES]: 'bg-orange-50 text-orange-700 border-orange-100',
  [BidStatus.SAMPLES_SENT]: 'bg-orange-100 text-orange-800 border-orange-200',
  [BidStatus.WAITING_HOMOLOGATION]: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  [BidStatus.HOMOLOGATED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [BidStatus.COMMITMENT_GENERATED]: 'bg-purple-100 text-purple-700 border-purple-200',
  [BidStatus.PRODUCT_ORDERED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [BidStatus.PRODUCT_PICKED]: 'bg-teal-100 text-teal-700 border-teal-200',
  [BidStatus.PRODUCT_SHIPPED]: 'bg-indigo-600 text-white border-indigo-700',
  [BidStatus.WAITING_PAYMENT]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [BidStatus.PAID_CONCLUDED]: 'bg-emerald-600 text-white border-emerald-700',
  [BidStatus.LOST]: 'bg-rose-100 text-rose-700 border-rose-200',
  [BidStatus.IN_APPEAL]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export const STATUS_ICONS = {
  [BidStatus.LAUNCHED]: <ClipboardList className="w-4 h-4" />,
  [BidStatus.INSERT_MODEL]: <Edit3 className="w-4 h-4" />,
  [BidStatus.READY_WAITING]: <Clock className="w-4 h-4" />,
  [BidStatus.WON_AUCTION]: <Trophy className="w-4 h-4" />,
  [BidStatus.PROPOSAL_SENT]: <Send className="w-4 h-4" />,
  [BidStatus.IN_DISPUTE]: <PlayCircle className="w-4 h-4" />,
  [BidStatus.WAITING_SAMPLES]: <FlaskConical className="w-4 h-4" />,
  [BidStatus.SAMPLES_SENT]: <ArrowRightCircle className="w-4 h-4" />,
  [BidStatus.WAITING_HOMOLOGATION]: <Search className="w-4 h-4" />,
  [BidStatus.HOMOLOGATED]: <FileCheck className="w-4 h-4" />,
  [BidStatus.COMMITMENT_GENERATED]: <FileBadge className="w-4 h-4" />,
  [BidStatus.PRODUCT_ORDERED]: <ShoppingBag className="w-4 h-4" />,
  [BidStatus.PRODUCT_PICKED]: <Package className="w-4 h-4" />,
  [BidStatus.PRODUCT_SHIPPED]: <Truck className="w-4 h-4" />,
  [BidStatus.WAITING_PAYMENT]: <DollarSign className="w-4 h-4" />,
  [BidStatus.PAID_CONCLUDED]: <CheckCircle className="w-4 h-4" />,
  [BidStatus.LOST]: <XCircle className="w-4 h-4" />,
  [BidStatus.IN_APPEAL]: <AlertTriangle className="w-4 h-4" />,
};
