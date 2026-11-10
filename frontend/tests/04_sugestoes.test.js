const assert = require("assert");
const db = require("./src/database/db");
(async () => {
  assert.deepStrictEqual(await db.buscarOficinasPorPrefixo(""), []);
  assert.deepStrictEqual(await db.buscarOficinasPorPrefixo("o"), []);
  let r = await db.buscarOficinasPorPrefixo("ofi");
  assert.deepStrictEqual(r.map(x=>x.nome), ["Oficina GS"]);
  r = await db.buscarOficinasPorPrefixo("  MECANI ");
  assert.deepStrictEqual(r.map(x=>x.nome), ["Mecânica Premium"]);
  assert.deepStrictEqual(await db.buscarOficinasPorPrefixo("premium"), []); // só início
  for (const w of ["%%", "__", "o%", "\\\\", "%a"]) assert.deepStrictEqual(await db.buscarOficinasPorPrefixo(w), [], w);
  console.log("ok  prefixo, acento/caixa, mínimo 2 letras, só início e curingas não vazam");
  const d = await db.getDb();
  for (let i=1;i<=8;i++) await d.runAsync("INSERT INTO oficinas (nome,criado_em,nome_busca) VALUES (?,?,?)",["Eron Auto "+i,"2026-01-01","eron auto "+i]);
  r = await db.buscarOficinasPorPrefixo("eron");
  assert.strictEqual(r.length, 5);
  assert.deepStrictEqual(r.map(x=>x.nome), ["Eron Auto 1","Eron Auto 2","Eron Auto 3","Eron Auto 4","Eron Auto 5"]);
  assert.deepStrictEqual((await db.buscarOficinasPorPrefixo("eron auto 7")).map(x=>x.nome), ["Eron Auto 7"]);
  const u = await db.cadastrarCliente({nome:"Zeca Silva",email:"z@t.com",senha:"abc123",nomeFantasia:r[2].nome});
  assert.strictEqual(u.oficina_nome, "Eron Auto 3");
  console.log("ok  limite de 5, ordem e seleção cadastra na oficina escolhida");
})().catch(e=>{console.error("FALHOU:",e);process.exit(1);});
