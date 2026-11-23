# Phase 1 — Modelo de Dados

**Feature**: `001-data-hora-pt-br` | **Branch**: `001-data-hora-pt-br` | **Data**: 2026-11-23

**Decisões técnicas de referência**: [research.md](./research.md) (D1, D2, D10)

## Escopo deste documento

Esta feature **não tem persistência, banco de dados, migração nem estado entre
requisições** (Restrições Técnicas da constituição e seção *Assumptions* da spec). Não há,
portanto, esquema, tabela, índice ou estratégia de dados de teste a definir.

O documento existe porque a spec declara uma *Key Entity*: **Data/hora do servidor**. Ela é
modelada aqui como **objeto de valor efêmero**, calculado durante a montagem da resposta de
cada requisição e descartado em seguida.

## Entidade: Data/hora do servidor

| Atributo | Tipo | Origem | Observações |
|---|---|---|---|
| `instante` | `Date` | `new Date()` no handler de `GET /` | Instante absoluto em que o servidor processou a requisição (`FR-001`, `FR-007`). Não é exposto ao template. |
| `fusoDeReferencia` | constante textual | fixo no código: `'America/Sao_Paulo'` | Nunca lido do host, do processo ou do visitante (`FR-002`). Não é exibido na página (premissa da spec: sem sigla nem offset). |
| `horaAtual` | `string` (19 caracteres) | `formatarDataHora(instante)` | Representação textual entregue ao template EJS. É o único atributo que atravessa a fronteira servidor → view. |

### Relacionamentos

Nenhum. A entidade não referencia nem é referenciada por outra entidade. Convive na mesma
resposta com o valor `ip` (string), já existente e **não alterado** por esta feature
(`FR-009`), sem vínculo entre os dois.

### Ciclo de vida

```text
chegada de GET /  →  instante = new Date()
                  →  horaAtual = formatarDataHora(instante)
                  →  res.render('index', { ip, horaAtual })
                  →  fim da resposta: ambos descartados
```

Sem criação, leitura posterior, atualização ou exclusão. Sem cache: duas requisições
próximas podem produzir valores iguais ou diferentes, e ambos são válidos (caso de borda da
spec). Sem transição de estado a modelar.

### Regras de validação (derivadas dos requisitos)

Estas regras são **invariantes de saída** de `formatarDataHora`, verificadas pelos testes
de `test/unidade/` (ver [research.md](./research.md) D10), e não validação de entrada de
usuário — o visitante não fornece dado algum nesta feature.

| ID | Regra | Requisito |
|---|---|---|
| V1 | O valor tem exatamente 19 caracteres | `FR-004` |
| V2 | O valor casa com `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$` | `FR-003` |
| V3 | A ordem dos componentes é dia, mês, ano, hora, minuto, segundo | `FR-003` |
| V4 | O separador entre data e hora é um único caractere de espaço (`U+0020`), sem vírgula | `FR-003` |
| V5 | Dia, mês, hora, minuto e segundo têm zero à esquerda quando de um dígito; o ano tem quatro dígitos | `FR-004` |
| V6 | A hora pertence a `00`–`23`; nunca `24`, nunca sufixo AM/PM | `FR-003` |
| V7 | Os componentes correspondem ao instante convertido para `America/Sao_Paulo`, com o offset vigente naquela data | `FR-002` |
| V8 | Para um mesmo `instante`, o valor é idêntico independentemente de `process.env.TZ` e do locale do host | `FR-011` |
| V9 | Se `America/Sao_Paulo` não for resolvível no ambiente, não há valor de recuo: o processo falha de forma visível | caso de borda da spec |

### Representação no HTML

O atributo `horaAtual` é renderizado por `<%= %>` (escape automático do EJS) dentro de um
`<span>` com `color: #8b0000`, enquanto o rótulo em português fica fora do `<span>`
(`FR-005`, `FR-008`). O contrato exato do fragmento está em
[contracts/pagina-inicial.md](./contracts/pagina-inicial.md).

## Dados de teste

Não há massa de dados a provisionar. Os testes usam **instantes UTC literais** como
entrada da função de formatação, listados em [research.md](./research.md) (D1) e repetidos
em [quickstart.md](./quickstart.md). Não há variável de ambiente sensível, segredo ou
credencial envolvida nesta feature; a única variável de ambiente tocada é `PORT`
(com padrão `3000`) e, nos testes, `process.env.TZ`, manipulada e restaurada pelo próprio
teste.
