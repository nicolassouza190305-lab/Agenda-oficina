const assert = require("assert");
const crypto = require("crypto");
const { sha256, hashSenha } = require("./src/database/seguranca");
for (const t of ["", "abc", "ação ✓ 😀", "x".repeat(200)]) {
  assert.strictEqual(sha256(t), crypto.createHash("sha256").update(t).digest("hex"), "sha256 " + t);
}
let h = crypto.createHash("sha256").update("s:senha").digest("hex");
for (let i = 0; i < 1000; i++) h = crypto.createHash("sha256").update(h + ":s").digest("hex");
assert.strictEqual(hashSenha("senha", "s"), h);
console.log("ok  sha256 + hashSenha batem com o crypto do Node");

const db = require("./src/database/db");
const { proximosDias, hojeISO, proximoDiaUtil, paraISO: _p } = require("./src/utils/datas");
const D0 = _p(proximoDiaUtil(new Date()));
const falha = async (fn, msg) => { try { await fn(); } catch (e) { assert(e.message.includes(msg), `esperava "${msg}" mas veio "${e.message}"`); return; } assert.fail("deveria falhar: " + msg); };
(async () => {
  assert.strictEqual(await db.obterUsuarioLogado(), null);
  await falha(() => db.login({ email: "dono@oficina.com", senha: "errada", perfil: "Oficina" }), "inválidos");
  await falha(() => db.login({ email: "cliente@demo.com", senha: "cliente123", perfil: "Oficina" }), "Esta conta é de Cliente");
  const dono = await db.login({ email: " DONO@oficina.com ", senha: "oficina123", perfil: "Oficina" });
  assert.strictEqual(dono.perfil, "Oficina");
  assert.strictEqual((await db.obterUsuarioLogado()).id, dono.id);
  console.log("ok  login (senha errada, perfil trocado, e-mail normalizado, sessão)");

  const ags = await db.listarAgendamentos(dono.id);
  assert.strictEqual(ags.length, 10);
  assert(ags.every((a) => /^\d{4}-\d{2}-\d{2}$/.test(a.data)));
  assert.strictEqual(ags[0].data, D0);
  await falha(() => db.listarVeiculos(dono.id), "apenas para clientes");

  const demo = await db.login({ email: "cliente@demo.com", senha: "cliente123", perfil: "Cliente" });
  assert.strictEqual((await db.listarVeiculos(demo.id)).length, 4);
  await falha(() => db.listarAgendamentos(demo.id), "dono da oficina");
  await falha(() => db.atualizarStatus(demo.id, "a1", "Confirmado"), "dono da oficina");
  await falha(() => db.atualizarStatus(demo.id, "a1", "Cancelado"), "dono da oficina");
  assert.strictEqual((await db.listarAgendamentos(dono.id)).find((a) => a.id === "a1").status, "Agendado");
  console.log("ok  cliente NÃO lista agenda nem confirma/cancela (bloqueado no banco)");

  await db.atualizarStatus(dono.id, "a1", "Confirmado");
  assert.strictEqual((await db.listarAgendamentos(dono.id)).find((a) => a.id === "a1").status, "Confirmado");
  await falha(() => db.atualizarStatus(dono.id, "a1", "Qualquer"), "Status inválido");
  console.log("ok  oficina confirma; status inválido recusado");

  const oc0 = await db.listarHorariosOcupados(dono.id, D0);
  assert.deepStrictEqual(oc0.sort(), ["08:00", "09:00", "10:00", "13:00", "14:00", "16:00"]);
  assert(oc0.every((x) => typeof x === "string"));
  await db.atualizarStatus(dono.id, "a4", "Cancelado");
  assert(!(await db.listarHorariosOcupados(dono.id, D0)).includes("13:00"));
  console.log("ok  horários ocupados (só strings); cancelar libera o horário");

  const novo = await db.cadastrarCliente({ nomeFantasia: "Oficina GS", nome: "Maria Silva", email: "Maria@Teste.com", senha: "abc123" });
  assert.strictEqual(novo.perfil, "Cliente");
  assert.strictEqual((await db.listarVeiculos(novo.id)).length, 0);
  await falha(() => db.cadastrarCliente({ nomeFantasia: "Oficina GS", nome: "Outra", email: "maria@teste.com", senha: "abc123" }), "já está cadastrado");
  await falha(() => db.cadastrarCliente({ nomeFantasia: "Oficina GS", nome: "X", email: "a@b.co", senha: "abc123" }), "nome");
  await falha(() => db.cadastrarCliente({ nomeFantasia: "Oficina GS", nome: "Fulano", email: "invalido", senha: "abc123" }), "e-mail válido");
  await falha(() => db.cadastrarCliente({ nomeFantasia: "Oficina GS", nome: "Fulano", email: "f@b.co", senha: "123" }), "6 caracteres");
  const m = await db.login({ email: "maria@teste.com", senha: "abc123", perfil: "Cliente" });
  assert.strictEqual(m.id, novo.id);
  console.log("ok  cadastro de cliente (validações, e-mail único, login depois)");

  const v = await db.inserirVeiculo(novo.id, { modelo: "Fiat Uno", placa: "AAA-1A11", ano: 2015, km: 1000, cor: "Azul" });
  assert.strictEqual((await db.listarVeiculos(novo.id)).length, 1);
  assert.strictEqual((await db.listarVeiculos(demo.id)).length, 4);
  await falha(() => db.inserirVeiculo(demo.id, { modelo: "Outro", placa: "AAA-1A11", ano: 2000, km: 0, cor: "-" }), "mesma placa".slice(0,0) || "essa placa");
  await falha(() => db.inserirVeiculo(dono.id, { modelo: "Y", placa: "ZZZ-9Z99", ano: 2000, km: 0, cor: "-" }), "apenas para clientes");
  console.log("ok  veículos isolados por cliente; placa única; oficina não cadastra");

  await db.encerrarSessao();
  assert.strictEqual(await db.obterUsuarioLogado(), null);
  const row = await (await db.getDb()).getFirstAsync("SELECT senha_hash, salt FROM usuarios WHERE email='maria@teste.com'");
  assert(!row.senha_hash.includes("abc123") && row.senha_hash.length === 64);
  console.log("ok  logout; senha guardada só como hash (64 hex)");
  console.log("proximosDias:", JSON.stringify(proximosDias(3)));
})().catch((e) => { console.error("FALHOU:", e); process.exit(1); });

// ---------- Solicitar horário ----------
(async () => {
  const assert = require("assert");
  const db = require("./src/database/db");
  const { hojeISO, somarDias, paraISO, horaAgora } = require("./src/utils/datas");
  const falha = async (fn, msg) => { try { await fn(); } catch (e) { assert(e.message.includes(msg), `esperava "${msg}" mas veio "${e.message}"`); return; } assert.fail("deveria falhar: " + msg); };
  await new Promise((r) => setTimeout(r, 300));
  const dono = await db.login({ email: "dono@oficina.com", senha: "oficina123", perfil: "Oficina" });
  const demo = await db.login({ email: "cliente@demo.com", senha: "cliente123", perfil: "Cliente" });
  const maria = await db.login({ email: "maria@teste.com", senha: "abc123", perfil: "Cliente" }).catch(() => db.cadastrarCliente({ nomeFantasia: "Oficina GS", nome: "Maria Silva", email: "maria@teste.com", senha: "abc123" }));
  const vMaria = (await db.listarVeiculos(maria.id))[0] || (await db.inserirVeiculo(maria.id, { modelo: "Fiat Uno", placa: "AAA-1A11", ano: 2015, km: 1, cor: "Azul" }));
  const vDemo = (await db.listarVeiculos(demo.id))[0];
  const amanha = require("./src/utils/datas").proximosDias(2)[1].iso;
  const base = { data: amanha, horario: "11:00", servico: "Troca de óleo" };

  const ag = await db.solicitarAgendamento(maria.id, { ...base, veiculoId: vMaria.id });
  assert.strictEqual(ag.status, "Agendado");
  assert.strictEqual(ag.cliente, "Maria Silva");
  assert.strictEqual(ag.veiculo, "Fiat Uno");
  assert((await db.listarHorariosOcupados(dono.id, amanha)).includes("11:00"));
  console.log("ok  cliente solicita horário: entra 'Agendado' com nome/veículo preenchidos; horário vira ocupado");

  await falha(() => db.solicitarAgendamento(demo.id, { ...base, veiculoId: vDemo.id }), "acabou de ser ocupado");
  await falha(() => db.solicitarAgendamento(demo.id, { ...base, horario: "15:00", veiculoId: vMaria.id }), "seus veículos");
  await falha(() => db.solicitarAgendamento(demo.id, { ...base, horario: "15:00", veiculoId: vDemo.id, servico: "ab" }), "Descreva");
  await falha(() => db.solicitarAgendamento(demo.id, { ...base, horario: "15:00", veiculoId: vDemo.id, servico: "x".repeat(121) }), "120");
  await falha(() => db.solicitarAgendamento(demo.id, { ...base, horario: "12:00", veiculoId: vDemo.id }), "Horário inválido");
  await falha(() => db.solicitarAgendamento(demo.id, { ...base, data: "31/10", veiculoId: vDemo.id }), "Data inválida");
  await falha(() => db.solicitarAgendamento(demo.id, { ...base, data: "2020-01-06", veiculoId: vDemo.id }), "já passou"); // segunda-feira no passado
  await falha(() => db.solicitarAgendamento(dono.id, { ...base, horario: "15:00", veiculoId: vDemo.id }), "apenas para clientes");
  console.log("ok  bloqueios: reserva dupla, veículo de outro cliente, serviço curto/longo, horário/data inválidos, passado, oficina");

  // horário de hoje que já passou (só testável se houver slot <= agora)
  const passados = require("./src/mocks/data").HORARIOS_ATENDIMENTO.filter((h) => h <= horaAgora());
  if (passados.length && require("./src/utils/datas").ehDiaUtilISO(hojeISO())) await falha(() => db.solicitarAgendamento(demo.id, { data: hojeISO(), horario: passados[0], veiculoId: vDemo.id, servico: "Revisão" }), "já passou");

  const meus = await db.listarMeusAgendamentos(maria.id);
  assert.strictEqual(meus.length, 1);
  assert.deepStrictEqual(Object.keys(meus[0]).sort(), ["data", "horario", "id", "placa", "servico", "status", "veiculo"]);
  assert.strictEqual((await db.listarMeusAgendamentos(demo.id)).length, 0);
  await falha(() => db.listarMeusAgendamentos(dono.id), "apenas para clientes");
  console.log("ok  cliente vê só as próprias solicitações (sem dados de outros)");

  const naAgenda = (await db.listarAgendamentos(dono.id)).find((a) => a.id === ag.id);
  assert(naAgenda && naAgenda.status === "Agendado");
  await db.atualizarStatus(dono.id, ag.id, "Confirmado");
  assert.strictEqual((await db.listarMeusAgendamentos(maria.id))[0].status, "Confirmado");
  await db.atualizarStatus(dono.id, ag.id, "Cancelado");
  assert(!(await db.listarHorariosOcupados(dono.id, amanha)).includes("11:00"));
  const re = await db.solicitarAgendamento(demo.id, { ...base, veiculoId: vDemo.id });
  assert.strictEqual(re.status, "Agendado");
  console.log("ok  oficina vê o pedido, confirma (cliente vê 'Confirmado'), cancela e o horário pode ser pedido de novo");
})().catch((e) => { console.error("FALHOU:", e); process.exit(1); });

// ---------- Sábado e domingo fechados ----------
(async () => {
  const assert = require("assert");
  await new Promise((r) => setTimeout(r, 600));
  const db = require("./src/database/db");
  const datas = require("./src/utils/datas");
  const falha = async (fn, msg) => { try { await fn(); } catch (e) { assert(e.message.includes(msg), `esperava "${msg}" mas veio "${e.message}"`); return; } assert.fail("deveria falhar: " + msg); };

  // 1) proximosDias nunca devolve sáb/dom, simulando o app aberto em cada dia da semana
  const RealDate = Date;
  const nomes = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  for (let i = 0; i < 7; i++) {
    const base = new RealDate(2026, 9, 18 + i, 15, 30); // 18/10/2026 = domingo
    global.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(base.getTime()); } static now() { return base.getTime(); } };
    const dias = datas.proximosDias(7);
    const semana = dias.map((d) => { const [y, m, dd] = d.iso.split("-").map(Number); return new RealDate(y, m - 1, dd).getDay(); });
    assert.strictEqual(dias.length, 7);
    assert(semana.every((w) => w >= 1 && w <= 5), `fim de semana na lista (app aberto ${nomes[base.getDay()]}): ` + dias.map((d) => d.iso));
    assert.strictEqual(new Set(dias.map((d) => d.iso)).size, 7);
    const fimDeSemana = base.getDay() === 0 || base.getDay() === 6;
    assert.strictEqual(dias[0].rotulo === "Hoje", !fimDeSemana, `rótulo Hoje errado (${nomes[base.getDay()]})`);
    if (base.getDay() === 5) assert.strictEqual(dias[1].rotulo, "Seg"); // sexta -> próximo é segunda, não "Amanhã"
    if (base.getDay() === 4) assert.strictEqual(dias[1].rotulo, "Amanhã");
    // seed em dias úteis
    const ini = datas.paraISO(datas.somarDiasUteis(new RealDate(base), 0));
    assert(datas.ehDiaUtilISO(ini));
    global.Date = RealDate;
  }
  console.log("ok  lista de dias: 7 dias úteis em qualquer dia da semana (sem sáb/dom; 'Hoje'/'Amanhã' só quando corretos)");

  // 2) banco recusa sáb/dom mesmo se a tela fosse burlada
  const demo = await db.login({ email: "cliente@demo.com", senha: "cliente123", perfil: "Cliente" });
  const v = (await db.listarVeiculos(demo.id))[0];
  let sab = new RealDate(); while (sab.getDay() !== 6) sab = datas.somarDias(sab, 1);
  const dom = datas.somarDias(sab, 1);
  await falha(() => db.solicitarAgendamento(demo.id, { data: datas.paraISO(sab), horario: "10:00", veiculoId: v.id, servico: "Revisão" }), "sábados e domingos");
  await falha(() => db.solicitarAgendamento(demo.id, { data: datas.paraISO(dom), horario: "10:00", veiculoId: v.id, servico: "Revisão" }), "sábados e domingos");
  const seg = datas.somarDias(sab, 2);
  const ok = await db.solicitarAgendamento(demo.id, { data: datas.paraISO(seg), horario: "10:00", veiculoId: v.id, servico: "Revisão" });
  assert.strictEqual(ok.status, "Agendado");
  console.log("ok  banco recusa sábado e domingo; segunda-feira aceita");

  // 3) dados de exemplo caem só em dias úteis
  const dono = await db.login({ email: "dono@oficina.com", senha: "oficina123", perfil: "Oficina" });
  const ags = await db.listarAgendamentos(dono.id);
  assert(ags.every((a) => datas.ehDiaUtilISO(a.data)), "seed em fim de semana");
  console.log("ok  agendamentos de exemplo só em dias úteis");
})().catch((e) => { console.error("FALHOU:", e); process.exit(1); });
