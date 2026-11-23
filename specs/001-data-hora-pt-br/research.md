# Phase 0 — Pesquisa e Decisões Técnicas

**Feature**: `001-data-hora-pt-br` — Data/hora do servidor em formato pt-BR e destacada em vermelho

**Branch**: `001-data-hora-pt-br` | **Data**: 2026-11-23

**Entradas**: [spec.md](./spec.md) (aprovada), [constitution.md](../../.specify/memory/constitution.md) v1.0.0,
código atual (`app.js`, `views/index.ejs`, `package.json`)

**Ambiente verificado**: Node.js v24.20.0, npm 11.19.0, Windows 11 (shell Git Bash).

Todas as lacunas técnicas da feature estão resolvidas abaixo. Nenhuma pergunta técnica
restou em aberto e nenhuma exigiu consulta humana.

---

## D1 — Como formatar a data/hora no fuso `America/Sao_Paulo`

**Decisão**: usar `Intl.DateTimeFormat` da biblioteca padrão do Node.js, com
`timeZone: 'America/Sao_Paulo'`, `hourCycle: 'h23'` e campos `2-digit`
(ano `numeric`), e montar a cadeia final a partir de `formatToParts()`, concatenando
`dia/mês/ano hora:minuto:segundo` manualmente.

**Racional**:

- `formatToParts()` devolve os componentes já convertidos para o fuso pedido e já com
  zero à esquerda, o que atende `FR-003` e `FR-004` sem aritmética de datas própria.
- Montar o separador à mão é necessário: a formatação pronta do locale `pt-BR` insere
  **vírgula** entre data e hora. Verificação executada no ambiente real:

  ```text
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ... }).format(d)
  → "03/07/2026, 09:05:07"        ← vírgula: reprova FR-003
  montagem via formatToParts(d)
  → "03/07/2026 09:05:07"         ← 19 caracteres: atende FR-003/FR-004
  ```

- Concatenar os componentes numéricos torna a saída **independente dos dados de locale**
  instalados (um Node compilado com `small-icu` muda o texto do locale, mas não muda
  dia/mês/ano/hora/minuto/segundo). Isso sustenta `FR-011` e `SC-006`.
- `hourCycle: 'h23'` garante relógio de 24 horas com meia-noite como `00`, e não `24`
  (comportamento que `hour12: false` apresenta em algumas versões de ICU). Verificado:
  o instante `2026-11-24T03:00:00Z` produz `24/11/2026 00:00:00`.
- O banco de fusos do ICU resolve o offset vigente **na data do instante**, de modo que um
  eventual retorno do horário de verão brasileiro é acompanhado automaticamente, sem
  ajuste manual (caso de borda da spec).
- Custo zero de dependência: `Intl` é padrão do runtime (Princípio I).

**Evidências coletadas** (instantes fixos em UTC → saída esperada):

| Instante (UTC) | Saída | Requisito coberto |
|---|---|---|
| `2026-07-03T12:05:07Z` | `03/07/2026 09:05:07` | US1 cenário 1, `FR-003` |
| `2026-11-24T03:30:04Z` | `24/11/2026 00:30:04` | US1 cenário 3 (24 h, sem AM/PM) |
| `2026-11-24T03:00:00Z` | `24/11/2026 00:00:00` | borda: virada de meia-noite |
| `2027-01-01T02:00:00Z` | `31/12/2026 23:00:00` | borda: virada de ano/mês |
| `2026-01-05T15:07:09Z` | `05/01/2026 12:07:09` | `FR-004` (zeros à esquerda) |

Todas as saídas têm exatamente 19 caracteres.

**Alternativas descartadas**:

| Alternativa | Por que foi recusada |
|---|---|
| Manter `moment().format('DD/MM/YYYY HH:mm:ss')` | Continua no fuso do host: viola `FR-002` e o Princípio III. O `moment` puro não converte fuso. |
| Adicionar `moment-timezone` | Dependência nova (runtime, pesada, em modo *legacy* declarado pelo próprio projeto) para um problema que a stdlib resolve. Reprovada pela política de dependências do Princípio I: a resposta ao item (b) seria "a stdlib basta". |
| `date-fns-tz`, `luxon`, `dayjs/plugin/timezone` | Mesmo motivo: dependência nova sem necessidade; todas apoiam-se no mesmo ICU que o `Intl` já expõe. |
| `fmt.format(d).replace(', ', ' ')` | Depende do formato textual do locale, que varia entre versões de ICU e builds de Node; quebra silenciosamente. Reprovada por `FR-011`/`SC-006`. |
| `d.toLocaleString('pt-BR', { timeZone: ... })` | Mesma vírgula do caso acima e mesma fragilidade de locale. |
| Deslocar o instante em −3 h manualmente (`new Date(t - 3*3600e3)`) | Fixa o offset no código; erra se o horário de verão voltar (caso de borda explícito da spec) e duplica o banco de fusos do sistema. |
| Formatar no navegador com JavaScript de cliente | Proibido pelo Princípio IV e exibiria o fuso do visitante, violando `FR-002`. |

---

## D2 — Onde a formatação ocorre e como o valor chega ao template

**Decisão**: tudo no servidor, dentro de `app.js`:

1. Um formatador criado **uma única vez** no escopo do módulo (constante
   `formatadorDataHora`), já com `timeZone: 'America/Sao_Paulo'`.
2. Uma função pura `formatarDataHora(instante)` que recebe um `Date` e devolve a cadeia
   de 19 caracteres.
3. O handler de `GET /` chama `formatarDataHora(new Date())` e passa o resultado ao EJS
   na variável já existente `horaAtual`.

**Racional**:

- Criar o formatador uma vez evita reconstruí-lo a cada requisição (o construtor é a parte
  caro de `Intl`) e faz a falha de fuso aparecer no boot (ver D3).
- Receber o `instante` por parâmetro, em vez de ler o relógio dentro da função, é o que
  torna o formato verificável de forma determinística (`FR-011`, `SC-006`) — ver D10. Não
  é abstração antecipada: existe um **segundo consumidor real e imediato**, a suíte de
  testes, critério que o próprio Princípio I estabelece.
- Nenhum arquivo ou diretório novo de produção: `app.js` tem hoje 38 linhas e uma única
  rota. Criar `src/`, `lib/` ou um módulo `data-hora.js` para uma função de três linhas
  seria a camada extra que o Princípio I proíbe.

**Alternativas descartadas**:

| Alternativa | Por que foi recusada |
|---|---|
| Formatar inline dentro do handler, sem função nomeada | Impede asserção determinística sobre instantes fixos (`FR-011`); só o relógio real seria testável. |
| Módulo novo `lib/data-hora.js` (ou `src/`) | Cria diretório e camada para um único uso de produção; Princípio I (sem abstração antecipada, mudança mínima). |
| Formatar dentro do template EJS (`<%= ... %>` com lógica) | Lógica na view, não testável isoladamente e contrária à legibilidade exigida no Princípio V. |
| Middleware Express que injeta `res.locals.horaAtual` | Camada de infraestrutura para uma rota única; Princípio I. |

---

## D3 — Falha visível quando o fuso não puder ser resolvido

**Decisão**: não escrever tratamento de falha. Se o ambiente não resolver
`America/Sao_Paulo`, o construtor de `Intl.DateTimeFormat` lança `RangeError:
Invalid time zone specified: ...` (verificado no ambiente) e, como o formatador é criado
no escopo do módulo, o processo **não sobe**.

**Racional**: o caso de borda da spec exige que a falha seja visível em vez de silenciosa —
"a página MUST NOT exibir um horário em outro fuso como se fosse o de São Paulo". Uma falha
no boot é o sinal mais visível possível e custa zero linha de código. Qualquer `try/catch`
com valor de recuo (`fallback`) produziria exatamente o comportamento que a spec proíbe.

**Alternativas descartadas**: `try/catch` com recuo para UTC (viola o caso de borda);
mensagem de indisponibilidade na página (exige código de tratamento e nova decisão de
produto sobre o texto, sem requisito que a peça).

---

## D4 — Tom do vermelho e como o destaque é aplicado

**Decisão**: `#8b0000` (vermelho escuro), aplicado por atributo `style` inline em um
`<span>` que envolve **apenas** `<%= horaAtual %>` em `views/index.ejs`. O rótulo
permanece fora do `<span>`, na cor padrão.

**Racional do tom**: a razão de contraste WCAG 2.1 de `#8b0000` sobre o fundo da página
(`#ffffff`, padrão do agente de usuário — a página não declara `background`) é
**10,01:1**, mais que o dobro do mínimo de 4,5:1 exigido por `SC-007`, e sobra margem para
qualquer ajuste futuro de fundo claro. Cálculo executado com a fórmula de luminância
relativa do WCAG:

| Cor | vs `#ffffff` | Veredito `SC-007` (≥ 4,5:1) |
|---|---|---|
| `#8b0000` (**escolhido**) | **10,01:1** | aprovado com folga |
| `#a00000` | 8,42:1 | aprovado |
| `#b00020` | 7,33:1 | aprovado |
| `#c00000` | 6,48:1 | aprovado |
| `#d00000` | 5,70:1 | aprovado, margem curta |
| `#ff0000` (vermelho puro) | 4,00:1 | **reprovado** |

O vermelho puro reprova o critério — razão pela qual a spec pede "vermelho escuro
legível" e não "vermelho".

**Como o contraste será verificado** (três camadas, nenhuma dependente de inspeção
subjetiva):

1. **Determinística, automatizada**: o teste de aceite assere que o HTML renderizado
   contém o valor envolvido por um elemento com `color: #8b0000` e que o rótulo está fora
   desse elemento. Isso trava o par cor/elemento aprovado.
2. **Documental**: a razão 10,01:1 para o par `#8b0000`/`#ffffff` está calculada acima
   pela fórmula do WCAG 2.1; como o par é fixo no código e travado pelo teste, a razão não
   pode regredir sem o teste falhar.
3. **Manual pontual**, descrita em [quickstart.md](./quickstart.md): conferir o valor no
   painel de acessibilidade do navegador (DevTools mostra a razão de contraste calculada)
   ou em um verificador de contraste.

**Racional do mecanismo (inline `style`)**:

- É o menor diff possível: altera somente a linha que já existe em `views/index.ejs`,
  sem acrescentar bloco `<style>`, arquivo de CSS, diretório público ou middleware.
- Mantém a cor coladinha ao valor que ela destaca, o que torna `FR-005`
  ("somente o valor") legível no próprio template e trivialmente asserível no teste.
- Não introduz framework, biblioteca, *bundler* nem JavaScript de cliente: conforme
  Princípio IV.

**Alternativas descartadas**:

| Alternativa | Por que foi recusada |
|---|---|
| Bloco `<style>` no `<head>` com classe | Constrói duas peças (regra + classe) para uma única declaração de cor; o teste passaria a depender de duas asserções frouxamente acopladas. Princípio I. |
| Arquivo `public/estilos.css` + `express.static` | Acrescenta diretório, middleware e uma requisição HTTP extra; nada disso é pedido por requisito. Princípio I. |
| Tailwind, Bootstrap ou qualquer utilitário de CSS | Dependência e etapa de build; proibido pelos Princípios I e IV e pelas Restrições Técnicas (não há etapa de build). |
| `<font color="red">` ou atributo `color` | HTML obsoleto; e `red` (= `#ff0000`) reprova `SC-007`. |
| Pintar rótulo e valor | Viola `FR-005`, que restringe o destaque ao valor. |

**Premissa registrada**: o fundo considerado é o padrão claro do agente de usuário, porque
a página não declara `background` nem `color-scheme` hoje. Renderização forçada em tema
escuro pelo navegador afetaria igualmente o texto preto já existente na página — é
característica preexistente da página, não introduzida por esta feature, e está fora do
escopo desta entrega (nenhum `FR` pede tema escuro).

---

## D5 — Como o `app` será exposto ao `supertest`

**Decisão**: ao final de `app.js`, exportar `module.exports = { app, formatarDataHora };` e
condicionar a subida do servidor a `if (require.main === module) { app.listen(...) }`.

**Racional**:

- O Princípio II exige, literalmente, que "o módulo da aplicação MUST ser exportável para
  que `supertest` o consuma diretamente", sem servidor em execução nem porta fixa.
  `supertest(app)` abre uma porta efêmera por teste e a fecha ao final.
- Sem o guard `require.main === module`, cada `require('../app')` do teste subiria a porta
  3000 e um segundo arquivo de teste quebraria com `EADDRINUSE`.
- Exportar um objeto nomeado (em vez de `module.exports = app`) deixa `formatarDataHora`
  acessível ao teste de unidade (D10) sem truques de propriedade pendurada no `app`.
- `app`, `module`, `require` e `exports` são termos técnicos consagrados e permanecem em
  inglês, conforme autoriza o Princípio V.

**Alternativa descartada**: manter `app.listen` incondicional e testar contra
`http://localhost:3000` com `fetch` — depende de servidor já em execução e de porta fixa,
proibido explicitamente pelo Princípio II.

**Observação de porta**: as Restrições Técnicas pedem que configuração variável por
ambiente (como a porta) seja lida de variável de ambiente com valor padrão seguro. O
código atual fixa `const port = 3000`. Ler `process.env.PORT` é um ajuste de uma linha no
trecho que esta feature já altera (o bloco de `listen` passa a ser condicional), então
entra no escopo como adequação pontual — ver D9.

---

## D6 — Comando de teste do projeto

**Decisão**: `"test": "node --test"` em `package.json`. O comando de verificação do projeto
passa a ser `npm test`.

**Racional, com evidência**: no Node 22+ os argumentos posicionais de `--test` são tratados
como **padrões glob**, não como raízes de busca em diretório. Medido no ambiente real
(Node v24.20.0), com `test/unidade/*.test.js` e `test/aceite/*.test.js` presentes:

| Comando | Resultado medido |
|---|---|
| `node --test test/` | falha: tenta carregar o diretório como módulo (`MODULE_NOT_FOUND`), saída 1 |
| `node --test test` | mesma falha |
| `node --test ./test` | mesma falha |
| `node --test "test/**/*.test.js"` | 2 testes, 2 aprovados, saída 0 |
| `node --test` | 2 testes, 2 aprovados, saída 0 |

Escolhido `node --test` sem argumento: descobre recursivamente os arquivos `*.test.js` a
partir da raiz, ignora `node_modules` por padrão, dispensa aspas (que se comportam de
forma diferente entre `sh`, Git Bash e `cmd.exe` quando o npm executa o script) e não
precisa de ajuste quando um diretório de teste novo for criado. Códigos de saída
confirmados: **0** com a suíte verde, **1** com um teste falhando — exatamente o portão que
o Princípio II exige.

**Alternativas descartadas**: `node --test "test/**/*.test.js"` (funciona, mas acrescenta
dependência de aspas e de shell sem ganho); `jest`/`mocha`/`vitest` (dependências novas
proibidas pelas Restrições Técnicas, que fixam `node:test`); `node --test --watch` (modo
interativo, nunca encerra, incompatível com portão de CI).

---

## D7 — Dependência nova: `supertest` (devDependency)

Justificativa exigida pelo Princípio I:

**(a) Qual requisito ela atende**: a verificação de comportamento HTTP observável — os
requisitos `FR-001` a `FR-011` só são verificáveis na resposta renderizada de `GET /`
(máscara, rótulo em pt-BR, `<span>` com a cor, ausência de script de atualização,
permanência da linha de IP), e os critérios `SC-001`, `SC-002`, `SC-006`, `SC-008` e
`SC-009` pressupõem essa verificação automatizada, conforme a própria seção *Assumptions*
da spec. É também exigência direta do Princípio II.

**(b) Por que a stdlib ou as dependências atuais não bastam**: a alternativa com a
biblioteca padrão seria `app.listen(0)` + descoberta da porta efêmera + `fetch` + desligamento
do servidor em cada arquivo de teste — código de ciclo de vida e de porta escrito à mão,
justamente o que o Princípio II proíbe ("sem depender de um servidor já em execução nem de
porta fixa"). Além disso, a decisão **já está tomada na constituição**: as Restrições
Técnicas fixam a stack de testes como "`node:test` (nativo) + `supertest`", de modo que
instalar `supertest` é ato de conformidade, não escolha nova de biblioteca. Entra apenas
como `devDependency`, sem efeito no runtime de produção.

**Versão alvo**: `supertest@^7` (7.3.2 publicada no registro no momento do plano).

**Saldo de dependências desta feature**: **+1 devDependency** (`supertest`) e
**−2 dependencies** de runtime (`moment` e `os`, ver D8).

---

## D8 — Remoção de `moment` e do pacote npm `os`

**Decisão**: remover ambas de `package.json` (e de `package-lock.json`, no mesmo commit).

**Racional**:

- `moment` é usado em **exatamente uma linha** (`app.js:16`), que é justamente a linha que
  esta feature substitui por `Intl` (D1). Depois da troca, a dependência fica órfã. Não é
  refatoração alheia ao escopo: é a limpeza imediata do que esta mudança torna morto.
- O pacote npm `os` é redundante — `os` é módulo nativo do Node.js e os módulos internos
  têm precedência na resolução, de modo que `require('os')` em `app.js:2` já resolve para
  o nativo hoje. Remover a entrada do `package.json` **não exige nenhuma alteração de
  código** e é um MUST explícito do Princípio I: "Pacotes npm que apenas duplicam módulos
  nativos do Node.js MUST ser removidos quando identificados". A constituição já os
  identificou.
- Risco: nulo e coberto por teste — o teste de aceite assere que a linha de endereço IP
  continua presente na página (`FR-009`).

---

## D9 — Pendências de conformidade do código atual: o que entra no escopo

A constituição v1.0.0 registra cinco pendências. Critério aplicado: entra no escopo o que
é **pré-requisito** de algum `FR`/`SC` desta feature ou MUST explícito disparado pelo
trecho que a feature já altera; fica fora o que é refatoração de código alheio ao escopo,
porque o Princípio I proíbe refatorar código que não faça parte do escopo pedido e
prevalece em colisões (Fluxo de Desenvolvimento, item 6).

| # | Pendência | Decisão | Fundamento |
|---|---|---|---|
| 1 | Script `test` inválido em `package.json` | **Entra** | Sem ele não existe portão `npm test` e o Princípio II (inegociável) não pode ser cumprido; é o comando de verificação desta etapa. Ver D6/D7. |
| 2 | `moment()` sem fuso explícito (`app.js:16`) | **Entra** | É o próprio objeto da feature (`FR-002`, `FR-003`). Ver D1. |
| 4 | `app` não exportado | **Entra** | Pré-requisito prático do Princípio II: sem exportar, `supertest` não consome a aplicação. Ver D5. |
| 5 | Pacote npm `os` redundante | **Entra** | MUST explícito do Princípio I, custo zero, nenhuma mudança de código, e `package.json` já é alterado por esta feature. Ver D8. |
| 3 | `getIpAddress` em inglês (`app.js:23`) | **Fica fora** | Ver abaixo. |

**Por que a renomeação de `getIpAddress` fica fora**: a função trata de descoberta de
endereço IP, assunto que nenhum requisito desta feature toca; `FR-009` exige, ao
contrário, que a informação de IP permaneça **inalterada**. O Princípio I é taxativo — "É
PROIBIDO refatorar, reorganizar diretórios ou generalizar código que não faça parte do
escopo pedido" — e o item 6 do Fluxo de Desenvolvimento determina que, em colisão entre
princípios, o Princípio I prevalece (exceto contra o Princípio II, que aqui não está em
jogo: a renomeação não habilita nenhum teste). O Princípio V, por sua vez, já condiciona a
renomeação obrigatória ao caso em que "o código que os contém for alterado pelo escopo da
mudança", e o corpo da função não é alterado por esta entrega.

**Dívida técnica registrada** (não é bloqueio desta feature): renomear `getIpAddress` →
`obterEnderecoIp` em uma mudança dedicada, ou na próxima feature cujo escopo alcance a
descoberta de IP. A pendência segue registrada na constituição, que é o lugar onde já está
rastreada.

**Adequação pontual admitida**: ler a porta de `process.env.PORT` com padrão `3000`, por
ser MUST das Restrições Técnicas e cair exatamente no bloco de `listen` que a feature já
reescreve para ficar condicional (D5). Uma linha, sem comportamento observável novo.

---

## D10 — Estratégia de teste determinística e independente do fuso da máquina

**Decisão**: duas camadas, ambas sob `node --test`.

**Camada 1 — unidade, sobre `formatarDataHora` (`test/unidade/`)**: assere a cadeia
**exata** para instantes UTC fixos (tabela de D1). Como a função recebe o instante por
parâmetro e o formatador fixa `timeZone: 'America/Sao_Paulo'`, o resultado não depende do
relógio nem do fuso da máquina. Cobre `FR-002`, `FR-003`, `FR-004`, as bordas de
meia-noite, virada de mês/ano e zeros à esquerda, e o comprimento de 19 caracteres.

**Prova explícita de independência de ambiente** (`FR-011`, `SC-002`, `SC-006`): um teste
altera `process.env.TZ` em tempo de execução e reafirma a mesma saída. Medido no ambiente:

```text
instante 2026-07-03T12:05:07Z
TZ=UTC                   → Date#getHours()=12 → saída "03/07/2026 09:05:07"
TZ=Asia/Tokyo            → Date#getHours()=21 → saída "03/07/2026 09:05:07"
TZ=America/Sao_Paulo     → Date#getHours()= 9 → saída "03/07/2026 09:05:07"
TZ=America/Los_Angeles   → Date#getHours()= 5 → saída "03/07/2026 09:05:07"
```

O `getHours()` varia (prova de que a troca de `TZ` fez efeito de verdade) e a saída não
varia — exatamente o que `SC-002` pede ao exigir "pelo menos dois fusos distintos do
host". O teste restaura o valor original de `process.env.TZ` ao final.

**Camada 2 — aceite HTTP com `supertest` (`test/aceite/`)**: `GET /` e asserções sobre o
HTML renderizado — status 200, `Content-Type` HTML, `lang="pt-br"`, rótulo em pt-BR, valor
batendo com a expressão `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$` (forma, pois aqui o
relógio é real), valor envolvido pelo `<span>` com `color: #8b0000` e rótulo fora dele,
linha de IP e título preservados, e ausência de `<script>`, `fetch`, `setInterval` e
`<meta http-equiv="refresh">` no corpo da resposta (`FR-006`, `SC-009`). A repetibilidade
exigida por `SC-006` ("três execuções consecutivas") é propriedade da suíte: nenhuma
asserção depende de relógio, fuso, locale do host ou de ordem entre arquivos.

**Alternativas descartadas**:

| Alternativa | Por que foi recusada |
|---|---|
| Simular o relógio com *fake timers* / biblioteca de mock de tempo | `node:test` oferece `mock.timers`, mas congelar `Date` globalmente é mais invasivo e frágil do que passar o instante por parâmetro, que já resolve. |
| Injetar um relógio por parâmetro na rota ou por variável de ambiente | Abstração/configuração antecipada em código de produção só para o teste; Princípio I. |
| Rodar a suíte duas vezes (`TZ=UTC npm test` e `TZ=America/Sao_Paulo npm test`) | Exigiria dois comandos de verificação e sintaxe de variável de ambiente diferente por shell (Windows/Linux). A troca de `TZ` dentro do teste cobre o mesmo critério com um único `npm test`. |
| Asserção apenas por expressão regular, sem valor exato | Não distingue `dd/mm` de `mm/dd` em datas ambíguas nem valida a conversão de fuso; insuficiente para `SC-001`/`SC-002`. |

---

## D11 — Diretórios de teste e divisão de responsabilidade

**Decisão**:

- `test/unidade/` — testes unitários, de responsabilidade do **Desenvolvedor** (E4).
  Arquivo previsto: `test/unidade/data-hora.test.js`.
- `test/aceite/` — testes de aceite ponta a ponta via HTTP, de responsabilidade do **QA**
  (E5). Arquivo previsto: `test/aceite/pagina-inicial.test.js`.

**Racional**: a separação por diretório deixa explícito quem mantém o quê e é descoberta
automaticamente por `node --test` (verificado: os dois subdiretórios foram varridos em uma
única execução). Nomes em português, conforme Princípio V. Nenhum arquivo de configuração
de teste é necessário.

**Alternativa descartada**: um único arquivo `test/app.test.js` — mistura as duas
responsabilidades e cria conflito de edição entre as etapas E4 e E5.

---

## D12 — Vocabulário e rótulo preservados

**Decisão**: manter o nome da variável `horaAtual` e o rótulo `Hora Atual do Servidor:`
exatamente como estão.

**Racional**: `horaAtual` já é português e é o vocabulário citado pelo próprio Princípio V
como referência do projeto; renomear propagaria mudança sem requisito que a peça. O rótulo
já cumpre `FR-008` (pt-BR) e `US2` cenário 3 (identificação sem cor). Nenhum requisito pede
texto novo, e `FR-009` pede estabilidade do conteúdo existente. Identificador novo criado
por esta feature: `formatarDataHora` e `formatadorDataHora`, ambos em português.

**Alternativa descartada**: trocar o rótulo para "Data/Hora Atual do Servidor" — mais
preciso, porém nenhum `FR` o exige e a mudança de texto visível pediria nova decisão de
produto. Registrado como sugestão, fora do escopo.

---

## D13 — Lint e build

**Decisão**: não há comando de lint nem de build neste projeto, e esta feature **não**
introduz nenhum.

**Racional**: as Restrições Técnicas afirmam que "não há etapa de build" e que o código
versionado deve ser executável diretamente por `node`. Introduzir ESLint/Prettier seria
dependência nova cuja justificativa (a) falharia: nenhum requisito desta feature depende
de lint, e o Princípio II já estabelece `npm test` como o portão objetivo do projeto.

---

## D14 — Resumo das decisões

| ID | Decisão | Efeito em dependências |
|---|---|---|
| D1 | `Intl.DateTimeFormat` + `formatToParts`, `America/Sao_Paulo`, `hourCycle: h23` | nenhuma (stdlib) |
| D2 | `formatarDataHora(instante)` em `app.js`, formatador no escopo do módulo | — |
| D3 | Falha de fuso derruba o boot, sem tratamento | — |
| D4 | `#8b0000` inline em `<span>` só no valor (10,01:1 sobre branco) | nenhuma |
| D5 | `module.exports = { app, formatarDataHora }` + `require.main === module` | — |
| D6 | `npm test` → `node --test` | — |
| D7 | `supertest@^7` como devDependency | +1 dev |
| D8 | Remover `moment` e o pacote npm `os` | −2 runtime |
| D9 | Renomeação de `getIpAddress` fora do escopo (dívida registrada) | — |
| D10 | Unidade com instantes fixos + troca de `TZ`; aceite HTTP com `supertest` | — |
| D11 | `test/unidade/` (Dev) e `test/aceite/` (QA) | — |
| D12 | `horaAtual` e rótulo preservados | — |
| D13 | Sem lint e sem build | nenhuma |
