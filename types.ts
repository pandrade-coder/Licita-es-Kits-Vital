
import React from 'react';

export enum BidStatus {
  LAUNCHED = 'Lançado',
  INSERT_MODEL = 'Inserir Marca Modelo',
  READY_WAITING = 'Pronto Ag Leilão',
  WON_AUCTION = 'Leilão Ganho',
  PROPOSAL_SENT = 'Proposta Enviada',
  IN_DISPUTE = 'Em Disputa',
  WAITING_SAMPLES = 'Aguardando Envio Amostra',
  SAMPLES_SENT = 'Amostra Enviada',
  WAITING_HOMOLOGATION = 'Aguardando Homologação',
  HOMOLOGATED = 'Homologado',
  COMMITMENT_GENERATED = 'Empenho Gerado',
  PRODUCT_ORDERED = 'Produto Encomendado',
  PRODUCT_PICKED = 'Produto Separado',
  PRODUCT_SHIPPED = 'Produto Enviado',
  WAITING_PAYMENT = 'Aguardando Pagamento',
  PAID_CONCLUDED = 'Pago/Concluído',
  LOST = 'Perdido',
  IN_APPEAL = 'Em Fase de Recurso'
}

export enum BidModality {
  PREGAO_ELETRONICO = 'Pregão Eletrônico',
  PREGAO_PRESENCIAL = 'Pregão Presencial',
  LEILAO = 'Leilão',
  DISPENSA = 'Dispensa',
  INEXIGIBILIDADE = 'Inexigibilidade'
}

export interface AuditLog {
  id: string;
  user: 'Marcos' | 'Pablo';
  action: 'create' | 'update' | 'delete' | 'sync';
  entityType: 'bid' | 'doc' | 'product' | 'activity' | 'finance';
  entityName: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'operacional';
}

export interface BidItem {
  id: string;
  number: string;
  name: string;
  quantity: number;
  brand?: string;       
  model?: string;       
  referencePrice?: number;
  minPrice?: number;       
  winningPrice?: number;
  lostPrice?: number;      
  costPrice?: number;      
  shippingCost?: number;   
  taxPercentage?: number;  
  investorPercentage?: number; 
  manufacturer?: string; 
  created_at?: string;
  updated_at?: string;
}

export interface Bid {
  id: string;
  user_id?: string;
  order?: string; 
  uasg?: string;
  title: string; 
  biddingNumber: string; 
  organ: string; 
  modality: BidModality;
  disputedItem: string; 
  items: BidItem[]; 
  date: string; 
  value: number; 
  anvisa: boolean; 
  sample: boolean; 
  status: BidStatus; 
  documents: BidDocument[];
  notes?: string; 
  paymentDate?: string;
  commitmentDate?: string;
  trackingCode?: string;
  deliveryDeadline?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BidDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  url?: string;
  base64?: string;
  updated_at?: string;
}

export interface CompanyDocument {
  id: string;
  user_id?: string;
  name: string;
  organ?: string; 
  category: string;
  issueDate: string;      
  expirationDate: string; 
  status: 'valid' | 'expired' | 'expiring';
  importance: 'Baixa' | 'Média' | 'Alta'; 
  notes?: string;         
  fileUrl?: string;       
  base64?: string; 
  mimeType?: string; 
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  user_id?: string;
  name: string;
  model: string;
  manufacturer: string;
  minPrice: number;
  costPrice?: number; 
  fileUrl?: string;
  base64?: string; 
  mimeType?: string; 
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  createdAt: string;
  read: boolean;
  persistent?: boolean; 
}

export interface KnowledgeBaseDoc {
  id: string;
  name: string;
  mimeType: string;
  base64: string;
  addedAt: string;
}

export interface Activity {
  id: string;
  owner: 'Marcos' | 'Pablo' | 'Ambos';
  title: string;
  category: 'meu-dia' | 'importante' | 'todas';
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  isImportant?: boolean;
  bidId?: string; 
  assignmentType?: 'ambos' | 'parceiro' | 'proprio';
  updated_at?: string;
}
