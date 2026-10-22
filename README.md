# 🔧 Agenda de Serviços da Oficina

Aplicativo mobile desenvolvido em **React Native + Expo** para a disciplina de **Programação para Dispositivos Móveis em Android**.

**Dupla:** Nicolas Gabriel & Luiz Eduardo
**Entregas:** Checkpoint 2 – Interface funcional (16/10) · Checkpoint 3 – Persistência (23/10)

---

## 📱 Sobre o projeto

O app conecta **clientes** e **oficinas mecânicas**:

- Cada **oficina** tem o seu cadastro, a sua agenda e os **seus clientes, com exclusividade**: o cliente pertence a uma única oficina e só agenda nela (ex.: o cliente *Nicolas* é da *Oficina GS* e só agenda na GS).
- O **cliente** cria sua conta escolhendo a sua oficina, cadastra seus veículos, consulta os dias e horários disponíveis **da sua oficina**, **solicita um horário** e acompanha o status do pedido. Também pode pedir uma pré-análise de problemas com um assistente de IA.
- A **oficina** (dono) vê só a agenda dos seus clientes e é a única que **confirma ou cancela** esses agendamentos.

O tema visual é *dark-first* com destaque laranja industrial.

## ✅ Funcionalidades (Checkpoint 2)

| Tela | Perfil | Responsável | O que faz |
|------|--------|-------------|-----------|
| **Login / Cadastro** | Todos | Dupla | Entrar (Cliente ou Oficina) com senha verificada no banco. **Cliente** cria conta e **escolhe a sua oficina**; **Oficina** cadastra a própria oficina e a conta do dono |
| **Meus Veículos** | Cliente | Nicolas Gabriel | Lista **somente os veículos do cliente logado**; cadastro via modal com validação (modelo, placa e ano) |
| **Horários** | Cliente | Dupla | Escolhe o dia, vê quais horários da **sua oficina** estão disponíveis ou ocupados (sem dados de outros clientes) e toca em **Solicitar horário** (veículo + serviço). Acompanha o status em *Minhas solicitações* |
| **Agenda** | Oficina | Luiz Eduardo | Agenda por dia **só dos clientes da própria oficina**, filtros por status, **Confirmar / Recusar / Cancelar** (só o dono daquela oficina) |
| **Diagnóstico IA** | Todos | Dupla | Chat com Claude Haiku 4.5 que sugere causas prováveis, serviços e urgência |

### Validações básicas implementadas
- **Login:** exibe erro se e-mail ou senha estiverem vazios, se a senha estiver errada ou se o perfil escolhido não for o da conta.
- **Dias de atendimento:** a oficina funciona de **segunda a sexta**; sábado e domingo são fechados (não aparecem na lista de dias e o banco recusa pedidos nesses dias).
- **Solicitar horário:** exige um horário livre, um dos seus veículos e a descrição do serviço (3 a 120 caracteres); não aceita horário passado nem já ocupado.
- **Cadastro de cliente:** nome obrigatório, **oficina escolhida**, e-mail válido e único, senha com no mínimo 6 caracteres e confirmação igual.
- **Cadastro de oficina:** nome da oficina único (sem diferenciar maiúsculas/minúsculas, mínimo 3 letras), nome do responsável, e-mail único e senha com no mínimo 6 caracteres.
- **Novo veículo:** exige modelo, placa e ano; placa é convertida para maiúsculas; ano e KM aceitam apenas teclado numérico.
- **Diagnóstico IA:** não envia mensagem vazia; limite de 500 caracteres; tratamento de erro de conexão.

## 💾 Persistência (Checkpoint 3)

Os dados ficam em um banco **SQLite** local (`expo-sqlite`, arquivo `oficina.db`) e continuam no aparelho depois de fechar o app. Código em `frontend/src/database/db.js`.

| Tabela | Campos principais | Usada em |
|--------|-------------------|----------|
| `oficinas` | id, nome (UNIQUE) | Cadastro de oficinas e escolha da oficina pelo cliente |
| `usuarios` | id, nome, e-mail (UNIQUE), senha_hash + salt, perfil (Cliente/Oficina), **oficina_id** | Login e cadastro. Todo usuário pertence a **uma** oficina |
| `sessao` | usuario_id | Mantém o usuário logado ao reabrir o app |
| `veiculos` | id, **usuario_id**, modelo, placa (UNIQUE), ano, km, cor | Meus Veículos |
| `agendamentos` | id, **data**, horário, cliente, veículo, placa, serviço, status, **usuario_id** (quem solicitou), **oficina_id** | Agenda e Horários |

- **Senhas** nunca são guardadas em texto: usa-se SHA-256 com salt aleatório (`seguranca.js`).
- **Cada cliente enxerga só os seus veículos** (`WHERE usuario_id = ?`).
- **Exclusividade por oficina:** o cliente fica ligado à oficina escolhida no cadastro e **só agenda nela** (a oficina do pedido vem da conta dele, não de dados enviados pelo app). Cada oficina tem a sua agenda: o mesmo dia e horário pode estar livre em uma oficina e ocupado em outra.
- **Permissões aplicadas no banco**, não só na interface:
  - só a **Oficina** lista os agendamentos e altera o status (confirmar/cancelar), e **apenas os da própria oficina**: uma oficina não vê nem altera a agenda de outra;
  - o **Cliente** consulta apenas os horários ocupados de um dia **da sua oficina** (`SELECT horario ...`), sem nome, veículo ou serviço de ninguém, e só vê as **suas próprias** solicitações;
  - só o **Cliente** cadastra veículos.
- **Fluxo de agendamento:** o cliente solicita → entra como *Agendado* (aguardando confirmação) → o dono **confirma ou recusa** na aba Agenda → o cliente vê o resultado em *Minhas solicitações*.
- Um índice único no banco impede **reserva dupla** do mesmo horário **dentro da mesma oficina**; cancelar um agendamento libera o horário.
- Bancos de versões anteriores são atualizados automaticamente (`ALTER TABLE`), sem perder dados: contas, veículos e agenda já existentes passam a pertencer à **Oficina GS**.
- No primeiro uso, o banco é criado com **duas oficinas de exemplo** (cada uma com seu dono, seu cliente, veículos e agenda), em `src/mocks/data.js`.

### Contas de demonstração

| Oficina | Perfil | E-mail | Senha |
|---------|--------|--------|-------|
| **Oficina GS** | Dono | `dono@oficina.com` | `oficina123` |
| **Oficina GS** | Cliente (Nicolas) | `cliente@demo.com` | `cliente123` |
| **Mecânica Premium** | Dono | `dono@premium.com` | `premium123` |
| **Mecânica Premium** | Cliente (Rodrigo) | `cliente@premium.com` | `cliente123` |

Para ver a exclusividade: entre como **Nicolas** (só enxerga e agenda na Oficina GS) e depois como **Rodrigo** (só na Mecânica Premium). O nome da oficina aparece no topo de todas as telas.

Novos clientes criam conta escolhendo a oficina; novas oficinas se cadastram em *Sou Oficina → Cadastrar oficina*. Use **Sair** (canto superior direito) para trocar de conta.

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

- Convite/código da oficina para o cliente se vincular (hoje ele escolhe a oficina numa lista).
- Cliente poder cancelar/remarcar a própria solicitação e receber notificação da resposta da oficina.
- Sincronizar os dados do SQLite com o backend (hoje o banco é local ao aparelho).
- Cliente poder solicitar agendamento direto pelo app.
