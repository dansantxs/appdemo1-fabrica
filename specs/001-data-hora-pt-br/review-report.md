# Relatório de Revisão de Código — E5

**Feature**: `001-data-hora-pt-br` | **Branch**: `001-data-hora-pt-br` | **Base**: `main`

**Intervalo revisado**: `main...HEAD` (primeira revisão desta feature)

**Commits no intervalo**: `473bcea`, `efab5bf`, `208bcbd`, `baad5c4`, `7b90d32` (etapa E4),
mais os commits de artefatos das etapas E1–E3

**Data**: 2026-11-23 | **Revisor**: Revisor de Código (Fábrica de Software)

**Critério normativo**: `.specify/memory/constitution.md` v1.0.0, `spec.md` (`FR-001`…`FR-011`,
`SC-001`…`SC-009`), `plan.md`, `research.md` (D1–D14), `data-model.md` (V1–V9),
`contracts/pagina-inicial.md`

**PARECER: aprovado com ressalvas** — nenhum achado bloqueante. Seis ressalvas não
bloqueantes, todas registradas abaixo para a descrição do PR.

---

## 1. Escopo revisado

Arquivos de código no diff:

| Arquivo | Alteração | Veredito |
|---|---|---|
| `app.js` | +39 / −6 | Conforme |
| `views/index.ejs` | 1 linha | Conforme |
| `test/unidade/data-hora.test.js` | novo, 80 linhas, 8 testes | Conforme com ressalva (R2) |
| `package.json` | +4 / −3 | Conforme |
| `package-lock.json` | regravado | Conforme |

Os demais arquivos do diff são artefatos do Spec Kit em `specs/001-data-hora-pt-br/` e não
foram revisados como código. Nenhum arquivo fora do previsto em `plan.md` → *Project
Structure* foi tocado; nenhum diretório novo de produção foi criado. Nenhum arquivo foi
alterado por esta revisão além deste relatório.

## 2. Execução dos comandos de verificação

| Comando | Resultado medido pelo revisor |
|---|---|
| `npm test` (→ `node --test`) | **8 testes, 8 aprovados, 0 falhas, 1 suíte; código de saída `0`** |
| lint | não existe no projeto (`null`) |
| build / typecheck | não existe no projeto (`null`) |

Ambiente: Node v24.20.0. Saída idêntica à medida pelo orquestrador antes do acionamento.
`npm ls --depth=0` mostra exatamente `ejs@3.1.9`, `express@4.18.2` e `supertest@7.3.2 (dev)`
— sem `moment`, sem o pacote npm `os`, sem pacote extraneous.

## 3. Conformidade com a constituição v1.0.0 — portão por portão

| Portão | Veredito | Evidência |
|---|---|---|
| **I. Mudança mínima** | Aprovado | Alteração confinada a `app.js`, `views/index.ejs` e aos dois arquivos de pacote. `views/index.ejs:11` é a única linha tocada do template. Nenhum diretório, camada, módulo ou arquivo de configuração novo no código de produção; o único diretório criado é `test/unidade/`. `getIpAddress` e a linha de IP permanecem intocados (`FR-009`, D9) — fora do escopo por decisão ratificada, não avaliado como achado. |
| **I. Sem abstração antecipada** | Aprovado | Uma função (`formatarDataHora`) e uma constante de módulo (`formatadorDataHora`). Nenhuma camada, interface, fábrica ou parametrização especulativa: o fuso e a máscara são literais no código, não configuração. |
| **I. Política de dependências** | Aprovado | Saldo: **+1 devDependency** (`supertest@^7`, justificativa (a)/(b) escrita em `research.md` D7 e nominalmente exigida pelas Restrições Técnicas) e **−2 dependências de runtime** (`moment`, órfã após a troca para `Intl`; pacote npm `os`, duplicata de módulo nativo cuja remoção é MUST do Princípio I). `require('os')` em `app.js:2` continua resolvendo para o módulo nativo, como previsto em D8 — verificado em execução. Ver ressalva R6 (transporte da justificativa para o corpo do PR). |
| **II. Teste para toda mudança de comportamento** | Aprovado com ressalva | A mudança de formato/fuso (`FR-002`, `FR-003`, `FR-004`, `FR-011`) tem teste unitário determinístico. O comportamento observável do HTML e do HTTP (destaque, rótulo, `lang`, preservação de IP/título, ausência de script, `200`/`Content-Type`) **não** tem teste neste diff — é `test/aceite/`, responsabilidade do QA em E6. Ver ressalva **R1**. |
| **II. `npm test` verde** | Aprovado | Código de saída `0`, 8/8 aprovados, medido pelo revisor. O script inválido (`echo … && exit 1`) foi substituído por `node --test` sem argumento posicional, conforme D6. |
| **II. App exportável, sem porta fixa** | Aprovado | `app.js:65` exporta `{ app, formatarDataHora }` exatamente como o contrato §4 exige; `app.listen` está sob `if (require.main === module)` (`app.js:59-63`), de modo que `require('../../app.js')` no teste não abre porta — confirmado: a suíte roda sem nenhum servidor em execução. `app.js:5` lê `process.env.PORT` com padrão `3000`. |
| **III. pt-BR e fuso explícito** | Aprovado | `timeZone: 'America/Sao_Paulo'` literal em `app.js:10`, nunca o fuso do host; `hourCycle: 'h23'`; `lang="pt-br"` preservado em `views/index.ejs:2`; nenhum texto novo de interface introduzido, os existentes já estão em pt-BR. |
| **III. Teste que fixa o fuso** | Aprovado com ressalva | Existe o teste de invariância (`test/unidade/data-hora.test.js:43-60`), mas seu poder de detecção é parcial. Ver ressalva **R2**. |
| **IV. Renderização no servidor, zero frontend** | Aprovado | Formatação no servidor, entrega por `res.render('index', { ip, horaAtual })`. Nenhuma tag `<script>`, nenhum `meta refresh`, nenhum CSS/JS externo, nenhum endpoint novo, nenhuma biblioteca de frontend no HTML renderizado (conferido no template completo). O estilo é embutido em um único `<span>`. |
| **V. Identificadores novos em português** | Aprovado | `formatadorDataHora`, `formatarDataHora`, `instante`, `partes`, `parte`, `tipo`, `valor`, `test/unidade/data-hora.test.js`, e nos testes `paresDeReferencia`, `esperado`, `descricao`, `fuso`, `tzOriginal`, `primeiraChamada`. `horaAtual`, `ip` e `port` preservados; `app`, `req`, `res`, `module`, `require` mantidos em inglês como o princípio autoriza. |
| **V. Responsabilidade única e legibilidade** | Aprovado | `formatarDataHora` tem 6 linhas e uma só responsabilidade. Os dois comentários novos (`app.js:7-8`, `20-21`, `57-58`) explicam **motivo** (falha visível de fuso; vírgula do locale; porta livre nos testes), não mecanismo — exatamente o que o princípio pede. |
| **Restrições Técnicas** | Aprovado | Stack inalterada (Node + Express + EJS + `node:test`/`supertest`). Sem banco, sem persistência, sem etapa de build. Nenhum segredo versionado; `.env` ausente do repositório e `node_modules/` no `.gitignore`. `package-lock.json` foi regravado **no mesmo commit** que `package.json` (`473bcea`, Fase 1) e é coerente: sem entradas de `moment`/`os`, com `supertest@7.3.2` marcado `"dev": true`. |
| **Fluxo de Desenvolvimento** | Aprovado | Trabalho na branch dedicada criada de `main`; nenhum commit em `main`; nenhum merge, push ou auto-merge executado pela implementação. PR, revisão humana e merge humano permanecem pendentes (etapa do orquestrador/humano). |

Nenhuma violação da constituição foi encontrada. `plan.md` → *Complexity Tracking* está
vazio por não haver violação, e esta revisão confirma esse veredito: não há complexidade não
justificada a recusar.

## 4. Correção funcional de `formatarDataHora` (`app.js:22-27`)

Verificações executadas pelo revisor no ambiente real (Node v24.20.0), por `require` direto
do módulo:

| Caso | Entrada | Saída | Veredito |
|---|---|---|---|
| Instante comum | `2026-07-03T12:05:07Z` | `03/07/2026 09:05:07` | Confere com o contrato §4 |
| Madrugada, 24 h | `2026-11-24T03:30:04Z` | `24/11/2026 00:30:04` | Confere; sem AM/PM (`FR-003`, V6) |
| Meia-noite | `2026-11-24T03:00:00Z` | `24/11/2026 00:00:00` | Confere; `00`, nunca `24` (V6) |
| Virada de ano e mês | `2027-01-01T02:00:00Z` | `31/12/2026 23:00:00` | Confere (caso de borda da spec) |
| Zeros à esquerda | `2026-01-05T15:07:09Z` | `05/01/2026 12:07:09` | Confere (`FR-004`, V5) |
| Horário de verão histórico | `2018-01-15T02:30:00Z` | `15/01/2018 00:30:00` (offset −02:00) | **Correto**: o ICU resolve o offset vigente na data, sem ajuste manual. Comportamento certo, porém **não coberto por teste** — ver ressalva R4 |
| `Date` inválida | `new Date('abc')` | `RangeError: Invalid time value` | Falha em `formatToParts`, antes de qualquer acesso a `.value` |

Invariantes do `data-model.md`: **V1** (19 caracteres) assertado em todos os cinco pares;
**V2/V3** (ordem e expressão) satisfeitos por construção, já que a cadeia é montada à mão em
`app.js:26`; **V4** (espaço `U+0020`, nunca vírgula) garantido pela montagem via
`formatToParts` — é precisamente a razão da decisão D1; **V5/V6** satisfeitos por
`2-digit` + `hourCycle: 'h23'`; **V7** satisfeito (horário de verão histórico medido acima);
**V8** satisfeito na prática (ver R2 quanto à prova); **V9** satisfeito — não há `try/catch`
na construção do formatador (`app.js:9-18`), conforme D3, de modo que um fuso irresolvível
derruba o processo no carregamento do módulo e nenhuma resposta é servida.

**Sobre `partes.find(...).value` (`app.js:24`)**: a leitura é desprotegida e lançaria
`TypeError: Cannot read properties of undefined` se algum dos seis tipos de parte faltasse.
Medição: com o conjunto fixo de opções e locale literais deste código, os seis tipos são
sempre produzidos, e entradas inválidas falham antes, dentro de `formatToParts`
(`RangeError`). O caminho de falha é, portanto, **inalcançável** no código como escrito.
Classificação: **ressalva R3, não bloqueante** — endurecer a leitura acrescentaria código
defensivo para um caminho impossível, o que o Princípio I desencoraja.

## 5. Qualidade e poder de detecção dos testes (`test/unidade/data-hora.test.js`)

Pontos fortes: os cinco pares de referência conferem **exatamente** com
`contracts/pagina-inicial.md` §4, inclusive nos instantes e nas saídas; cada caso assere a
cadeia completa (não um `match` frouxo) **e** o comprimento de 19 caracteres; as asserções
usam `node:assert/strict`; os nomes dos testes descrevem o comportamento e o par
entrada→saída; a tabela parametrizada evita duplicação sem esconder o caso; o teste de
`process.env.TZ` restaura o valor original em `finally`, inclusive o caso `undefined`
(`:54-58`), sem vazar estado para os demais testes. Não há teste tautológico, nem asserção
sobre a própria implementação, nem dependência de relógio, ordem de execução ou locale do
host. Os testes de `:62-79` (mesma entrada → mesma saída; entradas distintas → saídas
distintas) são fracos por natureza, mas fixam legitimamente a ausência de cache exigida por
`FR-006`/`FR-007` e custam pouco.

O único problema real de poder de detecção é o da ressalva **R2**, abaixo.

## 6. Achados

### R1 — Comportamento observável de HTML/HTTP sem verificação automatizada neste diff

- **Severidade**: Alto | **Classificação: NÃO BLOQUEANTE** (contexto pré-registrado pelo
  orquestrador: `test/aceite/` é entrega do QA em E6)
- **Onde**: `views/index.ejs:11`; `app.js:32-41`; ausência de `test/aceite/` (hoje `test/`
  contém apenas `unidade/data-hora.test.js`)
- **Problema**: a suíte atual exercita somente a função pura. Nada no diff verifica a
  resposta HTTP nem o HTML renderizado. Ficam **sem verificação automatizada**: `FR-005`
  (destaque só no valor, rótulo fora do `<span>`), `FR-006` (ausência de atualização
  automática), `FR-008` (rótulo em pt-BR e `lang="pt-br"`), `FR-009` (IP, `h1` e `title`
  inalterados), `FR-010` (regra restrita a `GET /`, nenhuma rota nova), `SC-007` (par
  cor/elemento), `SC-008` e `SC-009`. `FR-001` e `FR-007` só têm cobertura indireta (a
  função é pura; quem chama `new Date()` é o handler, não testado).
- **Impacto**: uma regressão no template — remover o `<span>`, colorir o rótulo junto,
  trocar o tom, mexer na linha de IP, introduzir um `<script>` — passaria com `npm test`
  verde. No nível do PR, o portão "cada mudança de comportamento tem teste correspondente"
  do Princípio II só se fecha quando os testes de aceite entrarem.
- **Correção esperada (QA, E6)**: `test/aceite/pagina-inicial.test.js` com `supertest(app)`
  cobrindo o contrato §1/§2: `200` e `Content-Type: text/html; charset=utf-8`; presença de
  `lang="pt-br"`; `title` e `h1` exatos; `Endereço IP do Servidor:` presente; o fragmento
  `Hora Atual do Servidor: <span style="color: #8b0000">` com o rótulo **fora** do `<span>`
  e o valor **dentro** dele, casando com `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$`; e as
  proibições P1–P5 (ausência de `<script>`, de `setInterval`/`setTimeout`/`fetch`, de
  `<meta http-equiv="refresh">`, de `.js`/CSS externo).
- **Nota**: até que R1 seja fechado, `supertest` permanece declarado e não usado por nenhum
  teste. Isso não é violação (a constituição fixa `supertest` como stack de testes e D7
  registra a justificativa), mas a dependência só passa a se pagar em E6.

### R2 — O teste de invariância de fuso não prova o que afirma provar

- **Severidade**: Médio | **Classificação: NÃO BLOQUEANTE** (a implementação está correta; o
  defeito é de poder de detecção do teste)
- **Onde**: `test/unidade/data-hora.test.js:43-60`
- **Problema**: o teste muta `process.env.TZ` **em tempo de execução**, depois que `app.js`
  já foi carregado e que `formatadorDataHora` (`app.js:9-18`) já foi construído. Medido em
  Node v24.20.0: um `Intl.DateTimeFormat` já construído **não** reassocia o fuso quando
  `process.env.TZ` muda depois (`resolvedOptions().timeZone` permanece o do momento da
  construção). Consequência demonstrada: simulando a regressão "esquecer
  `timeZone: 'America/Sao_Paulo'` em `app.js:10`" em um host cujo fuso é
  `America/Sao_Paulo` — o caso desta máquina —, a função devolve `03/07/2026 09:05:07` nos
  quatro valores de `TZ` do laço e **as 8 asserções continuam passando**. O teste tem
  poder de detecção *parcial*, não nulo: ele pegaria uma implementação baseada em métodos
  locais de `Date` (`getHours`, `getDate`), porque esses **sim** acompanham a mutação de
  `TZ` em tempo de execução (também medido). O que ele não pega é justamente a regressão
  mais provável, a perda da opção `timeZone`.
- **Impacto**: `FR-002`, `FR-011`, `SC-002`, `SC-006` e o invariante V8 aparentam cobertura
  automatizada que, na prática, depende do fuso da máquina que roda a suíte. A prova real é
  a execução da suíte com `TZ` definido **no ambiente**, feita manualmente em T010
  (`TZ=UTC`, `TZ=America/Sao_Paulo`, `TZ=Asia/Tokyo`, todas verdes) — mas essa prova não
  está codificada em lugar algum e se perde na próxima execução.
- **Correção esperada**: manter o teste atual (ele cobre o caso dos métodos locais) e
  acrescentar uma verificação com poder real, de uma destas duas formas, ambas simples:
  (i) assertar diretamente o fuso declarado, por exemplo que o valor produzido para um
  instante fixo é o de São Paulo **e** que o formatador do módulo resolve
  `America/Sao_Paulo`; ou (ii) preferencialmente, subir um processo filho com
  `child_process` passando `env: { ...process.env, TZ: 'Asia/Tokyo' }`, carregar `app.js`
  nele e comparar a saída com o par de referência — isso exercita o carregamento do módulo
  sob outro fuso, que é o cenário que importa. Complemento recomendado ao orquestrador:
  registrar na descrição do PR que a suíte deve ser executada também sob `TZ` diferente,
  como condição do portão de `SC-006`.
- **Destinatário sugerido**: QA (E6), junto de R1, por ser acréscimo de verificação e não
  correção de código de produção.

### R3 — Leitura desprotegida de `partes.find(...).value`

- **Severidade**: Baixo | **Classificação: NÃO BLOQUEANTE**
- **Onde**: `app.js:24`
- **Problema**: se algum dos seis tipos de parte não existisse, a expressão lançaria
  `TypeError: Cannot read properties of undefined (reading 'value')` — mensagem que não
  explicaria a causa a quem a encontrasse em produção.
- **Impacto**: nulo no código como está. Medição: com o locale e o conjunto de opções
  literais de `app.js:9-18`, os seis tipos são sempre emitidos; entrada inválida falha
  antes, em `formatToParts` (`RangeError: Invalid time value`). O caminho é inalcançável.
- **Correção esperada**: nenhuma ação obrigatória. Não se recomenda adicionar guarda: seria
  código defensivo para um caminho impossível, contra o Princípio I. Registrado apenas para
  que a decisão seja consciente, caso o conjunto de opções mude no futuro.

### R4 — Horário de verão eventual sem teste

- **Severidade**: Baixo | **Classificação: NÃO BLOQUEANTE**
- **Onde**: `test/unidade/data-hora.test.js:6-32` (lista de pares de referência)
- **Problema**: o caso de borda "eventual retorno do horário de verão brasileiro" da spec
  (e o invariante V7, "offset vigente naquela data") não tem par de referência. Todos os
  cinco pares caem em datas de offset −03:00.
- **Impacto**: baixo. O revisor mediu o comportamento e ele está **correto**:
  `2018-01-15T02:30:00Z` → `15/01/2018 00:30:00`, ou seja, offset −02:00 resolvido pelo
  banco de fusos do ICU sem ajuste manual. O risco é apenas de regressão silenciosa futura.
- **Correção esperada**: acrescentar um sexto par de referência com instante em período de
  horário de verão brasileiro já encerrado (por exemplo `2018-01-15T02:30:00Z` →
  `15/01/2018 00:30:00`), que fixa o comportamento sem depender de mudança legal futura.

### R5 — `process.env.PORT || 3000` descarta `PORT=0`

- **Severidade**: Sugestão | **Classificação: NÃO BLOQUEANTE**
- **Onde**: `app.js:5`
- **Problema**: com `||`, os valores `0` e `""` caem no padrão `3000`. `PORT=0` é um valor
  legítimo em Node (porta efêmera atribuída pelo sistema) e seria silenciosamente ignorado.
- **Impacto**: nenhum requisito desta feature é afetado, e a forma está exatamente como
  `tasks.md` T004 e `research.md` D5 prescreveram. A observação só importa se algum dia o
  projeto precisar subir em porta efêmera fora dos testes.
- **Correção esperada**: nenhuma nesta entrega. Caso se queira precisão, `??` em vez de
  `||` com validação numérica — mas isso excede o escopo pedido e não deve entrar agora.

### R6 — Justificativa da dependência nova precisa constar do corpo do PR

- **Severidade**: Sugestão (processo) | **Classificação: NÃO BLOQUEANTE** | **Destinatário:
  orquestrador**, não o Desenvolvedor
- **Onde**: `package.json:13-15` (`devDependencies.supertest`)
- **Problema**: o Princípio I exige que dependência nova seja "justificada **por escrito no
  pull request**", respondendo (a) e (b). A justificativa existe e é adequada, mas está em
  `research.md` D7, não no PR — que ainda não foi aberto.
- **Correção esperada**: transcrever ou referenciar explicitamente D7 (a)/(b) na descrição
  do PR, junto do saldo de dependências (+1 dev, −2 runtime), para fechar o portão de
  revisão de conformidade.

## 7. Segurança

Nenhum achado. Verificações realizadas:

- **Segredos**: varredura do diff de código por `password`, `secret`, `token`, `api key`,
  chave privada e `.env` — nenhuma ocorrência. Nenhum arquivo `.env` existe ou é rastreado;
  `node_modules/` está no `.gitignore`. A única configuração de ambiente é `PORT`, com
  padrão seguro (`app.js:5`).
- **Injeção / XSS**: o valor é renderizado com `<%= horaAtual %>` (`views/index.ejs:11`),
  escape automático do EJS — correto. Além disso, o valor é integralmente derivado do
  relógio e do ICU, sem qualquer entrada do usuário: a rota não aceita parâmetro de rota,
  query ou corpo. Nenhuma interpolação de HTML cru (`<%- %>`) foi introduzida. O estilo
  embutido é literal, não interpolado.
- **Autenticação/autorização**: não aplicável; `GET /` é público por desenho e nada foi
  alterado nesse aspecto.
- **Log**: a única escrita em log é a mensagem de inicialização com a porta
  (`app.js:60-62`), preexistente. Nenhum dado sensível é registrado; nada foi acrescentado.
- **Nota preexistente, fora do escopo**: a página expõe o IP de rede do servidor
  (`getIpAddress`, `app.js:44-55`). É comportamento anterior a esta feature e `FR-009`
  exige que permaneça inalterado — não é achado desta revisão, apenas registro.

## 8. Desempenho

Nenhum achado. O formatador `Intl` é construído **uma única vez** no escopo do módulo
(`app.js:9-18`), e não por requisição — que é o ponto caro dessa API. A formatação é O(1):
`formatToParts` sobre sete partes, com seis buscas lineares em um vetor de tamanho fixo
(`app.js:24`), irrelevante nessa escala. Nenhuma consulta, I/O, alocação em laço ou
processamento desnecessário. Sem estado compartilhado mutável entre requisições, logo sem
condição de corrida: cada chamada cria seu próprio `instante` e sua própria cadeia; o
formatador é imutável e seu uso concorrente é seguro.

## 9. Cobertura de requisitos neste diff

| Requisito | Verificação automatizada neste diff | Observação |
|---|---|---|
| `FR-001` | Indireta | `new Date()` no handler (`app.js:37`); sem teste HTTP (R1) |
| `FR-002` | Sim, com ressalva | Pares de referência; prova de independência de fuso enfraquecida (R2) |
| `FR-003` | Sim | Cadeia exata nos cinco pares |
| `FR-004` | Sim | Pares com componentes de um dígito + comprimento 19 |
| `FR-005` | **Não** | `test/aceite/` (QA, E6) — R1 |
| `FR-006` | Parcial | Ausência de cache coberta em unidade; ausência de `<script>`/`refresh` não — R1 |
| `FR-007` | Parcial | Saídas distintas para instantes distintos; sem teste HTTP — R1 |
| `FR-008` | **Não** | `test/aceite/` — R1 |
| `FR-009` | **Não** | `test/aceite/` — R1 |
| `FR-010` | **Não** | `test/aceite/` (ausência de rota nova) — R1; conferido manualmente no diff: nenhuma rota criada |
| `FR-011` | Sim, com ressalva | Função pura com instante por parâmetro; ver R2 |
| `SC-001`, `SC-002`, `SC-006` | Parcial | Formato e determinismo cobertos; a parte de "fusos de host distintos" depende de R2 |
| `SC-007` | **Não** | Par cor/elemento não travado por teste — R1. Conferido manualmente: `#8b0000` sobre `#ffffff` = 10,01:1 pela fórmula do WCAG 2.1, acima do mínimo de 4,5:1 |
| `SC-008`, `SC-009` | **Não** | `test/aceite/` — R1; conferido manualmente no template: todos os textos em pt-BR, nenhum recurso externo ou script |
| `SC-003`, `SC-004`, `SC-005` | Não aplicável | Critérios de observação manual, cobertos pelo `quickstart.md` |

As lacunas marcadas como **Não** são todas de responsabilidade do QA em E6 e estavam
pré-registradas pelo orquestrador: constituem **risco/ressalva (R1)**, não bloqueio desta
etapa.

## 10. Parecer final

**Aprovado com ressalvas.**

Nenhum achado bloqueante: nenhum Crítico e nenhuma violação da constituição. O código
implementa fielmente as decisões ratificadas em E2 (`Intl` com fuso explícito e
`formatToParts`; ausência deliberada de `try/catch`; `#8b0000` embutido apenas no valor;
`module.exports` com `app.listen` condicional e `PORT` por ambiente; `supertest` como
devDependency; remoção de `moment` e do pacote `os`; `node --test` sem posicional), é
correto nos casos de borda que o revisor mediu, não tem problema de segurança nem de
desempenho, e sai com `npm test` em código `0`.

As seis ressalvas vão para a descrição do PR. Duas delas (**R1** e **R2**) devem ser
endereçadas pelo QA em E6 **antes do merge**, porque é em E6 que o portão "cada mudança de
comportamento observável tem teste correspondente" do Princípio II se fecha no nível do PR.

### Achados por severidade

| ID | Severidade | Bloqueante | Resumo | Destinatário |
|---|---|---|---|---|
| R1 | Alto | Não | HTML/HTTP observável sem teste automatizado neste diff | QA (E6) |
| R2 | Médio | Não | Teste de invariância de `TZ` com poder de detecção parcial | QA (E6) |
| R3 | Baixo | Não | `partes.find(...).value` desprotegido, caminho inalcançável | nenhuma ação |
| R4 | Baixo | Não | Horário de verão eventual sem par de referência | QA (E6) |
| R5 | Sugestão | Não | `PORT=0` descartado por `\|\|` | nenhuma ação |
| R6 | Sugestão | Não | Justificativa de `supertest` a transcrever no PR | orquestrador |

**Próxima etapa sugerida**: E6 (QA — testes de aceite em `test/aceite/`), incorporando R1,
R2 e R4 ao escopo.
