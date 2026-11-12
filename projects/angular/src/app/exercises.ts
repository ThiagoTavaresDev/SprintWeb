import { HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import type { ErrosCampos, EstadoLista, FeedbackAlteracao, FiltroStatus, PaginaPedidos } from './contracts';

// NG-401. O filtro selecionado na interface ainda não entra na URL.
export function parametrosLista(_status: FiltroStatus, pagina: number, limite: number): HttpParams {
  return new HttpParams().set('pagina', pagina).set('limite', limite);
}

// NG-402. A tela ainda não distingue uma lista vazia de uma lista com resultados.
export function listaCarregada({ items, pagina, limite, total }: PaginaPedidos): EstadoLista {
  return { kind: 'ready', pedidos: items, pagina, limite, total };
}

export function listaFalhou(_error: unknown): EstadoLista {
  return { kind: 'empty' };
}

// NG-403. As mensagens individuais devolvidas pela API ainda não chegam aos campos.
export function errosDeCriacao(_error: unknown): ErrosCampos {
  return {};
}

// NG-404. O cliente ainda não informa a versão que leu e trata todo erro do mesmo jeito.
export function cabecalhosDeAlteracao(_etag: string): HttpHeaders {
  return new HttpHeaders();
}

export function alteracaoFalhou(error: unknown): FeedbackAlteracao {
  const status = error instanceof HttpErrorResponse ? ` (HTTP ${error.status})` : '';
  return { kind: 'error', message: `Não foi possível atualizar o pedido${status}.` };
}
