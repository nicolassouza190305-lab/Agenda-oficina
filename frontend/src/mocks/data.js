// ============================================================
// MOCKS LOCAIS - Dados iniciais (seed) do banco SQLite
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
// Status possíveis: "Agendado" | "Confirmado" | "Em Andamento" | "Cancelado"
// diaOffset: 0 = primeiro dia útil (hoje, ou segunda se for fim de semana), 1 = o dia útil seguinte...
// (a data real é calculada ao popular o banco; a oficina fecha sábado e domingo)
export const AGENDAMENTOS_MOCK = [
  {
    id: "a1",
    horario: "08:00",
    cliente: "Marcos Souza",
    veiculo: "Honda Civic LXR",
    placa: "ABC-1D23",
    servico: "Troca de óleo e filtro",
    status: "Agendado",
    diaOffset: 0,
  },
  {
    id: "a2",
    horario: "09:00",
    cliente: "Juliana Reis",
    veiculo: "Volkswagen Gol G6",
    placa: "DEF-4G56",
    servico: "Alinhamento e balanceamento",
    status: "Confirmado",
    diaOffset: 0,
  },
  {
    id: "a3",
    horario: "10:00",
    cliente: "Rafael Lima",
    veiculo: "Toyota Corolla XEI",
    placa: "GHI-7J89",
    servico: "Revisão 20.000 km",
    status: "Em Andamento",
    diaOffset: 0,
  },
  {
    id: "a4",
    horario: "13:00",
    cliente: "Fernanda Alves",
    veiculo: "Fiat Argo Drive",
    placa: "JKL-0M12",
    servico: "Troca de pastilhas de freio",
    status: "Agendado",
    diaOffset: 0,
  },
  {
    id: "a5",
    horario: "14:00",
    cliente: "Lucas Pereira",
    veiculo: "Chevrolet Onix LT",
    placa: "MNO-3P45",
    servico: "Diagnóstico eletrônico",
    status: "Agendado",
    diaOffset: 0,
  },
  {
    id: "a6",
    horario: "16:00",
    cliente: "Beatriz Costa",
    veiculo: "Hyundai HB20",
    placa: "QRS-6T78",
    servico: "Troca de amortecedores",
    status: "Confirmado",
    diaOffset: 0,
  },
  {
    id: "a7",
    horario: "09:00",
    cliente: "Ana Martins",
    veiculo: "Chevrolet Cruze LT",
    placa: "TUV-9W01",
    servico: "Troca de correia dentada",
    status: "Agendado",
    diaOffset: 1,
  },
  {
    id: "a8",
    horario: "14:00",
    cliente: "Paulo Ribeiro",
    veiculo: "Renault Kwid",
    placa: "XYZ-2A34",
    servico: "Revisão de freios",
    status: "Confirmado",
    diaOffset: 1,
  },
  {
    id: "a9",
    horario: "08:00",
    cliente: "Carla Nunes",
    veiculo: "Jeep Renegade",
    placa: "BCD-5E67",
    servico: "Troca de óleo e filtros",
    status: "Agendado",
    diaOffset: 2,
  },
  {
    id: "a10",
    horario: "15:00",
    cliente: "Diego Fonseca",
    veiculo: "Ford Ka SE",
    placa: "EFG-8H90",
    servico: "Diagnóstico eletrônico",
    status: "Agendado",
    diaOffset: 2,
  },
];

// Grade de horários de atendimento da oficina (um serviço por horário)
export const HORARIOS_ATENDIMENTO = [
  "08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

// ------------------------------------------------------------
// 2ª oficina de exemplo (para demonstrar que cada oficina só enxerga os seus clientes)
// ------------------------------------------------------------
export const VEICULOS_PREMIUM_MOCK = [
  { id: "v5", modelo: "Ford Ranger XLT", placa: "RAN-4G55", ano: 2020, km: 58200, cor: "Preto" },
  { id: "v6", modelo: "Hyundai Creta", placa: "CRE-7T21", ano: 2023, km: 12400, cor: "Cinza" },
];

// doCliente: o pedido aparece em "Minhas solicitações" do cliente dessa oficina
export const AGENDAMENTOS_PREMIUM_MOCK = [
  {
    id: "b1",
    horario: "09:00",
    cliente: "Rodrigo Alves",
    veiculo: "Ford Ranger XLT",
    placa: "RAN-4G55",
    servico: "Revisão 60.000 km",
    status: "Confirmado",
    diaOffset: 0,
    doCliente: true,
  },
  {
    id: "b2",
    horario: "11:00",
    cliente: "Rodrigo Alves",
    veiculo: "Hyundai Creta",
    placa: "CRE-7T21",
    servico: "Troca de pastilhas de freio",
    status: "Agendado",
    diaOffset: 0,
    doCliente: true,
  },
  {
    id: "b3",
    horario: "14:00",
    cliente: "Rodrigo Alves",
    veiculo: "Ford Ranger XLT",
    placa: "RAN-4G55",
    servico: "Alinhamento e balanceamento",
    status: "Agendado",
    diaOffset: 1,
    doCliente: true,
  },
];

// Oficinas iniciais de demonstração. Cada oficina tem um dono (conta Oficina) e
// seu cliente (conta Cliente). As senhas são gravadas só como hash.
// Um cliente pertence a UMA oficina e só agenda nela.
export const OFICINAS_SEED = [
  {
    nome: "Oficina GS",
    dono: { nome: "Dono da GS", email: "dono@oficina.com", senha: "oficina123" },
    cliente: { nome: "Nicolas", email: "cliente@demo.com", senha: "cliente123" },
    veiculos: VEICULOS_MOCK,
    agendamentos: AGENDAMENTOS_MOCK,
  },
  {
    nome: "Mecânica Premium",
    dono: { nome: "Dono da Premium", email: "dono@premium.com", senha: "premium123" },
    cliente: { nome: "Rodrigo Alves", email: "cliente@premium.com", senha: "cliente123" },
    veiculos: VEICULOS_PREMIUM_MOCK,
    agendamentos: AGENDAMENTOS_PREMIUM_MOCK,
  },
];
