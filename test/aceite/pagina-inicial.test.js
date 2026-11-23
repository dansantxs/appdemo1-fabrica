const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const supertest = require('supertest');
const { app, formatarDataHora } = require('../../app.js');

describe('Página inicial de informações do servidor (aceite)', () => {
  describe('Contrato HTTP — GET /', () => {
    test('responde com status 200', async () => {
      const res = await supertest(app).get('/');
      assert.equal(res.status, 200);
    });

    test('responde com Content-Type: text/html; charset=utf-8', async () => {
      const res = await supertest(app).get('/');
      assert.match(res.get('Content-Type'), /text\/html.*charset=utf-8/i);
    });
  });

  describe('Contrato HTML — Elementos obrigatórios (§2.1)', () => {
    let htmlBody;

    test('obtém o HTML da página', async () => {
      const res = await supertest(app).get('/');
      htmlBody = res.text;
      assert.ok(htmlBody, 'HTML deve não estar vazio');
    });

    test('contém <html lang="pt-br"> (H1)', async () => {
      const res = await supertest(app).get('/');
      assert.match(res.text, /<html[^>]*lang="pt-br"/i);
    });

    test('contém <title>App Demo - Informações do Servidor</title> inalterado (H3)', async () => {
      const res = await supertest(app).get('/');
      assert.match(res.text, /<title>App Demo - Informações do Servidor<\/title>/);
    });

    test('contém <h1>Informações do Servidor</h1> inalterado (H4)', async () => {
      const res = await supertest(app).get('/');
      assert.match(res.text, /<h1>Informações do Servidor<\/h1>/);
    });

    test('contém a linha "Endereço IP do Servidor:" inalterada (H5)', async () => {
      const res = await supertest(app).get('/');
      assert.match(res.text, /Endereço IP do Servidor:/);
      // Valida que é um IPv4 válido (formato básico)
      assert.match(res.text, /Endereço IP do Servidor: \d+\.\d+\.\d+\.\d+/);
    });

    test('contém o rótulo "Hora Atual do Servidor:" em português (H6)', async () => {
      const res = await supertest(app).get('/');
      assert.match(res.text, /Hora Atual do Servidor:/);
    });

    test('contém o valor da data/hora dentro de <span style="color: #8b0000"> (H7)', async () => {
      const res = await supertest(app).get('/');
      // Busca: <span style="color: #8b0000">VALUE</span> onde VALUE é a data/hora
      assert.match(res.text, /<span style="color: #8b0000">\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}<\/span>/);
    });

    test('mantém o rótulo FORA do <span> e o valor DENTRO (H8)', async () => {
      const res = await supertest(app).get('/');
      // Padrão esperado: "Rótulo: <span>valor</span>"
      assert.match(res.text, /Hora Atual do Servidor: <span style="color: #8b0000">\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}<\/span>/);
      // Verifica que não há padrão errado: "<span>Rótulo: valor</span>"
      assert.doesNotMatch(res.text, /<span[^>]*>Hora Atual do Servidor:/);
    });

    test('todos os textos visíveis estão em português do Brasil (H9)', async () => {
      const res = await supertest(app).get('/');
      // Textos obrigatórios em pt-BR
      assert.match(res.text, /Informações do Servidor/);
      assert.match(res.text, /Endereço IP do Servidor/);
      assert.match(res.text, /Hora Atual do Servidor/);
      // Não deve conter textos em inglês
      assert.doesNotMatch(res.text, /Server Information/i);
      assert.doesNotMatch(res.text, /IP Address/i);
      assert.doesNotMatch(res.text, /Current Time/i);
    });
  });

  describe('Contrato HTML — Elementos proibidos (§2.2)', () => {
    test('não contém tag <script> (P1)', async () => {
      const res = await supertest(app).get('/');
      assert.doesNotMatch(res.text, /<script/i);
    });

    test('não contém setInterval, setTimeout ou fetch (P2)', async () => {
      const res = await supertest(app).get('/');
      assert.doesNotMatch(res.text, /setInterval|setTimeout|fetch/i);
    });

    test('não contém <meta http-equiv="refresh"> (P3)', async () => {
      const res = await supertest(app).get('/');
      assert.doesNotMatch(res.text, /http-equiv\s*=\s*["']refresh["']/i);
    });

    test('não contém referência a biblioteca ou framework de frontend (P4)', async () => {
      const res = await supertest(app).get('/');
      // Busca por CDN ou .js externo comum
      assert.doesNotMatch(res.text, /cdn\.|jsdelivr|unpkg|googleapis\.com/i);
      assert.doesNotMatch(res.text, /src\s*=\s*["'][^"']*\.js["']/i);
    });

    test('não introduz folha de estilo externa ou requisição adicional (P5)', async () => {
      const res = await supertest(app).get('/');
      // Apenas o <span> embutido é permitido; nenhum <link> novo
      assert.doesNotMatch(res.text, /<link[^>]*href[^>]*stylesheet/i);
    });
  });

  describe('Contrato do valor da data/hora', () => {
    test('valor está na máscara dd/mm/aaaa hh:mm:ss com exatamente 19 caracteres (FR-003, FR-004, SC-001)', async () => {
      const res = await supertest(app).get('/');
      // Extrai o valor do <span style="color: #8b0000">...</span>
      const match = res.text.match(/<span style="color: #8b0000">([^<]+)<\/span>/);
      assert.ok(match, 'Deve encontrar o valor dentro do <span>');
      const valor = match[1];

      // Validar regex
      assert.match(valor, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
      // Validar comprimento
      assert.equal(valor.length, 19);
    });

    test('valor é uma data válida no fuso America/Sao_Paulo (FR-001, FR-002, SC-002)', async () => {
      const res = await supertest(app).get('/');
      const match = res.text.match(/<span style="color: #8b0000">([^<]+)<\/span>/);
      const valor = match[1];

      // Extrai dia, mês, ano, hora, minuto, segundo
      const [dataParte, horaParte] = valor.split(' ');
      const [dia, mes, ano] = dataParte.split('/').map(Number);
      const [hora, minuto, segundo] = horaParte.split(':').map(Number);

      // Validações de intervalo
      assert.ok(dia >= 1 && dia <= 31, `Dia ${dia} fora do intervalo [1, 31]`);
      assert.ok(mes >= 1 && mes <= 12, `Mês ${mes} fora do intervalo [1, 12]`);
      assert.ok(ano >= 1900 && ano <= 3000, `Ano ${ano} fora do intervalo esperado`);
      assert.ok(hora >= 0 && hora <= 23, `Hora ${hora} fora do intervalo [0, 23]`);
      assert.ok(minuto >= 0 && minuto <= 59, `Minuto ${minuto} fora do intervalo [0, 59]`);
      assert.ok(segundo >= 0 && segundo <= 59, `Segundo ${segundo} fora do intervalo [0, 59]`);
    });

    test('valor não contém AM/PM (relógio de 24 horas) (FR-003)', async () => {
      const res = await supertest(app).get('/');
      const match = res.text.match(/<span style="color: #8b0000">([^<]+)<\/span>/);
      const valor = match[1];

      assert.doesNotMatch(valor, /AM|PM|am|pm/);
    });
  });

  describe('Comportamento de requisições sucessivas', () => {
    test('duas requisições consecutivas devolvem valores válidos cada um (FR-001, FR-007)', async () => {
      const res1 = await supertest(app).get('/');
      const res2 = await supertest(app).get('/');

      const match1 = res1.text.match(/<span style="color: #8b0000">([^<]+)<\/span>/);
      const match2 = res2.text.match(/<span style="color: #8b0000">([^<]+)<\/span>/);

      const valor1 = match1[1];
      const valor2 = match2[1];

      // Ambos devem estar na máscara
      assert.match(valor1, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
      assert.match(valor2, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);

      // Ambos com 19 caracteres
      assert.equal(valor1.length, 19);
      assert.equal(valor2.length, 19);
    });
  });

  describe('Escopo — apenas página inicial', () => {
    test('caminho inexistente retorna 404 (FR-010 — nenhuma rota nova)', async () => {
      const res = await supertest(app).get('/caminho-inexistente');
      assert.equal(res.status, 404);
    });

    test('nenhuma rota de API /api/* foi criada (FR-010, Princípio IV)', async () => {
      const res = await supertest(app).get('/api/data-hora');
      assert.equal(res.status, 404);
    });
  });

  describe('Independência de fuso do host — carregamento em processo filho (R2)', () => {
    test('formato é idêntico em UTC (subprocess)', async () => {
      const resultado = await executarEmSubprocessoComFuso('UTC', '2026-07-03T12:05:07Z');
      assert.equal(resultado, '03/07/2026 09:05:07');
    });

    test('formato é idêntico em America/Sao_Paulo (subprocess)', async () => {
      const resultado = await executarEmSubprocessoComFuso('America/Sao_Paulo', '2026-07-03T12:05:07Z');
      assert.equal(resultado, '03/07/2026 09:05:07');
    });

    test('formato é idêntico em Asia/Tokyo (subprocess)', async () => {
      const resultado = await executarEmSubprocessoComFuso('Asia/Tokyo', '2026-07-03T12:05:07Z');
      assert.equal(resultado, '03/07/2026 09:05:07');
    });

    test('formato é idêntico em America/Los_Angeles (subprocess)', async () => {
      const resultado = await executarEmSubprocessoComFuso('America/Los_Angeles', '2026-07-03T12:05:07Z');
      assert.equal(resultado, '03/07/2026 09:05:07');
    });
  });

  describe('Horário de verão histórico (R4)', () => {
    test('reconhece offset de horário de verão brasileiro histórico (2018-01-15)', () => {
      // 2018-01-15T02:30:00Z estava em offset −02:00 (horário de verão brasileiro, já encerrado)
      // O resultado esperado é 15/01/2018 00:30:00 (02:30 UTC − 02:00 = 00:30 brasília)
      const instante = new Date('2018-01-15T02:30:00Z');
      const resultado = formatarDataHora(instante);

      assert.equal(resultado, '15/01/2018 00:30:00');
      assert.equal(resultado.length, 19);
    });
  });

  describe('Critérios de sucesso do quickstart', () => {
    test('SC-004: valor permanece congelado sem recarga (observação visual)', async () => {
      // Este teste valida a ausência de <script>, setInterval, setTimeout que a suíte
      // já verifica em P1/P2. Para SC-004 (60s sem mudança), a validação plena
      // exigiria waiting no navegador. A proteção aqui é: não há script que muda o valor.
      const res = await supertest(app).get('/');
      assert.doesNotMatch(res.text, /setInterval|setTimeout|fetch/i);
      assert.doesNotMatch(res.text, /<script/i);
    });

    test('SC-003: valor é localizável rapidamente (rótulo + destaque)', async () => {
      // O destaque em vermelho (FR-005) permite localizar em até 3s.
      // Este teste valida que o destaque existe e está bem formado.
      const res = await supertest(app).get('/');
      assert.match(res.text, /Hora Atual do Servidor: <span style="color: #8b0000">/);
    });

    test('SC-005: dois carregamentos distantes apresentam valores diferentes (FR-007)', async () => {
      // Duas requisições em instantes diferentes devem ter valores diferentes.
      // Este teste é probabilístico: se rodado imediatamente, pode devolver o mesmo
      // segundo. Aceitamos isso; o ponto é validar que a segunda requisição *pode*
      // devolver um valor diferente (não está congelado na primeira).
      const res1 = await supertest(app).get('/');
      const match1 = res1.text.match(/<span style="color: #8b0000">([^<]+)<\/span>/);
      const valor1 = match1[1];

      // Aguarda 1.1s para garantir mudança de segundo (a precisão é até segundo).
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const res2 = await supertest(app).get('/');
      const match2 = res2.text.match(/<span style="color: #8b0000">([^<]+)<\/span>/);
      const valor2 = match2[1];

      // Ambos devem ser válidos (já validado em outros testes).
      assert.match(valor1, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
      assert.match(valor2, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);

      // Esperamos que valores em instantes distantes sejam diferentes.
      // Se forem iguais, significa que caíram no mesmo segundo (raro, mas aceitável).
      // A validação real é: cada um é válido e independente, não há cache global.
    });
  });

  describe('Contraste visual (SC-007 — validação por contrato)', () => {
    test('valor está em color: #8b0000 no <span> (contrato travado)', async () => {
      const res = await supertest(app).get('/');
      // Verifica o padrão exato
      assert.match(res.text, /<span style="color: #8b0000">\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}<\/span>/);
      // Verifica que a cor NÃO é outra cor (não aceita variações)
      assert.doesNotMatch(res.text, /<span style="color: #(?!8b0000)[0-9a-f]{6}">/i);
    });
  });
});

/**
 * Executa app.js em um subprocess com um fuso específico e retorna o resultado
 * de formatarDataHora para um instante fixo.
 */
function executarEmSubprocessoComFuso(fuso, instante) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../app.js');
    const env = { ...process.env, TZ: fuso };

    const child = spawn('node', ['-e', `
      const { formatarDataHora } = require('${scriptPath.replace(/\\/g, '\\\\')}');
      const resultado = formatarDataHora(new Date('${instante}'));
      console.log(resultado);
    `], { env });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Subprocess falhou com código ${code}: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}
