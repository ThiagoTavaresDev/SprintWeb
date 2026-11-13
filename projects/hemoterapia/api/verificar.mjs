import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:5085/api/hemoterapia';

async function requisitar(path, data) {
  const init = data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {};
  const resposta = await fetch(base + path, { ...init, signal: AbortSignal.timeout(6000) });
  const text = await resposta.text();
  return { resposta, body: text ? JSON.parse(text) : null };
}

const tarefas = {
  'HNT-301': async () => {
    const todos = await requisitar('/componentes');
    assert.equal(todos.resposta.status, 200);
    assert.equal(todos.body.total, 3);
    const filtrados = await requisitar('/componentes?status=disponivel');
    assert.equal(filtrados.resposta.status, 200);
    assert.equal(filtrados.body.total, 2);
    assert.deepEqual(filtrados.body.items.map(x => x.codigo), ['BOL-101', 'BOL-103']);
    assert.equal((await requisitar('/componentes?status=desconhecido')).resposta.status, 400);
  },
  'HNT-302': async () => {
    assert.equal((await requisitar('/componentes/BOL-999')).resposta.status, 404);
    const { resposta, body } = await requisitar('/componentes/BOL-101');
    assert.equal(resposta.status, 200);
    assert.equal(resposta.headers.get('etag'), '"1"');
    assert.equal(body.codigo, 'BOL-101');
    assert.deepEqual(body.linhaDoTempo.map(x => [x.tipo, x.unidade]), [['registrado', 'U-A'], ['recebido', 'U-B']]);
    assert.ok(body.linhaDoTempo[0].instante < body.linhaDoTempo[1].instante);
  },
  'HNT-303': async () => {
    const invalid = await requisitar('/ocorrencias', { codigoComponente: 'BOL-999', descricao: '  ' });
    assert.equal(invalid.resposta.status, 422);
    assert.deepEqual(Object.keys(invalid.body.errors).sort(), ['codigoComponente', 'descricao']);
    const long = await requisitar('/ocorrencias', { codigoComponente: 'BOL-101', descricao: 'x'.repeat(241) });
    assert.equal(long.resposta.status, 422);
    assert.deepEqual(Object.keys(long.body.errors), ['descricao']);
    const created = await requisitar('/ocorrencias', { codigoComponente: ' BOL-101 ', descricao: ' Rascunho de teste ' });
    assert.equal(created.resposta.status, 201);
    assert.equal(created.body.status, 'rascunho');
    assert.equal(created.body.descricao, 'Rascunho de teste');
    const location = created.resposta.headers.get('location');
    assert.equal(location, '/api/hemoterapia/ocorrencias/' + created.body.id);
    const saved = await requisitar('/ocorrencias/' + created.body.id);
    assert.deepEqual(saved.body, created.body);
  }
};

const ids = process.argv.slice(2);
for (const id of ids.length ? ids : Object.keys(tarefas)) {
  try {
    if (!Object.hasOwn(tarefas, id)) throw new Error('Missão desconhecida.');
    await tarefas[id]();
    console.log('PASSOU', id);
  } catch (error) {
    console.error('FALHOU', id, error.message);
    process.exitCode = 1;
  }
}
