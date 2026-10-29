# Roteiro da Avaliação Presencial 2 — CRUD / Persistência (30/10)

Entidade do CRUD: **Veículo** (tela *Meus Veículos*, perfil Cliente). Cada operação tem uma função no banco
(`frontend/src/database/db.js`) e um trecho na tela (`frontend/src/screens/VeiculosScreen.js`).
Conta de teste: cadastre um cliente novo (ex.: oficina `Oficina GS`) ou use `cliente@demo.com` / `cliente123`.

## Divisão sugerida (cada um executa e explica a sua)

| Operação | Quem | Na tela | No banco (função / SQL) |
|---|---|---|---|
| **C**reate — cadastrar | Nicolas | `+ Adicionar` → modal → *Salvar Veículo* (`adicionar`, ramo `else`) | `inserirVeiculo` → `INSERT INTO veiculos ...` |
| **R**ead — consultar | Luiz | lista ao abrir a tela (`useEffect` → `listarVeiculos`) | `listarVeiculos` → `SELECT ... WHERE usuario_id = ?` |
| **U**pdate — editar | Luiz | botão *Editar* → mesmo modal preenchido (`abrirEdicao`, `adicionar` ramo `if (editandoId)`) | `atualizarVeiculo` → `UPDATE veiculos SET ... WHERE id = ? AND usuario_id = ?` |
| **D**elete — excluir | Nicolas | botão *Excluir* → confirmação (`confirmarExclusao`) | `excluirVeiculo` → `DELETE FROM veiculos WHERE id = ? AND usuario_id = ?` |

(Se o professor pedir outra distribuição, o fluxo de explicação é o mesmo: **tela → função do banco → SQL → o que volta para a tela**.)

## Como explicar cada operação (30 segundos cada)

- **Create:** o modal valida campos obrigatórios; `validarVeiculo` limpa os dados (placa em maiúsculas, ano válido, km ≥ 0);
  o `INSERT` grava com o `usuario_id` do cliente logado; placa repetida cai no `UNIQUE` e vira a mensagem "Já existe um veículo com essa placa."; a tela põe o novo item no topo da lista.
- **Read:** `listarVeiculos` só traz os veículos do cliente logado (`WHERE usuario_id = ?`) e a `FlatList` desenha os cards. Outro cliente nunca vê esses veículos.
- **Update:** o modal abre com os dados atuais; ao salvar, `atualizarVeiculo` confere que o veículo é do usuário, valida, faz o `UPDATE` e, na mesma **transação**, atualiza modelo/placa dos agendamentos futuros ativos desse veículo, para não ficarem desatualizados.
- **Delete:** pede confirmação; `excluirVeiculo` confere o dono e **bloqueia** se houver agendamento futuro não cancelado ("Cancele o agendamento antes de excluí-lo"); senão faz o `DELETE`.

Regra comum às quatro: a permissão é checada **no banco** (`exigirUsuario` + `usuario_id` no `WHERE`), não só na tela.

## "Pequena alteração" que o professor pode pedir — onde mexer

| Pedido | Onde mexer |
|---|---|
| Novo campo (ex.: *observação*, *combustível*) | 1) `CREATE TABLE veiculos` + `garantirColuna(db, "veiculos", "obs", "TEXT")` em `db.js`; 2) `validarVeiculo`; 3) `inserirVeiculo`/`atualizarVeiculo` (colunas do INSERT/UPDATE); 4) `SELECT` do `listarVeiculos`; 5) estado + `TextInput` + card em `VeiculosScreen.js` |
| Mudar uma regra de validação (ano mínimo, km máximo, placa com 7 caracteres) | `validarVeiculo` em `db.js` |
| Limitar a N veículos por cliente | `inserirVeiculo`: `SELECT COUNT(*) FROM veiculos WHERE usuario_id = ?` e `erroApp(...)` se passar |
| Ordenar por modelo / ano | `ORDER BY` em `listarVeiculos` |
| Buscar/filtrar por placa | `WHERE ... AND placa LIKE ?` em `listarVeiculos` + `TextInput` de busca na tela |
| Permitir excluir mesmo com agendamento | remover o bloqueio em `excluirVeiculo` (ou cancelar os agendamentos antes do `DELETE`) |
| Trocar mensagem / texto de botão | string em `db.js` (`erroApp`) ou em `VeiculosScreen.js` |

## Rodar e testar antes da prova

```
cd frontend
npm install
npx expo start -c
```
Teste manual: cadastrar → ver na lista → editar km → excluir → tentar excluir um veículo com agendamento ativo (deve recusar) → cancelar o agendamento pela conta da oficina → excluir de novo (deve permitir).
