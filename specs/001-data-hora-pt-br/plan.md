# Implementation Plan: Data/hora do servidor em formato pt-BR e destacada em vermelho

**Branch**: `001-data-hora-pt-br` | **Date**: 2026-11-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-data-hora-pt-br/spec.md`

**Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0

## Summary

A página inicial de informações do servidor (`GET /`) passa a exibir a data/hora do
instante da requisição na máscara brasileira `dd/mm/aaaa hh:mm:ss`, sempre no fuso
`America/Sao_Paulo` declarado de forma explícita, com o **valor** (e não o rótulo)
destacado em vermelho escuro. O valor permanece estático por requisição: sem relógio ao
vivo, sem consulta periódica e sem JavaScript de cliente.

Abordagem técnica, em uma frase: trocar `moment().format('YYYY-MM-DD HH:mm:ss')` por uma
função pura `formatarDataHora(instante)` apoiada em `Intl.DateTimeFormat` da biblioteca
padrão do Node (fuso fixo, `hourCycle: 'h23'`, montagem via `formatToParts`), envolver o
valor em um `<span style="color: #8b0000">` no template EJS e, para que isso seja
verificável, tornar o módulo `app.js` exportável e criar a suíte `node:test` +
`supertest` que o projeto ainda não possui.

São quatro arquivos de produto tocados (`app.js`, `views/index.ejs`, `package.json`,
`package-lock.json`), dois arquivos de teste criados e nenhum diretório novo de código de
produção. Saldo de dependências: **+1 devDependency** (`supertest`) e **−2 dependências de
runtime** (`moment`, pacote npm redundante `os`).

Decisões, alternativas descartadas e evidências medidas no ambiente real:
[research.md](./research.md).

## Technical Context

**Language/Version**: JavaScript (CommonJS), Node.js 18+ com ICU completo; ambiente de
referência medido **Node v24.20.0 / npm 11.19.0**

**Primary Dependencies**: Express 4 (servidor HTTP), EJS 3 (view engine),
`Intl.DateTimeFormat` da biblioteca padrão do Node (formatação de data/hora com fuso).
Nenhuma dependência nova de runtime; `moment` e o pacote npm `os` são **removidos**

**Storage**: nenhum. Sem banco de dados, sem persistência, sem cache e sem estado entre
requisições — logo, **sem estratégia de migração e sem massa de dados a provisionar**
(Restrições Técnicas da constituição)

**Testing**: `node:test` (runner nativo) + `supertest@^7` (devDependency nova, justificada
em [research.md](./research.md) D7). Testes unitários em `test/unidade/` (Desenvolvedor);
testes de aceite HTTP em `test/aceite/` (QA)

### Comandos de verificação (contrato desta feature)

| Finalidade | Comando | Observação |
|---|---|---|
| **Teste (obrigatório)** | `npm test` → `node --test` | Portão do Princípio II. Sai com `0` com a suíte verde e `1` com qualquer falha (ambos medidos no ambiente). Passa a ser o valor do script `test` em `package.json`, hoje inválido |
| **Lint** | não existe (`null`) | O projeto não tem linter e esta feature não introduz nenhum; dependência sem requisito que a sustente seria recusada pela política do Princípio I ([research.md](./research.md) D13) |
| **Build / typecheck** | não existe (`null`) | As Restrições Técnicas determinam que não há etapa de build e que o código versionado é executável direto por `node` |
| **Cobertura** | não aplicável | A constituição não exige cobertura mínima |

Forma canônica para registro de estado:
`{"test": "npm test", "lint": null, "build": null}`

A forma `node --test test/` **não** funciona no Node 22+ (os posicionais são tratados como
glob e o diretório é carregado como módulo); por isso o script usa `node --test` sem
argumento, que varre recursivamente `test/unidade/` e `test/aceite/` e ignora
`node_modules`. Medições em [research.md](./research.md) D6.

**Target Platform**: servidor Node.js executado localmente ou em container; navegadores
modernos como consumidores do HTML renderizado. Independente do fuso e do locale
configurados no host, por construção

**Project Type**: aplicação web monolítica com renderização no servidor (Express + EJS),
sem frontend separado e sem API — Princípio IV

**Performance Goals**: nenhuma meta nova. A formatação é O(1) por requisição e o formatador
`Intl` é construído **uma única vez** no escopo do módulo, não a cada requisição

**Constraints**:

- Fuso `America/Sao_Paulo` sempre explícito; é proibido depender do fuso do host, do
  processo ou do visitante (`FR-002`, Princípio III)
- Valor com exatamente 19 caracteres, separador de um espaço simples, relógio de 24 h
  (`FR-003`, `FR-004`)
- Destaque restrito ao valor, com contraste ≥ 4,5:1 (`FR-005`, `SC-007`)
- Zero JavaScript de cliente, zero requisição adicional após o carregamento (`FR-006`,
  `SC-009`)
- Proibido framework/biblioteca de frontend e proibido endpoint de API para alimentar
  cliente JS (Princípio IV)
- Resultado verificável de forma determinística, igual em qualquer fuso/locale de máquina
  (`FR-011`, `SC-006`)
- `package-lock.json` alterado no mesmo commit que `package.json`
- Nenhum segredo ou credencial envolvido; a única configuração de ambiente é `PORT`, lida
  de `process.env.PORT` com padrão `3000`. Os testes não precisam de variável de ambiente
  alguma (nem valor de teste, nem mock, nem stub); o único ambiente manipulado é
  `process.env.TZ`, alterado e restaurado dentro do próprio teste para provar
  independência de fuso

**Scale/Scope**: 1 rota (`GET /`), 1 template EJS, 1 função nova de formatação, 2 arquivos
de teste novos, 4 arquivos de produto tocados. `app.js` tem 38 linhas hoje; o plano
acrescenta cerca de 10

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliação contra a constituição v1.0.0. **Resultado: APROVADO** — antes da Fase 0 e
reavaliado após a Fase 1, sem violações e, portanto, sem nada a registrar em
*Complexity Tracking*.

| Portão | Veredito | Evidência no plano |
|---|---|---|
| **I. Simplicidade e Mudanças Mínimas** | Aprovado | Nenhum diretório, módulo, camada ou arquivo de configuração novo no código de produção. A formatação fica em `app.js`, onde já estava. Sem abstração antecipada: a função recebe o instante por parâmetro porque existe um segundo consumidor **real e imediato** (a suíte de testes), critério que o próprio princípio estabelece. O diff em `views/index.ejs` é de uma linha |
| **I. Política de dependências** | Aprovado | Uma única dependência nova, `supertest`, apenas de desenvolvimento, com justificativa (a)/(b) escrita em [research.md](./research.md) D7 — e exigida nominalmente pelas Restrições Técnicas. Em contrapartida, `moment` (que esta mudança torna órfã) e o pacote npm `os` (duplicata de módulo nativo, cuja remoção é MUST explícito do princípio) são removidos. Saldo: −1 dependência no total, −2 em runtime |
| **I. Sem refatoração fora do escopo** | Aprovado | A renomeação de `getIpAddress` é deliberadamente **excluída**: trata de assunto que nenhum requisito desta feature toca e `FR-009` exige que a informação de IP permaneça inalterada. Decisão e dívida registradas em [research.md](./research.md) D9 |
| **II. Testes Automatizados Obrigatórios** | Aprovado | A feature cria a suíte que hoje não existe. `npm test` passa a rodar `node --test` e sai com `0`; toda mudança de comportamento observável desta entrega tem teste correspondente (ver a matriz de rastreabilidade adiante). `app` é exportado e consumido por `supertest` sem servidor em execução e sem porta fixa, com `app.listen` condicionado a `require.main === module` |
| **III. Português do Brasil e fuso explícito** | Aprovado | `lang="pt-br"` mantido; rótulo e textos em pt-BR (`FR-008`); `timeZone: 'America/Sao_Paulo'` fixo no formatador, nunca o fuso do host; os testes fixam instantes e trocam `process.env.TZ` para provar que o resultado não varia com o ambiente, exatamente como o princípio exige |
| **IV. Renderização no Servidor com EJS** | Aprovado | Formatação no servidor, entrega por `res.render('index', { ip, horaAtual })`. Nenhum framework, biblioteca, *bundler* ou SPA. Nenhum endpoint novo. Nenhum JavaScript de navegador — o teste de aceite assere a **ausência** de `<script>`, `fetch`, `setInterval` e `meta refresh` |
| **V. Nomenclatura em português** | Aprovado | Identificadores novos: `formatarDataHora`, `formatadorDataHora`, `test/unidade/`, `test/aceite/`, `data-hora.test.js`, `pagina-inicial.test.js`. `horaAtual` e `ip` preservados. Termos técnicos consagrados (`app`, `req`, `res`, `module`, `require`) permanecem em inglês, conforme autoriza o princípio |
| **Restrições Técnicas** (stack fixa) | Aprovado | Node + Express + EJS + `node:test`/`supertest`, sem desvio. Sem banco, sem persistência, sem etapa de build. `PORT` lida de variável de ambiente com padrão seguro. `package-lock.json` acompanha `package.json` no mesmo commit |
| **Fluxo de Desenvolvimento** | Aprovado | Trabalho na branch dedicada `001-data-hora-pt-br`, criada a partir de `main`; integração por pull request com revisão e merge humanos. Nenhum merge automático. Este plano não executa commit, push nem merge |

**Reavaliação pós-Fase 1**: o desenho das Fases 0 e 1 não introduziu arquivo, camada,
dependência ou endpoint além do previsto acima. Os artefatos de desenho
([research.md](./research.md), [data-model.md](./data-model.md),
[contracts/pagina-inicial.md](./contracts/pagina-inicial.md),
[quickstart.md](./quickstart.md)) são documentação em `specs/`, sem efeito sobre o código.
Veredito mantido: **APROVADO, sem violações**.

## Project Structure

### Documentation (this feature)

```text
specs/001-data-hora-pt-br/
├── spec.md                      # Entrada: especificação aprovada (Checkpoint 1)
├── plan.md                      # Este arquivo (saída do speckit-plan)
├── research.md                  # Fase 0: decisões técnicas D1–D14 e alternativas
├── data-model.md                # Fase 1: entidade efêmera e invariantes V1–V9
├── quickstart.md                # Fase 1: validação ponta a ponta
├── contracts/
│   └── pagina-inicial.md        # Fase 1: contrato de GET /, do HTML e do módulo app.js
├── checklists/
│   └── requirements.md          # Entrada: checklist de qualidade da spec (16/16)
└── tasks.md                     # Fase 2 (speckit-tasks — NÃO criado por este comando)
```

### Source Code (repository root)

```text
.
├── app.js                       # ALTERADO: formatador Intl no escopo do módulo,
│                                #   formatarDataHora(instante), rota GET / usando-a,
│                                #   module.exports = { app, formatarDataHora },
│                                #   app.listen condicionado a require.main === module,
│                                #   porta de process.env.PORT com padrão 3000
├── views/
│   └── index.ejs                # ALTERADO: uma linha — valor envolvido por
│                                #   <span style="color: #8b0000">, rótulo fora do span
├── package.json                 # ALTERADO: script test -> "node --test";
│                                #   + devDependencies.supertest;
│                                #   - dependencies.moment; - dependencies.os
├── package-lock.json            # ALTERADO: no mesmo commit que package.json
└── test/                        # NOVO (único diretório criado)
    ├── unidade/                 # Testes unitários — responsabilidade do Desenvolvedor (E4)
    │   └── data-hora.test.js    #   NOVO: máscara exata em instantes fixos, zeros à
    │                            #   esquerda, 24 h/meia-noite, virada de ano, 19
    │                            #   caracteres, invariância a process.env.TZ
    └── aceite/                  # Testes de aceite — responsabilidade do QA (E5)
        └── pagina-inicial.test.js  # NOVO: GET / 200 + HTML, lang=pt-br, rótulo pt-BR,
                                 #   valor na máscara, span com a cor só no valor,
                                 #   IP e título preservados, ausência de script/refresh
```

**Arquivos explicitamente NÃO tocados**: nenhum outro arquivo do repositório. Sem `src/`,
sem `lib/`, sem `public/`, sem middleware novo, sem arquivo de configuração de lint, build
ou teste, sem rota nova.

**Structure Decision**: projeto único e plano, exatamente o que já existe — `app.js` na
raiz como ponto de entrada e `views/` para os templates EJS. A única estrutura nova é
`test/`, subdividida em `test/unidade/` (Desenvolvedor) e `test/aceite/` (QA) para separar
responsabilidades entre as etapas E4 e E5 e evitar conflito de edição no mesmo arquivo. Não
se adota layout `src/`+`tests/` nem separação `backend/`+`frontend/`: a aplicação tem uma
rota, um template e 38 linhas de código: reorganizar diretórios é vedado pelo Princípio I e
não atende a nenhum requisito.

## Rastreabilidade: requisitos × plano

Todo `FR` e todo `SC` da spec está endereçado por uma decisão técnica e por uma
verificação.

| Requisito | Como o plano atende | Onde se verifica |
|---|---|---|
| `FR-001` instante da requisição | `new Date()` dentro do handler de `GET /`, por requisição | `test/aceite` (valor presente e na máscara) |
| `FR-002` fuso `America/Sao_Paulo` explícito | `timeZone` fixo no formatador `Intl` (D1); jamais o fuso do host | `test/unidade` (instantes UTC fixos → valor de SP; troca de `TZ`) |
| `FR-003` máscara `dd/mm/aaaa hh:mm:ss` | Montagem via `formatToParts` + `hourCycle: 'h23'`; separador de espaço escrito à mão porque o locale usa vírgula (D1) | `test/unidade` (cadeia exata); `test/aceite` (expressão de forma) |
| `FR-004` zeros à esquerda, 19 caracteres | Campos `2-digit`, ano `numeric` (D1); invariantes V1 e V5 | `test/unidade` (comprimento e casos de um dígito) |
| `FR-005` vermelho só no valor | `<span style="color: #8b0000">` envolvendo apenas `<%= horaAtual %>`; rótulo fora (D4) | `test/aceite` (span com a cor + rótulo fora dele) |
| `FR-006` valor estático, sem atualização automática | Nenhum JavaScript de cliente, nenhum `meta refresh`, nenhum endpoint de atualização (D4, Princípio IV) | `test/aceite` (ausência de `script`/`fetch`/`setInterval`/`refresh`); quickstart passo 8 |
| `FR-007` novo valor por carregamento | Sem cache e sem memoização; o instante é lido a cada requisição | quickstart passo 9 |
| `FR-008` textos em pt-BR | Rótulo `Hora Atual do Servidor:` preservado; `lang="pt-br"` | `test/aceite` (rótulo e `lang`) |
| `FR-009` IP e título inalterados | `getIpAddress` e o restante do template intocados; renomeação deliberadamente fora do escopo (D9, D12) | `test/aceite` (linha de IP, `h1` e `title`) |
| `FR-010` só a página inicial | Alteração restrita a `GET /` e `views/index.ejs`; nenhuma rota nova, nenhuma regra global de estilo (contrato seção 1) | revisão do diff; contrato de rota única |
| `FR-011` verificável de forma determinística | Função pura com instante por parâmetro e fuso fixo (D2, D10) | `test/unidade` (mesma saída com `TZ` = UTC, Tóquio, SP, Los Angeles) |
| `SC-001` 100% na máscara brasileira | Máscara única e centralizada em uma função | `test/unidade` + `test/aceite` |
| `SC-002` correto em ≥ 2 fusos de host | Independência por construção, comprovada por medição (D10) | `test/unidade` (troca de `TZ`); quickstart `TZ=UTC node app.js` |
| `SC-003` localizável em até 3 s | Destaque em vermelho escuro no valor, único elemento colorido da página | quickstart Validação 2, item 5 |
| `SC-004` valor idêntico por ≥ 60 s | HTML estático, sem script algum | quickstart passo 8 |
| `SC-005` valores diferentes em cargas distantes | Instante lido a cada requisição | quickstart passo 9 |
| `SC-006` mesmo resultado em 3 execuções e em fusos diferentes | Nenhuma asserção depende de relógio, fuso, locale ou ordem de arquivos (D10) | `npm test` três vezes e sob três `TZ` (quickstart Validação 1) |
| `SC-007` contraste ≥ 4,5:1 | `#8b0000` sobre `#ffffff` = **10,01:1** pela fórmula do WCAG 2.1; vermelho puro reprovaria com 4,00:1 (D4) | `test/aceite` trava o par cor/elemento; memória de cálculo em D4; conferência no DevTools (quickstart Validação 3) |
| `SC-008` 100% dos textos em pt-BR | Nenhum texto novo é introduzido; os existentes já estão em pt-BR | `test/aceite` (rótulos e `lang`) |
| `SC-009` zero requisições de atualização | Sem script, sem CSS externo, sem recurso novo (D4, contrato seção 2.2) | `test/aceite` (ausências); aba Rede (quickstart passo 10) |

Casos de borda da spec cobertos: fuso do host divergente (`test/unidade` + quickstart);
retorno eventual do horário de verão (offset resolvido pelo banco de fusos do ICU na data
do instante, sem ajuste manual — D1); virada de meia-noite e de ano (instantes fixos no
`test/unidade`); componentes de um dígito (idem); página aberta por horas (quickstart);
duas requisições quase simultâneas (sem cache, ambos os valores válidos); ambiente sem
dados de fuso (falha no boot, sem valor de recuo — D3); relógio dessincronizado
(explicitamente fora do escopo).

## Phase 0 — Outline & Research

Concluída. Saída: [research.md](./research.md), com 14 decisões (D1–D14), alternativas
descartadas e evidências medidas em Node v24.20.0 (saída do `Intl` com e sem
`formatToParts`, invariância de fuso, falha de fuso inválido, razões de contraste de seis
tons de vermelho, comportamento e códigos de saída das variantes de `node --test`).
Nenhuma lacuna técnica permanece aberta e nenhuma dúvida de requisito foi encontrada.

Decisões de maior impacto: `Intl.DateTimeFormat` + `formatToParts` em vez de qualquer
biblioteca de data (D1); remoção de `moment` e do pacote npm `os` (D8); `#8b0000` como tom
aprovado (D4); `node --test` sem argumento como comando de teste (D6); limite de escopo das
pendências de conformidade registradas na constituição (D9).

## Phase 1 — Design & Contracts

Concluída.

- [data-model.md](./data-model.md) — a entidade **Data/hora do servidor** modelada como
  objeto de valor efêmero (`instante`, `fusoDeReferencia`, `horaAtual`), seu ciclo de vida
  por requisição e os invariantes de saída V1–V9 derivados dos requisitos. Declarado
  explicitamente: **sem persistência, sem banco, sem migração, sem massa de dados**.
- [contracts/pagina-inicial.md](./contracts/pagina-inicial.md) — contrato da interface
  externa: `GET /` (status, `Content-Type`, ausência de parâmetros e de rotas novas),
  contrato do HTML renderizado (9 elementos obrigatórios, 5 proibições), contrato do valor
  `horaAtual`, contrato do módulo (`module.exports = { app, formatarDataHora }` e
  `app.listen` condicional) com cinco pares entrada/saída de referência, e contrato de
  verificação. Esta é a interface que a aplicação expõe; por isso `contracts/` **é**
  aplicável aqui, ainda que não haja API JSON.
- [quickstart.md](./quickstart.md) — cinco validações executáveis: suíte automatizada
  (incluindo três execuções consecutivas e três fusos de host), aplicação em execução com
  conferência por navegador e por `curl`, contraste, legibilidade sem cor e falha visível
  de fuso. Termina com o critério de pronto da feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Não aplicável: o `Constitution Check` foi **aprovado sem violações**, antes da Fase 0 e na
reavaliação pós-Fase 1. Nenhuma complexidade extra foi introduzida, nenhuma exceção à
constituição é solicitada e nada precisa ser justificado nesta seção.

Registro de transparência, sem violação envolvida: a renomeação de `getIpAddress` para
`obterEnderecoIp` — pendência de conformidade com o Princípio V já anotada na constituição
— fica **fora do escopo** desta feature, porque o Princípio I proíbe refatorar código
alheio ao escopo pedido e prevalece em colisões entre princípios (Fluxo de
Desenvolvimento, item 6), e porque `FR-009` exige que a informação de IP permaneça
inalterada. Racional completo em [research.md](./research.md) D9.

## Próxima etapa

`speckit-tasks` (Criador de Tarefas, E3) para gerar `tasks.md` a partir destes artefatos.
A criação de `tasks.md` não faz parte deste comando.
