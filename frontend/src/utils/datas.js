// ============================================================
// datas.js - utilitários de data (sempre no fuso local do aparelho)
// Datas são guardadas no banco como texto "AAAA-MM-DD".
// ============================================================

const p2 = (n) => String(n).padStart(2, "0");
const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_LONGO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function paraISO(d) {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export function hojeISO() {
  return paraISO(new Date());
}

export function somarDias(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

// Hora atual no formato "HH:MM" (compara direto com os horários da grade)
export function horaAgora() {
  const d = new Date();
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

// A oficina funciona de segunda a sexta (sábado e domingo são fechados)
export function ehDiaUtil(d) {
  const w = d.getDay();
  return w !== 0 && w !== 6;
}

export function ehDiaUtilISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return ehDiaUtil(new Date(y, m - 1, d));
}

// O próprio dia, se for útil; senão a próxima segunda-feira
export function proximoDiaUtil(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  while (!ehDiaUtil(x)) x.setDate(x.getDate() + 1);
  return x;
}

// n dias úteis depois do primeiro dia útil a partir de d
export function somarDiasUteis(d, n) {
  let x = proximoDiaUtil(d);
  for (let i = 0; i < n; i++) x = proximoDiaUtil(somarDias(x, 1));
  return x;
}

// Próximos n DIAS ÚTEIS (sem sábado e domingo), para os seletores de dia
export function proximosDias(n = 7) {
  const hoje = new Date();
  const hojeIso = paraISO(hoje);
  const amanhaIso = paraISO(somarDias(hoje, 1));
  const dias = [];
  let d = proximoDiaUtil(hoje);
  for (let i = 0; i < n; i++) {
    const iso = paraISO(d);
    dias.push({
      iso,
      rotulo: iso === hojeIso ? "Hoje" : iso === amanhaIso ? "Amanhã" : DIAS_CURTO[d.getDay()],
      sub: `${p2(d.getDate())}/${p2(d.getMonth() + 1)}`,
    });
    d = proximoDiaUtil(somarDias(d, 1));
  }
  return dias;
}

// "2026-10-19" -> "Segunda, 19 de Out"
export function descreverDia(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DIAS_LONGO[dt.getDay()]}, ${d} de ${MESES[m - 1]}`;
}
