const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { formatarDataHora } = require('../../app.js');

describe('formatarDataHora', () => {
  const paresDeReferencia = [
    {
      instante: '2026-07-03T12:05:07Z',
      esperado: '03/07/2026 09:05:07',
      descricao: 'converte um instante comum para o fuso America/Sao_Paulo',
    },
    {
      instante: '2026-11-24T03:30:04Z',
      esperado: '24/11/2026 00:30:04',
      descricao: 'exibe a madrugada em relógio de 24 horas, sem AM/PM',
    },
    {
      instante: '2026-11-24T03:00:00Z',
      esperado: '24/11/2026 00:00:00',
      descricao: 'representa a virada de meia-noite como 00:00:00',
    },
    {
      instante: '2027-01-01T02:00:00Z',
      esperado: '31/12/2026 23:00:00',
      descricao: 'representa a virada de ano e de mês corretamente',
    },
    {
      instante: '2026-01-05T15:07:09Z',
      esperado: '05/01/2026 12:07:09',
      descricao: 'preserva zeros à esquerda em dia, mês, hora, minuto e segundo',
    },
  ];

  for (const { instante, esperado, descricao } of paresDeReferencia) {
    test(`${descricao} (${instante} -> ${esperado})`, () => {
      const resultado = formatarDataHora(new Date(instante));

      assert.equal(resultado, esperado);
      assert.equal(resultado.length, 19);
    });
  }

  test('devolve sempre a mesma saída para o mesmo instante, independentemente de process.env.TZ', () => {
    const tzOriginal = process.env.TZ;
    const instante = new Date('2026-07-03T12:05:07Z');
    const esperado = '03/07/2026 09:05:07';

    try {
      for (const fuso of ['UTC', 'Asia/Tokyo', 'America/Sao_Paulo', 'America/Los_Angeles']) {
        process.env.TZ = fuso;
        assert.equal(formatarDataHora(instante), esperado);
      }
    } finally {
      if (tzOriginal === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = tzOriginal;
      }
    }
  });

  test('devolve a mesma saída em duas chamadas com o mesmo instante (sem cache variando o resultado)', () => {
    const instante = new Date('2026-07-03T12:05:07Z');

    const primeiraChamada = formatarDataHora(instante);
    const segundaChamada = formatarDataHora(instante);

    assert.equal(primeiraChamada, segundaChamada);
  });

  test('devolve saídas diferentes para instantes diferentes (não memoriza nem lê relógio interno)', () => {
    const primeiroInstante = new Date('2026-07-03T12:05:07Z');
    const segundoInstante = new Date('2026-11-24T03:30:04Z');

    const resultadoPrimeiro = formatarDataHora(primeiroInstante);
    const resultadoSegundo = formatarDataHora(segundoInstante);

    assert.notEqual(resultadoPrimeiro, resultadoSegundo);
  });
});
