# Contrato — Página inicial de informações do servidor

**Feature**: `001-data-hora-pt-br` | **Data**: 2026-11-23

**Tipo de interface**: aplicação web renderizada no servidor (HTML por requisição). Não há
API JSON, e criar uma seria proibido pelo Princípio IV.

Este contrato é a fonte das asserções dos testes de aceite (`test/aceite/`) e o critério de
pronto do Desenvolvedor (E4) e do QA (E5).

---

## 1. Contrato HTTP

### `GET /`

| Item | Valor |
|---|---|
| Método | `GET` |
| Caminho | `/` |
| Parâmetros de rota / query / corpo | nenhum (requisição sem entrada) |
| Autenticação | nenhuma |
| Status de sucesso | `200 OK` |
| `Content-Type` | `text/html; charset=utf-8` |
| Corpo | documento HTML completo, conforme seção 2 |
| Cache | nenhum cabeçalho de cache é adicionado por esta feature; cada requisição recalcula o valor (`FR-007`) |
| Idempotência | segura e sem efeito colateral; não altera estado algum |

**Rotas novas**: nenhuma. Esta feature **não** cria endpoint adicional — em particular, não
cria rota de API para alimentar JavaScript de cliente (proibido pelo Princípio IV,
`FR-006`, `SC-009`).

**Escopo**: o contrato vale **somente** para `GET /`, a página inicial de informações do
servidor (`FR-010`). Nenhuma outra superfície é alterada e a regra não é estendida a
páginas futuras nesta entrega.

### Falha de ambiente

Se o ambiente de execução não resolver o fuso `America/Sao_Paulo`, o processo falha ao
iniciar (exceção `RangeError: Invalid time zone specified` lançada na construção do
formatador, no escopo do módulo) e **nenhuma resposta é servida**. A página nunca exibe um
horário de outro fuso como se fosse o de São Paulo — a falha é visível, não silenciosa
(caso de borda da spec; ver [research.md](../research.md) D3).

---

## 2. Contrato do HTML renderizado

### 2.1 Elementos obrigatórios

| # | Contrato | Requisito |
|---|---|---|
| H1 | `<html lang="pt-br">` | Princípio III |
| H2 | `<meta charset="UTF-8">` presente | preexistente |
| H3 | `<title>App Demo - Informações do Servidor</title>` inalterado | `FR-009` |
| H4 | `<h1>Informações do Servidor</h1>` inalterado | `FR-009` |
| H5 | Linha de IP presente e inalterada: `Endereço IP do Servidor: <valor>` | `FR-009` |
| H6 | Rótulo da data/hora em português, inalterado: `Hora Atual do Servidor:` | `FR-008`, `FR-009` |
| H7 | O valor da data/hora aparece envolvido por `<span style="color: #8b0000">…</span>` | `FR-005` |
| H8 | O rótulo (H6) está **fora** do `<span>` de H7 | `FR-005` |
| H9 | Todo texto visível da página está em português do Brasil | `FR-008`, `SC-008` |

### 2.2 Elementos proibidos no corpo da resposta

| # | Contrato | Requisito |
|---|---|---|
| P1 | Nenhuma tag `<script>` | `FR-006`, `SC-009`, Princípio IV |
| P2 | Nenhuma ocorrência de `setInterval`, `setTimeout` ou `fetch` | `FR-006`, `SC-009` |
| P3 | Nenhum `<meta http-equiv="refresh">` | `FR-006`, `SC-009` |
| P4 | Nenhuma referência a biblioteca ou framework de frontend (CDN, `.js` externo) | Princípio IV |
| P5 | Nenhuma folha de estilo externa ou requisição de recurso adicional introduzida por esta feature | `SC-009`, Princípio I |

### 2.3 Fragmento de referência

Forma esperada da linha da data/hora no HTML renderizado (valor ilustrativo):

```html
<p>Hora Atual do Servidor: <span style="color: #8b0000">23/11/2026 14:07:35</span></p>
```

O rótulo fora do `<span>`, o valor dentro, nada mais colorido na página.

---

## 3. Contrato do valor `horaAtual`

| Item | Valor |
|---|---|
| Tipo | `string` |
| Comprimento | exatamente 19 caracteres |
| Máscara | `dd/mm/aaaa hh:mm:ss` |
| Expressão de validação | `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$` |
| Separador data/hora | um único espaço `U+0020` (nunca vírgula) |
| Relógio | 24 horas, horas de `00` a `23`, sem AM/PM |
| Fuso | `America/Sao_Paulo`, explícito, com o offset vigente na data do instante |
| Exemplo | `23/11/2026 14:07:35` |

Regras de validação detalhadas (V1–V9): [data-model.md](../data-model.md).

---

## 4. Contrato do módulo `app.js`

Interface consumida pela suíte de testes (e somente por ela, além do próprio processo):

```text
module.exports = { app, formatarDataHora }
```

| Export | Forma | Contrato |
|---|---|---|
| `app` | instância Express | Consumível por `supertest(app)` sem que nenhuma porta esteja aberta. `app.listen` é executado **apenas** quando `require.main === module`, isto é, quando `app.js` é o ponto de entrada. |
| `formatarDataHora` | `(instante: Date) => string` | Função pura. Recebe o instante e devolve o valor da seção 3. Não lê o relógio, não lê `process.env.TZ`, não tem efeito colateral. Mesma entrada ⇒ mesma saída, em qualquer host (`FR-011`). |

**Porta de escuta**: `process.env.PORT`, com padrão `3000` (Restrições Técnicas).

### Pares de referência para `formatarDataHora`

| Entrada (instante UTC) | Saída esperada |
|---|---|
| `new Date('2026-07-03T12:05:07Z')` | `03/07/2026 09:05:07` |
| `new Date('2026-11-24T03:30:04Z')` | `24/11/2026 00:30:04` |
| `new Date('2026-11-24T03:00:00Z')` | `24/11/2026 00:00:00` |
| `new Date('2027-01-01T02:00:00Z')` | `31/12/2026 23:00:00` |
| `new Date('2026-01-05T15:07:09Z')` | `05/01/2026 12:07:09` |

Todos os pares foram conferidos no ambiente de execução do plano (Node v24.20.0) e são
invariantes a `process.env.TZ` (`UTC`, `Asia/Tokyo`, `America/Sao_Paulo`,
`America/Los_Angeles` verificados).

---

## 5. Contrato de verificação

| Comando | Contrato |
|---|---|
| `npm test` | executa `node --test`; **deve** sair com código `0`. Qualquer falha sai com `1` e bloqueia o avanço (Princípio II). |
| lint | não existe no projeto |
| build / typecheck | não existe no projeto (sem etapa de build) |
