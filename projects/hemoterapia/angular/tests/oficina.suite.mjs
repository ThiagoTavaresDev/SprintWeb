import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';

// Angular's bundler resolves this extensionless TypeScript import. The Node runner
// uses the same source directly and needs the extension for this local module.
registerHooks({
  resolve(specifier, context, next) {
    return next(specifier === './oficina.shared' ? './oficina.shared.ts' : specifier, context);
  }
});

const componente = { codigo: 'BOL-101', status: 'disponivel', tipo: 'CH', versao: 1 };
const outro = { codigo: 'BOL-102', status: 'quarentena', tipo: 'PL', versao: 1 };
const estoque = { items: [componente, outro], total: 2 };
const responderDetalhe = resumo => new HttpResponse({ body: { ...resumo, linhaDoTempo: [] } });
const httpError = status => new HttpErrorResponse({ status });
const entrada = { codigoComponente: 'BOL-101', descricao: 'Teste fictício de conferência' };

export function verificarOficina(oficina) {
  test('HNG-404 filtra código ignorando espaços e caixa e admite resultado vazio', () => {
    const termo = signal('');
    const visiveis = oficina.criarVisiveis(signal(estoque.items), termo);
    assert.deepEqual(visiveis(), estoque.items);
    termo.set(' bol-102 ');
    assert.deepEqual(visiveis(), [outro]);
    termo.set('999');
    assert.deepEqual(visiveis(), []);
  });

  test('HNG-404 acompanha atualizações na coleção de origem', () => {
    const itens = signal([componente]);
    const visiveis = oficina.criarVisiveis(itens, signal(''));
    assert.deepEqual(visiveis(), [componente]);
    itens.set(estoque.items);
    assert.deepEqual(visiveis(), estoque.items);
  });

  test('HNG-405 só publica o detalhe da última seleção sob respostas fora de ordem', () => {
    const cliques = new Subject();
    const atrasado = new Subject();
    const recente = new Subject();
    const estados = [];
    const sub = oficina.detalhesRecentes(cliques, codigo => codigo === 'BOL-101' ? atrasado : recente)
      .subscribe(estado => estados.push(estado));

    cliques.next('BOL-101');
    cliques.next('BOL-102');
    recente.next(responderDetalhe(outro));
    atrasado.next(responderDetalhe(componente));
    sub.unsubscribe();

    assert.deepEqual(estados.map(estado => estado.codigo ?? estado.componente.codigo), ['BOL-101', 'BOL-102', 'BOL-102']);
  });

  test('HNG-405 recupera a busca após um 404', () => {
    const cliques = new Subject();
    const estados = [];
    const sub = oficina.detalhesRecentes(cliques, codigo => codigo === 'BOL-999'
      ? throwError(() => httpError(404)) : of(responderDetalhe(componente)))
      .subscribe(estado => estados.push(estado.tipo));
    cliques.next('BOL-999');
    cliques.next('BOL-101');
    sub.unsubscribe();
    assert.deepEqual(estados, ['carregando', 'erro', 'carregando', 'pronto']);
  });

  test('HNG-406 repete falhas de rede e 503 somente uma vez', async () => {
    for (const status of [0, 503]) {
      let tentativas = 0;
      const resultado = await firstValueFrom(oficina.consultarEstoque(() => ++tentativas === 1
        ? throwError(() => httpError(status)) : of(estoque)));
      assert.deepEqual(resultado, estoque);
      assert.equal(tentativas, 2);
    }
    let indisponivel = 0;
    await assert.rejects(firstValueFrom(oficina.consultarEstoque(() => {
      indisponivel += 1;
      return throwError(() => httpError(503));
    })), { status: 503 });
    assert.equal(indisponivel, 2);
  });

  test('HNG-406 propaga 400 e 404 sem repetir', async () => {
    for (const status of [400, 404]) {
      let tentativas = 0;
      await assert.rejects(firstValueFrom(oficina.consultarEstoque(() => {
        tentativas += 1;
        return throwError(() => httpError(status));
      })), { status });
      assert.equal(tentativas, 1);
    }
  });

  test('HNG-407 segue a ordem dos controles e foca uma vez', () => {
    const foco = [];
    const controles = {
      codigoComponente: { focus: () => foco.push('codigoComponente') },
      descricao: { focus: () => foco.push('descricao') }
    };
    oficina.focarPrimeiroErro({ descricao: ['Obrigatória'], codigoComponente: ['Desconhecido'] }, controles);
    assert.deepEqual(foco, ['codigoComponente']);
    oficina.focarPrimeiroErro({ codigoComponente: [], descricao: ['Obrigatória'] }, controles);
    assert.deepEqual(foco, ['codigoComponente', 'descricao']);
  });

  test('HNG-407 preserva o foco sem campos com erro', () => {
    const focus = () => assert.fail('o foco deveria permanecer no controle atual');
    oficina.focarPrimeiroErro({}, { codigoComponente: { focus }, descricao: { focus } });
  });

  test('HNG-408 descarta disparos enquanto o POST está aberto', () => {
    const cliques = new Subject();
    const pendente = new Subject();
    const enviados = [];
    const sub = oficina.enviarRascunhos(cliques, rascunho => {
      enviados.push(rascunho);
      return enviados.length === 1 ? pendente : of({ ...rascunho, id: 2, status: 'rascunho' });
    }).subscribe();
    cliques.next(entrada);
    cliques.next(entrada);
    pendente.next({ ...entrada, id: 1, status: 'rascunho' });
    pendente.complete();
    assert.deepEqual(enviados, [entrada]);
    const novo = { ...entrada, descricao: 'Novo rascunho após a primeira resposta' };
    cliques.next(novo);
    sub.unsubscribe();
    assert.deepEqual(enviados, [entrada, novo]);
  });

  test('HNG-408 aceita um envio corrigido após erro de validação', () => {
    const cliques = new Subject();
    const estados = [];
    const sub = oficina.enviarRascunhos(cliques, rascunho => rascunho.codigoComponente === 'BOL-999'
      ? throwError(() => httpError(422))
      : of({ ...rascunho, id: 1, status: 'rascunho' }))
      .subscribe(estado => estados.push(estado.tipo));
    cliques.next({ ...entrada, codigoComponente: 'BOL-999' });
    cliques.next(entrada);
    sub.unsubscribe();
    assert.deepEqual(estados, ['enviando', 'erro', 'enviando', 'salvo']);
  });
}
