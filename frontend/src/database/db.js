// ============================================================
// db.js - Persistência com SQLite (expo-sqlite)  |  Checkpoint 3
// Cria o banco "oficina.db", as tabelas e oferece as consultas
// (SQL) usadas pelas telas. No primeiro uso, popula com os mocks.
// ============================================================

import * as SQLite from "expo-sqlite";
import { VEICULOS_MOCK, AGENDAMENTOS_MOCK } from "../mocks/data";

let dbPromise = null;

// Abre o banco uma única vez e garante tabelas + dados iniciais
export function getDb() {
  if (!dbPromise) dbPromise = iniciar();
  return dbPromise;
}

async function iniciar() {
  const db = await SQLite.openDatabaseAsync("oficina.db");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS veiculos (
      id     TEXT PRIMARY KEY NOT NULL,
      modelo TEXT NOT NULL,
      placa  TEXT NOT NULL UNIQUE,
      ano    INTEGER NOT NULL,
      km     INTEGER NOT NULL DEFAULT 0,
      cor    TEXT NOT NULL DEFAULT '—'
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id       TEXT PRIMARY KEY NOT NULL,
      horario  TEXT NOT NULL,
      cliente  TEXT NOT NULL,
      veiculo  TEXT NOT NULL,
      placa    TEXT NOT NULL,
      servico  TEXT NOT NULL,
      status   TEXT NOT NULL DEFAULT 'Agendado'
    );
  `);

  // Seed: só insere os mocks se a tabela estiver vazia (primeiro uso)
  const v = await db.getFirstAsync("SELECT COUNT(*) AS n FROM veiculos");
  if (v.n === 0) {
    for (const x of VEICULOS_MOCK) {
      await db.runAsync(
        "INSERT INTO veiculos (id, modelo, placa, ano, km, cor) VALUES (?, ?, ?, ?, ?, ?)",
        [x.id, x.modelo, x.placa, x.ano, x.km, x.cor]
      );
    }
  }
  const a = await db.getFirstAsync("SELECT COUNT(*) AS n FROM agendamentos");
  if (a.n === 0) {
    for (const x of AGENDAMENTOS_MOCK) {
      await db.runAsync(
        "INSERT INTO agendamentos (id, horario, cliente, veiculo, placa, servico, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [x.id, x.horario, x.cliente, x.veiculo, x.placa, x.servico, x.status]
      );
    }
  }
  return db;
}

// ---------------- Veículos (Nicolas) ----------------

// Consulta: lista todos (mais recentes primeiro; veículos novos têm id "v<timestamp>")
export async function listarVeiculos() {
  const db = await getDb();
  return db.getAllAsync("SELECT * FROM veiculos ORDER BY rowid DESC");
}

// Cadastro: retorna o veículo criado. Lança erro se a placa já existir.
export async function inserirVeiculo({ modelo, placa, ano, km, cor }) {
  const db = await getDb();
  const novo = {
    id: `v${Date.now()}`,
    modelo,
    placa,
    ano,
    km,
    cor,
  };
  await db.runAsync(
    "INSERT INTO veiculos (id, modelo, placa, ano, km, cor) VALUES (?, ?, ?, ?, ?, ?)",
    [novo.id, novo.modelo, novo.placa, novo.ano, novo.km, novo.cor]
  );
  return novo;
}

export async function removerVeiculo(id) {
  const db = await getDb();
  await db.runAsync("DELETE FROM veiculos WHERE id = ?", [id]);
}

// ---------------- Agenda (Luiz) ----------------

export async function listarAgendamentos() {
  const db = await getDb();
  return db.getAllAsync("SELECT * FROM agendamentos ORDER BY horario ASC");
}

export async function atualizarStatus(id, status) {
  const db = await getDb();
  await db.runAsync("UPDATE agendamentos SET status = ? WHERE id = ?", [status, id]);
}
