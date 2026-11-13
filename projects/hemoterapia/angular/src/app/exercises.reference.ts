import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import type { HttpResponse } from '@angular/common/http';
import type { DetalheCarregado, DetalheComponente, ErrosOcorrencia, FiltroEstoque } from './contracts';

export function parametrosEstoque(status: FiltroEstoque): HttpParams {
  const params = new HttpParams();
  return status ? params.set('status', status) : params;
}

export function detalheRecebido(resposta: HttpResponse<DetalheComponente>): DetalheCarregado | null {
  if (!resposta.body) return null;
  return { componente: resposta.body, etag: resposta.headers.get('ETag') };
}

export function errosDeOcorrencia(erro: unknown): ErrosOcorrencia {
  if (!(erro instanceof HttpErrorResponse) || erro.status !== 422) return {};
  const body: unknown = erro.error;
  if (typeof body !== 'object' || body === null || !('errors' in body)) return {};
  const campos = body.errors;
  if (typeof campos !== 'object' || campos === null) return {};

  const result: ErrosOcorrencia = {};
  for (const campo of ['codigoComponente', 'descricao'] as const) {
    const mensagens = (campos as Record<string, unknown>)[campo];
    if (!Array.isArray(mensagens)) continue;
    const textos = mensagens.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    if (textos.length) result[campo] = textos;
  }
  return result;
}
