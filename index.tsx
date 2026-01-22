
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento root para montar o Oráculo.");
}

// Mecanismo de limpeza de Service Workers com tratamento de erro robusto
// Evita o erro "The document is in an invalid state" em ambientes de sandbox
const clearServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Verificamos se o documento está pronto antes de tentar acessar os registros
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log("[Oráculo] Service Worker antigo removido com sucesso.");
        }
      }
    } catch (swError) {
      // Falha silenciosa: Service Workers não são críticos para o boot do Oráculo
      console.warn("[Oráculo] Aviso: Não foi possível limpar Service Workers (Ambiente Restrito).", swError);
    }
  }
};

clearServiceWorkers();

// Mecanismo de detecção de loop de erro
const CRASH_KEY = 'kits-vital:last-crash';
const lastCrash = localStorage.getItem(CRASH_KEY);
const now = Date.now();

if (lastCrash && (now - parseInt(lastCrash)) < 5000) {
    console.warn("Detectado crash recorrente. Realizando limpeza de emergência...");
    localStorage.clear();
    localStorage.setItem(CRASH_KEY, now.toString());
}

const renderApp = () => {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Erro crítico na inicialização do Oráculo:", error);
    localStorage.setItem(CRASH_KEY, Date.now().toString());
    
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; text-align: center; padding: 40px; background: #020617; color: white;">
        <div style="background: #1e293b; padding: 40px; border-radius: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); max-width: 500px; border: 1px solid #334155;">
          <div style="font-size: 60px; margin-bottom: 20px;">🛡️</div>
          <h1 style="color: #f8fafc; font-size: 24px; font-weight: 900; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">KITS VITAL: RECUPERAÇÃO</h1>
          <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 30px; font-weight: 500;">
            Houve um conflito de carregamento ou cache. 
            Clique abaixo para resetar a memória e carregar o Oráculo limpo.
          </p>
          <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" style="background: #2563eb; color: white; border: none; padding: 18px 40px; border-radius: 16px; font-weight: 900; font-size: 14px; text-transform: uppercase; cursor: pointer; letter-spacing: 2px; transition: all 0.2s; box-shadow: 0 10px 20px rgba(37,99,235,0.4);">
            Resetar e Abrir Oráculo
          </button>
        </div>
      </div>
    `;
  }
};

renderApp();
