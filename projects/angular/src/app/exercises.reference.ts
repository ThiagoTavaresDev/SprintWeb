import { HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import type { CamposPedido, ErrosCampos, EstadoLista, FeedbackAlteracao, FiltroStatus, PaginaPedidos } from './contracts';

export function parametrosLista(status: FiltroStatus, pagina: number, limite: number): HttpParams {
  const params = new HttpParams().set('pagina', pagina).set('limite', limite);
  return status ? params.set('status', status) : params;
}

export function listaCarregada({ items, pagina, limite, total }: PaginaPedidos): EstadoLista {
  return items.length
    ? { kind: 'ready', pedidos: items, pagina, limite, total }
    : { kind: 'empty' };
}

export function listaFalhou(error: unknown): EstadoLista {
  const status = error instanceof HttpErrorResponse && error.status > 0 ? ` (HTTP ${error.status})` : '';
  return { kind: 'error', message: `Não foi possível carregar os pedidos${status}. Tente novamente.` };
}

export function errosDeCriacao(error: unknown): ErrosCampos {
  if (!(error instanceof HttpErrorResponse) || error.status !== 422) return {};
  const errors = error.error?.errors as unknown;
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {};

  const fields: CamposPedido[] = ['cliente', 'cep', 'valorCentavos'];
  const result: ErrosCampos = {};
  for (const field of fields) {
    const messages: unknown = Object.hasOwn(errors, field) && Reflect.get(errors, field);
    if (Array.isArray(messages)) {
      const validMessages = messages.filter((message): message is string =>
        typeof message === 'string' && message.trim().length > 0);
      if (validMessages.length) result[field] = validMessages;
    }
  }
  return result;
}

export function cabecalhosDeAlteracao(etag: string): HttpHeaders {
  return new HttpHeaders().set('If-Match', etag);
}

export function alteracaoFalhou(error: unknown): FeedbackAlteracao {
  if (error instanceof HttpErrorResponse && error.status === 412) {
    return { kind: 'conflict', message: 'Outra atualização chegou primeiro. Recarregue o pedido antes de tentar novamente.' };
  }
  const status = error instanceof HttpErrorResponse ? ` (HTTP ${error.status})` : '';
  return { kind: 'error', message: `Não foi possível atualizar o pedido${status}.` };
}
