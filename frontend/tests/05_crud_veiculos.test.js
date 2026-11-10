const assert = require("assert");
const db = require("./src/database/db");
const { proximosDias } = require("./src/utils/datas");
const falha = async (fn, msg) => { try { await fn(); } catch (e) { assert(e.message.includes(msg), `esperava "${msg}" veio "${e.message}"`); return; } assert.fail("deveria falhar: " + msg); };
(async () => {
  const a = await db.cadastrarCliente({ nome: "Ana Teste", email: "ana@t.com", senha: "abc123", nomeFantasia: "Oficina GS" });
  const b = await db.cadastrarCliente({ nome: "Beto Teste", email: "beto@t.com", senha: "abc123", nomeFantasia: "Oficina GS" });
  const v = await db.inserirVeiculo(a.id, { modelo: " Gol ", placa: "abc-1234", ano: "2015", km: "100", cor: "" });
  assert.strictEqual(v.modelo, "Gol"); assert.strictEqual(v.placa, "ABC-1234"); assert.strictEqual(v.cor, "—");
  await falha(() => db.inserirVeiculo(a.id, { modelo: "X", placa: "Z1", ano: 1800 }), "ano válido");
  await falha(() => db.inserirVeiculo(a.id, { modelo: "X", placa: "Z1", ano: 2020, km: -5 }), "negativo");
  console.log("ok  C: cadastro limpa e valida (ano, km)");

  const e = await db.atualizarVeiculo(a.id, v.id, { modelo: "Gol G7", placa: "ABC-1234", ano: 2016, km: 5000, cor: "Prata" });
  assert.strictEqual(e.modelo, "Gol G7");
  const lista = await db.listarVeiculos(a.id);
  assert.strictEqual(lista.find(x => x.id === v.id).km, 5000);
  console.log("ok  U: atualiza e a consulta mostra o novo valor");

  await falha(() => db.atualizarVeiculo(b.id, v.id, { modelo: "Hack", placa: "ABC-1234", ano: 2016 }), "não encontrado");
  await falha(() => db.excluirVeiculo(b.id, v.id), "não encontrado");
  assert.strictEqual((await db.listarVeiculos(a.id)).find(x => x.id === v.id).modelo, "Gol G7");
  const v2 = await db.inserirVeiculo(a.id, { modelo: "Uno", placa: "UNO-0001", ano: 2010 });
  await falha(() => db.atualizarVeiculo(a.id, v2.id, { modelo: "Uno", placa: "ABC-1234", ano: 2010 }), "mesma placa".replace("mesma placa","Já existe"));
  console.log("ok  outro cliente não edita/exclui; placa repetida recusada na edição");

  const dia = proximosDias(3)[2].iso;
  const ag = await db.solicitarAgendamento(a.id, { data: dia, horario: "16:00", veiculoId: v.id, servico: "Troca de óleo" });
  await db.atualizarVeiculo(a.id, v.id, { modelo: "Gol Novo", placa: "NOV-0001", ano: 2016 });
  const meus = await db.listarMeusAgendamentos(a.id);
  assert.strictEqual(meus.find(x => x.id === ag.id).placa, "NOV-0001");
  assert.strictEqual(meus.find(x => x.id === ag.id).veiculo, "Gol Novo");
  console.log("ok  U: agendamento futuro acompanha a nova placa/modelo");

  await falha(() => db.excluirVeiculo(a.id, v.id), "agendamento ativo");
  console.log("ok  D: veículo com agendamento ativo não é excluído");
  const dono = await db.login({ email: "dono@oficina.com", senha: "oficina123", perfil: "Oficina" });
  await db.atualizarStatus(dono.id, ag.id, "Cancelado");
  await db.excluirVeiculo(a.id, v.id);
  assert(!(await db.listarVeiculos(a.id)).some(x => x.id === v.id));
  await falha(() => db.excluirVeiculo(a.id, v.id), "não encontrado");
  await db.excluirVeiculo(a.id, v2.id);
  console.log("ok  D: após cancelar o agendamento, exclui; excluir de novo dá erro claro");
})().catch(e => { console.error("FALHOU:", e); process.exit(1); });
