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

// Próximos n dias a partir de hoje, para os seletores de dia
export function proximosDias(n = 7) {
  const hoje = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = somarDias(hoje, i);
    return {
      iso: paraISO(d),
      rotulo: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : DIAS_CURTO[d.getDay()],
      sub: `${p2(d.getDate())}/${p2(d.getMonth() + 1)}`,
    };
  });
}

// "2026-10-19" -> "Segunda, 19 de Out"
export function descreverDia(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DIAS_LONGO[dt.getDay()]}, ${d} de ${MESES[m - 1]}`;
}
