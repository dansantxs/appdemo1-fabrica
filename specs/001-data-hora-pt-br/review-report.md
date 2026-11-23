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

---

## Revisão complementar — testes de aceite do QA (E6)

**Data**: 2026-11-23 | **Revisor**: Revisor de Código (Fábrica de Software) |
**Rodada**: complementar, posterior a E6 e anterior a E7

**Escopo desta rodada**: exclusivamente `test/aceite/pagina-inicial.test.js` (novo, 311
linhas, 31 testes), commit `3010ad3`. O código de produção (`app.js`, `views/index.ejs`),
os testes unitários (`test/unidade/data-hora.test.js`) e as ressalvas R3, R5 e R6 **não**
foram reabertos: permanecem com o parecer da rodada anterior. A dívida de `getIpAddress`
em inglês segue fora de escopo (D9) e não é apontamento.

**PARECER desta rodada: reprovado** — um achado **Crítico** (C1) e uma violação de portão
constitucional (C2). Ambos são de `test/aceite/`, portanto **retornam ao QA**; nenhuma ação
do Desenvolvedor é requerida.

### A. Verificação executada pelo revisor

| Verificação | Resultado medido |
|---|---|
| `npm test` (→ `node --test`) | **39 testes, 39 aprovados, 0 falhas, 12 suítes; código de saída `0`** |
| `TZ=UTC npm test` | 39/39, código `0` |
| `TZ=Asia/Tokyo npm test` | 39/39, código `0` |
| Arquivos alterados em `3010ad3` | `test/aceite/pagina-inicial.test.js` (novo), `qa-report.md`, `state.json` — nenhuma mudança em código de produção, em `package.json` ou em `test/unidade/` |
| `npm ls --depth=0` | `ejs@3.1.9`, `express@4.18.2`, `supertest@7.3.2 (dev)` — **nenhuma dependência nova** |
| Encerramento do runner | sai sozinho, sem *handle* pendurado e sem processo filho sobrevivente |

Ambiente: Node v24.20.0, fuso do host `America/Sao_Paulo`. Árvore de trabalho limpa ao fim
da revisão; nenhum arquivo do projeto foi alterado por esta rodada além deste relatório.

**Método**: além da leitura, o poder de detecção da suíte foi medido por **mutação do código
de produção em cópia isolada** (fora do repositório, com `NODE_PATH` apontando para o
`node_modules` do projeto), executando a suíte do QA **sem nenhuma alteração** contra cada
mutante. Resultados:

| Mutante (regressão simulada em `app.js`) | Resultado da suíte do QA | Veredito |
|---|---|---|
| M1 — valor calculado **uma única vez** no carregamento do módulo (congelado para sempre) | **31/31 aprovados** | **não detectado** |
| M2 — valor fixo no código: `const horaAtual = '01/01/2000 00:00:00'` (nunca lê o relógio) | **31/31 aprovados** | **não detectado** |
| M3 — remoção de `timeZone: 'America/Sao_Paulo'` da construção do formatador | 28/31 — falham os 3 testes de subprocesso (`UTC`, `Asia/Tokyo`, `America/Los_Angeles`) | detectado |

M1 e M2 são a base do achado C1. M3 é a prova de que R2 foi efetivamente fechada.

### B. Fechamento das ressalvas encaminhadas ao QA

#### R1 — comportamento observável de HTML/HTTP — **parcialmente fechada**

**Fechado** (asserções exatas, não frouxas, sobre a resposta real):

| Requisito | Teste | Observação |
|---|---|---|
| `200` e `Content-Type` | `:10-18` | conforme contrato §1 |
| `FR-005`, `SC-007` | `:57-69`, `:266-273` | o fragmento `Hora Atual do Servidor: <span style="color: #8b0000">` é casado **literalmente**, e `:68` rejeita o rótulo dentro do `<span>`. Trocar o tom, remover o `<span>` ou colorir o rótulo faz a suíte falhar |
| `FR-008`, `SC-008` | `:30-33`, `:52-55`, `:71-81` | `lang="pt-br"`, rótulo em pt-BR e ausência de textos em inglês |
| `FR-009` | `:35-50` | `title` e `h1` exatos; linha de IP presente (ver N1) |
| `FR-006` (parte observável), `SC-009` | `:85-111` | P1–P5 do contrato §2.2 |
| `FR-010` | `:178-186` | `404` em caminho inexistente e em `/api/data-hora` |
| `FR-003`, `FR-004`, `SC-001` | `:115-153` | máscara, 19 caracteres, ausência de AM/PM, extraídos do HTML renderizado |

**Não fechado**: os dois requisitos que a rodada anterior classificou como de cobertura
*parcial* — `FR-001` (valor corresponde ao instante da requisição) e `FR-007`/`SC-005`
(cada carregamento apresenta um valor novo) — continuam **sem nenhuma asserção que os
verifique**, apesar de a matriz do `qa-report.md` §2 declarar ambos "✓ Coberto". Ver **C1**.

#### R2 — independência de fuso provada em processo filho — **fechada**

O helper `executarEmSubprocessoComFuso` (`:281-311`) faz exatamente o que a correção (ii)
da R2 pedia: `spawn('node', ['-e', …], { env: { ...process.env, TZ: fuso } })`, de modo que
`app.js` é **carregado** em um processo cujo `TZ` já está definido — logo
`formatadorDataHora` é construído sob o fuso alternativo, que é o cenário que o teste
unitário não alcançava. O valor esperado é uma **literal** (`'03/07/2026 09:05:07'`), não um
derivado da própria entrada, e os quatro fusos cobrem os dois sinais dos offsets. Medição de
confirmação: o mutante M3 (remoção do `timeZone`) **faz a suíte falhar** nesta máquina, cujo
fuso é `America/Sao_Paulo` — precisamente o falso-verde que a R2 denunciava. O poder de
detecção não depende mais do fuso do host.

#### R4 — horário de verão — **fechada**

`:211-221` fixa `2018-01-15T02:30:00Z` → `15/01/2018 00:30:00` (offset −02:00 vigente na
data) com igualdade de cadeia **e** comprimento 19, sem depender de mudança legal futura.
É um teste de função pura hospedado em `test/aceite/` — aceitável, já que `test/unidade/` é
do Desenvolvedor e o QA não deve alterá-lo.

### C. Achados desta rodada

#### C1 — `FR-001` e `FR-007`/`SC-005` declarados cobertos, mas nenhuma asserção os verifica

- **Severidade: Crítico | BLOQUEANTE | Destinatário: QA (E6)**
- **Onde**:
  - `test/aceite/pagina-inicial.test.js:240-263` — teste `SC-005: dois carregamentos
    distantes apresentam valores diferentes (FR-007)`: captura `valor1` e `valor2`, aguarda
    1100 ms entre as duas requisições e **não compara os dois valores**. As únicas asserções
    (`:257-258`) repetem a máscara já verificada em `:115-126`. O comentário de `:260-262`
    declara explicitamente que a comparação foi omitida por ser "probabilística".
  - `test/aceite/pagina-inicial.test.js:157-174` — teste `duas requisições consecutivas
    devolvem valores válidos cada um (FR-001, FR-007)`: idem, só máscara e comprimento.
  - `test/aceite/pagina-inicial.test.js:128-145` — teste `valor é uma data válida no fuso
    America/Sao_Paulo (FR-001, FR-002, SC-002)`: só valida intervalos (`dia` 1–31, `ano`
    1900–3000 etc.). Passa para **qualquer** data e sob **qualquer** fuso; não verifica nem
    o fuso que o nome anuncia nem a proximidade com o instante da requisição.
- **Problema**: nenhum teste da suíte liga o valor renderizado ao relógio do servidor no
  momento da requisição. O comentário de `:260-262` parte de uma premissa errada: com
  `1100 ms` de espera (> 1 s) a mudança do campo de segundos é **garantida**, não
  probabilística, de modo que `assert.notEqual(valor1, valor2)` seria determinístico — a
  asserção foi omitida sem necessidade.
- **Impacto medido** (mutação, seção A): a suíte do QA passa **31/31** com o valor congelado
  no carregamento do módulo (M1) e passa **31/31** com um valor fixo no código,
  `'01/01/2000 00:00:00'`, que nunca lê o relógio (M2). Ou seja, `FR-001` e `FR-007` estão
  quebrados nos dois mutantes e `npm test` continua verde com código `0`. Isso contraria o
  `qa-report.md` §2 (que marca `FR-001`, `FR-007` e `SC-005` como "✓ Coberto"), §6 (que
  declara R1 "FECHADO") e §9 ("zero defeitos"), e deixa aberto o portão "cada mudança de
  comportamento tem teste correspondente" do Princípio II justamente nos dois requisitos
  que a rodada anterior havia marcado como parciais.
- **Correção esperada** (duas asserções; validadas pelo revisor, ver abaixo):
  1. Em `:240-263`, acrescentar a comparação que o nome do teste promete:
     `assert.notEqual(valor1, valor2, 'o valor deve mudar entre requisições separadas por mais de 1 s');`
  2. Acrescentar um teste que amarre o valor renderizado ao instante da requisição, por
     **janela de tolerância** (nunca por igualdade com um `new Date()` do próprio teste, que
     seria intermitente na virada de segundo):

     ```javascript
     test('o valor renderizado corresponde ao instante da requisição (FR-001)', async () => {
       const antes = Date.now();
       const res = await supertest(app).get('/');
       const depois = Date.now();
       const valor = res.text.match(/<span style="color: #8b0000">([^<]+)<\/span>/)[1];

       const aceitos = new Set();
       for (let t = antes - 1000; t <= depois + 1000; t += 200) {
         aceitos.add(formatarDataHora(new Date(t)));
       }
       assert.ok(aceitos.has(valor), `valor ${valor} fora da janela da requisição`);
     });
     ```

     `formatarDataHora` já está importado em `:6`. Usá-lo como oráculo do **instante** é
     legítimo: a máscara e o fuso são fixados independentemente pelos pares de referência e
     pelos testes de subprocesso, e este teste só precisa decidir *quando*.
- **Verificação da correção, executada pelo revisor**: com as duas asserções acima, o código
  correto passa (5 execuções consecutivas e sob `TZ=UTC`, `TZ=Asia/Tokyo`,
  `TZ=America/Los_Angeles`: 2/2 em todas, zero intermitência); o mutante M1 falha (na
  comparação `notEqual`) e o mutante M2 falha nas duas asserções. A correção, portanto, mata
  as duas regressões sem introduzir fragilidade.
- **Além disso**: corrigir no `qa-report.md` §2, §6 e §9 a declaração de cobertura de
  `FR-001`, `FR-007` e `SC-005`, para que o relatório deixe de afirmar cobertura que a suíte
  não tinha.

#### C2 — identificadores novos em inglês no arquivo de teste (portão do Princípio V)

- **Severidade: Alto | BLOQUEANTE** por ser violação de portão constitucional não registrada
  em `Complexity Tracking` (que está vazio) | **Destinatário: QA (E6)**
- **Onde**: `test/aceite/pagina-inicial.test.js:22, 26, 27` (`htmlBody`); `:283, 287`
  (`scriptPath`); `:286, 295, 299, 303` (`child`); `:118, 130, 149, 161-162, 246, 253`
  (`match`, `match1`, `match2`)
- **Problema**: o Princípio V exige que **identificadores novos** — incluindo os de teste —
  sejam nomeados em português, e o portão "identificadores novos em português" consta
  explicitamente do *Fluxo de Desenvolvimento*. Os nomes acima têm equivalente natural em
  português (`corpoHtml`, `caminhoDoScript`, `processoFilho`, `correspondencia`) e não se
  enquadram na exceção de "termos técnicos consagrados sem tradução natural". Ficam **fora**
  do achado, por serem consagrados ou impostos por API externa: `res`, `res1`, `res2`,
  `env`, `code`, `data`, `resolve`, `reject`, `stdout`, `stderr`, `app`, `test`, `describe`,
  `assert`, `supertest`, `path`, `spawn`.
- **Impacto**: nenhum no comportamento; é o portão de conformidade do PR que não fecha. Os
  demais identificadores do arquivo (`valor`, `instante`, `fuso`, `resultado`, `dataParte`,
  `horaParte`, `dia`, `mes`, `ano`, `hora`, `minuto`, `segundo`, `executarEmSubprocessoComFuso`)
  estão corretos — a inconsistência interna é, por si, o problema de legibilidade que o
  princípio quer evitar.
- **Correção esperada**: renomear os quatro identificadores (renomeação local, sem efeito em
  outros arquivos). Alternativa prevista pela *Governance* da constituição, se o
  orquestrador preferir não devolver por isso: registrar a exceção explicitamente no corpo
  do PR, com justificativa e prazo — decisão do orquestrador, não do revisor.

#### N1 — asserção de IP depende da configuração de rede do host (risco de falso vermelho)

- **Severidade: Médio | NÃO BLOQUEANTE | Destinatário: QA**
- **Onde**: `:49` — `assert.match(res.text, /Endereço IP do Servidor: \d+\.\d+\.\d+\.\d+/)`
- **Problema**: `getIpAddress` (`app.js:44-55`) devolve a cadeia `Endereço IP não
  encontrado` quando o host não tem nenhuma interface IPv4 externa. Nesse ambiente o
  contrato H5 (`FR-009`: "linha de IP presente e inalterada") **continua satisfeito**, mas a
  asserção falha. Medição do revisor: com `os.networkInterfaces()` devolvendo apenas `lo`
  interna, a resposta traz `<p>Endereço IP do Servidor: Endereço IP não encontrado</p>` e a
  expressão de `:49` **não casa**. É a única dependência de ambiente que resta na suíte, e
  contraria `SC-006` ("zero resultados divergentes por causa do ambiente").
- **Correção esperada**: manter a asserção do rótulo (`:47`) e tornar a do valor tolerante
  ao caminho de fallback, por exemplo
  `/Endereço IP do Servidor: (\d+\.\d+\.\d+\.\d+|Endereço IP não encontrado)/` — o contrato
  §2.1 H5 exige o rótulo e um valor, não um IPv4.

#### N2 — teste quase tautológico com estado compartilhado morto

- **Severidade: Baixo | NÃO BLOQUEANTE | Destinatário: QA**
- **Onde**: `:22` (`let htmlBody`) e `:24-28` (teste `obtém o HTML da página`)
- **Problema**: `htmlBody` é escrito em `:26` e **nunca lido** por nenhum outro teste —
  estado compartilhado morto, que sugere falsamente uma dependência de ordem de execução. A
  única asserção, `assert.ok(htmlBody)`, passa com qualquer corpo não vazio, inclusive com a
  página de erro de um `404`: não verifica requisito algum e infla a contagem de testes
  (é um dos "9 testes cobrindo H1–H9" do `qa-report.md` §3).
- **Correção esperada**: remover a variável e o teste, ajustando a contagem no relatório do
  QA; o conteúdo já é verificado pelos testes de H1 a H9.

#### N3 — H2 do contrato (`<meta charset="UTF-8">`) sem teste, mas declarado coberto

- **Severidade: Baixo | NÃO BLOQUEANTE | Destinatário: QA**
- **Onde**: ausência, no bloco `:21-82`; `qa-report.md` §3 afirma "9 testes, cobrindo H1–H9"
  e lista 8 itens
- **Problema**: o contrato §2.1 H2 pede `<meta charset="UTF-8">` presente no documento.
  Nenhum teste o verifica — o teste de `Content-Type` (`:15-18`) é o cabeçalho HTTP, coisa
  distinta do `meta` do documento. É o segundo caso de cobertura declarada e não existente
  (cf. C1), ainda que de impacto pequeno.
- **Correção esperada**: `assert.match(res.text, /<meta charset="UTF-8">/i)` ou corrigir a
  declaração de cobertura no relatório.

#### N4 — nomes de teste que prometem mais do que as asserções verificam

- **Severidade: Baixo | NÃO BLOQUEANTE | Destinatário: QA**
- **Onde**: `:224-231` (`SC-004: valor permanece congelado sem recarga`) reproduz
  **literalmente** as asserções de `:87` (P1) e `:92` (P2), sem acrescentar poder de
  detecção; `:233-238` (`SC-003: valor é localizável rapidamente`) é um subconjunto da
  asserção de `:66` (H8); `:128-145` verifica intervalos, não o fuso que o nome anuncia
  (ver C1).
- **Problema**: duplicação pura e títulos que superdimensionam a cobertura. Quem ler a saída
  de `npm test` concluirá que `SC-003` e `SC-004` foram verificados como critérios, quando o
  que existe é a checagem indireta de P1/P2/H8 — ambos já contados. A honestidade do nome do
  teste é o que faz o relatório de execução ser confiável.
- **Correção esperada**: renomear para o que de fato é verificado (por exemplo
  `SC-004: nenhum mecanismo de atualização automática no HTML (via P1/P2)`) ou remover as
  duplicatas, deixando a observação manual registrada apenas no `quickstart.md`.

#### N5 — helper de subprocesso: sem listener de `error`, sem limite de tempo e com caminho interpolado no script

- **Severidade: Sugestão | NÃO BLOQUEANTE | Destinatário: QA**
- **Onde**: `:281-311`
- **Problema**: (a) não há `child.on('error', reject)`; (b) não há limite de tempo para o
  filho; (c) o caminho absoluto é interpolado dentro de uma literal de aspas simples no
  script passado a `node -e` (`:287`), com escape manual apenas das barras invertidas.
- **Impacto medido**: menor do que parece. O revisor reproduziu a forma do helper com um
  executável inexistente: o `ENOENT` **não** pendura o runner — o `node:test` captura o
  evento `error` não tratado como exceção não capturada e **reprova o teste** (medido). Resta
  risco residual em dois cenários: um filho que nunca encerre travaria a suíte
  indefinidamente (o `node:test` não impõe timeout padrão), e um caminho de projeto que
  contenha `'` quebraria o script gerado — este repositório está hospedado em um caminho com
  espaços, que já funciona, mas o escape é frágil por construção.
- **Correção esperada**: acrescentar `child.on('error', reject)` e passar o caminho por
  argumento em vez de interpolá-lo, por exemplo
  `spawn(process.execPath, ['-e', 'const { formatarDataHora } = require(process.argv[1]); console.log(formatarDataHora(new Date(process.argv[2])));', caminhoDoApp, instante], { env })`
  — o que também elimina a dependência de `node` estar no `PATH` (`process.execPath`).

#### N6 — asserção negativa de cor cobre apenas hexadecimais de 6 dígitos em `<span>`

- **Severidade: Sugestão | NÃO BLOQUEANTE | Destinatário: QA**
- **Onde**: `:272` — `assert.doesNotMatch(res.text, /<span style="color: #(?!8b0000)[0-9a-f]{6}">/i)`
- **Problema**: a regra §2.3 ("nada mais colorido na página") passaria com `color: red`,
  `color: #f00` ou com cor aplicada a `<p>`/`<body>`. A asserção positiva de `:270` é exata
  e suficiente para `SC-007`; a negativa só dá uma falsa sensação de completude.
- **Correção esperada**: opcionalmente, trocar por uma contagem — nenhuma outra declaração
  `color:` no documento além da do `<span>` do valor — ou simplesmente remover a asserção
  negativa, mantendo a positiva.

### D. Determinismo, isolamento e limpeza de recursos

| Critério | Veredito |
|---|---|
| Porta fixa | Nenhuma. `supertest(app)` usa porta efêmera; `app.listen` continua sob `require.main === module`. Nenhum servidor permanece aberto |
| Rede externa | Nenhuma chamada. Única dependência de ambiente: a configuração de rede local lida por `getIpAddress` (ver N1) |
| Ordem de execução | Nenhum teste depende de outro. O único estado compartilhado (`htmlBody`) é morto (N2) |
| Relógio real | Nenhum teste compara o valor renderizado com `new Date()` do próprio teste, logo **não há risco de intermitência na virada de segundo**. O problema é o oposto: a ausência dessa comparação é o que cria o falso-verde de C1. A espera de 1100 ms em `:250` é suficiente e não é fonte de instabilidade |
| Fuso/locale do host | Os valores esperados são literais; os testes de subprocesso fixam `TZ` no ambiente do filho. Suíte verde sob `TZ` padrão, `UTC` e `Asia/Tokyo` (medido) |
| Processos filhos | Quatro filhos (`node -e`), cada um encerra sozinho e é aguardado em `close`; `stdout`/`stderr` consumidos. Nenhum filho sobrevive à suíte. Ressalvas de robustez em N5 |
| Encerramento do runner | `node --test` sai com código `0` sem *handle* pendurado; duração total ≈ 2,5 s |

### E. Conformidade com a constituição (apenas o que esta rodada acrescenta)

| Portão | Veredito |
|---|---|
| II — stack de testes `node:test` + `supertest` | Aprovado. Nenhum framework novo, nenhum *runner* alternativo, nenhum auxiliar de asserção externo; `node:assert/strict` em todo o arquivo |
| I — política de dependências | Aprovado. `3010ad3` não toca `package.json` nem `package-lock.json`; `npm ls --depth=0` inalterado |
| I — mudança mínima | Aprovado. Um único arquivo de teste novo, no diretório previsto (`test/aceite/`); nenhum código de produção alterado pelo QA |
| II — teste para comportamento observável | **Reprovado nesta rodada** — `FR-001` e `FR-007` seguem sem verificação efetiva (C1) |
| V — identificadores novos em português | **Reprovado nesta rodada** (C2) |
| III — testes que fixam o fuso | Aprovado, e agora com poder de detecção real (R2 fechada, confirmada por mutação) |

### F. Parecer da rodada complementar

**Reprovado.** O arquivo de testes do QA é, na maior parte, de boa qualidade: as asserções
de HTML são literais e exatas, os valores esperados são literais (não derivados da entrada),
não há `try/catch` engolindo falha, não há teste vazio nem `assert` ausente — exceto no caso
de C1 —, e as ressalvas R2 e R4 foram fechadas de forma verificável, com poder de detecção
comprovado por mutação. Mas a suíte **passa por motivo errado** em dois requisitos que a
rodada anterior já havia sinalizado como parciais: com o valor congelado no carregamento do
módulo, ou mesmo com uma data fixa escrita no código, os 31 testes continuam verdes. Como o
`qa-report.md` declara esses requisitos cobertos e zero defeitos, o PR seria aberto sobre
uma afirmação de cobertura que a medição refuta.

A correção é pequena (duas asserções, uma delas de uma linha) e foi validada pelo revisor
contra os mutantes e contra a intermitência. Nenhuma alteração em código de produção é
necessária: o `app.js` revisado na rodada anterior está correto nos dois mutantes testados —
o defeito é exclusivamente de poder de detecção dos testes.

#### Achados por severidade

| ID | Severidade | Bloqueante | Resumo | Destinatário |
|---|---|---|---|---|
| C1 | **Crítico** | **Sim** | `FR-001` e `FR-007`/`SC-005` sem asserção: suíte verde com valor congelado (M1) e com data fixa no código (M2) | QA (E6) |
| C2 | Alto (portão do Princípio V) | **Sim** | `htmlBody`, `scriptPath`, `child`, `match*`: identificadores novos em inglês | QA (E6) |
| N1 | Médio | Não | Asserção de IPv4 falha em host sem interface externa (falso vermelho) | QA |
| N2 | Baixo | Não | `htmlBody` morto + teste quase tautológico `obtém o HTML da página` | QA |
| N3 | Baixo | Não | H2 (`<meta charset="UTF-8">`) sem teste, declarado coberto | QA |
| N4 | Baixo | Não | Nomes de teste (`SC-003`, `SC-004`, "fuso America/Sao_Paulo") prometem mais do que verificam | QA |
| N5 | Sugestão | Não | Helper de subprocesso sem `on('error')`, sem timeout, com caminho interpolado | QA |
| N6 | Sugestão | Não | Asserção negativa de cor cobre só hex de 6 dígitos em `<span>` | QA |

**Próxima etapa sugerida**: retorno a E6 (QA) para fechar C1 e C2; em seguida, nova
verificação pontual destes dois itens antes de E7. Os achados N1–N6 podem ser endereçados na
mesma passagem ou seguir para a descrição do PR como ressalvas.
