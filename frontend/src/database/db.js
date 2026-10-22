// ============================================================
// db.js - Persistência com SQLite (expo-sqlite)
//
// Tabelas:
//   oficinas      cada oficina cadastrada, identificada pelo NOME FANTASIA (único).
//                 nome_busca = nome sem acentos/maiúsculas/espaços extras, usado para
//                 o cliente informar o nome e ser ligado à oficina
//   usuarios      contas (Cliente | Oficina), senha com hash + salt.
//                 TODA conta pertence a uma oficina (oficina_id):
//                 o dono administra a oficina; o cliente é exclusivo dela
//   sessao        quem está logado neste aparelho (1 linha)
//   veiculos      veículos, cada um pertence a um cliente (usuario_id)
//   agendamentos  serviços marcados, sempre dentro de UMA oficina (oficina_id)
//
// Regras de permissão são aplicadas AQUI (não só escondendo botões):
//   - cada oficina só enxerga e administra a SUA agenda e os SEUS clientes
//   - o cliente só agenda na oficina a que pertence (não escolhe outra)
//   - a oficina atende de segunda a sexta (sábado e domingo são fechados)
//   - só a Oficina lista agendamentos e muda o status (confirmar/cancelar)
//   - só o Cliente cadastra/consulta veículos (e só os seus)
//   - o Cliente consulta quais horários estão ocupados NA SUA OFICINA (sem dados
//     de ninguém), solicita um horário livre e vê só as suas solicitações
// ============================================================

import * as SQLite from "expo-sqlite";
import { AGENDAMENTOS_MOCK, OFICINAS_SEED, HORARIOS_ATENDIMENTO } from "../mocks/data";
import { gerarSalt, hashSenha } from "./seguranca";
import { paraISO, somarDiasUteis, ehDiaUtilISO, hojeISO, horaAgora } from "../utils/datas";

// VERSAO_ESQUEMA: versão atual do banco.
// VERSAO_MINIMA: abaixo dela as tabelas de exemplo são recriadas; entre as duas
// o banco é só ajustado (ALTER TABLE), sem perder os dados cadastrados.
const VERSAO_ESQUEMA = 6;
const VERSAO_MINIMA = 2;

let dbPromise = null;

// Nome fantasia -> chave de busca: sem acentos, sem maiúsculas, espaços únicos.
// "  MECANICA   premium " e "Mecânica Premium" geram a mesma chave.
function normalizarNome(nome) {
  let t = String(nome || "");
  if (typeof t.normalize === "function") t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return t.toLowerCase().replace(/\s+/g, " ").trim();
}

// Id único para registros novos (hora + sufixo aleatório, evita colisão no mesmo milissegundo)
function novoId(prefixo) {
  return `${prefixo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

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
  if (atual < VERSAO_MINIMA) {
    // Esquema antigo (Checkpoint 3 inicial): recria com usuários e datas
    await db.execAsync(`
      DROP TABLE IF EXISTS agendamentos;
      DROP TABLE IF EXISTS veiculos;
      DROP TABLE IF EXISTS sessao;
      DROP TABLE IF EXISTS usuarios;
    `);
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS oficinas (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT NOT NULL UNIQUE COLLATE NOCASE,
      criado_em TEXT NOT NULL,
      nome_busca TEXT
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      salt       TEXT NOT NULL,
      perfil     TEXT NOT NULL CHECK (perfil IN ('Cliente', 'Oficina')),
      criado_em  TEXT NOT NULL,
      oficina_id INTEGER REFERENCES oficinas(id)
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
      id         TEXT PRIMARY KEY NOT NULL,
      data       TEXT NOT NULL,
      horario    TEXT NOT NULL,
      cliente    TEXT NOT NULL,
      veiculo    TEXT NOT NULL,
      placa      TEXT NOT NULL,
      servico    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'Agendado',
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
      oficina_id INTEGER REFERENCES oficinas(id)
    );
  `);

  // Bancos de versões anteriores ganham as colunas novas sem perder dados
  await garantirColuna(db, "agendamentos", "usuario_id", "INTEGER REFERENCES usuarios(id) ON DELETE SET NULL"); // v3
  await garantirColuna(db, "usuarios", "oficina_id", "INTEGER REFERENCES oficinas(id)"); // v5
  await garantirColuna(db, "agendamentos", "oficina_id", "INTEGER REFERENCES oficinas(id)"); // v5
  await garantirColuna(db, "oficinas", "nome_busca", "TEXT"); // v6
  await preencherNomesBusca(db);
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos (data, horario);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario ON agendamentos (usuario_id);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_oficina ON agendamentos (oficina_id, data);
    CREATE INDEX IF NOT EXISTS idx_usuarios_oficina ON usuarios (oficina_id);
  `);

  const { n } = await db.getFirstAsync("SELECT COUNT(*) AS n FROM usuarios");
  if (n === 0) {
    await popular(db);
  } else {
    // reagendarExemplos precisa do índice único antigo (v3) para detectar colisões
    if (atual < 4) await reagendarExemplos(db);
    if (atual < 5) await migrarParaOficinas(db);
  }

  // Um horário não pode ter dois agendamentos ativos NA MESMA OFICINA (evita reserva dupla).
  // Substitui o índice antigo, que valia para o app inteiro.
  await db.execAsync(`
    DROP INDEX IF EXISTS ux_agendamento_horario;
    CREATE UNIQUE INDEX IF NOT EXISTS ux_agendamento_oficina_horario
      ON agendamentos (oficina_id, data, horario) WHERE status <> 'Cancelado';
    -- Dois nomes fantasia que só diferem por acento/maiúscula contam como o mesmo
    CREATE UNIQUE INDEX IF NOT EXISTS ux_oficinas_nome_busca ON oficinas (nome_busca);
  `);

  if (atual < VERSAO_ESQUEMA) {
    await db.execAsync(`PRAGMA user_version = ${VERSAO_ESQUEMA}`);
  }
  return db;
}

// v5 -> v6: oficinas já cadastradas ganham a chave de busca do nome fantasia.
// Se duas oficinas antigas virarem a mesma chave (ex.: "Mecanica" e "Mecânica"), a mais
// nova recebe um sufixo para não quebrar a unicidade.
async function preencherNomesBusca(db) {
  const pendentes = await db.getAllAsync("SELECT id, nome FROM oficinas WHERE nome_busca IS NULL ORDER BY id");
  if (pendentes.length === 0) return;
  await db.withTransactionAsync(async () => {
    for (const o of pendentes) {
      let chave = normalizarNome(o.nome);
      const igual = await db.getFirstAsync("SELECT id FROM oficinas WHERE nome_busca = ?", [chave]);
      if (igual) chave = `${chave}#${o.id}`;
      await db.runAsync("UPDATE oficinas SET nome_busca = ? WHERE id = ?", [chave, o.id]);
    }
  });
}

// Cria a oficina já com a chave de busca. Retorna o id.
async function inserirOficina(db, nome, agora) {
  const r = await db.runAsync("INSERT INTO oficinas (nome, nome_busca, criado_em) VALUES (?, ?, ?)", [
    nome,
    normalizarNome(nome),
    agora,
  ]);
  return r.lastInsertRowId;
}

async function garantirColuna(db, tabela, coluna, ddl) {
  const colunas = await db.getAllAsync(`PRAGMA table_info(${tabela})`);
  if (!colunas.some((c) => c.name === coluna)) {
    await db.execAsync(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${ddl}`);
  }
}

// v3 -> v4 (oficina fecha sábado e domingo): move os agendamentos de EXEMPLO
// (ids dos mocks, sem cliente vinculado) para dias úteis. Pedidos reais de
// clientes nunca são alterados. Se algum exemplo bater com um horário já
// ocupado por um pedido real, ele é marcado como Cancelado (libera o índice único).
async function reagendarExemplos(db) {
  const ids = AGENDAMENTOS_MOCK.map((x) => x.id);
  const marcas = ids.map(() => "?").join(",");
  await db.withTransactionAsync(async () => {
    const atuais = await db.getAllAsync(
      `SELECT id, data FROM agendamentos WHERE usuario_id IS NULL AND id IN (${marcas})`,
      ids
    );
    const dataOriginal = Object.fromEntries(atuais.map((r) => [r.id, r.data]));
    // fase 1: tira todos do caminho para os horários novos não colidirem entre si
    for (const id of Object.keys(dataOriginal)) {
      await db.runAsync("UPDATE agendamentos SET data = ? WHERE id = ?", [`tmp:${id}`, id]);
    }
    // fase 2: coloca cada um no dia útil correspondente
    const hoje = new Date();
    for (const x of AGENDAMENTOS_MOCK) {
      if (!(x.id in dataOriginal)) continue;
      try {
        await db.runAsync("UPDATE agendamentos SET data = ? WHERE id = ?", [
          paraISO(somarDiasUteis(hoje, x.diaOffset ?? 0)),
          x.id,
        ]);
      } catch (e) {
        await db.runAsync(
          "UPDATE agendamentos SET data = ?, status = 'Cancelado' WHERE id = ?",
          [dataOriginal[x.id], x.id]
        );
      }
    }
  });
}

// Cria uma oficina de exemplo com seu dono, seu cliente, veículos e agendamentos
async function semearOficina(db, def, agora) {
  const oficinaId = await inserirOficina(db, def.nome, agora);

  const criarUsuario = async (u, perfil) => {
    const salt = gerarSalt();
    const r = await db.runAsync(
      "INSERT INTO usuarios (nome, email, senha_hash, salt, perfil, criado_em, oficina_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [u.nome, u.email, hashSenha(u.senha, salt), salt, perfil, agora, oficinaId]
    );
    return r.lastInsertRowId;
  };
  await criarUsuario(def.dono, "Oficina");
  const clienteId = await criarUsuario(def.cliente, "Cliente");

  for (const x of def.veiculos) {
    await db.runAsync(
      "INSERT INTO veiculos (id, usuario_id, modelo, placa, ano, km, cor) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [x.id, clienteId, x.modelo, x.placa, x.ano, x.km, x.cor]
    );
  }
  const hoje = new Date();
  for (const x of def.agendamentos) {
    await db.runAsync(
      "INSERT INTO agendamentos (id, data, horario, cliente, veiculo, placa, servico, status, usuario_id, oficina_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        x.id,
        paraISO(somarDiasUteis(hoje, x.diaOffset ?? 0)),
        x.horario,
        x.cliente,
        x.veiculo,
        x.placa,
        x.servico,
        x.status,
        x.doCliente ? clienteId : null,
        oficinaId,
      ]
    );
  }
}

// Banco novo: cria todas as oficinas de exemplo, tudo ou nada (transação)
async function popular(db) {
  await db.withTransactionAsync(async () => {
    const agora = new Date().toISOString();
    for (const def of OFICINAS_SEED) await semearOficina(db, def, agora);
  });
}

// v4 -> v5 (oficinas): tudo o que já existia passa a pertencer à "Oficina GS" (contas,
// clientes, veículos e agenda). Depois cria a 2ª oficina de exemplo, se não houver
// conflito de e-mail/placa com dados reais do aparelho.
async function migrarParaOficinas(db) {
  await db.withTransactionAsync(async () => {
    const agora = new Date().toISOString();
    const [gsDef, outraDef] = OFICINAS_SEED;

    let gs = await db.getFirstAsync("SELECT id FROM oficinas ORDER BY id LIMIT 1");
    if (!gs) {
      gs = { id: await inserirOficina(db, gsDef.nome, agora) };
    }
    await db.runAsync("UPDATE usuarios SET oficina_id = ? WHERE oficina_id IS NULL", [gs.id]);
    await db.runAsync("UPDATE agendamentos SET oficina_id = ? WHERE oficina_id IS NULL", [gs.id]);

    // nomes de exemplo antigos -> nomes coerentes com a oficina GS (só se ninguém os alterou)
    await db.runAsync("UPDATE usuarios SET nome = ? WHERE email = ? AND nome = 'Dono da Oficina'", [gsDef.dono.nome, gsDef.dono.email]);
    await db.runAsync("UPDATE usuarios SET nome = ? WHERE email = ? AND nome = 'Cliente Demo'", [gsDef.cliente.nome, gsDef.cliente.email]);

    // o índice único antigo (data, horario) valia para o app todo: sai antes de semear a 2ª oficina
    await db.execAsync("DROP INDEX IF EXISTS ux_agendamento_horario");

    const jaExiste = await db.getFirstAsync("SELECT id FROM oficinas WHERE nome = ?", [outraDef.nome]);
    const placas = outraDef.veiculos.map((v) => v.placa);
    const emails = [outraDef.dono.email, outraDef.cliente.email];
    const conflito = await db.getFirstAsync(
      `SELECT (SELECT COUNT(*) FROM usuarios WHERE email IN (${emails.map(() => "?").join(",")}))
            + (SELECT COUNT(*) FROM veiculos WHERE placa IN (${placas.map(() => "?").join(",")}))
            + (SELECT COUNT(*) FROM agendamentos WHERE id IN (${outraDef.agendamentos.map(() => "?").join(",")})) AS c`,
      [...emails, ...placas, ...outraDef.agendamentos.map((a) => a.id)]
    );
    if (!jaExiste && conflito.c === 0) await semearOficina(db, outraDef, agora);
  });
}

// ---------------- Permissões ----------------

// Garante que o usuário existe, tem o perfil exigido e pertence a uma oficina.
// Retorna { id, nome, perfil, oficina_id } lido do banco (nunca confia no app).
async function exigirUsuario(db, usuarioId, perfil) {
  const u = await db.getFirstAsync("SELECT id, nome, perfil, oficina_id FROM usuarios WHERE id = ?", [usuarioId]);
  if (!u || u.perfil !== perfil) {
    throw erroApp(`Ação permitida apenas para ${perfil === "Oficina" ? "o dono da oficina" : "clientes"}.`);
  }
  if (!u.oficina_id) throw erroApp("Sua conta não está vinculada a uma oficina.");
  return u;
}

// ---------------- Contas e sessão ----------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizarEmail = (e) => String(e || "").trim().toLowerCase();

// Dados do usuário que o app pode guardar (sem senha), já com o nome da oficina
async function carregarPublico(db, usuarioId) {
  return db.getFirstAsync(
    `SELECT u.id, u.nome, u.email, u.perfil, u.oficina_id, o.nome AS oficina_nome
       FROM usuarios u LEFT JOIN oficinas o ON o.id = u.oficina_id
      WHERE u.id = ?`,
    [usuarioId]
  );
}

async function abrirSessao(db, usuarioId) {
  await db.runAsync("INSERT OR REPLACE INTO sessao (id, usuario_id) VALUES (1, ?)", [usuarioId]);
}

// Usuário que ficou logado neste aparelho (ou null)
export async function obterUsuarioLogado() {
  const db = await getDb();
  const s = await db.getFirstAsync("SELECT usuario_id FROM sessao WHERE id = 1");
  return s ? (await carregarPublico(db, s.usuario_id)) ?? null : null;
}

function validarConta({ nome, email, senha }) {
  if (String(nome || "").trim().length < 2) throw erroApp("Informe seu nome.");
  if (!EMAIL_RE.test(normalizarEmail(email))) throw erroApp("Informe um e-mail válido.");
  if (String(senha || "").length < 6) throw erroApp("A senha deve ter pelo menos 6 caracteres.");
}

// Cadastro de CLIENTE: ele informa o NOME FANTASIA da oficina. Só se o nome existir a conta é
// criada, e o cliente passa a pertencer (com exclusividade) a essa oficina e à agenda dela.
export async function cadastrarCliente({ nome, email, senha, nomeFantasia }) {
  validarConta({ nome, email, senha });
  const chave = normalizarNome(nomeFantasia);
  if (!chave) throw erroApp("Informe o nome fantasia da sua oficina.");
  const db = await getDb();
  const oficina = await db.getFirstAsync("SELECT id FROM oficinas WHERE nome_busca = ?", [chave]);
  if (!oficina) {
    throw erroApp("Não encontramos nenhuma oficina com esse nome fantasia. Confira o nome com a sua oficina.");
  }

  const salt = gerarSalt();
  try {
    const r = await db.runAsync(
      "INSERT INTO usuarios (nome, email, senha_hash, salt, perfil, criado_em, oficina_id) VALUES (?, ?, ?, ?, 'Cliente', ?, ?)",
      [String(nome).trim(), normalizarEmail(email), hashSenha(senha, salt), salt, new Date().toISOString(), oficina.id]
    );
    await abrirSessao(db, r.lastInsertRowId);
    return carregarPublico(db, r.lastInsertRowId);
  } catch (e) {
    if (String(e?.message || e).includes("UNIQUE")) throw erroApp("Este e-mail já está cadastrado.");
    throw e;
  }
}

// Cadastro de OFICINA: cria a oficina e a conta do dono (que só administra a própria oficina)
export async function cadastrarOficina({ nomeOficina, nome, email, senha }) {
  validarConta({ nome, email, senha });
  const oficinaLimpa = String(nomeOficina || "").trim();
  if (oficinaLimpa.length < 3) throw erroApp("Informe o nome fantasia da oficina (mínimo 3 letras).");

  const db = await getDb();
  const salt = gerarSalt();
  let usuarioId;
  try {
    await db.withTransactionAsync(async () => {
      const agora = new Date().toISOString();
      const oficinaId = await inserirOficina(db, oficinaLimpa, agora);
      const r = await db.runAsync(
        "INSERT INTO usuarios (nome, email, senha_hash, salt, perfil, criado_em, oficina_id) VALUES (?, ?, ?, ?, 'Oficina', ?, ?)",
        [String(nome).trim(), normalizarEmail(email), hashSenha(senha, salt), salt, agora, oficinaId]
      );
      usuarioId = r.lastInsertRowId;
    });
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("oficinas.")) throw erroApp("Já existe uma oficina com esse nome fantasia.");
    if (msg.includes("usuarios.email")) throw erroApp("Este e-mail já está cadastrado.");
    throw e;
  }
  await abrirSessao(db, usuarioId);
  return carregarPublico(db, usuarioId);
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
  return carregarPublico(db, u.id);
}

export async function encerrarSessao() {
  const db = await getDb();
  await db.runAsync("DELETE FROM sessao");
}

// ---------------- Veículos (Cliente) ----------------

// Consulta: só os veículos do cliente logado
export async function listarVeiculos(usuarioId) {
  const db = await getDb();
  await exigirUsuario(db, usuarioId, "Cliente");
  return db.getAllAsync(
    "SELECT id, modelo, placa, ano, km, cor FROM veiculos WHERE usuario_id = ? ORDER BY rowid DESC",
    [usuarioId]
  );
}

// Cadastro: grava o veículo no nome do cliente. Placa repetida é recusada.
export async function inserirVeiculo(usuarioId, { modelo, placa, ano, km, cor }) {
  const db = await getDb();
  await exigirUsuario(db, usuarioId, "Cliente");
  const novo = { id: novoId("v"), modelo, placa, ano, km, cor };
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

// ---------------- Agenda (sempre dentro da oficina do usuário) ----------------

// Oficina: todos os agendamentos DA SUA oficina, com os dados dos clientes
export async function listarAgendamentos(usuarioId) {
  const db = await getDb();
  const u = await exigirUsuario(db, usuarioId, "Oficina");
  return db.getAllAsync(
    "SELECT id, data, horario, cliente, veiculo, placa, servico, status, usuario_id FROM agendamentos WHERE oficina_id = ? ORDER BY data ASC, horario ASC",
    [u.oficina_id]
  );
}

// Oficina: confirmar ou cancelar um agendamento DA SUA oficina
const STATUS_PERMITIDOS = ["Confirmado", "Cancelado"];
export async function atualizarStatus(usuarioId, id, status) {
  if (!STATUS_PERMITIDOS.includes(status)) throw erroApp("Status inválido.");
  const db = await getDb();
  const u = await exigirUsuario(db, usuarioId, "Oficina");
  const r = await db.runAsync("UPDATE agendamentos SET status = ? WHERE id = ? AND oficina_id = ?", [
    status,
    id,
    u.oficina_id,
  ]);
  if (r.changes === 0) throw erroApp("Agendamento não encontrado nesta oficina.");
}

// Usuário logado: SÓ os horários ocupados de um dia NA SUA oficina (sem nomes nem serviços)
export async function listarHorariosOcupados(usuarioId, dataISO) {
  const db = await getDb();
  const u = await db.getFirstAsync("SELECT oficina_id FROM usuarios WHERE id = ?", [usuarioId]);
  if (!u || !u.oficina_id) throw erroApp("Faça login novamente.");
  const linhas = await db.getAllAsync(
    "SELECT horario FROM agendamentos WHERE oficina_id = ? AND data = ? AND status <> 'Cancelado'",
    [u.oficina_id, dataISO]
  );
  return linhas.map((l) => l.horario);
}

// Cliente: solicita um horário livre NA SUA OFICINA (a oficina vem da conta dele, não do app).
// Entra como "Agendado" e aguarda a oficina confirmar ou recusar.
export async function solicitarAgendamento(usuarioId, { data, horario, veiculoId, servico }) {
  const db = await getDb();
  const u = await exigirUsuario(db, usuarioId, "Cliente");

  const servicoLimpo = String(servico || "").trim();
  if (servicoLimpo.length < 3) throw erroApp("Descreva o serviço desejado.");
  if (servicoLimpo.length > 120) throw erroApp("Descreva o serviço em até 120 caracteres.");
  if (!HORARIOS_ATENDIMENTO.includes(horario)) throw erroApp("Horário inválido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data))) throw erroApp("Data inválida.");
  if (!ehDiaUtilISO(data)) throw erroApp("A oficina não funciona aos sábados e domingos.");
  const hoje = hojeISO();
  if (data < hoje || (data === hoje && horario <= horaAgora())) {
    throw erroApp("Esse horário já passou. Escolha outro.");
  }

  // O veículo precisa ser do próprio cliente
  const v = await db.getFirstAsync(
    "SELECT modelo, placa FROM veiculos WHERE id = ? AND usuario_id = ?",
    [veiculoId, usuarioId]
  );
  if (!v) throw erroApp("Selecione um dos seus veículos.");

  const novo = {
    id: novoId("a"),
    data,
    horario,
    cliente: u.nome,
    veiculo: v.modelo,
    placa: v.placa,
    servico: servicoLimpo,
    status: "Agendado",
  };
  try {
    await db.runAsync(
      "INSERT INTO agendamentos (id, data, horario, cliente, veiculo, placa, servico, status, usuario_id, oficina_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [novo.id, novo.data, novo.horario, novo.cliente, novo.veiculo, novo.placa, novo.servico, novo.status, usuarioId, u.oficina_id]
    );
  } catch (e) {
    if (String(e?.message || e).includes("UNIQUE")) {
      throw erroApp("Esse horário acabou de ser ocupado. Escolha outro.");
    }
    throw e;
  }
  return novo;
}

// Cliente: só as PRÓPRIAS solicitações (de hoje em diante) e o status de cada uma
export async function listarMeusAgendamentos(usuarioId) {
  const db = await getDb();
  await exigirUsuario(db, usuarioId, "Cliente");
  return db.getAllAsync(
    "SELECT id, data, horario, veiculo, placa, servico, status FROM agendamentos WHERE usuario_id = ? AND data >= ? ORDER BY data ASC, horario ASC",
    [usuarioId, hojeISO()]
  );
}
