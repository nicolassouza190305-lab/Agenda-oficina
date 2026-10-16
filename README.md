# 🔧 Agenda de Serviços da Oficina

Aplicativo mobile desenvolvido em **React Native + Expo** para a disciplina de **Programação para Dispositivos Móveis em Android**.

**Dupla:** Nicolas Gabriel & Luiz Eduardo
**Entrega:** Checkpoint 2 – Interface funcional (16/10)

---

## 📱 Sobre o projeto

O app conecta **clientes** e **oficinas mecânicas**:

- O **cliente** cadastra e acompanha seus veículos e pode pedir uma pré-análise de problemas com um assistente de IA.
- A **oficina** visualiza a agenda do dia e confirma ou recusa agendamentos.

O tema visual é *dark-first* com destaque laranja industrial.

## ✅ Funcionalidades (Checkpoint 2)

| Tela | Responsável | O que faz |
|------|-------------|-----------|
| **Login / Cadastro** | Dupla | Toggle *Sou Cliente / Sou Oficina*, alternância Entrar/Cadastrar, validação de e-mail e senha obrigatórios |
| **Meus Veículos** | Nicolas Gabriel | Lista de veículos (FlatList), cadastro via modal com validação de campos obrigatórios (modelo, placa e ano) |
| **Agenda do Dia** | Luiz Eduardo | Resumo do dia, filtros por status, timeline de cards, botões Confirmar/Recusar que atualizam o status e os contadores |
| **Diagnóstico IA** | Dupla | Chat com Claude Haiku 4.5 que sugere causas prováveis, serviços e urgência |

### Validações básicas implementadas
- **Login:** exibe erro se e-mail ou senha estiverem vazios.
- **Novo veículo:** exige modelo, placa e ano; placa é convertida para maiúsculas; ano e KM aceitam apenas teclado numérico.
- **Diagnóstico IA:** não envia mensagem vazia; limite de 500 caracteres; tratamento de erro de conexão.

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
- Dados de veículos e agenda em **mocks locais** (`frontend/src/mocks/data.js`)

## 🗂️ Estrutura

```
frontend/
├── index.js                  # registerRootComponent(App)
├── App.js                    # providers + navegação
└── src/
    ├── navigation/AppNavigator.js   # Stack (Login -> Tabs) + Bottom Tabs
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── VeiculosScreen.js         # Nicolas
    │   ├── AgendaOficinaScreen.js    # Luiz
    │   └── DiagnosticoScreen.js
    ├── components/
    │   ├── Header.js
    │   └── CardAgendamento.js        # Luiz
    ├── mocks/data.js
    └── theme.ts
backend/
└── server.py                 # API FastAPI (/api/diagnostico)
```

## ▶️ Como executar

```bash
cd frontend
yarn install
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

- **Nicolas Gabriel:** gerenciamento de veículos (lista, cadastro via modal, estado local).
- **Luiz Eduardo:** manipulação de status da agenda (confirmar, recusar, filtros, timeline).
- **Em conjunto:** login, navegação, tema, componente de cabeçalho e diagnóstico com IA.

## 🔜 Próximos passos

- Autenticação real e persistência de veículos/agendamentos no backend.
- Cliente poder solicitar agendamento direto pelo app.
