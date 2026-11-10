// ============================================================
// Serviço do chat "Mecânico IA".
//  - Com EXPO_PUBLIC_BACKEND_URL definido: pergunta ao backend (Claude Haiku 4.5).
//  - Sem backend, ou se ele estiver fora do ar: responde no modo demonstração (local).
// ============================================================

import { responderLocal } from "../utils/diagnosticoLocal";

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

export const IA_ONLINE_CONFIGURADA = BACKEND_URL.length > 0;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Devolve { content, modo: "online" | "demo", aviso? }
export async function perguntarMecanicoIA({ sessionId, mensagem, historicoUsuario = [] }) {
  if (IA_ONLINE_CONFIGURADA) {
    try {
      const controle = new AbortController();
      const limite = setTimeout(() => controle.abort(), 20000);
      const resp = await fetch(`${BACKEND_URL}/api/diagnostico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, mensagem }),
        signal: controle.signal,
      });
      clearTimeout(limite);
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const data = await resp.json();
      return { content: data.content || "Sem resposta.", id: data.id, modo: "online" };
    } catch (e) {
      console.log("IA online indisponível, usando modo demonstração:", e);
      await esperar(400);
      return {
        content: responderLocal(mensagem, historicoUsuario),
        modo: "demo",
        aviso: "IA online indisponível agora. Respondi no modo demonstração.",
      };
    }
  }
  await esperar(700); // pequena pausa para parecer uma conversa
  return { content: responderLocal(mensagem, historicoUsuario), modo: "demo" };
}
