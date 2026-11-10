const assert = require("assert");
const db = require("./src/database/db");
const falha = async (fn, msg) => { try { await fn(); } catch (e) { assert(e.message.includes(msg), `esperava "${msg}" mas veio "${e.message}"`); return; } assert.fail("deveria falhar: " + msg); };
const base = (n, nomeFantasia) => ({ nome: "Cliente " + n, email: `c${n}@teste.com`, senha: "abc123", nomeFantasia });
(async () => {
  // exports: a lista pública de oficinas NÃO existe mais
  assert.strictEqual(db.listarOficinas, undefined);
  console.log("ok  não existe mais função que lista as oficinas (o cliente precisa saber o nome)");

  // variações do mesmo nome fantasia encontram a oficina certa
  const variacoes = ["Oficina GS", "oficina gs", "  OFICINA   GS  ", "oficina\tgs"];
  let i = 0;
  for (const v of variacoes) {
    const u = await db.cadastrarCliente(base(++i, v));
    assert.strictEqual(u.oficina_nome, "Oficina GS", `"${v}" deveria achar a Oficina GS`);
  }
  for (const [v, esperado] of [["mecanica premium", "Mecânica Premium"], ["MECÂNICA PREMIUM", "Mecânica Premium"], ["Mecânica   Premium", "Mecânica Premium"]]) {
    const u = await db.cadastrarCliente(base(++i, v));
    assert.strictEqual(u.oficina_nome, esperado);
  }
  console.log("ok  nome fantasia aceita variações de maiúscula, acento e espaços (ex.: 'mecanica premium')");

  // nomes inválidos NÃO criam conta
  const invalidos = ["", "   ", "Oficina", "GS", "Oficina GS 2", "Mecânica", "Premium Mecânica", "Oficina G"];
  const antes = (await (await db.getDb()).getFirstAsync("SELECT COUNT(*) AS n FROM usuarios")).n;
  for (const v of invalidos) {
    await falha(() => db.cadastrarCliente(base(++i, v)), v.trim() ? "Não encontramos nenhuma oficina" : "Informe o nome fantasia");
  }
  await falha(() => db.cadastrarCliente(base(++i, undefined)), "Informe o nome fantasia");
  await falha(() => db.cadastrarCliente(base(++i, null)), "Informe o nome fantasia");
  await falha(() => db.cadastrarCliente(base(++i, "' OR 1=1 --")), "Não encontramos");   // injeção não passa (consulta parametrizada)
  await falha(() => db.cadastrarCliente(base(++i, "%")), "Não encontramos");              // curinga LIKE não vale
  const depois = (await (await db.getDb()).getFirstAsync("SELECT COUNT(*) AS n FROM usuarios")).n;
  assert.strictEqual(depois, antes, "nenhuma conta pode ter sido criada com nome inválido");
  assert.strictEqual(await db.obterUsuarioLogado().then((u) => u.email), `c${6}@teste.com`.replace("c6", "c7")); // última conta válida logada
  console.log("ok  nome fantasia inexistente/parcial/curinga/injeção: recusado e nenhuma conta criada");

  // ordem de validação: dados da conta antes do nome fantasia
  await falha(() => db.cadastrarCliente({ nome: "Fulano", email: "invalido", senha: "abc123", nomeFantasia: "Oficina GS" }), "e-mail válido");

  // cadastro de oficina: nome fantasia único mesmo variando acento/caixa
  await falha(() => db.cadastrarOficina({ nomeOficina: "MECANICA PREMIUM", nome: "X Y", email: "x@y.com", senha: "abc123" }), "Já existe uma oficina com esse nome fantasia");
  await falha(() => db.cadastrarOficina({ nomeOficina: "  oficina  gs ", nome: "X Y", email: "x@y.com", senha: "abc123" }), "Já existe uma oficina com esse nome fantasia");
  await falha(() => db.cadastrarOficina({ nomeOficina: "ab", nome: "X Y", email: "x@y.com", senha: "abc123" }), "nome fantasia da oficina");
  const silva = await db.cadastrarOficina({ nomeOficina: "Auto Center Silva", nome: "Carlos Silva", email: "carlos@silva.com", senha: "silva123" });
  assert.strictEqual(silva.oficina_nome, "Auto Center Silva");
  // um cliente novo agora consegue se ligar à oficina recém-criada pelo nome fantasia
  const cs = await db.cadastrarCliente(base(++i, "AUTO CENTER SILVA"));
  assert.strictEqual(cs.oficina_nome, "Auto Center Silva");
  assert.strictEqual(cs.oficina_id, silva.oficina_id);
  console.log("ok  nome fantasia único (sem diferenciar acento/caixa); oficina nova já pode receber clientes pelo nome");

  // exclusividade continua valendo: cliente da Silva não enxerga horários da GS
  const donoGS = await db.login({ email: "dono@oficina.com", senha: "oficina123", perfil: "Oficina" });
  const { hojeISO } = require("./src/utils/datas");
  assert.deepStrictEqual(await db.listarHorariosOcupados(cs.id, hojeISO()), []);
  assert((await db.listarHorariosOcupados(donoGS.id, hojeISO())).length > 0);
  console.log("ok  cliente da Silva só vê a agenda da Silva (vazia), não a da GS");
})().catch((e) => { console.error("FALHOU:", e); process.exit(1); });
