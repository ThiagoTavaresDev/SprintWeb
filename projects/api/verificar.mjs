import assert from 'node:assert/strict';

const base = (process.env.SPRINT_API_URL ?? 'http://127.0.0.1:5075').replace(/\/$/, '');
const caminhos = '/api/pedidos';
const etiqueta = versao => '"' + versao + '"';

async function enviar(rota, {method = 'GET', dados, headers = {}} = {}) {
  const response = await fetch(base + rota, {
    method,
    headers: dados === undefined ? headers : {'Content-Type': 'application/json', ...headers},
    body: dados === undefined ? undefined : JSON.stringify(dados),
    signal: AbortSignal.timeout(6000)
  });
  const text = await response.text();
  return {status: response.status, headers: response.headers, body: text ? JSON.parse(text) : null};
}

function criarValido() {
  return enviar(caminhos, {method: 'POST', dados: {cliente: '  QA Sprint  ', cep: '01311000', valorCentavos: 23990}});
}

const tarefas = {
  'NET-301': async () => {
    assert.equal((await criarValido()).status, 201);
    assert.equal((await criarValido()).status, 201);
    const primeira = await enviar(caminhos + '?status=pendente&pagina=1&limite=1');
    const segunda = await enviar(caminhos + '?status=pendente&pagina=2&limite=1');
    assert.equal(primeira.status, 200);
    assert.equal(segunda.status, 200);
    assert.equal(primeira.body.pagina, 1);
    assert.equal(segunda.body.pagina, 2);
    assert.equal(primeira.body.limite, 1);
    assert.equal(primeira.body.items.length, 1);
    assert.equal(segunda.body.items.length, 1);
    assert.equal(primeira.body.items[0].status, 'pendente');
    assert.equal(segunda.body.items[0].status, 'pendente');
    assert.ok(primeira.body.items[0].id < segunda.body.items[0].id);
    assert.equal(primeira.body.total, segunda.body.total);
    assert.equal((await enviar(caminhos + '?status=ignorado')).status, 400);
    assert.equal((await enviar(caminhos + '?limite=101')).status, 400);
  },
  'NET-302': async () => {
    const pedido = await enviar(caminhos + '/101');
    assert.equal(pedido.status, 200);
    assert.equal(pedido.body.id, 101);
    assert.equal(pedido.body.cliente, 'Ana');
    assert.ok(Number.isInteger(pedido.body.versao));
    assert.equal(pedido.headers.get('etag'), etiqueta(pedido.body.versao));
    assert.equal((await enviar(caminhos + '/2147483647')).status, 404);
  },
  'NET-303': async () => {
    const antes = await enviar(caminhos);
    const invalido = await enviar(caminhos, {method: 'POST', dados: {cliente: '', cep: '123', valorCentavos: 0}});
    assert.equal(invalido.status, 422);
    assert.equal(invalido.body.status, 422);
    assert.deepEqual(Object.keys(invalido.body.errors).sort(), ['cep', 'cliente', 'valorCentavos']);
    const depois = await enviar(caminhos);
    assert.equal(depois.body.total, antes.body.total, 'Uma requisição inválida não deve criar pedido.');

    const criado = await criarValido();
    assert.equal(criado.status, 201);
    assert.equal(criado.body.status, 'pendente');
    assert.equal(criado.body.cliente, 'QA Sprint');
    assert.equal(criado.body.cep, '01311000');
    assert.equal(criado.body.valorCentavos, 23990);
    assert.equal(criado.headers.get('etag'), etiqueta(criado.body.versao));
    assert.equal(criado.headers.get('location'), caminhos + '/' + criado.body.id);
    const leitura = await enviar(criado.headers.get('location'));
    assert.equal(leitura.status, 200);
    assert.deepEqual(leitura.body, criado.body, 'A leitura em outra requisição deve recuperar o registro gravado.');
  },
  'NET-304': async () => {
    const criado = await criarValido();
    assert.equal(criado.status, 201);
    const rota = caminhos + '/' + criado.body.id + '/status';
    const dados = {status: 'enviado'};
    const anterior = etiqueta(criado.body.versao);
    assert.equal((await enviar(rota, {method: 'PATCH', dados})).status, 428);
    assert.equal((await enviar(rota, {method: 'PATCH', dados, headers: {'If-Match': '1'}})).status, 400);
    assert.equal((await enviar(rota, {method: 'PATCH', dados: {status: 'outro'}, headers: {'If-Match': anterior}})).status, 422);
    const sucesso = await enviar(rota, {method: 'PATCH', dados, headers: {'If-Match': anterior}});
    assert.equal(sucesso.status, 200);
    assert.equal(sucesso.body.status, 'enviado');
    assert.equal(sucesso.body.versao, criado.body.versao + 1);
    assert.equal(sucesso.headers.get('etag'), etiqueta(sucesso.body.versao));
    const conflito = await enviar(rota, {method: 'PATCH', dados: {status: 'cancelado'}, headers: {'If-Match': anterior}});
    assert.equal(conflito.status, 412);
    const atual = await enviar(caminhos + '/' + criado.body.id);
    assert.equal(atual.body.status, 'enviado', 'A tentativa desatualizada não deve alterar o pedido.');
  }
};

const escolhida = process.argv[2]?.toUpperCase();
const codigos = escolhida ? [escolhida] : Object.keys(tarefas);
if (codigos.some(codigo => !Object.hasOwn(tarefas, codigo))) {
  console.error('Uso: node verificar.mjs [NET-301 | NET-302 | NET-303 | NET-304]');
  process.exit(2);
}
for (const codigo of codigos) {
  try {
    await tarefas[codigo]();
    console.log(codigo + ': passou.');
  } catch (error) {
    console.error(codigo + ': ' + error.message);
    if (error.cause?.code === 'ECONNREFUSED') console.error('Inicie a API em ' + base + ' antes de rodar a verificação.');
    process.exitCode = 1;
  }
}
