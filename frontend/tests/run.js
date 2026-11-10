// Roda os testes do banco (regras de negócio) sem celular nem Expo:
//   npm run test:db        (precisa de Node 22.5+, que traz o módulo node:sqlite)
//
// Como funciona: o código do app (db.js, datas.js...) é convertido para CommonJS numa pasta
// temporária, o "expo-sqlite" é trocado por um adaptador sobre o node:sqlite (banco em memória)
// e o relógio é congelado em 28/10/2026 09:00 (quarta-feira) para os testes serem repetíveis.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

let ts;
try { ts = require("typescript"); } catch (e) {
  console.error("Falta o typescript. Rode 'npm install' na pasta frontend antes."); process.exit(1);
}
try { require("node:sqlite"); } catch (e) {
  console.error("Este teste precisa do Node 22.5 ou mais novo (módulo node:sqlite). Versão atual: " + process.version); process.exit(1);
}

const raiz = path.join(__dirname, "..");
const saida = fs.mkdtempSync(path.join(os.tmpdir(), "agenda-oficina-tests-"));

// 1) converte o código do app
for (const arq of ["database/db.js", "database/seguranca.js", "mocks/data.js", "utils/datas.js"]) {
  const fonte = fs.readFileSync(path.join(raiz, "src", arq), "utf8");
  const js = ts.transpileModule(fonte, { compilerOptions: { module: "commonjs", target: "es2020", allowJs: true } }).outputText;
  const destino = path.join(saida, "src", arq);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, js);
}

// 2) adaptador do expo-sqlite sobre node:sqlite
const shim = path.join(saida, "node_modules", "expo-sqlite");
fs.mkdirSync(shim, { recursive: true });
fs.writeFileSync(path.join(shim, "index.js"), `
const { DatabaseSync } = require("node:sqlite");
exports.openDatabaseAsync = async () => {
  const db = new DatabaseSync(":memory:");
  return {
    async execAsync(sql) { db.exec(sql); },
    async runAsync(sql, p = []) { const r = db.prepare(sql).run(...p); return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes }; },
    async getFirstAsync(sql, p = []) { return db.prepare(sql).get(...p) ?? null; },
    async getAllAsync(sql, p = []) { return db.prepare(sql).all(...p); },
    async withTransactionAsync(fn) { db.exec("BEGIN"); try { await fn(); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; } },
  };
};`);

// 3) relógio congelado
fs.writeFileSync(path.join(saida, "fixdate.js"), `
const Real = Date, fixo = new Real(process.env.FIXED_DATE).getTime();
global.Date = class extends Real {
  constructor(...a) { if (a.length) super(...a); else super(fixo); }
  static now() { return fixo; }
};`);

// 4) roda cada arquivo *.test.js em um processo separado (banco limpo em cada um)
const arquivos = fs.readdirSync(__dirname).filter((f) => f.endsWith(".test.js")).sort();
let total = 0, falhas = 0;
for (const f of arquivos) {
  fs.copyFileSync(path.join(__dirname, f), path.join(saida, f));
  const r = spawnSync(process.execPath, ["--no-warnings", "-r", "./fixdate.js", f], {
    cwd: saida, encoding: "utf8", env: { ...process.env, FIXED_DATE: "2026-10-28T09:00:00" },
  });
  const oks = (r.stdout.match(/^ok /gm) || []).length;
  total += oks;
  const passou = r.status === 0;
  if (!passou) falhas++;
  console.log(`${passou ? "PASSOU" : "FALHOU"}  ${f}  (${oks} verificações)`);
  if (!passou) console.log((r.stdout + r.stderr).split("\n").map((l) => "    " + l).join("\n"));
}
fs.rmSync(saida, { recursive: true, force: true });
console.log(`\n${arquivos.length - falhas}/${arquivos.length} arquivos de teste passaram · ${total} verificações`);
process.exit(falhas ? 1 : 0);
