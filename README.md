# Agenda Oficina

Aplicativo em React Native (Expo) para agendar serviços em uma oficina mecânica.
Projeto final em dupla. Esta versão é a base da **Avaliação presencial 1 (09/10)**: estrutura inicial, 3 telas navegáveis e componentes React Native, com dados de exemplo (ainda sem API nem persistência local).

## Telas

| Aba | Tela | O que faz |
| --- | --- | --- |
| Agendamentos | Meus agendamentos | Lista os agendamentos com status e permite cancelar |
| Serviços | Catálogo de serviços | Lista serviços com duração e preço estimado; o botão "Agendar" leva ao formulário já com o serviço escolhido |
| Agendar | Novo agendamento | Escolha de serviço, veículo, data e horário, e confirmação |

## Estrutura

```
App.js                          ponto de entrada (providers + navegação)
src/
  navigation/AppNavigator.js    abas inferiores (React Navigation)
  context/AgendamentosContext.js estado compartilhado dos agendamentos
  screens/                      as 3 telas
  components/                   Chip, StatusBadge, CardServico, CardAgendamento
  data/                         serviços, horários e veículos de exemplo
  utils/datas.js                gera os próximos dias úteis
  theme.js                      cores
```

## Como rodar

Com Node.js instalado:

```bash
# 1. Criar o projeto Expo (em uma pasta temporária)
npx create-expo-app@latest Agenda-oficina --template blank

# 2. Entrar na pasta e instalar a navegação
cd Agenda-oficina
npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# 3. Substituir o App.js e copiar a pasta src/ deste projeto para dentro dela

# 4. Rodar
npx expo start
```

Abra no celular com o app **Expo Go** (leia o QR code) ou em um emulador.

## Subir no GitHub

Dentro da pasta do projeto:

```bash
git init
git remote add origin https://github.com/nicolassouza190305-lab/Agenda-oficina.git
git add .
git commit -m "Estrutura inicial do app com 3 telas"
git branch -M main
git push -u origin main
```

Se o repositório já tiver commits (um README criado pelo GitHub, por exemplo), use `git pull origin main --allow-unrelated-histories` antes do `push`.

## Próximos passos

- Persistência local dos veículos e agendamentos (AsyncStorage ou SQLite)
- API em Python (Django) para horários e agendamentos
- Tela de agenda do dia para a oficina
- Notificações de lembrete
