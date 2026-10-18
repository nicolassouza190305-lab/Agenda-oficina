// ============================================================
// db.js - Persistência com SQLite (expo-sqlite)
// Checkpoint 3 + cadastro de clientes e permissões por perfil
//
// Tabelas:
//   usuarios      contas (Cliente | Oficina), senha com hash + salt
//   sessao        quem está logado neste aparelho (1 linha)
//   veiculos      veículos, cada um pertence a um cliente (usuario_id)
//   agendamentos  serviços marcados (data + horário + status)
//
// Regras de permissão são aplicadas AQUI (não só escondendo botões):
//   - só a Oficina lista agendamentos e muda o status (confirmar/cancelar)
//   - só o Cliente cadastra/consulta veículos (e só os seus)
//   - o Cliente só consulta quais horários estão ocupados (sem dados de ninguém)
// ============================================================

import * as SQLite from "expo-sqlite";
import {
  VEICULOS_MOCK,
  AGENDAMENTOS_MOCK,
  USUARIOS_SEED,
} from "../mocks/data";
import { gerarSalt, hashSenha } from "./seguranca";
import { paraISO, somarDias } from "../utils/datas";

// Aumente este número quando mudar o esquema (recria as tabelas de exemplo)
const VERSAO_ESQUEMA = 2;

let dbPromise = null;

// Erro "esperado" com mensagem amigável para mostrar ao usuário
function erroApp(mensagem) {
  const e = new Error(mensagem);
  e.erroApp = true;
  return e;
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = iniciar().catch((e) => {
      dbPromise = null; // permite tentar de novo
      throw e;
    });
  }
  return dbPromise;
}

async function iniciar() {
  const db = await SQLite.openDatabaseAsync("oficina.db");
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

  const atual = (await db.getFirstAsync("PRAGMA user_version"))?.user_version ?? 0;
  if (atual < VERSAO_ESQUEMA) {
    // Esquema antigo (Checkpoint 3 inicial): recria com usuários e datas
    await db.execAsync(`
      DROP TABLE IF EXISTS agendamentos;
      DROP TABLE IF EXISTS veiculos;
      DROP TABLE IF EXISTS sessao;
      DROP TABLE IF EXISTS usuarios;
    `);
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      salt       TEXT NOT NULL,
      perfil     TEXT NOT NULL CHECK (perfil IN ('Cliente', 'Oficina')),
      criado_em  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessao (
      id         INTEGER PRIMARY KEY CHECK (id = 1),
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS veiculos (
      id         TEXT PRIMARY KEY NOT NULL,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      modelo     TEXT NOT NULL,
      placa      TEXT NOT NULL UNIQUE,
      ano        INTEGER NOT NULL,
      km         INTEGER NOT NULL DEFAULT 0,
      cor        TEXT NOT NULL DEFAULT '—'
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id       TEXT PRIMARY KEY NOT NULL,
      data     TEXT NOT NULL,
      horario  TEXT NOT NULL,
      cliente  TEXT NOT NULL,
      veiculo  TEXT NOT NULL,
      placa    TEXT NOT NULL,
      servico  TEXT NOT NULL,
      status   TEXT NOT NULL DEFAULT 'Agendado'
    );
    CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos (data, horario);
  `);

  const { n } = await db.getFirstAsync("SELECT COUNT(*) AS n FROM usuarios");
  if (n === 0) await popular(db);
  if (atual < VERSAO_ESQUEMA) {
    await db.execAsync(`PRAGMA user_version = ${VERSAO_ESQUEMA}`);
  }
  return db;
}

// Dados iniciais, tudo ou nada (transação)
async function popular(db) {
  await db.withTransactionAsync(async () => {
    const agora = new Date().toISOString();
    const ids = {};
    for (const u of USUARIOS_SEED) {
      const salt = gerarSalt();
      const r = await db.runAsync(
        "INSERT INTO usuarios (nome, email, senha_hash, salt, perfil, criado_em) VALUES (?, ?, ?, ?, ?, ?)",
        [u.nome, u.email, hashSenha(u.senha, salt), salt, u.perfil, agora]
      );
      ids[u.perfil] = r.lastInsertRowId;
    }
    for (const x of VEICULOS_MOCK) {
      await db.runAsync(
        "INSERT INTO veiculos (id, usuario_id, modelo, placa, ano, km, cor) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [x.id, ids.Cliente, x.modelo, x.placa, x.ano, x.km, x.cor]
      );
    }
    const hoje = new Date();
    for (const x of AGENDAMENTOS_MOCK) {
      await db.runAsync(
        "INSERT INTO agendamentos (id, data, horario, cliente, veiculo, placa, servico, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [x.id, paraISO(somarDias(hoje, x.diaOffset ?? 0)), x.horario, x.cliente, x.veiculo, x.placa, x.servico, x.status]
      );
    }
  });
}

// ---------------- Permissões ----------------

// Garante que o usuário existe e tem o perfil exigido (consulta o banco)
async function exigirPerfil(db, usuarioId, perfil) {
  const u = await db.getFirstAsync("SELECT perfil FROM usuarios WHERE id = ?", [usuarioId]);
  if (!u || u.perfil !== perfil) {
    throw erroApp(`Ação permitida apenas para ${perfil === "Oficina" ? "o dono da oficina" : "clientes"}.`);
  }
}

// ---------------- Contas e sessão ----------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizarEmail = (e) => String(e || "").trim().toLowerCase();
const publico = (u) => ({ id: u.id, nome: u.nome, email: u.email, perfil: u.perfil });

async function abrirSessao(db, usuarioId) {
  await db.runAsync("INSERT OR REPLACE INTO sessao (id, usuario_id) VALUES (1, ?)", [usuarioId]);
}

// Usuário que ficou logado neste aparelho (ou null)
export async function obterUsuarioLogado() {
  const db = await getDb();
  const u = await db.getFirstAsync(
    "SELECT u.id, u.nome, u.email, u.perfil FROM sessao s JOIN usuarios u ON u.id = s.usuario_id WHERE s.id = 1"
  );
  return u ?? null;
}

// Cadastro de CLIENTE (o perfil Oficina não pode ser criado pelo app)
export async function cadastrarCliente({ nome, email, senha }) {
  const nomeLimpo = String(nome || "").trim();
  const emailLimpo = normalizarEmail(email);
  if (nomeLimpo.length < 2) throw erroApp("Informe seu nome.");
  if (!EMAIL_RE.test(emailLimpo)) throw erroApp("Informe um e-mail válido.");
  if (String(senha || "").length < 6) throw erroApp("A senha deve ter pelo menos 6 caracteres.");

  const db = await getDb();
  const salt = gerarSalt();
  try {
    const r = await db.runAsync(
      "INSERT INTO usuarios (nome, email, senha_hash, salt, perfil, criado_em) VALUES (?, ?, ?, ?, 'Cliente', ?)",
      [nomeLimpo, emailLimpo, hashSenha(senha, salt), salt, new Date().toISOString()]
    );
    await abrirSessao(db, r.lastInsertRowId);
    return { id: r.lastInsertRowId, nome: nomeLimpo, email: emailLimpo, perfil: "Cliente" };
  } catch (e) {
    if (String(e?.message || e).includes("UNIQUE")) throw erroApp("Este e-mail já está cadastrado.");
    throw e;
  }
}

// Login: confere senha (hash) e se o perfil escolhido bate com o da conta
export async function login({ email, senha, perfil }) {
  const db = await getDb();
  const u = await db.getFirstAsync("SELECT * FROM usuarios WHERE email = ?", [normalizarEmail(email)]);
  if (!u || hashSenha(String(senha || ""), u.salt) !== u.senha_hash) {
    throw erroApp("E-mail ou senha inválidos.");
  }
  if (u.perfil !== perfil) {
    throw erroApp(`Esta conta é de ${u.perfil}. Selecione "Sou ${u.perfil}" para entrar.`);
  }
  await abrirSessao(db, u.id);
  return publico(u);
}

export async function encerrarSessao() {
  const db = await getDb();
  await db.runAsync("DELETE FROM sessao");
}

// ---------------- Veículos (Cliente) ----------------

// Consulta: só os veículos do cliente logado
export async function listarVeiculos(usuarioId) {
  const db = await getDb();
  await exigirPerfil(db, usuarioId, "Cliente");
  return db.getAllAsync(
    "SELECT id, modelo, placa, ano, km, cor FROM veiculos WHERE usuario_id = ? ORDER BY rowid DESC",
    [usuarioId]
  );
}

// Cadastro: grava o veículo no nome do cliente. Placa repetida é recusada.
export async function inserirVeiculo(usuarioId, { modelo, placa, ano, km, cor }) {
  const db = await getDb();
  await exigirPerfil(db, usuarioId, "Cliente");
  const novo = { id: `v${Date.now()}`, modelo, placa, ano, km, cor };
  try {
    await db.runAsync(
      "INSERT INTO veiculos (id, usuario_id, modelo, placa, ano, km, cor) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [novo.id, usuarioId, novo.modelo, novo.placa, novo.ano, novo.km, novo.cor]
    );
  } catch (e) {
    if (String(e?.message || e).includes("UNIQUE")) throw erroApp("Já existe um veículo com essa placa.");
    throw e;
  }
  return novo;
}

// ---------------- Agenda ----------------

// Oficina: todos os agendamentos, com os dados dos clientes
export async function listarAgendamentos(usuarioId) {
  const db = await getDb();
  await exigirPerfil(db, usuarioId, "Oficina");
  return db.getAllAsync("SELECT * FROM agendamentos ORDER BY data ASC, horario ASC");
}

// Oficina: confirmar ou cancelar um agendamento
const STATUS_PERMITIDOS = ["Confirmado", "Cancelado"];
export async function atualizarStatus(usuarioId, id, status) {
  if (!STATUS_PERMITIDOS.includes(status)) throw erroApp("Status inválido.");
  const db = await getDb();
  await exigirPerfil(db, usuarioId, "Oficina");
  await db.runAsync("UPDATE agendamentos SET status = ? WHERE id = ?", [status, id]);
}

// Qualquer usuário logado: SÓ os horários ocupados de um dia (sem nomes nem serviços)
export async function listarHorariosOcupados(dataISO) {
  const db = await getDb();
  const linhas = await db.getAllAsync(
    "SELECT horario FROM agendamentos WHERE data = ? AND status <> 'Cancelado'",
    [dataISO]
  );
  return linhas.map((l) => l.horario);
}
