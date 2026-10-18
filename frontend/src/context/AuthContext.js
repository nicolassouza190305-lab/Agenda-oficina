// ============================================================
// AuthContext - quem está logado (Cliente ou Oficina)
// Lê a sessão salva no SQLite ao abrir o app e expõe
// entrar / cadastrar / sair para as telas.
// ============================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  obterUsuarioLogado,
  login,
  cadastrarCliente,
  encerrarSessao,
} from "../database/db";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Restaura a sessão (se o usuário não tinha saído da conta)
  useEffect(() => {
    let ativo = true;
    obterUsuarioLogado()
      .then((u) => ativo && setUsuario(u))
      .catch((e) => console.warn("[auth] erro ao restaurar sessão:", e))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  const entrar = useCallback(async (email, senha, perfil) => {
    setUsuario(await login({ email, senha, perfil }));
  }, []);

  const cadastrar = useCallback(async (dados) => {
    setUsuario(await cadastrarCliente(dados));
  }, []);

  const sair = useCallback(async () => {
    try {
      await encerrarSessao();
    } finally {
      setUsuario(null);
    }
  }, []);

  const value = useMemo(
    () => ({ usuario, carregando, entrar, cadastrar, sair }),
    [usuario, carregando, entrar, cadastrar, sair]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

// Mensagem para mostrar ao usuário a partir de qualquer erro
export function mensagemDeErro(e, padrao = "Algo deu errado. Tente novamente.") {
  return e?.erroApp ? e.message : `${padrao} (${String(e?.message || e)})`;
}
