# Agenda de Serviços da Oficina

## Visão Geral
Aplicativo mobile em React Native + Expo para a **Avaliação Presencial 1** da disciplina de Programação para Dispositivos Móveis em Android. Desenvolvido em dupla por **Nicolas Gabriel** e **Luiz Eduardo**.

## Tecnologias
- Expo SDK 57 / **React Navigation v7** (Native Stack + Bottom Tabs)
- React Native 0.86
- Navegação Stack (raiz: Login -> Tabs) + Tab Navigator
- Entrada: `index.js` -> `App.js` -> `src/navigation/AppNavigator.js`
- Dados em MOCKs locais (arrays em `src/mocks/data.js`)
- Tema dark "automotivo" (laranja industrial sobre fundos escuros)

## Telas
1. **Login / Cadastro** (`/login`) — Dupla
   - Hero com imagem de oficina, campos Email/Senha
   - Toggle Cliente / Oficina (segmented control)
   - Alternar modo Entrar / Cadastrar
2. **Meus Veículos** (`/(tabs)/veiculos`) — Nicolas Gabriel
   - FlatList de veículos (modelo, placa, ano, KM, cor)
   - FAB + modal com formulário para adicionar novo veículo
3. **Agenda do Dia** (`/(tabs)/agenda`) — Luiz Eduardo
   - Resumo (total, pendentes, em curso, confirmados)
   - Filtros por status (chips horizontais)
   - Timeline com cards de agendamento
   - Badges coloridas (Agendado, Confirmado, Em Andamento, Recusado)
   - Botões Confirmar / Recusar para pendentes
4. **Diagnóstico IA** (`/(tabs)/diagnostico`) — Dupla
   - Chat com Claude Haiku 4.5 via Emergent Universal Key
   - Cliente descreve problema → IA retorna causas prováveis + serviços da oficina + urgência (🟢🟡🔴)
   - Sugestões rápidas de perguntas, histórico persistido em MongoDB

## Estrutura de Arquivos
```
frontend/
├── index.js                     # registerRootComponent(App)
├── App.js                       # providers + AppNavigator (ponto de entrada real)
└── src/
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── VeiculosScreen.js    # Nicolas
    │   └── AgendaOficinaScreen.js # Luiz
    ├── components/
    │   ├── Header.js
    │   └── CardAgendamento.js
    ├── mocks/
    │   └── data.js              # VEICULOS_MOCK + AGENDAMENTOS_MOCK
    ├── navigation/
    │   └── AppNavigator.js      # Stack (Login -> Tabs) + Bottom Tabs
    └── theme.ts                 # tokens de cor/spacing/radius
```

## Responsabilidades da Dupla
- **Nicolas Gabriel**: Gerenciamento de veículos (lista, cadastro via modal, estado local)
- **Luiz Eduardo**: Manipulação de status da agenda (confirmar, recusar, filtros, timeline)
