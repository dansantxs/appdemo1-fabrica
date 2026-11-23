const express = require('express');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

// Construído uma única vez: se o ambiente não resolver o fuso, o processo falha
// ao iniciar (RangeError), em vez de exibir silenciosamente um horário incorreto.
const formatadorDataHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hourCycle: 'h23',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// Função pura: monta a cadeia a partir das partes para evitar a vírgula que
// a saída pronta do locale pt-BR insere entre data e hora.
function formatarDataHora(instante) {
  const partes = formatadorDataHora.formatToParts(instante);
  const valor = (tipo) => partes.find((parte) => parte.type === tipo).value;

  return `${valor('day')}/${valor('month')}/${valor('year')} ${valor('hour')}:${valor('minute')}:${valor('second')}`;
}

// Configurar EJS como a engine de visualização
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  // Obter o endereço IP do servidor
  const ip = getIpAddress();

  // Obter a hora atual do servidor
  const horaAtual = formatarDataHora(new Date());

  // Renderizar a página ejs com as informações
  res.render('index', { ip, horaAtual });
});

// Função para obter o endereço IP do servidor
function getIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const iface in interfaces) {
    const ifaceInfo = interfaces[iface];
    for (const alias of ifaceInfo) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'Endereço IP não encontrado';
}

// Só sobe o servidor quando app.js é o ponto de entrada: permite que os testes
// consumam `app` via supertest sem porta em uso.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}

module.exports = { app, formatarDataHora };
