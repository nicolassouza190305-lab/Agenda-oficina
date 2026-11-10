const assert = require("assert");
const db = require("./src/database/db");
const { hojeISO, somarDias, paraISO } = require("./src/utils/datas");
const falha = async (fn, msg) => { try { await fn(); } catch (e) { assert(e.message.includes(msg), `esperava "${msg}" mas veio "${e.message}"`); return; } assert.fail("deveria falhar: " + msg); };
const listarOficinas = async () => (await db.getDb()).getAllAsync("SELECT id, nome FROM oficinas ORDER BY nome COLLATE NOCASE");
const L = (email, senha, perfil) => db.login({ email, senha, perfil });
(async () => {
  const hoje = hojeISO();
  const amanha = paraISO(somarDias(new Date(), 1));
  assert.deepStrictEqual((await listarOficinas()).map((o) => o.nome), ["Mecânica Premium", "Oficina GS"]);

  const nicolas = await L("cliente@demo.com", "cliente123", "Cliente");
  const donoGS = await L("dono@oficina.com", "oficina123", "Oficina");
  const rodrigo = await L("cliente@premium.com", "cliente123", "Cliente");
  const donoPR = await L("dono@premium.com", "premium123", "Oficina");
  assert.strictEqual(nicolas.oficina_nome, "Oficina GS");
  assert.strictEqual(donoGS.oficina_nome, "Oficina GS");
  assert.strictEqual(rodrigo.oficina_nome, "Mecânica Premium");
  assert.strictEqual(nicolas.nome, "Nicolas");
  assert.strictEqual(nicolas.oficina_id, donoGS.oficina_id);
  assert.notStrictEqual(nicolas.oficina_id, rodrigo.oficina_id);
  console.log("ok  cada conta já nasce ligada à sua oficina (Nicolas -> Oficina GS; Rodrigo -> Mecânica Premium)");

  const agGS = await db.listarAgendamentos(donoGS.id), agPR = await db.listarAgendamentos(donoPR.id);
  assert.strictEqual(agGS.length, 10); assert.strictEqual(agPR.length, 3);
  assert(agGS.every((a) => a.id.startsWith("a")) && agPR.every((a) => a.id.startsWith("b")));
  console.log("ok  dono da GS vê só os 10 agendamentos da GS; dono da Premium vê só os 3 da Premium");

  await falha(() => db.atualizarStatus(donoGS.id, "b2", "Confirmado"), "não encontrado nesta oficina");
  await falha(() => db.atualizarStatus(donoPR.id, "a1", "Cancelado"), "não encontrado nesta oficina");
  assert.strictEqual((await db.listarAgendamentos(donoPR.id)).find((a) => a.id === "b2").status, "Agendado");
  await db.atualizarStatus(donoPR.id, "b2", "Confirmado");
  assert.strictEqual((await db.listarAgendamentos(donoPR.id)).find((a) => a.id === "b2").status, "Confirmado");
  console.log("ok  uma oficina NÃO consegue confirmar/cancelar agendamento de outra (e a própria consegue)");

  assert.deepStrictEqual((await db.listarHorariosOcupados(nicolas.id, hoje)).sort(), ["08:00", "09:00", "10:00", "13:00", "14:00", "16:00"]);
  assert.deepStrictEqual((await db.listarHorariosOcupados(rodrigo.id, hoje)).sort(), ["09:00", "11:00"]);
  assert.deepStrictEqual((await db.listarHorariosOcupados(donoGS.id, hoje)).sort(), (await db.listarHorariosOcupados(nicolas.id, hoje)).sort());
  console.log("ok  horários ocupados são os da oficina do usuário (GS != Premium no mesmo dia)");

  // Nicolas agenda na GS: 11:00 está livre na GS (mesmo que ocupado na Premium)
  const v = (await db.listarVeiculos(nicolas.id))[0];
  const rN = await db.solicitarAgendamento(nicolas.id, { data: hoje, horario: "11:00", veiculoId: v.id, servico: "Troca de óleo" });
  assert((await db.listarAgendamentos(donoGS.id)).some((a) => a.id === rN.id));
  assert(!(await db.listarAgendamentos(donoPR.id)).some((a) => a.id === rN.id));
  assert((await db.listarHorariosOcupados(nicolas.id, hoje)).includes("11:00"));
  console.log("ok  Nicolas agenda e o pedido cai SÓ na agenda da Oficina GS");

  // Rodrigo (Premium) usa 11:00 já ocupado na Premium -> recusa; 13:00 livre na Premium (ocupado só na GS) -> aceita
  const vr = (await db.listarVeiculos(rodrigo.id))[0];
  await falha(() => db.solicitarAgendamento(rodrigo.id, { data: hoje, horario: "11:00", veiculoId: vr.id, servico: "Revisão" }), "acabou de ser ocupado");
  const rR = await db.solicitarAgendamento(rodrigo.id, { data: hoje, horario: "13:00", veiculoId: vr.id, servico: "Revisão" });
  assert((await db.listarAgendamentos(donoPR.id)).some((a) => a.id === rR.id) && !(await db.listarAgendamentos(donoGS.id)).some((a) => a.id === rR.id));
  console.log("ok  mesmo horário pode existir em duas oficinas (agendas independentes); reserva dupla só é barrada dentro da mesma oficina");

  // O cliente não consegue usar veículo de outro cliente/oficina
  await falha(() => db.solicitarAgendamento(nicolas.id, { data: amanha, horario: "15:00", veiculoId: vr.id, servico: "Teste" }), "seus veículos");
  // Cliente/dono não invadem funções do outro perfil
  await falha(() => db.listarAgendamentos(nicolas.id), "dono da oficina");
  await falha(() => db.atualizarStatus(nicolas.id, "a1", "Confirmado"), "dono da oficina");
  await falha(() => db.solicitarAgendamento(donoGS.id, { data: amanha, horario: "15:00", veiculoId: v.id, servico: "Teste" }), "apenas para clientes");
  console.log("ok  perfis continuam isolados (cliente não vê agenda; oficina não agenda)");

  // Novo cliente escolhe a Premium
  await falha(() => db.cadastrarCliente({ nome: "Ana Souza", email: "ana@teste.com", senha: "abc123" }), "Informe o nome fantasia");
  await falha(() => db.cadastrarCliente({ nome: "Ana Souza", email: "ana@teste.com", senha: "abc123", nomeFantasia: "Oficina Inexistente" }), "Não encontramos nenhuma oficina");
  const ana = await db.cadastrarCliente({ nome: "Ana Souza", email: "ana@teste.com", senha: "abc123", nomeFantasia: "mecanica premium" });
  assert.strictEqual(ana.oficina_nome, "Mecânica Premium"); assert.strictEqual(ana.perfil, "Cliente");
  assert.deepStrictEqual((await db.listarHorariosOcupados(ana.id, hoje)).sort(), ["09:00", "11:00", "13:00"]);
  await db.inserirVeiculo(ana.id, { modelo: "Fiat Mobi", placa: "MOB-1B23", ano: 2022, km: 10, cor: "Branco" });
  const rA = await db.solicitarAgendamento(ana.id, { data: amanha, horario: "09:00", veiculoId: (await db.listarVeiculos(ana.id))[0].id, servico: "Revisão" });
  assert((await db.listarAgendamentos(donoPR.id)).some((a) => a.id === rA.id) && !(await db.listarAgendamentos(donoGS.id)).some((a) => a.id === rA.id));
  console.log("ok  cliente novo escolhe a Premium: enxerga só a agenda dela e o pedido vai só para ela");

  // Cadastro de oficina
  await falha(() => db.cadastrarOficina({ nomeOficina: "ab", nome: "Carlos", email: "c@x.com", senha: "abc123" }), "nome fantasia da oficina");
  await falha(() => db.cadastrarOficina({ nomeOficina: "oficina gs", nome: "Carlos", email: "carlos@x.com", senha: "abc123" }), "Já existe uma oficina com esse nome fantasia");
  await falha(() => db.cadastrarOficina({ nomeOficina: "Auto Center Silva", nome: "Carlos", email: "DONO@oficina.com", senha: "abc123" }), "e-mail já está cadastrado");
  assert(!(await listarOficinas()).some((o) => o.nome === "Auto Center Silva"), "oficina não pode ficar criada se o e-mail falhou");
  const silva = await db.cadastrarOficina({ nomeOficina: "Auto Center Silva", nome: "Carlos Silva", email: "carlos@silva.com", senha: "silva123" });
  assert.strictEqual(silva.perfil, "Oficina"); assert.strictEqual(silva.oficina_nome, "Auto Center Silva");
  assert.strictEqual((await db.listarAgendamentos(silva.id)).length, 0);
  assert.deepStrictEqual(await db.listarHorariosOcupados(silva.id, hoje), []);
  assert.strictEqual((await listarOficinas()).length, 3);
  await db.encerrarSessao();
  assert.strictEqual(await db.obterUsuarioLogado(), null);
  const volta = await L("carlos@silva.com", "silva123", "Oficina");
  assert.strictEqual(volta.oficina_nome, "Auto Center Silva");
  console.log("ok  cadastro de oficina: nome único (sem diferenciar maiúsculas), e-mail único (sem deixar oficina órfã), agenda própria vazia");

  // Sessão restaura com o nome da oficina
  assert.strictEqual((await db.obterUsuarioLogado()).oficina_nome, "Auto Center Silva");
  console.log("ok  sessão restaurada traz a oficina do usuário");
})().catch((e) => { console.error("FALHOU:", e); process.exit(1); });
