# Feature Specification: Data/hora do servidor em formato pt-BR e destacada em vermelho

**Feature Branch**: `001-data-hora-pt-br`

**Created**: 2026-11-23

**Status**: Draft

**Input**: User description: "No frontend a data/hora do servidor deve aparecer no formato pt-br e em cor vermelha. Não precisa ser atualizada e deve usar a timezone America/Sao_Paulo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ler a data/hora do servidor no padrão brasileiro (Priority: P1)

Uma pessoa acessa a página de informações do servidor para saber em que momento o
servidor atendeu àquela requisição. Ela espera ler a data e a hora do jeito que se
escreve no Brasil — dia antes do mês e relógio de 24 horas — e já no horário de
Brasília/São Paulo, sem precisar converter nada de cabeça nem saber em que região o
servidor está hospedado.

**Why this priority**: é o núcleo da demanda e a única parte que corrige um problema
real de correção da informação. Hoje o valor aparece em formato internacional
(`AAAA-MM-DD HH:mm:ss`) e no fuso do host, o que pode exibir um horário silenciosamente
errado. Entregar apenas esta história já resolve o essencial e atende ao Princípio III
da constituição.

**Independent Test**: pode ser testada isoladamente abrindo a página e conferindo que o
valor exibido está na ordem dia/mês/ano com relógio de 24 horas e corresponde ao horário
vigente em `America/Sao_Paulo`, inclusive quando o fuso configurado no host é outro
(por exemplo, UTC).

**Acceptance Scenarios**:

1. **Dado** um servidor cujo relógio marca o equivalente a 03/07/2026 às 09:05 em
   `America/Sao_Paulo`, **Quando** a pessoa acessa a página de informações do servidor,
   **Então** a data/hora aparece na ordem dia/mês/ano com hora no relógio de 24 horas e
   com zeros à esquerda (03/07/2026, 09:05).
2. **Dado** um servidor configurado com fuso do host igual a UTC, **Quando** a pessoa
   acessa a página, **Então** o valor exibido é o horário de São Paulo daquele instante,
   e não o horário UTC.
3. **Dado** que o instante da requisição é 00:30 em São Paulo, **Quando** a página é
   exibida, **Então** a hora aparece como 00:30 (24 horas), sem indicação de AM/PM.
4. **Dado** que a pessoa lê a página, **Quando** observa o rótulo que acompanha o valor,
   **Então** o texto está em português do Brasil.

---

### User Story 2 - Localizar a data/hora de imediato pelo destaque em vermelho (Priority: P2)

A página lista várias informações do servidor na mesma formatação. A pessoa quer bater o
olho e achar a data/hora sem ler item por item, então o valor aparece destacado em
vermelho, diferenciando-se do restante do texto.

**Why this priority**: agrega valor de leitura e foi pedido explicitamente, mas é
cosmético — a informação já estaria correta e utilizável sem o destaque. Depende da
história 1 estar entregue para fazer sentido.

**Independent Test**: pode ser testada isoladamente verificando que a data/hora é
apresentada em vermelho enquanto os demais textos da página seguem na cor padrão, e que
o contraste do vermelho sobre o fundo permanece legível.

**Acceptance Scenarios**:

1. **Dado** que a pessoa abre a página de informações do servidor, **Quando** a página é
   exibida, **Então** a data/hora aparece em vermelho e os demais textos permanecem na
   cor padrão da página.
2. **Dado** o destaque aplicado, **Quando** se compara a cor da data/hora com a cor do
   fundo da página, **Então** o contraste é suficiente para leitura confortável.
3. **Dado** que o destaque é apenas visual, **Quando** a página é lida sem cores
   (impressão em tons de cinza ou leitor de tela), **Então** a data/hora continua
   identificável pelo rótulo em português que a acompanha.

---

### User Story 3 - Entender que o valor é um retrato do instante da requisição (Priority: P3)

A pessoa percebe que o valor exibido corresponde ao momento em que carregou a página e
que ele não se move sozinho. Para ver um horário novo, ela recarrega a página.

**Why this priority**: é uma decisão de não-escopo que precisa ser verificável para
evitar que alguém trate a ausência de atualização automática como defeito. Não entrega
função nova, apenas fixa o comportamento esperado.

**Independent Test**: pode ser testada isoladamente deixando a página aberta sem
interagir e conferindo que o valor não muda, e em seguida recarregando para conferir que
um novo valor é apresentado.

**Acceptance Scenarios**:

1. **Dado** que a página está aberta e exibindo uma data/hora, **Quando** a pessoa
   aguarda sem recarregar, **Então** o valor exibido permanece exatamente o mesmo.
2. **Dado** que a página está aberta, **Quando** a pessoa recarrega depois de algum
   tempo, **Então** a data/hora exibida corresponde ao novo instante da requisição.
3. **Dado** duas visitas em instantes diferentes, **Quando** se comparam os valores,
   **Então** ambos são válidos para os respectivos instantes, sem que um invalide o
   outro.

---

### Edge Cases

- **Fuso do host diferente de São Paulo**: servidor hospedado em UTC, Europa ou Estados
  Unidos. O valor exibido MUST continuar sendo o horário de São Paulo; nunca o do host.
- **Eventual retorno do horário de verão brasileiro**: hoje `America/Sao_Paulo` não
  observa horário de verão. Caso volte a observar, o valor exibido deve acompanhar o
  offset vigente na data da requisição, sem ajuste manual.
- **Virada de meia-noite**: o instante 00:00 deve ser exibido como `00:00` no relógio de
  24 horas, e a data deve ser a do novo dia.
- **Componentes de um dígito**: dia, mês, hora e minuto com um único dígito devem ser
  exibidos com zero à esquerda, mantendo largura constante do valor.
- **Virada de ano e de mês**: 31/12 para 01/01 deve refletir a mudança de ano
  corretamente no horário de São Paulo, não no do host.
- **Página aberta por horas**: o valor congelado é o comportamento esperado e não deve
  ser reportado como erro; não há relógio ao vivo nem recarregamento automático.
- **Duas requisições quase simultâneas**: valores idênticos ou diferentes em poucos
  instantes são ambos aceitáveis; não há cache nem valor fixo entre requisições.
- **Ambiente sem dados de fuso horário disponíveis**: se o ambiente de execução não
  conseguir resolver `America/Sao_Paulo`, a página MUST NOT exibir um horário em outro
  fuso como se fosse o de São Paulo; a falha deve ser visível em vez de silenciosa.
- **Relógio do servidor dessincronizado**: a feature não corrige nem detecta desvio de
  relógio; exibe fielmente o que o servidor informa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A página de informações do servidor MUST exibir a data e a hora
  correspondentes ao instante em que o servidor processou aquela requisição.
- **FR-002**: A data/hora exibida MUST ser expressa no fuso `America/Sao_Paulo` de forma
  explícita, independentemente do fuso configurado no host, no processo ou no dispositivo
  do visitante.
- **FR-003**: A data/hora MUST ser apresentada na convenção brasileira de escrita: dia
  antes do mês, ano com quatro dígitos e hora em relógio de 24 horas, sem AM/PM.
  [NEEDS CLARIFICATION: máscara exata não definida — inclui segundos (`dd/mm/aaaa
  hh:mm:ss`) ou apenas horas e minutos (`dd/mm/aaaa hh:mm`)? Qual o separador entre data
  e hora: espaço, vírgula ou a palavra "às"?]
- **FR-004**: Dia, mês, hora, minuto (e segundo, se adotado) MUST ser exibidos com zero à
  esquerda quando tiverem um único dígito.
- **FR-005**: A data/hora MUST ser apresentada em vermelho, distinguindo-se visualmente
  do restante do texto da página. [NEEDS CLARIFICATION: tom exato do vermelho não
  definido e abrangência do destaque não definida — somente o valor da data/hora ou
  também o rótulo que o antecede?]
- **FR-006**: O valor exibido MUST permanecer inalterado enquanto a página não for
  recarregada; o sistema MUST NOT atualizar a data/hora automaticamente no navegador.
- **FR-007**: Cada novo carregamento da página MUST apresentar a data/hora do instante
  daquela nova requisição.
- **FR-008**: O rótulo e qualquer texto associado à data/hora MUST estar em português do
  Brasil.
- **FR-009**: As demais informações já apresentadas na página (endereço IP do servidor e
  título) MUST permanecer visíveis e com conteúdo inalterado.
- **FR-010**: A regra de formato e de destaque MUST ser aplicada em
  [NEEDS CLARIFICATION: abrangência não definida — apenas na página inicial de
  informações do servidor, única que exibe data/hora hoje, ou como regra geral válida para
  qualquer página futura que venha a exibir data/hora?]
- **FR-011**: O formato, o fuso e o destaque MUST ser verificáveis de forma
  determinística, produzindo o mesmo resultado independentemente do fuso e da configuração
  regional da máquina que executa a verificação.

### Key Entities

- **Data/hora do servidor**: instante único em que o servidor processou a requisição.
  Atributos relevantes para o usuário: o instante em si, o fuso de referência
  (`America/Sao_Paulo`) e sua representação textual em convenção brasileira. Não é
  persistida, não é configurável pelo visitante e não guarda histórico — existe apenas
  durante a montagem da resposta de cada requisição.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos carregamentos da página exibem a data/hora na convenção
  brasileira (dia/mês/ano, relógio de 24 horas); nenhum carregamento apresenta formato
  internacional (`AAAA-MM-DD`) ou americano (`mm/dd`).
- **SC-002**: Com o host configurado em pelo menos dois fusos distintos (por exemplo, UTC
  e `America/Sao_Paulo`), o valor exibido corresponde ao horário vigente em São Paulo no
  instante da requisição, em 100% das verificações.
- **SC-003**: Uma pessoa que abre a página pela primeira vez localiza a data/hora em até
  3 segundos, sem precisar ler os outros itens da página.
- **SC-004**: Com a página aberta e sem recarga, o valor exibido permanece idêntico por no
  mínimo 60 segundos de observação.
- **SC-005**: Dois carregamentos separados por mais de um minuto apresentam valores de
  data/hora diferentes entre si.
- **SC-006**: A verificação automatizada de formato, fuso e destaque produz o mesmo
  resultado em três execuções consecutivas e em ambientes com fusos de host diferentes
  (zero resultados divergentes por causa do ambiente).
- **SC-007**: A razão de contraste entre a cor da data/hora e a cor de fundo da página é
  de no mínimo 4,5:1.
- **SC-008**: 100% dos textos visíveis na página estão em português do Brasil, incluindo o
  rótulo da data/hora.
- **SC-009**: Nenhuma requisição adicional é disparada pelo navegador para obter ou
  atualizar a data/hora após o carregamento da página (zero chamadas de atualização).

## Assumptions

- A página inicial de informações do servidor é, hoje, a única superfície do produto que
  exibe data/hora; a abrangência definitiva da regra está em aberto (FR-010).
- O relógio de 24 horas, sem AM/PM, é o padrão brasileiro adotado; não há pedido de
  formato de 12 horas.
- A data/hora apresentada é a do servidor no instante da requisição, e não a do
  dispositivo do visitante — este continua sendo o propósito informativo da página.
- Não há requisito de exibir o nome do fuso, a sigla ou o offset (por exemplo, "BRT" ou
  "-03:00") junto ao valor; apenas o horário já convertido.
- O contraste mínimo de 4,5:1 (nível AA de acessibilidade) foi adotado como padrão de
  legibilidade na ausência de definição do tom exato do vermelho (FR-005).
- O relógio do sistema do servidor está correto e sincronizado; sincronização de relógio
  está fora do escopo.
- Não há persistência, cache, histórico de horários, autenticação ou qualquer estado entre
  requisições envolvido nesta feature.
- O projeto não possui hoje nenhuma verificação automatizada em funcionamento — a
  execução da suíte termina com erro —, de modo que os critérios SC-002, SC-006 e SC-009
  pressupõem a criação dessa verificação como parte desta entrega, conforme exige o
  Princípio II da constituição.
- Fora de escopo, por decisão já ratificada: relógio ao vivo, atualização automática,
  consulta periódica ao servidor, escolha de fuso pelo visitante e tradução para outros
  idiomas.
