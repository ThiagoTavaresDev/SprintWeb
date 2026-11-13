import { computed, type Signal } from '@angular/core';
import { defer, mergeMap, type Observable } from 'rxjs';
import type { Estoque, NovaOcorrencia, ResumoComponente } from '../contracts';
import { abrirConsulta, abrirEnvio, type CamposComErro, type ConsultarComponente, type Controles, type CriarRascunho } from './oficina.shared';

// HNG-404 · Derive a lista dos itens e do termo pesquisado.
export function criarVisiveis(itens: Signal<ResumoComponente[]>, termo: Signal<string>) {
  return computed(() => itens());
}

// HNG-405 · Uma seleção nova deve substituir a consulta anterior.
export function detalhesRecentes(codigos: Observable<string>, consultar: ConsultarComponente) {
  return codigos.pipe(mergeMap(codigo => abrirConsulta(codigo, consultar)));
}

// HNG-406 · Repita somente falhas transitórias deste GET, com limite.
export function consultarEstoque(carregar: () => Observable<Estoque>) {
  return defer(carregar);
}

// HNG-407 · Leve o foco ao primeiro controle com erro de validação.
export function focarPrimeiroErro(campos: CamposComErro, controles: Controles): void {
}

// HNG-408 · Durante um POST, descarte novos disparos de envio.
export function enviarRascunhos(entradas: Observable<NovaOcorrencia>, criar: CriarRascunho) {
  return entradas.pipe(mergeMap(entrada => abrirEnvio(entrada, criar)));
}
