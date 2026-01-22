
/**
 * KITS VITAL - SCRIPT DE MIGRAÇÃO DE DADOS (ORÁCULO)
 * Este script move os dados da coluna 'payload' para o Supabase Storage.
 * 
 * Como usar:
 * 1. Instale as dependências: npm install @supabase/supabase-js
 * 2. Configure as variáveis abaixo com suas chaves de ADMIN (Service Role).
 * 3. Execute: node migrate_data.js
 */

const { createClient } = require('@supabase/supabase-js');

// CONFIGURAÇÕES (Use a SERVICE_ROLE_KEY para ignorar RLS durante a migração)
const SUPABASE_URL = 'https://psuiqswtcxwpoxwzqdek.supabase.co';
const SUPABASE_SERVICE_KEY = 'SUA_SERVICE_ROLE_KEY_AQUI'; // IMPORTANTE: Use a Service Role Key, não a Anon Key.

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET_NAME = 'backup-files';

async function startMigration() {
  console.log("🚀 [Kits Vital] Iniciando migração de dados para Storage...");
  
  let processed = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      // 1. Busca 1 registro que ainda não foi migrado
      const { data: row, error: fetchError } = await supabase
        .from('kits_vital_backup')
        .select('user_id, payload, id')
        .is('file_url', null)
        .not('payload', 'is', null)
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!row) {
        console.log("✅ [Kits Vital] Migração concluída! Todos os registros estão no Storage.");
        hasMore = false;
        break;
      }

      console.log(`📦 Processando registro do usuário: ${row.user_id}...`);

      // 2. Preparar o conteúdo para Upload
      // Se o payload for uma string Base64 ou um Objeto, convertemos para Buffer
      const content = typeof row.payload === 'string' 
        ? Buffer.from(row.payload, 'base64') 
        : Buffer.from(JSON.stringify(row.payload));

      const fileName = `${row.user_id}/oraculo_state.json`;

      // 3. Upload para o Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, content, {
          upsert: true,
          contentType: 'application/json'
        });

      if (storageError) throw storageError;

      // 4. Atualizar o banco de dados e LIMPAR o payload original
      const { error: updateError } = await supabase
        .from('kits_vital_backup')
        .update({
          file_url: fileName,
          payload: {}, // Limpa o conteúdo pesado da coluna
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id);

      if (updateError) throw updateError;

      processed++;
      console.log(`✔️ Registro ${processed} migrado com sucesso para ${fileName}`);

      // Pequeno delay para não sobrecarregar a CPU do banco
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.error("❌ Erro na migração:", err.message);
      // Se houver erro, podemos optar por parar ou pular. Aqui vamos parar para segurança.
      hasMore = false;
    }
  }

  console.log(`📊 Total de registros processados nesta sessão: ${processed}`);
}

startMigration();
