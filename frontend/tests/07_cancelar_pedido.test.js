const assert = require("assert");
const db = require("./src/database/db");
const { proximosDias } = require("./src/utils/datas");
const falha = async (fn, msg) => { try { await fn(); } catch (e) { assert(e.message.includes(msg), `esperava "${msg}" veio "${e.message}"`); return; } assert.fail("deveria falhar: " + msg); };
(async () => {
  const a = await db.cadastrarCliente({ nome: "Ana Teste", email: "ana@t.com", senha: "abc123", nomeFantasia: "Oficina GS" });
  const b = await db.cadastrarCliente({ nome: "Beto Teste", email: "beto@t.com", senha: "abc123", nomeFantasia: "Oficina GS" });
  const v = await db.inserirVeiculo(a.id, { modelo: "Gol", placa: "GOL-0001", ano: 2015 });
  const dia = proximosDias(3)[2].iso;
  const ag = await db.solicitarAgendamento(a.id, { data: dia, horario: "16:00", veiculoId: v.id, servico: "Troca de óleo" });
  assert((await db.listarHorariosOcupados(a.id, dia)).includes("16:00"));

  await falha(() => db.cancelarMeuAgendamento(b.id, ag.id), "não encontrado");
  const dono = await db.login({ email: "dono@oficina.com", senha: "oficina123", perfil: "Oficina" });
  await falha(() => db.cancelarMeuAgendamento(dono.id, ag.id), "apenas para clientes");
  console.log("ok  só quem pediu cancela: outro cliente e a oficina não usam esta função");

  await db.cancelarMeuAgendamento(a.id, ag.id);
  assert.strictEqual((await db.listarMeusAgendamentos(a.id)).find((x) => x.id === ag.id).status, "Cancelado");
  assert(!(await db.listarHorariosOcupados(a.id, dia)).includes("16:00"));
  console.log("ok  cancelar marca como Cancelado e libera o horário");

  await falha(() => db.cancelarMeuAgendamento(a.id, ag.id), "já está cancelado");
  const outro = await db.solicitarAgendamento(b.id, { data: dia, horario: "16:00", veiculoId: (await db.inserirVeiculo(b.id, { modelo: "Uno", placa: "UNO-0002", ano: 2011 })).id, servico: "Revisão geral" });
  assert.strictEqual(outro.status, "Agendado");
  console.log("ok  cancelar duas vezes é recusado; outro cliente consegue pegar o horário liberado");

  const ocupados = await db.listarHorariosOcupados(a.id, dia);
  const livre = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "17:00"].find((h) => !ocupados.includes(h));
  const conf = await db.solicitarAgendamento(a.id, { data: dia, horario: livre, veiculoId: v.id, servico: "Freios" });
  await db.atualizarStatus(dono.id, conf.id, "Confirmado");
  await db.cancelarMeuAgendamento(a.id, conf.id);
  assert.strictEqual((await db.listarMeusAgendamentos(a.id)).find((x) => x.id === conf.id).status, "Cancelado");
  console.log("ok  pedido já confirmado também pode ser cancelado pelo cliente");

  await db.getDb().then((d) => d.runAsync("UPDATE agendamentos SET status = 'Em Andamento' WHERE id = ?", [outro.id]));
  await falha(() => db.cancelarMeuAgendamento(b.id, outro.id), "em andamento");
  console.log("ok  serviço em andamento não pode ser cancelado pelo app (fale com a oficina)");
})().catch((e) => { console.error("FALHOU:", e); process.exit(1); });
