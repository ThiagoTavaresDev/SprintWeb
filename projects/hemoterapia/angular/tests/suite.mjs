import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';

const componente = {
  codigo: 'BOL-101',
  tipo: 'CH',
  status: 'disponivel',
  versao: 1,
  linhaDoTempo: [{ tipo: 'registrado', instante: '2026-10-01T09:00:00Z', unidade: 'U-A' }]
};

export function verificarExercicios(exercises) {
  test('HNG-401 envia o filtro selecionado em HttpParams', () => {
    assert.equal(exercises.parametrosEstoque('disponivel').get('status'), 'disponivel');
    assert.equal(exercises.parametrosEstoque('quarentena').get('status'), 'quarentena');
  });

  test('HNG-401 omite status ao consultar todos', () => {
    assert.equal(exercises.parametrosEstoque('').has('status'), false);
  });

  test('HNG-402 preserva os eventos e a ETag da resposta HTTP', () => {
    const response = new HttpResponse({ body: componente, headers: new HttpHeaders({ ETag: '"1"' }) });
    assert.deepEqual(exercises.detalheRecebido(response), { componente, etag: '"1"' });
  });

  test('HNG-402 mantém ausências explícitas', () => {
    assert.equal(exercises.detalheRecebido(new HttpResponse()), null);
    const vazio = { ...componente, linhaDoTempo: [] };
    assert.deepEqual(exercises.detalheRecebido(new HttpResponse({ body: vazio })), { componente: vazio, etag: null });
  });

  test('HNG-403 exibe apenas mensagens válidas dos campos conhecidos no 422', () => {
    const erro = new HttpErrorResponse({ status: 422, error: { errors: {
      descricao: ['Informe o ocorrido.', null, ''],
      codigoComponente: ['Selecione um código do estoque.'],
      desconhecido: ['Campo sem controle.']
    } } });
    assert.deepEqual(exercises.errosDeOcorrencia(erro), {
      codigoComponente: ['Selecione um código do estoque.'],
      descricao: ['Informe o ocorrido.']
    });
  });

  test('HNG-403 preserva o erro geral quando o formato ou status é outro', () => {
    assert.deepEqual(exercises.errosDeOcorrencia(new HttpErrorResponse({ status: 503 })), {});
    assert.deepEqual(exercises.errosDeOcorrencia(new HttpErrorResponse({ status: 422, error: { errors: 'inválido' } })), {});
  });
}
