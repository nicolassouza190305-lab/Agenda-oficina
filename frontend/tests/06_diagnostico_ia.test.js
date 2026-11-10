const assert = require("assert");
const { responderLocal, acharTopico, TOPICOS_DIAGNOSTICO } = require("./src/utils/diagnosticoLocal");
const palavras = (t) => t.trim().split(/\s+/).length;

// As 4 frases de exemplo do chat levam ao tópico certo
const exemplos = [
  ["Meu carro está fazendo um barulho estranho ao frear", "freios"],
  ["A luz da injeção acendeu no painel", "injecao"],
  ["O motor está esquentando mais do que o normal", "superaquecimento"],
  ["O carro está puxando para um lado ao andar", "alinhamento"],
];
for (const [frase, id] of exemplos) assert.strictEqual(acharTopico(frase).id, id, frase);
console.log("ok  as 4 frases de exemplo do chat caem no tópico certo");

// Acento e caixa não atrapalham; outros assuntos comuns
assert.strictEqual(acharTopico("MEU CARRO NÃO LIGA, A BATERIA FOI ESTE MÊS").id, "bateria");
assert.strictEqual(acharTopico("o ar condicionado nao gela").id, "ar");
assert.strictEqual(acharTopico("saindo fumaça azul no escapamento").id, "fumaca");
assert.strictEqual(acharTopico("quando devo fazer a revisão dos 10 mil km?").id, "revisao");
console.log("ok  ignora acento/maiúsculas e reconhece outros assuntos (bateria, ar-condicionado, fumaça, revisão)");

// Resposta com causas, serviço, urgência, pergunta e caminho para agendar; até 180 palavras
for (const t of TOPICOS_DIAGNOSTICO) {
  assert(t.pares.length >= 2 && t.pares.every(([c, s]) => c && s), t.id);
  assert(["baixa", "media", "alta"].includes(t.urgencia), t.id);
  const r = responderLocal(t.palavras[0]);
  assert(r.includes("Possíveis causas") && r.includes("Serviço:") && r.includes("Urgência:") && r.includes("Para refinar:"), t.id);
  assert(r.includes("Solicitar horário"), t.id);
  assert(palavras(r) <= 180, `${t.id}: ${palavras(r)} palavras`);
}
console.log(`ok  os ${TOPICOS_DIAGNOSTICO.length} tópicos respondem com causas, serviços, urgência e pergunta, em até 180 palavras`);

// Itens de segurança vêm como urgência vermelha
for (const t of ["freios", "superaquecimento", "fumaca", "oleo", "cheiro"]) {
  assert.strictEqual(TOPICOS_DIAGNOSTICO.find((x) => x.id === t).urgencia, "alta", t);
}
assert(responderLocal("freio fazendo barulho").includes("🔴"));
console.log("ok  freio, superaquecimento, fumaça, óleo e cheiro de queimado saem como risco de segurança (🔴)");

// Sem tópico: pede mais detalhes; com contexto anterior, aproveita o que o cliente já falou
const vazio = responderLocal("oi tudo bem?");
assert(vazio.includes("Conte um pouco mais") && !vazio.includes("Possíveis causas"));
assert.strictEqual(acharTopico(""), null);
assert(responderLocal("acontece só de manhã", ["meu carro faz barulho ao frear"]).includes("freios"));
console.log("ok  mensagem sem assunto pede detalhes; usa o histórico da conversa quando ajuda");
