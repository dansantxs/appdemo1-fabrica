# Phase 1 — Quickstart de validação

**Feature**: `001-data-hora-pt-br` — Data/hora do servidor em formato pt-BR e destacada em vermelho

**Branch**: `001-data-hora-pt-br` | **Data**: 2026-11-23

Guia de validação ponta a ponta da feature. Serve ao Desenvolvedor (E4), ao QA (E5) e ao
revisor humano. Não contém código de implementação — o contrato está em
[contracts/pagina-inicial.md](./contracts/pagina-inicial.md) e as decisões em
[research.md](./research.md).

## Pré-requisitos

- Node.js 18+ com ICU completo (o fuso `America/Sao_Paulo` precisa ser resolvível).
  Validado em **Node v24.20.0 / npm 11.19.0**.
- Repositório na branch `001-data-hora-pt-br`.
- Dependências instaladas:

  ```bash
  npm install
  ```

  Após a implementação, `package.json` deve ter `supertest` em `devDependencies` e **não**
  deve mais ter `moment` nem o pacote `os` (ver [research.md](./research.md) D7, D8).

## Validação 1 — Suíte automatizada (portão obrigatório)

```bash
npm test
```

**Resultado esperado**: todos os testes aprovados e **código de saída 0**.

```bash
npm test; echo "codigo de saida: $?"   # deve imprimir 0
```

Cobertura esperada da suíte:

| Arquivo | Dono | O que valida |
|---|---|---|
| `test/unidade/data-hora.test.js` | Desenvolvedor (E4) | máscara exata para instantes fixos, zeros à esquerda, 24 h, meia-noite, virada de ano, comprimento 19, invariância a `process.env.TZ` |
| `test/aceite/pagina-inicial.test.js` | QA (E5) | `GET /` 200 + HTML, `lang="pt-br"`, rótulo em pt-BR, valor na máscara, `<span>` com `color: #8b0000` só no valor, linha de IP e título preservados, ausência de script/refresh/polling |

**Repetibilidade** (`SC-006`): rodar três vezes seguidas deve dar o mesmo resultado.

```bash
npm test && npm test && npm test; echo "codigo de saida: $?"   # deve imprimir 0
```

**Independência de fuso do host** (`SC-002`) — além do teste que troca `process.env.TZ`
internamente, a suíte inteira pode ser executada sob fusos diferentes e deve passar igual:

```bash
TZ=UTC npm test;                 echo "UTC -> $?"
TZ=America/Sao_Paulo npm test;   echo "SP  -> $?"
TZ=Asia/Tokyo npm test;          echo "TQ  -> $?"
```

Os três devem imprimir `0`.

## Validação 2 — Aplicação em execução

```bash
node app.js
# Servidor rodando em http://localhost:3000
```

Abrir <http://localhost:3000> e conferir, na linha "Hora Atual do Servidor:":

| # | Verificação | Requisito |
|---|---|---|
| 1 | O valor está na máscara `dd/mm/aaaa hh:mm:ss`, com 19 caracteres | `FR-003`, `FR-004`, `SC-001` |
| 2 | A data é dia/mês/ano (não `aaaa-mm-dd` nem `mm/dd`) | `SC-001` |
| 3 | A hora bate com o horário de Brasília/São Paulo daquele instante | `FR-001`, `FR-002` |
| 4 | Não há AM/PM | `FR-003` |
| 5 | Somente o valor está em vermelho escuro; o rótulo está na cor padrão | `FR-005` |
| 6 | O rótulo e os demais textos estão em português do Brasil | `FR-008`, `SC-008` |
| 7 | A linha "Endereço IP do Servidor" e o título continuam presentes e inalterados | `FR-009` |

Conferência por linha de comando, sem navegador:

```bash
curl -s http://localhost:3000 | grep "Hora Atual"
# esperado, com o valor do instante:
# <p>Hora Atual do Servidor: <span style="color: #8b0000">23/11/2026 14:07:35</span></p>
```

### Valor congelado e novo valor por requisição

| # | Passo | Resultado esperado | Requisito |
|---|---|---|---|
| 8 | Deixar a página aberta 60 s sem interagir | o valor não muda | `FR-006`, `SC-004` |
| 9 | Recarregar a página | aparece a data/hora do novo instante | `FR-007`, `SC-005` |
| 10 | Abrir a aba Rede do navegador e recarregar | apenas a requisição do documento; nenhuma chamada posterior de atualização | `SC-009` |
| 11 | Ver o código-fonte da página (Ctrl+U) | sem `<script>`, sem `meta refresh`, sem `fetch`/`setInterval` | `FR-006`, `SC-009` |

### Fuso do host divergente

```bash
TZ=UTC node app.js
```

Recarregar a página: o valor exibido deve continuar sendo o horário de **São Paulo**
(3 horas antes de UTC, no offset atual), não o horário UTC (`FR-002`, `SC-002`,
US1 cenário 2).

## Validação 3 — Contraste do destaque (`SC-007`)

Par aprovado no plano: valor `#8b0000` sobre fundo `#ffffff` (padrão do agente de usuário,
pois a página não declara `background`) → razão de contraste **10,01:1**, contra o mínimo
de 4,5:1. Memória de cálculo e comparação com outros tons:
[research.md](./research.md) D4.

Conferência manual, a fazer uma vez:

1. Abrir <http://localhost:3000>, inspecionar o `<span>` da data/hora no DevTools.
2. No seletor de cor da propriedade `color`, ler a razão de contraste que o navegador
   calcula contra o fundo efetivo.
3. Confirmar que o valor lido é ≥ 4,5:1 (esperado ≈ 10:1) e que o marcador AA aparece
   atendido.

Alternativa sem navegador: informar `#8b0000` e `#ffffff` em qualquer verificador de
contraste WCAG.

O teste de aceite trava o par cor/elemento (`color: #8b0000` no `<span>` do valor), de modo
que a razão não pode regredir sem que a suíte falhe.

## Validação 4 — Legibilidade sem cor (US2 cenário 3)

Imprimir a página em tons de cinza, ou aplicar um filtro de escala de cinza, e confirmar
que a data/hora continua identificável pelo rótulo em português que a antecede. O destaque
é apenas um reforço visual, nunca o único portador da informação.

## Validação 5 — Falha visível de fuso (caso de borda)

Validação opcional, só aplicável em ambiente sem banco de fusos (por exemplo, um Node
compilado sem ICU). Esperado: o processo **não sobe** e registra exceção de fuso inválido
na saída; a página nunca é servida com horário de outro fuso. Ver
[research.md](./research.md) D3.

## Critério de pronto da feature

- [ ] `npm test` sai com código 0, nas três execuções consecutivas e nos três fusos de host
- [ ] Validações 2.1 a 2.11 conferidas na aplicação em execução
- [ ] Contraste conferido (Validação 3) com razão ≥ 4,5:1
- [ ] Legibilidade sem cor conferida (Validação 4)
- [ ] `package.json` e `package-lock.json` alterados no mesmo commit, com `supertest`
      adicionado e `moment`/`os` removidos
