// ============================================================
// MOCKS LOCAIS - Dados estáticos para a Avaliação Presencial 1
// Dupla: Nicolas Gabriel & Luiz Eduardo
// ============================================================

// Desenvolvido por Nicolas: lista inicial de veículos do cliente
export const VEICULOS_MOCK = [
  {
    id: "v1",
    modelo: "Honda Civic LXR",
    placa: "ABC-1D23",
    ano: 2019,
    km: 68450,
    cor: "Prata",
  },
  {
    id: "v2",
    modelo: "Volkswagen Gol G6",
    placa: "DEF-4G56",
    ano: 2016,
    km: 112300,
    cor: "Preto",
  },
  {
    id: "v3",
    modelo: "Toyota Corolla XEI",
    placa: "GHI-7J89",
    ano: 2022,
    km: 24110,
    cor: "Branco",
  },
  {
    id: "v4",
    modelo: "Fiat Argo Drive",
    placa: "JKL-0M12",
    ano: 2021,
    km: 41200,
    cor: "Vermelho",
  },
];

// Desenvolvido por Luiz: agenda de serviços do dia (painel oficina)
// Status possíveis: "Agendado" | "Confirmado" | "Em Andamento" | "Recusado"
export const AGENDAMENTOS_MOCK = [
  {
    id: "a1",
    horario: "08:00",
    cliente: "Marcos Souza",
    veiculo: "Honda Civic LXR",
    placa: "ABC-1D23",
    servico: "Troca de óleo e filtro",
    status: "Agendado",
  },
  {
    id: "a2",
    horario: "09:30",
    cliente: "Juliana Reis",
    veiculo: "Volkswagen Gol G6",
    placa: "DEF-4G56",
    servico: "Alinhamento e balanceamento",
    status: "Confirmado",
  },
  {
    id: "a3",
    horario: "10:45",
    cliente: "Rafael Lima",
    veiculo: "Toyota Corolla XEI",
    placa: "GHI-7J89",
    servico: "Revisão 20.000 km",
    status: "Em Andamento",
  },
  {
    id: "a4",
    horario: "13:00",
    cliente: "Fernanda Alves",
    veiculo: "Fiat Argo Drive",
    placa: "JKL-0M12",
    servico: "Troca de pastilhas de freio",
    status: "Agendado",
  },
  {
    id: "a5",
    horario: "14:30",
    cliente: "Lucas Pereira",
    veiculo: "Chevrolet Onix LT",
    placa: "MNO-3P45",
    servico: "Diagnóstico eletrônico",
    status: "Agendado",
  },
  {
    id: "a6",
    horario: "16:00",
    cliente: "Beatriz Costa",
    veiculo: "Hyundai HB20",
    placa: "QRS-6T78",
    servico: "Troca de amortecedores",
    status: "Confirmado",
  },
];
