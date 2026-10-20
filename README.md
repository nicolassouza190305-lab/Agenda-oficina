# 🔧 Agenda de Serviços da Oficina

Aplicativo mobile desenvolvido em **React Native + Expo** para a disciplina de **Programação para Dispositivos Móveis em Android**.

**Dupla:** Nicolas Gabriel & Luiz Eduardo
**Entregas:** Checkpoint 2 – Interface funcional (16/10) · Checkpoint 3 – Persistência (23/10)

---

## 📱 Sobre o projeto

O app conecta **clientes** e **oficinas mecânicas**:

- O **cliente** cria sua conta, cadastra seus veículos, consulta os dias e horários disponíveis, **solicita um horário** e acompanha o status do pedido. Também pode pedir uma pré-análise de problemas com um assistente de IA.
- A **oficina** (dono) vê a agenda completa, incluindo os pedidos novos, e é a única que **confirma ou cancela** agendamentos.

O tema visual é *dark-first* com destaque laranja industrial.

## ✅ Funcionalidades (Checkpoint 2)

| Tela | Perfil | Responsável | O que faz |
|------|--------|-------------|-----------|
| **Login / Cadastro** | Todos | Dupla | Entrar (Cliente ou Oficina) com senha verificada no banco; **Cliente** pode criar conta; a conta da Oficina é do dono e não é criada pelo app |
| **Meus Veículos** | Cliente | Nicolas Gabriel | Lista **somente os veículos do cliente logado**; cadastro via modal com validação (modelo, placa e ano) |
| **Horários** | Cliente | Dupla | Escolhe o dia, vê quais horários estão disponíveis ou ocupados (sem dados de outros clientes) e toca em **Solicitar horário** (veículo + serviço). Acompanha o status em *Minhas solicitações* |
| **Agenda** | Oficina | Luiz Eduardo | Agenda por dia, filtros por status, **Confirmar / Recusar / Cancelar** (só a oficina) |
| **Diagnóstico IA** | Todos | Dupla | Chat com Claude Haiku 4.5 que sugere causas prováveis, serviços e urgência |

### Validações básicas implementadas
- **Login:** exibe erro se e-mail ou senha estiverem vazios, se a senha estiver errada ou se o perfil escolhido não for o da conta.
- **Dias de atendimento:** a oficina funciona de **segunda a sexta**; sábado e domingo são fechados (não aparecem na lista de dias e o banco recusa pedidos nesses dias).
- **Solicitar horário:** exige um horário livre, um dos seus veículos e a descrição do serviço (3 a 120 caracteres); não aceita horário passado nem já ocupado.
- **Cadastro de cliente:** nome obrigatório, e-mail válido e único, senha com no mínimo 6 caracteres e confirmação igual.
- **Novo veículo:** exige modelo, placa e ano; placa é convertida para maiúsculas; ano e KM aceitam apenas teclado numérico.
- **Diagnóstico IA:** não envia mensagem vazia; limite de 500 caracteres; tratamento de erro de conexão.

## 💾 Persistência (Checkpoint 3)

Os dados ficam em um banco **SQLite** local (`expo-sqlite`, arquivo `oficina.db`) e continuam no aparelho depois de fechar o app. Código em `frontend/src/database/db.js`.

| Tabela | Campos principais | Usada em |
|--------|-------------------|----------|
| `usuarios` | id, nome, e-mail (UNIQUE), senha_hash + salt, perfil (Cliente/Oficina) | Login e cadastro |
| `sessao` | usuario_id | Mantém o usuário logado ao reabrir o app |
| `veiculos` | id, **usuario_id**, modelo, placa (UNIQUE), ano, km, cor | Meus Veículos |
| `agendamentos` | id, **data**, horário, cliente, veículo, placa, serviço, status, **usuario_id** (quem solicitou) | Agenda e Horários |

- **Senhas** nunca são guardadas em texto: usa-se SHA-256 com salt aleatório (`seguranca.js`).
- **Cada cliente enxerga só os seus veículos** (`WHERE usuario_id = ?`).
- **Permissões aplicadas no banco**, não só na interface:
  - só a **Oficina** lista os agendamentos e altera o status (confirmar/cancelar);
  - o **Cliente** consulta apenas os horários ocupados de um dia (`SELECT horario ...`), sem nome, veículo ou serviço de ninguém, e só vê as **suas próprias** solicitações;
  - só o **Cliente** cadastra veículos.
- **Fluxo de agendamento:** o cliente solicita → entra como *Agendado* (aguardando confirmação) → o dono **confirma ou recusa** na aba Agenda → o cliente vê o resultado em *Minhas solicitações*.
- Um índice único no banco impede **reserva dupla** do mesmo horário; cancelar um agendamento libera o horário.
- Bancos de versões anteriores são atualizados automaticamente (`ALTER TABLE`), sem perder dados.
- No primeiro uso, o banco é criado e populado com dados de exemplo (`src/mocks/data.js`).

### Contas de demonstração

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Oficina (dono) | `dono@oficina.com` | `oficina123` |
| Cliente | `cliente@demo.com` | `cliente123` |

Novos clientes criam conta pela tela de cadastro. Use **Sair** (canto superior direito) para trocar de conta.

## 🖼️ Capturas de tela

| Login | Meus Veículos | Novo Veículo |
|:---:|:---:|:---:|
| ![Login](docs/screenshots/01-login.png) | ![Veículos](docs/screenshots/02-veiculos.png) | ![Novo veículo](docs/screenshots/03-novo-veiculo.png) |

| Agenda do Dia | Diagnóstico IA |
|:---:|:---:|
| ![Agenda](docs/screenshots/04-agenda.png) | ![Diagnóstico IA](docs/screenshots/05-diagnostico.png) |

## 🧰 Tecnologias

- Expo SDK 57 / React Native 0.86
- React Navigation v7 (Native Stack + Bottom Tabs)
- TanStack React Query
- expo-image, expo-linear-gradient, react-native-safe-area-context
- Backend: FastAPI + MongoDB (rota de diagnóstico com IA)
- Persistência local com **SQLite** (`expo-sqlite`); `frontend/src/mocks/data.js` só fornece os dados iniciais

## 🗂️ Estrutura

```
frontend/
├── index.js                  # registerRootComponent(App)
├── App.js                    # providers + navegação
└── src/
    ├── navigation/AppNavigator.js   # Login -> abas por perfil (Cliente / Oficina)
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── VeiculosScreen.js         # Nicolas (cliente)
    │   ├── HorariosScreen.js         # cliente: consulta de horários
    │   ├── AgendaOficinaScreen.js    # Luiz (oficina)
    │   └── DiagnosticoScreen.js
    ├── components/
    │   ├── Header.js
    │   ├── DiaSelector.js
    │   └── CardAgendamento.js        # Luiz
    ├── context/AuthContext.js       # usuário logado (login, cadastro, sair)
    ├── database/
    │   ├── db.js                    # SQLite: tabelas, consultas e permissões
    │   └── seguranca.js             # hash de senha (SHA-256 + salt)
    ├── utils/datas.js               # datas e seletor de dias
    ├── mocks/data.js
    └── theme.ts
backend/
└── server.py                 # API FastAPI (/api/diagnostico)
```

## ▶️ Como executar

```bash
cd frontend
yarn install
npx expo install expo-sqlite   # necessário para a persistência (Checkpoint 3)
npx expo start
```

Abra no **Expo Go** (Android) escaneando o QR Code, ou pressione `a` para o emulador Android.

Para a aba **Diagnóstico IA**, defina `EXPO_PUBLIC_BACKEND_URL` apontando para o backend e rode-o:

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

O backend requer as variáveis `MONGO_URL`, `DB_NAME` e `EMERGENT_LLM_KEY` no arquivo `backend/.env`.

## 👥 Divisão de responsabilidades

- **Nicolas Gabriel:** gerenciamento de veículos (lista, cadastro via modal, persistência).
- **Luiz Eduardo:** manipulação de status da agenda (confirmar, recusar, filtros, timeline).
- **Em conjunto:** login, navegação, tema, componente de cabeçalho e diagnóstico com IA.

## 🔜 Próximos passos

- Cliente poder cancelar/remarcar a própria solicitação e receber notificação da resposta da oficina.
- Sincronizar os dados do SQLite com o backend (hoje o banco é local ao aparelho).
- Cliente poder solicitar agendamento direto pelo app.
