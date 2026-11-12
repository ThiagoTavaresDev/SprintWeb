import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HttpErrorResponse } from '@angular/common/http';

const pedido = {
  id: 101,
  cliente: 'Ana',
  cep: '01001000',
  status: 'pendente',
  valorCentavos: 12500,
  versao: 1
};

function httpError(status, errors) {
  return new HttpErrorResponse({ status, error: errors ? { errors } : undefined });
}

export function verificarExercicios(exercises) {
  test('NG-401 mantém o status e a paginação na query', () => {
    const params = exercises.parametrosLista('pendente', 2, 5);
    assert.equal(params.get('status'), 'pendente');
    assert.equal(params.get('pagina'), '2');
    assert.equal(params.get('limite'), '5');
  });

  test('NG-401 omite status para a opção Todos', () => {
    const params = exercises.parametrosLista('', 1, 5);
    assert.equal(params.has('status'), false);
    assert.equal(params.get('pagina'), '1');
    assert.equal(params.get('limite'), '5');
  });

  test('NG-402 preserva resultados e metadados da página', () => {
    const view = exercises.listaCarregada({ items: [pedido], pagina: 2, limite: 5, total: 6 });
    assert.deepEqual(view, { kind: 'ready', pedidos: [pedido], pagina: 2, limite: 5, total: 6 });
  });

  test('NG-402 apresenta estado vazio somente após uma resposta sem itens', () => {
    assert.deepEqual(exercises.listaCarregada({ items: [], pagina: 1, limite: 5, total: 0 }), { kind: 'empty' });
  });

  test('NG-402 apresenta estado de erro quando a requisição falha', () => {
    const view = exercises.listaFalhou(httpError(503));
    assert.equal(view.kind, 'error');
    assert.match(view.message, /503/);
  });

  test('NG-403 liga as mensagens de 422 aos campos conhecidos', () => {
    const errors = exercises.errosDeCriacao(httpError(422, {
      cep: ['Informe oito dígitos.'], valorCentavos: ['Informe valor positivo.'],
      campoDesconhecido: ['Não pertence ao formulário.']
    }));
    assert.deepEqual(errors, { cep: ['Informe oito dígitos.'], valorCentavos: ['Informe valor positivo.'] });
  });

  test('NG-403 ignora erros que não representam campos válidos', () => {
    assert.deepEqual(exercises.errosDeCriacao(httpError(500, { cep: ['Erro interno.'] })), {});
    assert.deepEqual(exercises.errosDeCriacao(httpError(422, { cep: [null, ''], cliente: 'inválido' })), {});
  });

  test('NG-404 envia o ETag original no cabeçalho If-Match', () => {
    const headers = exercises.cabecalhosDeAlteracao('"2"');
    assert.equal(headers.get('If-Match'), '"2"');
  });

  test('NG-404 distingue conflito de falha genérica', () => {
    const conflito = exercises.alteracaoFalhou(httpError(412));
    assert.equal(conflito.kind, 'conflict');
    assert.match(conflito.message, /recarreg/i);
    assert.equal(exercises.alteracaoFalhou(httpError(500)).kind, 'error');
  });
}
