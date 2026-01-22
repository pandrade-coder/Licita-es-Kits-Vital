
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://psuiqswtcxwpoxwzqdek.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdWlxc3d0Y3h3cG94d3pxZGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNTEyNjAsImV4cCI6MjA4MjcyNzI2MH0.oXtc9gzny3JgQ69McQtk0h2CgxsxlPhJalDF5pqazEE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'kits-vital:auth-token'
  }
});

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) throw error;
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    localStorage.removeItem('kits-vital:auth-token');
    if (error) throw error;
    window.location.href = window.location.origin;
  } catch (err) {
    console.warn("[Auth] Erro ao deslogar, forçando limpeza local.");
    localStorage.clear();
    window.location.reload();
  }
};
