
import { Bid, CompanyDocument, Product, Notification, KnowledgeBaseDoc, Activity, AuditLog } from '../types';
import { supabase } from './supabase';

const KEYS = {
  BIDS: '@kits-vital:bids',
  DOCS: '@kits-vital:docs',
  PRODUCTS: '@kits-vital:products',
  NOTIFICATIONS: '@kits-vital:notifications',
  KNOWLEDGE: '@kits-vital:knowledge',
  ACTIVITIES: '@kits-vital:activities-v1',
  LOGS: '@kits-vital:audit-logs'
};

const BUCKET_NAME = 'backup-files';

let isSyncing = false;

export const DataService = {
  generateId: () => crypto.randomUUID(),
  
  loadLocal: (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  },

  safePersist: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  },

  mergeCollections: (local: any[] = [], cloud: any[] = []) => {
    const map = new Map();
    [...cloud, ...local].forEach(item => {
      const existing = map.get(item.id);
      const itemDate = new Date(item.updated_at || item.timestamp || 0).getTime();
      const existingDate = existing ? new Date(existing.updated_at || existing.timestamp || 0).getTime() : -1;
      
      if (!existing || itemDate > existingDate) {
        map.set(item.id, item);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.updated_at || a.timestamp || 0).getTime();
      const dateB = new Date(b.updated_at || b.timestamp || 0).getTime();
      return dateB - dateA;
    });
  },

  syncToCloud: async (payload: any, clientLastUpdate: string | null) => {
    if (isSyncing) return { success: false, error: 'Ocupado' };

    try {
      isSyncing = true;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Deslogado');

      const userId = session.user.id;
      const statePath = `${userId}/oraculo_state.json`;

      // --- OPTIMISTIC LOCKING ---
      const { data: remoteInfo } = await supabase
        .from('kits_vital_backup')
        .select('updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (remoteInfo && clientLastUpdate) {
        const serverDate = new Date(remoteInfo.updated_at).getTime();
        const clientDate = new Date(clientLastUpdate).getTime();
        
        // Se a nuvem está mais de 2 segundos à frente do que eu tenho (margem de segurança)
        if (serverDate > clientDate + 2000) {
          return { success: false, conflict: true };
        }
      }

      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const file = new File([blob], 'oraculo_state.json', { type: 'application/json' });

      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(statePath, file, { upsert: true });

      if (storageError) throw storageError;

      const newTimestamp = new Date().toISOString();
      await supabase
        .from('kits_vital_backup')
        .upsert({ 
          user_id: userId, 
          file_url: statePath,
          payload: {}, 
          updated_at: newTimestamp 
        }, { onConflict: 'user_id' });

      return { success: true, timestamp: newTimestamp };
    } catch (e: any) {
      console.error("[Sync Fail]", e.message);
      return { success: false, error: e.message };
    } finally {
      isSyncing = false;
    }
  },

  loadFromCloud: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: dbData } = await supabase
        .from('kits_vital_backup')
        .select('file_url, updated_at')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!dbData?.file_url) return null;

      const { data: fileData, error: fileError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(dbData.file_url);

      if (!fileError && fileData) {
        const text = await fileData.text();
        return { 
          data: JSON.parse(text), 
          updatedAt: dbData.updated_at 
        };
      }
      return null;
    } catch (e) { return null; }
  },

  uploadFile: async (file: File, folder: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const userId = session.user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${folder}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  },

  persistBids: (bids: Bid[]) => DataService.safePersist(KEYS.BIDS, bids),
  persistDocs: (docs: CompanyDocument[]) => DataService.safePersist(KEYS.DOCS, docs),
  persistProducts: (products: Product[]) => DataService.safePersist(KEYS.PRODUCTS, products),
  persistActivities: (activities: Activity[]) => DataService.safePersist(KEYS.ACTIVITIES, activities),
  persistKnowledge: (knowledge: KnowledgeBaseDoc[]) => DataService.safePersist(KEYS.KNOWLEDGE, knowledge),
  persistLogs: (logs: AuditLog[]) => DataService.safePersist(KEYS.LOGS, logs),

  loadBids: () => DataService.loadLocal(KEYS.BIDS),
  loadDocs: () => DataService.loadLocal(KEYS.DOCS),
  loadProducts: () => DataService.loadLocal(KEYS.PRODUCTS),
  loadKnowledge: () => DataService.loadLocal(KEYS.KNOWLEDGE) || [],
  loadActivities: () => DataService.loadLocal(KEYS.ACTIVITIES) || [],
  loadLogs: () => DataService.loadLocal(KEYS.LOGS) || [],

  bids: {
    save: (currentBids: Bid[], bid: Bid): Bid[] => {
      const arr = Array.isArray(currentBids) ? currentBids : [];
      const idx = arr.findIndex(b => b.id === bid.id);
      const now = new Date().toISOString();
      if (idx >= 0) {
        const next = [...arr];
        next[idx] = { ...bid, updated_at: now };
        return next;
      }
      return [{ ...bid, created_at: now, updated_at: now }, ...arr];
    }
  }
};
