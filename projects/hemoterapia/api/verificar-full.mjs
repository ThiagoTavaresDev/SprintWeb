import assert from 'node:assert/strict';

const base = `${(process.env.HEMO_FULL_URL ?? 'http://127.0.0.1:5085').replace(/\/$/, '')}/api/hemoterapia/oficina-full`;
const requisitar = (rota, headers) => fetch(base + rota, { headers });

const missoes = {
  async 'HFS-205'() {
    const primeira = await requisitar('/estoque?pagina=1&tamanho=2');
    assert.equal(primeira.status, 200);
    const pagina1 = await primeira.json();
    assert.deepEqual(pagina1.items.map(item => item.codigo), ['BOL-101', 'BOL-102']);
    assert.equal(pagina1.total, 3);

    const segunda = await requisitar('/estoque?pagina=2&tamanho=2');
    assert.equal(segunda.status, 200);
    const pagina2 = await segunda.json();
    assert.deepEqual(pagina2.items.map(item => item.codigo), ['BOL-103']);
    assert.deepEqual([pagina2.pagina, pagina2.tamanho, pagina2.total], [2, 2, 3]);

    assert.deepEqual((await (await requisitar('/estoque?pagina=3&tamanho=2')).json()).items, []);
    assert.equal((await requisitar('/estoque?pagina=0&tamanho=2')).status, 400);
  },
  async 'HFS-206'() {
    const resposta = await requisitar('/movimentos.csv');
    assert.equal(resposta.status, 200);
    assert.match(resposta.headers.get('Content-Type') ?? '', /^text\/csv; charset=utf-8$/i);
    assert.match(resposta.headers.get('Content-Disposition') ?? '', /^attachment;.*movimentos\.csv/i);
    assert.deepEqual((await resposta.text()).trimEnd().split('\r\n'), [
      'código,tipo,instante,unidade',
      '"BOL-101","registrado","2026-10-01T09:00:00Z","U-A"',
      '"BOL-102","registrado","2026-10-01T10:00:00Z","U-A"',
      '"BOL-101","recebido","2026-10-01T11:00:00Z","U-B"',
      '"BOL-103","registrado","2026-10-01T12:00:00Z","U-A"'
    ]);
  },
  async 'HFS-207'() {
    const resposta = await requisitar('/resumo');
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), { items: [
      { tipo: 'CH', disponiveis: 1, quarentena: 0 },
      { tipo: 'CP', disponiveis: 1, quarentena: 0 },
      { tipo: 'PL', disponiveis: 0, quarentena: 1 }
    ] });
  },
  async 'HFS-208'() {
    const falta = await requisitar('/conferencia/BOL-999');
    assert.equal(falta.status, 404);
    assert.match(falta.headers.get('Content-Type') ?? '', /^application\/problem\+json/i);
    const correlacao = falta.headers.get('X-Correlation-ID');
    assert.ok(correlacao);
    const problema = await falta.json();
    assert.equal(problema.status, 404);
    assert.equal(problema.title, 'Componente não encontrado');
    assert.equal(problema.correlacao, correlacao);

    const encontrado = await requisitar('/conferencia/BOL-101');
    assert.equal(encontrado.status, 200);
    assert.equal((await encontrado.json()).codigo, 'BOL-101');
  },
  async 'HFS-209'() {
    const caminho = '/etiquetas/BOL-101';
    const primeira = await requisitar(caminho);
    assert.equal(primeira.status, 200);
    const etag = primeira.headers.get('ETag');
    assert.equal(etag, '"BOL-101-1"');
    assert.equal((await primeira.json()).codigo, 'BOL-101');

    for (const tag of [etag, `"outra", W/${etag}`, '*']) {
      const igual = await requisitar(caminho, { 'If-None-Match': tag });
      assert.equal(igual.status, 304);
      assert.equal(await igual.text(), '');
      assert.equal(igual.headers.get('ETag'), etag);
    }
    assert.equal((await requisitar(caminho, { 'If-None-Match': '"antiga"' })).status, 200);
    assert.equal((await requisitar('/etiquetas/BOL-102', { 'If-None-Match': etag })).status, 200);
    assert.equal((await requisitar('/etiquetas/BOL-999', { 'If-None-Match': '*' })).status, 404);
  }
};

const id = process.argv[2];
const ids = id ? [id] : Object.keys(missoes);
for (const missao of ids) {
  try {
    assert.ok(Object.hasOwn(missoes, missao), `Use HFS-205 a HFS-209. ID recebido: ${missao}`);
    await missoes[missao]();
    console.log(`${missao} OK`);
  } catch (erro) {
    process.exitCode = 1;
    console.error(`${missao} falhou`);
    console.error(erro);
  }
}
