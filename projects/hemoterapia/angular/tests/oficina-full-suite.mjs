import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';

export function verificarOficinaFull(exercicios) {
  test('HFS-205 envia a página e o tamanho', () => {
    const params = exercicios.parametrosPagina(2, 2);
    assert.equal(params.get('pagina'), '2');
    assert.equal(params.get('tamanho'), '2');
    assert.equal(exercicios.parametrosPagina(1, 5).get('tamanho'), '5');
  });

  test('HFS-206 preserva o CSV e interpreta o nome seguro', () => {
    const blob = new Blob(['código,tipo,instante,unidade\r\n'], { type: 'text/csv' });
    const csv = new HttpResponse({ body: blob, headers: new HttpHeaders({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lote-qa.csv"; filename*=UTF-8\'\'lote-qa.csv'
    }) });
    assert.deepEqual(exercicios.arquivoMovimentos(csv), { nome: 'lote-qa.csv', blob });
    assert.equal(exercicios.arquivoMovimentos(csv.clone({ headers: csv.headers.set('Content-Type', 'application/json') })), null);
    assert.equal(exercicios.arquivoMovimentos(csv.clone({ headers: csv.headers.set('Content-Disposition', 'attachment; filename="../lote.csv"') })).nome, 'movimentos.csv');
    assert.equal(exercicios.arquivoMovimentos(csv.clone({ body: null })), null);
  });

  test('HFS-207 calcula o rodapé das duas colunas', () => {
    const linhas = [{ tipo: 'CH', disponiveis: 1, quarentena: 0 }, { tipo: 'CP', disponiveis: 1, quarentena: 0 }, { tipo: 'PL', disponiveis: 0, quarentena: 1 }];
    assert.deepEqual(exercicios.totalizar(linhas), { disponiveis: 2, quarentena: 1 });
    assert.deepEqual(exercicios.totalizar([]), { disponiveis: 0, quarentena: 0 });
  });

  test('HFS-208 aceita a referência apenas no erro de conferência', () => {
    const problema = new HttpErrorResponse({ status: 404, error: { status: 404, correlacao: 'req-teste-17' } });
    assert.equal(exercicios.codigoSuporte(problema), 'req-teste-17');
    assert.equal(exercicios.codigoSuporte(new HttpErrorResponse({ status: 500, error: problema.error })), null);
    assert.equal(exercicios.codigoSuporte(new HttpErrorResponse({ status: 404, error: { correlacao: 17 } })), null);
    assert.equal(exercicios.codigoSuporte(null), null);
  });

  test('HFS-209 só reutiliza uma etiqueta em cache no 304', () => {
    const item = { codigo: 'BOL-101', tipo: 'CH', status: 'disponivel', versao: 1 };
    const entrada = { item, etag: '"BOL-101-1"' };
    assert.equal(exercicios.cabecalhosEtiqueta().has('If-None-Match'), false);
    assert.equal(exercicios.cabecalhosEtiqueta(entrada).get('If-None-Match'), entrada.etag);

    const semMudanca = new HttpErrorResponse({ status: 304 });
    assert.equal(exercicios.reutilizarEtiqueta(semMudanca, entrada), entrada);
    assert.equal(exercicios.reutilizarEtiqueta(semMudanca), null);
    assert.equal(exercicios.reutilizarEtiqueta(new HttpErrorResponse({ status: 404 }), entrada), null);
    assert.equal(exercicios.reutilizarEtiqueta(new HttpErrorResponse({ status: 0 }), entrada), null);
  });
}
