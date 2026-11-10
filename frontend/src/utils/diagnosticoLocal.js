// ============================================================
// Mecânico IA - MODO DEMONSTRAÇÃO (sem internet e sem chave de IA)
// Responde com base em uma pequena base de conhecimento local: procura palavras-chave
// na mensagem e devolve possíveis causas, serviços da oficina e urgência, no mesmo
// formato pedido ao Claude no backend. NÃO é uma IA generativa: quando houver um
// backend com chave (EXPO_PUBLIC_BACKEND_URL), o app usa a IA de verdade.
// ============================================================

const URGENCIA = {
  baixa: "🟢 pode esperar (agende na próxima revisão)",
  media: "🟡 agendar logo",
  alta: "🔴 risco de segurança: evite dirigir e procure a oficina",
};

// Cada tópico: palavras-chave (sem acento, minúsculas), causas/serviços em pares e uma pergunta
const TOPICOS = [
  {
    id: "freios",
    titulo: "problema nos freios",
    palavras: ["freio", "frear", "frenagem", "pedal", "pastilha", "disco"],
    pares: [
      ["pastilhas gastas", "troca de pastilhas de freio"],
      ["discos empenados ou desgastados", "retífica ou troca dos discos"],
      ["fluido de freio velho ou com ar no sistema", "troca e sangria do fluido de freio"],
    ],
    urgencia: "alta",
    pergunta: "O barulho aparece só ao frear ou o tempo todo? O pedal está mole ou o carro demora a parar?",
  },
  {
    id: "injecao",
    titulo: "luz de injeção/motor acesa",
    palavras: ["injecao", "luz do motor", "luz acesa", "check engine", "painel", "falhando", "falha no motor", "engasgando"],
    pares: [
      ["velas ou bobinas com desgaste", "troca de velas/bobinas"],
      ["sensor (sonda lambda, MAP ou temperatura) com defeito", "leitura de códigos com scanner e troca do sensor"],
      ["bicos injetores sujos", "limpeza de bicos e corpo de borboleta"],
    ],
    urgencia: "media",
    pergunta: "A luz está fixa ou piscando? O motor está falhando ou perdendo força?",
  },
  {
    id: "superaquecimento",
    titulo: "motor esquentando demais",
    palavras: ["esquentando", "esquenta", "superaquec", "temperatura", "ferver", "fervendo", "radiador", "arrefecimento"],
    pares: [
      ["nível baixo ou vazamento de líquido de arrefecimento", "revisão do sistema de arrefecimento"],
      ["válvula termostática travada", "troca da válvula termostática"],
      ["ventoinha ou radiador com defeito", "teste e reparo/troca da ventoinha e do radiador"],
    ],
    urgencia: "alta",
    pergunta: "O ponteiro de temperatura sobe parado, em movimento ou nos dois casos? Há cheiro doce ou vapor?",
  },
  {
    id: "alinhamento",
    titulo: "carro puxando ou volante vibrando",
    palavras: ["puxando", "puxa para", "puxa pro", "desalinhado", "alinhamento", "volante tremendo", "volante vibrando", "vibrando", "tremendo", "trepidando", "balanceamento"],
    pares: [
      ["alinhamento fora de medida", "alinhamento de direção"],
      ["rodas desbalanceadas", "balanceamento das rodas"],
      ["pneu com desgaste irregular ou pressão diferente", "calibragem, rodízio ou troca de pneus"],
    ],
    urgencia: "media",
    pergunta: "A vibração aparece em alguma velocidade específica? O carro puxa para qual lado?",
  },
  {
    id: "suspensao",
    titulo: "barulho na suspensão",
    palavras: ["suspensao", "buraco", "batendo", "batida", "amortecedor", "estalo", "toc toc", "pancada", "barulho ao passar"],
    pares: [
      ["amortecedores gastos", "troca de amortecedores"],
      ["buchas ou pivôs com folga", "troca de buchas/pivôs da suspensão"],
      ["terminal de direção ou barra estabilizadora soltos", "revisão e aperto/troca dos terminais e das barras"],
    ],
    urgencia: "media",
    pergunta: "O barulho acontece em buracos, em curvas ou ao virar o volante parado?",
  },
  {
    id: "bateria",
    titulo: "dificuldade para ligar o carro",
    palavras: ["bateria", "nao liga", "nao pega", "partida", "arranque", "motor de partida", "pegar", "morreu", "descarregada", "clique"],
    pares: [
      ["bateria fraca ou descarregada", "teste de carga e troca da bateria"],
      ["terminais da bateria oxidados", "limpeza e aperto dos terminais"],
      ["alternador ou motor de partida com defeito", "teste do sistema de carga e partida"],
    ],
    urgencia: "media",
    pergunta: "Ao girar a chave, o painel acende e faz clique, ou fica totalmente sem resposta?",
  },
  {
    id: "oleo",
    titulo: "óleo do motor",
    palavras: ["oleo", "pressao do oleo", "luz do oleo", "troca de oleo", "vazando oleo", "consumindo oleo"],
    pares: [
      ["nível de óleo baixo", "completar o nível e verificar vazamentos"],
      ["óleo vencido ou filtro saturado", "troca de óleo e filtro"],
      ["vazamento (junta ou retentor)", "diagnóstico do vazamento e troca da junta/retentor"],
    ],
    urgencia: "alta",
    pergunta: "A luz do óleo acendeu em vermelho? Há manchas no chão onde o carro fica estacionado?",
  },
  {
    id: "fumaca",
    titulo: "fumaça saindo do escapamento",
    palavras: ["fumaca", "fumando", "escapamento", "escape"],
    pares: [
      ["fumaça azulada: queima de óleo (anéis ou retentores de válvula)", "avaliação de compressão e retentores"],
      ["fumaça branca densa: líquido de arrefecimento entrando no motor", "teste da junta do cabeçote"],
      ["fumaça preta: mistura rica (injeção ou filtro de ar sujo)", "limpeza de bicos e troca do filtro de ar"],
    ],
    urgencia: "alta",
    pergunta: "Qual a cor da fumaça e ela aparece só ao ligar o carro ou o tempo todo?",
  },
  {
    id: "ar",
    titulo: "ar-condicionado com problema",
    palavras: ["ar condicionado", "ar-condicionado", "ar nao gela", "ar fraco", "nao gela", "gelando", "cheiro no ar"],
    pares: [
      ["gás refrigerante baixo", "recarga de gás e teste de vazamento"],
      ["filtro de cabine sujo", "troca do filtro de cabine e higienização"],
      ["compressor ou condensador com defeito", "diagnóstico do sistema de ar-condicionado"],
    ],
    urgencia: "baixa",
    pergunta: "O ar sai fraco ou sai quente? Existe cheiro de mofo ao ligar?",
  },
  {
    id: "embreagem",
    titulo: "embreagem ou câmbio",
    palavras: ["embreagem", "cambio", "marcha", "patinando", "engatar", "arranhando", "trocar marcha", "troca de marcha"],
    pares: [
      ["embreagem desgastada (disco/platô)", "troca do kit de embreagem"],
      ["fluido ou cabo de acionamento com problema", "revisão do acionamento da embreagem"],
      ["sincronizadores do câmbio gastos", "avaliação e revisão do câmbio"],
    ],
    urgencia: "media",
    pergunta: "A dificuldade é para engatar alguma marcha específica ou o motor acelera e o carro não acompanha?",
  },
  {
    id: "consumo",
    titulo: "consumo de combustível alto",
    palavras: ["consumo", "gastando muito", "bebendo", "combustivel", "gasolina", "faz pouco km", "km por litro"],
    pares: [
      ["pneus com pressão baixa", "calibragem e conferência dos pneus"],
      ["filtro de ar ou velas desgastados", "troca de filtro de ar e velas"],
      ["sensor de oxigênio ou bicos com problema", "diagnóstico da injeção eletrônica"],
    ],
    urgencia: "baixa",
    pergunta: "Desde quando o consumo aumentou? Mudou algo no uso (mais trânsito, ar ligado, carga)?",
  },
  {
    id: "pneus",
    titulo: "pneus",
    palavras: ["pneu", "pneus", "furou", "furado", "careca", "calibragem", "desgaste do pneu"],
    pares: [
      ["pressão incorreta", "calibragem dos pneus"],
      ["desgaste irregular (geometria da suspensão)", "alinhamento e balanceamento"],
      ["pneu careca ou com bolhas", "troca de pneus"],
    ],
    urgencia: "media",
    pergunta: "O desgaste é mais nas bordas ou no centro? Os pneus têm mais de 5 anos?",
  },
  {
    id: "cheiro",
    titulo: "cheiro de queimado ou de combustível",
    palavras: ["cheiro de queimado", "cheiro de gasolina", "cheiro de combustivel", "cheiro de borracha", "cheirando", "queimado"],
    pares: [
      ["vazamento de combustível ou de óleo em peça quente", "inspeção completa do motor e das mangueiras"],
      ["freio ou embreagem superaquecidos", "revisão de freios e embreagem"],
      ["problema elétrico (fiação ou curto)", "inspeção do sistema elétrico"],
    ],
    urgencia: "alta",
    pergunta: "O cheiro aparece parado, rodando ou ao frear? Há fumaça ou manchas embaixo do carro?",
  },
  {
    id: "revisao",
    titulo: "revisão preventiva",
    palavras: ["revisao", "manutencao", "preventiva", "quilometragem", "km rodados", "quando trocar"],
    pares: [
      ["óleo e filtros dentro do prazo", "troca de óleo, filtro de óleo, de ar e de combustível"],
      ["itens de segurança sem checagem", "inspeção de freios, pneus, suspensão e iluminação"],
      ["correias e fluidos envelhecidos", "verificação da correia dentada e dos fluidos"],
    ],
    urgencia: "baixa",
    pergunta: "Qual a quilometragem atual e quando foi a última revisão?",
  },
];

export function normalizar(texto) {
  let t = String(texto || "").toLowerCase();
  if (typeof t.normalize === "function") t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return t.replace(/\s+/g, " ").trim();
}

// Procura o tópico com mais palavras-chave encontradas (empate: o que aparece primeiro)
export function acharTopico(texto) {
  const t = normalizar(texto);
  if (!t) return null;
  let melhor = null;
  let pontos = 0;
  for (const topico of TOPICOS) {
    const n = topico.palavras.filter((p) => t.includes(p)).length;
    if (n > pontos) {
      melhor = topico;
      pontos = n;
    }
  }
  return melhor;
}

const AVISO = "(Resposta do modo demonstração, sem IA online. Confirme o diagnóstico com a oficina.)";

export function responderLocal(mensagem, historicoUsuario = []) {
  // 1) tenta a mensagem atual; 2) se não achar, usa também o que o cliente já disse antes
  const topico = acharTopico(mensagem) || acharTopico([...historicoUsuario, mensagem].join(" "));

  if (!topico) {
    return (
      "Não consegui identificar o problema só com essa descrição. Conte um pouco mais:\n" +
      "• O que você percebe (barulho, luz no painel, vibração, cheiro, fumaça)?\n" +
      "• Quando acontece (ao frear, ao ligar, em alta velocidade)?\n" +
      "• Qual o modelo e a quilometragem do carro?\n\n" +
      AVISO
    );
  }

  const linhas = topico.pares.map(([causa, servico]) => `• ${causa}\n   Serviço: ${servico}`);
  return (
    `Pelo que você descreveu, parece ser ${topico.titulo}.\n\n` +
    `Possíveis causas:\n${linhas.join("\n")}\n\n` +
    `Urgência: ${URGENCIA[topico.urgencia]}\n\n` +
    `Para refinar: ${topico.pergunta}\n\n` +
    `Quer agendar? Vá em Horários e toque em "Solicitar horário".\n\n` +
    AVISO
  );
}

export const TOPICOS_DIAGNOSTICO = TOPICOS;
