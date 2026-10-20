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

// Contas iniciais de demonstração (as senhas são gravadas só como hash)
// - A conta da OFICINA (dono) existe previamente: ninguém se cadastra como oficina pelo app.
// - Clientes criam conta pela tela de cadastro.
export const USUARIOS_SEED = [
  { nome: "Dono da Oficina", email: "dono@oficina.com", senha: "oficina123", perfil: "Oficina" },
  { nome: "Cliente Demo", email: "cliente@demo.com", senha: "cliente123", perfil: "Cliente" },
];
