<!--
Sync Impact Report (material temporário de revisão — remover antes do commit final)

- Mudança de versão: (template não preenchido) → 1.0.0
- Tipo de bump: MAJOR inicial (ratificação original; o arquivo anterior continha
  apenas placeholders, sem nenhuma regra de governança em vigor)

- Princípios definidos (todos novos):
  - [PRINCIPLE_1_NAME] → I. Simplicidade e Mudanças Mínimas
  - [PRINCIPLE_2_NAME] → II. Testes Automatizados Obrigatórios (NÃO NEGOCIÁVEL)
  - [PRINCIPLE_3_NAME] → III. Português do Brasil e Fuso America/Sao_Paulo
  - [PRINCIPLE_4_NAME] → IV. Renderização no Servidor com EJS
  - [PRINCIPLE_5_NAME] → V. Código Legível com Nomenclatura em Português

- Seções adicionadas:
  - [SECTION_2_NAME] → Restrições Técnicas (stack fixa, política de dependências)
  - [SECTION_3_NAME] → Fluxo de Desenvolvimento (branch, PR, portões de qualidade)
  - Governance → procedimento de emenda, versionamento, revisão de conformidade

- Seções removidas: nenhuma

- Pendências de conformidade identificadas no código atual (não corrigidas aqui;
  este comando altera apenas a constituição):
  1. `package.json` → script `test` é `echo "Error: no test specified" && exit 1`,
     violando o Princípio II. Falta instalar `supertest` como devDependency e
     apontar o script para `node --test`.
  2. `app.js:16` → `moment().format(...)` usa o fuso local do servidor, sem
     garantir `America/Sao_Paulo` (Princípio III). Exige fixar o fuso de forma
     explícita (ex.: `Intl.DateTimeFormat` com `timeZone`) ou justificar.
  3. `app.js:23` → função `getIpAddress` em inglês, divergindo do Princípio V
     (renomeação sugerida: `obterEnderecoIp`).
  4. `app.js` não exporta o `app`, o que impede testes com `supertest` sem subir
     a porta 3000 (bloqueio prático para o Princípio II).
  5. Dependência `os` em `package.json` é um pacote npm redundante — `os` é
     módulo nativo do Node.js (Princípio I, política de dependências).

- TODOs diferidos: nenhum placeholder permanece no documento.
-->

# Constituição do appdemo1

## Core Principles

### I. Simplicidade e Mudanças Mínimas

Toda alteração MUST ser a menor mudança capaz de atender ao requisito. É PROIBIDO
refatorar, reorganizar diretórios ou generalizar código que não faça parte do
escopo pedido.

Dependências novas (runtime ou desenvolvimento) MUST ser justificadas por escrito
no pull request, respondendo: (a) qual requisito ela atende, (b) por que a
biblioteca padrão do Node.js ou as dependências já presentes não bastam. Sem essa
justificativa, a dependência MUST ser recusada na revisão. Pacotes npm que apenas
duplicam módulos nativos do Node.js MUST ser removidos quando identificados.

Abstrações antecipadas (camadas, interfaces, configuração parametrizável) MUST ser
introduzidas somente quando houver um segundo caso de uso real, nunca em
antecipação a um hipotético.

*Racional*: o appdemo1 é uma aplicação didática de superfície pequena. Cada
dependência e cada camada extra aumentam o custo de leitura e manutenção sem
retorno proporcional.

### II. Testes Automatizados Obrigatórios (NÃO NEGOCIÁVEL)

Toda mudança de comportamento observável — rotas, conteúdo renderizado, formato de
dados, códigos de status HTTP — MUST ser acompanhada de teste automatizado no mesmo
pull request.

Regras vinculantes:

- Os testes MUST usar o runner nativo `node:test` e, para requisições HTTP,
  `supertest`.
- `npm test` MUST terminar com código de saída 0 antes de qualquer merge. Saída
  diferente de 0 bloqueia o merge, sem exceção.
- Os testes MUST exercitar a aplicação Express sem depender de um servidor já em
  execução nem de porta fixa; o módulo da aplicação MUST ser exportável para que
  `supertest` o consuma diretamente.
- Correções de defeito MUST incluir um teste que falhe antes da correção e passe
  depois.
- Mudanças que não alteram comportamento (documentação, formatação) estão isentas
  de novo teste, mas ainda MUST manter `npm test` verde.

*Racional*: é o único portão objetivo e automatizável do projeto. Sem ele, a
conformidade com os demais princípios depende de inspeção manual e regride.

### III. Português do Brasil e Fuso America/Sao_Paulo

Todo texto exibido ao usuário — títulos, rótulos, mensagens de erro, textos de
template EJS — MUST estar em português do Brasil. O atributo `lang` do documento
HTML MUST ser `pt-br`.

Datas e horários apresentados MUST ser formatados no fuso `America/Sao_Paulo` de
forma explícita, nunca dependendo do fuso local do processo ou da máquina
hospedeira. Testes que verifiquem data/hora MUST fixar o fuso para que o resultado
não varie com o ambiente de execução.

*Racional*: o público-alvo é brasileiro e o servidor pode rodar em qualquer região.
Depender do fuso do host produz horários silenciosamente errados em produção.

### IV. Renderização no Servidor com EJS

A interface MUST ser produzida por renderização no servidor usando EJS como view
engine do Express. É PROIBIDO introduzir frameworks ou bibliotecas de frontend
(React, Vue, Angular, jQuery, bundlers, SPAs) e PROIBIDO criar endpoints de API
cuja única finalidade seja alimentar um cliente JavaScript.

JavaScript no navegador é permitido apenas como script simples e embutido, para
comportamento que não possa ser resolvido no servidor, e MUST ser justificado no
pull request.

*Racional*: a aplicação entrega conteúdo informativo estático por requisição.
Qualquer camada de frontend adicionaria build, dependências e complexidade sem
nenhum ganho funcional.

### V. Código Legível com Nomenclatura em Português

Identificadores novos — variáveis, funções, rotas, arquivos — MUST ser nomeados em
português, coerentes com o vocabulário já presente no código (`horaAtual`, `ip`,
`servidor`). Nomes MUST descrever o domínio, não o mecanismo.

Identificadores em inglês preexistentes MUST ser renomeados para português quando
o código que os contém for alterado pelo escopo da mudança; fora desse escopo, a
renomeação é opcional (ver Princípio I).

Funções MUST ter uma responsabilidade única e caber na tela sem rolagem.
Comentários MUST explicar o motivo de uma decisão, não repetir o que o código já
diz literalmente. Termos técnicos consagrados sem tradução natural (`req`, `res`,
`app`, `middleware`) MUST ser mantidos em inglês.

*Racional*: o projeto já é escrito em português; misturar idiomas na mesma base
aumenta a carga cognitiva de quem lê e torna a nomenclatura imprevisível.

## Restrições Técnicas

Stack fixa, alterável somente por emenda a esta constituição:

- **Runtime**: Node.js, com uso preferencial da biblioteca padrão.
- **Servidor HTTP**: Express.
- **View engine**: EJS, com templates em `views/`.
- **Testes**: `node:test` (nativo) + `supertest`.

Restrições adicionais:

- Não há banco de dados nem persistência. Estado de requisição MUST permanecer em
  memória, derivado do próprio servidor.
- Não há etapa de build. O código-fonte versionado MUST ser executável diretamente
  por `node`.
- Segredos e credenciais MUST NOT ser versionados. Configuração que varie por
  ambiente (como a porta) MUST ser lida de variável de ambiente com valor padrão
  seguro.
- `package-lock.json` MUST ser versionado e MUST acompanhar qualquer alteração em
  `package.json` no mesmo commit.

## Fluxo de Desenvolvimento

1. **Branch por feature**: toda mudança MUST ser desenvolvida em branch dedicada,
   criada a partir de `main`. Commits diretos em `main` são PROIBIDOS.
2. **Pull request obrigatório**: a integração MUST ocorrer via pull request com
   descrição do que muda, do porquê e de como foi testado.
3. **Revisão humana**: todo pull request MUST receber revisão de uma pessoa antes
   do merge.
4. **Merge humano**: o merge MUST ser executado por uma pessoa. Merge automático,
   merge por agente e auto-merge configurado no repositório são PROIBIDOS.
5. **Portões de qualidade**, verificados antes do merge:
   - `npm test` sai com código 0 (Princípio II);
   - cada mudança de comportamento tem teste correspondente (Princípio II);
   - nenhuma dependência nova sem justificativa registrada (Princípio I);
   - textos de interface em pt-BR e datas em `America/Sao_Paulo` (Princípio III);
   - nenhum framework de frontend introduzido (Princípio IV);
   - identificadores novos em português (Princípio V).
6. **Conflito entre princípios**: quando dois princípios colidirem, o Princípio I
   (simplicidade) prevalece, exceto contra o Princípio II, que é inegociável.

## Governance

Esta constituição supersede qualquer outra prática, convenção informal ou
preferência pessoal aplicada ao appdemo1. Em caso de divergência entre esta
constituição e um documento de especificação, plano ou tarefa, esta constituição
prevalece.

**Procedimento de emenda**: alterações a este documento MUST ser propostas em pull
request dedicado, contendo o texto novo, o racional da mudança e o impacto sobre
código e artefatos existentes. A emenda MUST ser aprovada em revisão humana e o
merge MUST ser feito por uma pessoa. Emendas que invalidem código existente MUST
indicar o plano de adequação ou registrar a dívida explicitamente.

**Política de versionamento** (semântica, aplicada a este documento):

- **MAJOR**: remoção ou redefinição incompatível de um princípio ou regra de
  governança.
- **MINOR**: adição de princípio ou seção, ou expansão material de orientação.
- **PATCH**: esclarecimentos, correções de redação e refinamentos sem efeito
  semântico.

**Revisão de conformidade**: a revisão de cada pull request MUST percorrer os
portões de qualidade da seção *Fluxo de Desenvolvimento*. Violações encontradas
MUST ser corrigidas antes do merge ou registradas no pull request como exceção
explícita, com justificativa e prazo de correção. Complexidade não justificada MUST
ser recusada.

**Guia de execução**: orientações operacionais do dia a dia, quando existirem,
residem em um `CLAUDE.md` na raiz do repositório (ainda não criado). Esse guia MUST
permanecer consistente com esta constituição; em caso de conflito, esta
constituição prevalece.

**Version**: 1.0.0 | **Ratified**: 2026-11-23 | **Last Amended**: 2026-11-23
