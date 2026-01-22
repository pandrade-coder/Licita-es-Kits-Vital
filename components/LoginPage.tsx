
import React, { useState } from 'react';
import { Sparkles, BrainCircuit, ShieldCheck, ArrowRight, Loader2, BookOpen, UserCircle2 } from 'lucide-react';
import { signInWithGoogle } from '../services/supabase';

interface LoginPageProps {
  onGuestLogin?: (mockSession: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onGuestLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Falha ao autenticar com Google. Tente novamente.');
      setLoading(false);
    }
  };

  const handleGuestEntry = () => {
    if (onGuestLogin) {
      onGuestLogin({
        user: {
          id: 'guest-user-id',
          email: 'teste@kitsvital.com.br',
          user_metadata: {
            full_name: 'Desenvolvedor Kits Vital (Offline)',
            avatar_url: null
          }
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
      
      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl text-center">
          <div className="mb-10 inline-flex items-center justify-center">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <BookOpen size={40} />
            </div>
          </div>

          <div className="space-y-3 mb-12">
            <h1 className="text-4xl font-black text-white tracking-tight">Kits Vital</h1>
            <p className="text-blue-400 text-xs font-black uppercase tracking-[0.4em]">Oráculo Operacional</p>
          </div>

          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-4 text-left p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Sparkles size={18}/></div>
              <p className="text-[11px] text-slate-400 font-bold uppercase leading-tight">Inteligência Maya para análise técnica de editais</p>
            </div>
            <div className="flex items-center gap-4 text-left p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><ShieldCheck size={18}/></div>
              <p className="text-[11px] text-slate-400 font-bold uppercase leading-tight">Segurança Híbrida em Nuvem e Compliance Local</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-50 transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Entrar com Google
                </>
              )}
            </button>

            <button
              onClick={handleGuestEntry}
              className="w-full py-4 bg-slate-900/50 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all border border-white/5"
            >
              <UserCircle2 size={18} />
              Modo Offline (Teste)
            </button>
          </div>

          <p className="mt-8 text-[9px] text-slate-500 font-black uppercase tracking-widest">
            Acesso Restrito • Monitoramento Oráculo Ativo
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
