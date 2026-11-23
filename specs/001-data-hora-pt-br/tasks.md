---

description: "Task list template for feature implementation"
---

# Tasks: Data/hora do servidor em formato pt-BR e destacada em vermelho

**Input**: Documentos de design em `/specs/001-data-hora-pt-br/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/pagina-inicial.md`, `quickstart.md`)

**Prerequisites**: `plan.md` (Constitution Check aprovado, sem violações), `spec.md` (US1/US2/US3 com prioridades)

**Tests**: a constituição (Princípio II, NÃO NEGOCIÁVEL) exige teste automatizado para toda mudança de comportamento observável. Esta lista inclui, portanto, as tarefas de teste de responsabilidade do Desenvolvedor em `test/unidade/`. Os testes de aceite HTTP em `test/aceite/` são responsabilidade do QA (etapa E6) e **não** aparecem aqui como tarefa de implementação.

**Organization**: tarefas agrupadas por história de usuário (US1 P1, US2 P2, US3 P3), precedidas por Setup e Foundational.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode ser executada em paralelo com outra tarefa do mesmo bloco (arquivos diferentes, sem dependência pendente entre elas)
- **[Story]**: história de usuário a que a tarefa pertence (US1, US2, US3)
- Toda descrição cita o caminho exato do arquivo afetado

## Path Conventions

Projeto único, sem `src/`: `app.js` e `views/index.ejs` na raiz, conforme `plan.md` (Project Structure). Único diretório novo: `test/`, com `test/unidade/` (Desenvolvedor, E4) e `test/aceite/` (QA, E6).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: colocar o portão de testes do Princípio II em condição de funcionar e sanear as dependências antes de qualquer alteração de código de produção.

- [X] T001 Ajustar `package.json`: remover as dependências `moment` e `os` (D8 — `moment` fica órfã após a troca para `Intl`; `os` é pacote npm redundante, duplicata do módulo nativo, MUST explícito do Princípio I), adicionar `supertest@^7` em `devDependencies` (D7 — justificativa (a)/(b) em `research.md`) e trocar o script `test` para `"node --test"`, sem argumento posicional (D6 — `node --test test/` falha no Node 22+). Executar via `npm uninstall moment os`, `npm install --save-dev supertest@^7` e `npm pkg set scripts.test="node --test"` (ou edição manual equivalente seguida de `npm install`), de modo que `package-lock.json` seja regravado no mesmo commit que `package.json` (Restrições Técnicas da constituição). Nenhuma alteração de código é necessária em `app.js` por esta tarefa: `require('os')` continua resolvendo para o módulo nativo (D8). Arquivos: `package.json`, `package-lock.json`.

**Checkpoint**: `npm test` já é um comando executável (sai com `0`, ainda sem nenhum arquivo de teste). Pronto para a Fase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: preparar `app.js` para ser consumido por `supertest` sem servidor em execução e criar a função pura de formatação que todas as histórias (US1 diretamente, US2 e US3 indiretamente, via testes) dependem. Todas as tarefas desta fase alteram `app.js` e por isso são sequenciais entre si (mesmo arquivo).

**⚠️ CRITICAL**: nenhuma tarefa de história de usuário pode começar antes desta fase estar completa.

- [X] T002 Em `app.js`, remover `const moment = require('moment');` e criar, no escopo do módulo (fora do handler, construído uma única vez), a constante `formatadorDataHora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hourCycle: 'h23', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })` (research.md D1/D2/D3 — se o ambiente não resolver o fuso, o construtor lança `RangeError` e o processo não sobe; não escrever `try/catch`, conforme D3). Cobre `data-model.md`, entidade **Data/hora do servidor**, atributo `fusoDeReferencia` (fixo no código, nunca lido do host).
- [X] T003 Em `app.js`, imediatamente após T002, criar a função pura `formatarDataHora(instante)` que usa `formatadorDataHora.formatToParts(instante)` para montar a cadeia `dd/mm/aaaa hh:mm:ss` (dia, mês, ano, espaço `U+0020`, hora, minuto, segundo — sem usar a saída pronta do locale, que insere vírgula; research.md D1). A função não lê o relógio nem `process.env.TZ`: recebe o instante por parâmetro e devolve sempre a mesma saída para a mesma entrada (`FR-011`). Implementa `data-model.md`, entidade **Data/hora do servidor**, atributo `horaAtual` (string de 19 caracteres) e os invariantes V1 (19 caracteres), V2/V3 (ordem e expressão `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$`), V4 (separador de espaço único, sem vírgula), V5 (zeros à esquerda) e V6 (hora `00`–`23`, sem AM/PM). Depende de T002 (mesmo arquivo, usa `formatadorDataHora`).
- [X] T004 Em `app.js`, trocar `const port = 3000;` por leitura de `process.env.PORT` com padrão `3000` (ex.: `const port = process.env.PORT || 3000;`) e condicionar a chamada existente de `app.listen(...)` a `if (require.main === module) { ... }` (research.md D5, D9; Restrições Técnicas da constituição — porta configurável por variável de ambiente). Depende de T003 (mesmo arquivo).
- [X] T005 Em `app.js`, ao final do arquivo, adicionar `module.exports = { app, formatarDataHora };` substituindo a ausência de exportação atual (research.md D5; `contracts/pagina-inicial.md` §4 — `app` consumível por `supertest(app)` sem porta aberta; `formatarDataHora` exposta como `(instante: Date) => string`). Depende de T004 (mesmo arquivo, é a última edição estrutural antes das histórias).

**Checkpoint**: `app.js` exporta `{ app, formatarDataHora }`, o servidor só sobe fora dos testes, a porta é configurável e a função de formatação existe e é testável isoladamente. A rota `GET /` ainda usa `moment` (troca é tarefa de US1). `npm test` continua saindo com `0`.

---

## Phase 3: User Story 1 - Ler a data/hora do servidor no padrão brasileiro (Priority: P1) 🎯 MVP

**Goal**: a rota `GET /` passa a exibir o instante da requisição formatado em `dd/mm/aaaa hh:mm:ss`, sempre no fuso `America/Sao_Paulo`, independentemente do fuso do host.

**Independent Test**: acessar a página com o host configurado em pelo menos dois fusos (ex.: UTC e `America/Sao_Paulo`) e confirmar que o valor exibido corresponde ao horário de São Paulo no instante da requisição, na máscara `dd/mm/aaaa hh:mm:ss` com 19 caracteres.

### Implementation for User Story 1

- [X] T006 [P] [US1] Em `app.js`, no handler de `GET /`, substituir `const horaAtual = moment().format('YYYY-MM-DD HH:mm:ss');` por `const horaAtual = formatarDataHora(new Date());` (`FR-001` — instante da requisição via `new Date()` a cada chamada, sem cache; `FR-002` — fuso explícito, herdado de T002/T003; `FR-003`/`FR-004` — máscara e zeros à esquerda, herdados de T003; `FR-007` — novo valor por carregamento). Implementa `data-model.md`, entidade **Data/hora do servidor**, atributo `instante` (`new Date()` no handler, não exposto ao template). Depende de T005 (Foundational concluída).
- [X] T007 [P] [US1] Criar `test/unidade/data-hora.test.js` com casos de `node:test` para `formatarDataHora`, usando os pares de referência do contrato (`contracts/pagina-inicial.md` §4): `2026-07-03T12:05:07Z` → `03/07/2026 09:05:07`; `2026-11-24T03:30:04Z` → `24/11/2026 00:30:04` (sem AM/PM); `2026-11-24T03:00:00Z` → `24/11/2026 00:00:00` (virada de meia-noite); `2027-01-01T02:00:00Z` → `31/12/2026 23:00:00` (virada de ano/mês); `2026-01-05T15:07:09Z` → `05/01/2026 12:07:09` (zeros à esquerda). Cada caso assere a cadeia exata e o comprimento de 19 caracteres (`FR-002`, `FR-003`, `FR-004`; `data-model.md` V1, V3, V5, V6). Adicionar, no mesmo arquivo, um teste que fixa um instante e troca `process.env.TZ` sucessivamente entre `UTC`, `Asia/Tokyo`, `America/Sao_Paulo` e `America/Los_Angeles`, confirmando que `formatarDataHora` devolve sempre a mesma saída (restaurando `process.env.TZ` ao valor original ao final) — prova de independência do fuso do host (`FR-011`, `SC-002`, `SC-006`; `data-model.md` V8; research.md D10). Depende de T003 (precisa de `formatarDataHora` exportada por T005); pode ser feita em paralelo com T006 porque consome `formatarDataHora` diretamente, sem depender da ligação da rota.

**Checkpoint**: `npm test` cobre a formatação e sua invariância de fuso; a página já exibe a data/hora correta em pt-BR e em `America/Sao_Paulo`. US1 é entregável e testável de forma independente (MVP).

---

## Phase 4: User Story 2 - Localizar a data/hora de imediato pelo destaque em vermelho (Priority: P2)

**Goal**: somente o valor da data/hora aparece em vermelho escuro (`#8b0000`); o rótulo que o antecede permanece na cor padrão da página.

**Independent Test**: abrir a página e confirmar visualmente/por inspeção do HTML que apenas o valor está dentro de um elemento colorido e que o rótulo está fora dele.

### Implementation for User Story 2

- [X] T008 [US2] Em `views/index.ejs`, envolver apenas `<%= horaAtual %>` em `<span style="color: #8b0000">...</span>`, mantendo o texto `Hora Atual do Servidor:` fora do `<span>` (`FR-005`; `contracts/pagina-inicial.md` §2.1 H7/H8 e §2.3 — fragmento de referência; research.md D4 — `#8b0000` sobre `#ffffff` mede 10,01:1, acima do mínimo de 4,5:1 de `SC-007`). Não alterar nenhuma outra linha do template (preserva `FR-009`). Depende da Foundational concluída (T005); não depende de T006/T007 porque o template já referencia a variável `horaAtual` existente, apenas inalterada em nome.

**Checkpoint**: a página destaca somente o valor da data/hora, sem afetar o rótulo nem o restante do conteúdo. US1 e US2 funcionam juntos e permanecem testáveis de forma independente.

---

## Phase 5: User Story 3 - Entender que o valor é um retrato do instante da requisição (Priority: P3)

**Goal**: confirmar, no nível de unidade, que `formatarDataHora` não tem estado interno nem cache — o valor exibido é sempre o retrato do instante recebido, nunca um valor memorizado ou atualizado sozinho.

**Independent Test**: com a página aberta, aguardar sem recarregar e confirmar que o valor não muda; recarregar e confirmar que aparece a data/hora do novo instante. (A verificação ponta a ponta desse comportamento via HTTP, incluindo a ausência de `<script>`/`setInterval`/`fetch`/`meta refresh`, é responsabilidade do QA em `test/aceite/`, conforme `research.md` D11 e `plan.md`.)

### Implementation for User Story 3

- [X] T009 [US3] Em `test/unidade/data-hora.test.js`, adicionar um teste que chama `formatarDataHora` duas vezes com o **mesmo** instante e confere que a saída é idêntica nas duas chamadas (sem cache fazendo a saída variar), e outro que chama com **dois instantes diferentes** e confere que as saídas diferem — comprovando que a função não memoriza nem lê relógio interno, apenas o parâmetro recebido (`contracts/pagina-inicial.md` §4 — "não lê o relógio, não tem efeito colateral"). Sustenta `FR-006` (valor não se move por conta própria) e `FR-007`/`SC-005` (novo valor por chamada, logo por requisição, já que T006 chama `formatarDataHora(new Date())` a cada `GET /`; `data-model.md`, seção *Ciclo de vida* — "sem cache: duas requisições próximas podem produzir valores iguais ou diferentes, e ambos são válidos"). Depende de T007 (mesmo arquivo `test/unidade/data-hora.test.js`, sequencial).

**Checkpoint**: todas as três histórias de usuário estão implementadas e cobertas por teste unitário onde aplicável. `npm test` sai com `0`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: validação cruzada exigida pelos critérios de sucesso que atravessam as três histórias, antes de entregar ao QA (E6).

- [X] T010 Executar `npm test` três vezes consecutivas e, em seguida, uma vez sob cada um de `TZ=UTC`, `TZ=America/Sao_Paulo` e `TZ=Asia/Tokyo`, confirmando código de saída `0` em todas as execuções (`SC-002`, `SC-006`; `quickstart.md` Validação 1). Não altera nenhum arquivo de produto; é a confirmação de que o script `test` ajustado em T001 e os testes de T007/T009 são determinísticos e independentes do fuso do host. Depende de T001–T009 (todas as fases anteriores concluídas).

**Checkpoint final**: `npm test` verde em três execuções e três fusos de host; feature pronta para a etapa de QA (E5/E6, `test/aceite/` e demais validações do `quickstart.md`).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente.
- **Foundational (Phase 2)**: depende da conclusão de Setup — bloqueia todas as histórias (T002→T003→T004→T005, sequenciais, mesmo arquivo `app.js`).
- **User Story 1 (Phase 3)**: depende da Foundational. T006 e T007 podem ser feitas em paralelo entre si.
- **User Story 2 (Phase 4)**: depende da Foundational. Não depende de US1 (arquivo `views/index.ejs`, distinto de `app.js` e do teste); pode ser feita em paralelo com a Phase 3 se houver duas pessoas disponíveis.
- **User Story 3 (Phase 5)**: depende da Foundational (uso de `formatarDataHora`) e de T007 (mesmo arquivo de teste, sequencial). Não depende de US2.
- **Polish (Phase 6)**: depende de todas as fases anteriores.

### Dentro de cada fase

- Foundational: T002 → T003 → T004 → T005 (mesmo arquivo, sem paralelismo).
- US1: T006 e T007 em paralelo (arquivos diferentes, sem dependência mútua).
- US2: T008, tarefa única.
- US3: T009 depende de T007 (mesmo arquivo de teste).
- Polish: T010 depende de tudo.

### Parallel Opportunities

- T006 `[US1]` e T007 `[US1]` — arquivos `app.js` e `test/unidade/data-hora.test.js`, sem dependência entre si.
- A Phase 4 (US2, `views/index.ejs`) pode ser conduzida em paralelo com a Phase 3 (US1) por uma segunda pessoa, já que não compartilham arquivo e US2 não depende da ligação da rota feita em T006.
- T002–T005 (Foundational) e T009 (US3) **não** são paralelizáveis com tarefas que tocam o mesmo arquivo (`app.js` e `test/unidade/data-hora.test.js`, respectivamente).

---

## Parallel Example: User Story 1

```bash
# T006 e T007 podem ser disparadas juntas:
Task: "Em app.js, trocar moment().format(...) por formatarDataHora(new Date()) no handler de GET /"
Task: "Criar test/unidade/data-hora.test.js com os 5 pares de referência e o teste de invariância de TZ"
```

---

## Implementation Strategy

### MVP First (User Story 1 somente)

1. Completar Phase 1 (Setup).
2. Completar Phase 2 (Foundational) — bloqueia todas as histórias.
3. Completar Phase 3 (US1) — T006 e T007.
4. **PARAR e VALIDAR**: `npm test` verde; `node app.js` exibe a máscara correta em `America/Sao_Paulo` mesmo com `TZ=UTC`.
5. Este é o MVP: corrige o problema real de formato e fuso (Princípio III), mesmo sem o destaque em vermelho.

### Entrega incremental

1. Setup + Foundational → base pronta.
2. US1 → testar isoladamente → MVP entregável.
3. US2 → testar isoladamente (destaque visual, sem alterar comportamento de dados) → incremento cosmético.
4. US3 → teste unitário de ausência de cache/estado → fixa o comportamento esperado, sem função nova.
5. Polish → três execuções e três fusos de host → pronto para QA (E5/E6).

---

## Notes

- `[P]` = arquivos diferentes, sem dependência pendente entre as tarefas marcadas.
- `[Story]` mapeia a tarefa à história de usuário correspondente para rastreabilidade.
- Tarefas de teste de aceite HTTP (`test/aceite/pagina-inicial.test.js`) são do QA (E6) e não aparecem nesta lista.
- Fora do escopo desta lista (dívida registrada na constituição e em `research.md` D9): renomear `getIpAddress` para `obterEnderecoIp`. Nenhuma tarefa a cria.
- Evitar: tarefas vagas, conflito de edição no mesmo arquivo sem ordem definida, dependências entre histórias que quebrem a independência de teste.
