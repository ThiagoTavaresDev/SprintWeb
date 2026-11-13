import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const origem = process.env.HEMO_TEST_URL ?? 'http://127.0.0.1:5085';
const base = `${origem.replace(/\/$/, '')}/api/hemoterapia/oficina-net`;

async function requisitar(caminho, dados) {
  const opcoes = dados === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  };
  const resposta = await fetch(caminho.startsWith('/api/') ? new URL(caminho, origem) : base + caminho, {
    ...opcoes,
    signal: AbortSignal.timeout(6000)
  });
  const texto = await resposta.text();
  return { status: resposta.status, headers: resposta.headers, body: texto ? JSON.parse(texto) : null };
}

function chave(prefixo) {
  return `${prefixo}-${randomUUID().replaceAll('-', '').slice(0, 20)}`.toUpperCase();
}

function consultarAuditoria(de, ate) {
  return requisitar('/auditoria?' + new URLSearchParams({ de, ate }));
}

const tarefas = {
  'HNT-304': async () => {
    const resposta = await requisitar('/opcoes');
    assert.equal(resposta.status, 200);
    assert.deepEqual(resposta.body, { items: [
      { codigo: 'BOL-101', rotulo: 'BOL-101 · CH' },
      { codigo: 'BOL-102', rotulo: 'BOL-102 · PL' },
      { codigo: 'BOL-103', rotulo: 'BOL-103 · CP' }
    ] });
  },
  'HNT-305': async () => {
    const resposta = await requisitar('/recebimentos');
    assert.equal(resposta.status, 200);
    assert.deepEqual(resposta.body, { items: [
      { codigo: 'BOL-101', recebidoEm: '2026-10-01T11:00:00Z' },
      { codigo: 'BOL-102', recebidoEm: null },
      { codigo: 'BOL-103', recebidoEm: null }
    ] });
  },
  'HNT-306': async () => {
    const codigoExterno = chave('IMPORT');
    const payload = { codigoExterno, codigoComponente: 'BOL-101' };
    assert.equal((await requisitar('/importacoes', { ...payload, codigoComponente: 'BOL-999' })).status, 422);

    const [primeira, segunda] = await Promise.all([
      requisitar('/importacoes', payload),
      requisitar('/importacoes', { ...payload, codigoExterno: ` ${codigoExterno.toLowerCase()} ` })
    ]);
    assert.deepEqual([primeira.status, segunda.status].sort(), [200, 201]);
    assert.deepEqual(primeira.body, payload);
    assert.deepEqual(segunda.body, payload);
    const criada = primeira.status === 201 ? primeira : segunda;
    const location = criada.headers.get('location');
    assert.equal(location, `/api/hemoterapia/oficina-net/importacoes/${codigoExterno}`);
    assert.equal((await requisitar('/importacoes', { ...payload, codigoComponente: 'BOL-102' })).status, 409);
    assert.deepEqual((await requisitar(location)).body, payload);
  },
  'HNT-307': async () => {
    const faixa = await consultarAuditoria('2026-10-01T06:00:00-03:00', '2026-10-01T11:00:00Z');
    assert.equal(faixa.status, 200);
    assert.deepEqual(faixa.body.items, [
      { codigoComponente: 'BOL-101', tipo: 'registrado', instante: '2026-10-01T09:00:00Z', unidade: 'U-A' },
      { codigoComponente: 'BOL-102', tipo: 'registrado', instante: '2026-10-01T10:00:00Z', unidade: 'U-A' }
    ]);
    assert.deepEqual((await consultarAuditoria('2026-10-01T13:00:00Z', '2026-10-01T14:00:00Z')).body, { items: [] });
    assert.equal((await consultarAuditoria('2026-10-01T11:00:00Z', '2026-10-01T11:00:00Z')).status, 400);
    assert.equal((await consultarAuditoria('2026-10-01T11:00:00', '2026-10-01T12:00:00Z')).status, 400);
    assert.equal((await requisitar('/auditoria')).status, 400);
  },
  'HNT-308': async () => {
    const codigo = chave('DOSSIE');
    const caminho = '/dossies/' + codigo;
    const rejeicao = await requisitar('/dossies', { codigo, nota: 'X'.repeat(81) });
    assert.equal(rejeicao.status, 422);
    assert.ok(rejeicao.body.errors.nota.length > 0);
    assert.equal((await requisitar(caminho)).status, 404, 'O dossiê parcial deve ser revertido.');

    const nota = 'Recebimento fictício conferido em homologação';
    const criado = await requisitar('/dossies', { codigo, nota });
    assert.equal(criado.status, 201);
    assert.equal(criado.headers.get('location'), `/api/hemoterapia/oficina-net${caminho}`);
    assert.deepEqual(criado.body, { codigo, eventos: [{ nota }] });
    assert.equal((await requisitar('/dossies', { codigo, nota })).status, 409);
    assert.deepEqual((await requisitar(caminho)).body, criado.body);
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
