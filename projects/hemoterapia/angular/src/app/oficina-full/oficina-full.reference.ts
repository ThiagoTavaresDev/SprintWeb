import { HttpErrorResponse, HttpHeaders, HttpParams, type HttpResponse } from '@angular/common/http';
import type { ArquivoMovimentos, EtiquetaEmCache, ResumoTipo } from './oficina-full.models';

export function parametrosPagina(pagina: number, tamanho: number): HttpParams {
  return new HttpParams().set('pagina', pagina).set('tamanho', tamanho);
}

export function arquivoMovimentos(resposta: HttpResponse<Blob>): ArquivoMovimentos | null {
  const tipo = resposta.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
  if (!resposta.body || tipo !== 'text/csv') return null;

  const disposicao = resposta.headers.get('Content-Disposition') ?? '';
  const nome = /(?:^|;)\s*filename\s*=\s*"?([a-z0-9][a-z0-9_-]*\.csv)"?\s*(?:;|$)/i.exec(disposicao)?.[1];
  return { nome: nome ?? 'movimentos.csv', blob: resposta.body };
}

export function totalizar(linhas: ResumoTipo[]): Omit<ResumoTipo, 'tipo'> {
  return linhas.reduce((total, linha) => ({
    disponiveis: total.disponiveis + linha.disponiveis,
    quarentena: total.quarentena + linha.quarentena
  }), { disponiveis: 0, quarentena: 0 });
}

export function codigoSuporte(erro: unknown): string | null {
  if (!(erro instanceof HttpErrorResponse) || erro.status !== 404) return null;
  const corpo: unknown = erro.error;
  if (typeof corpo !== 'object' || corpo === null || !('correlacao' in corpo)) return null;
  const codigo = corpo.correlacao;
  return typeof codigo === 'string' && codigo.trim() ? codigo : null;
}

export function cabecalhosEtiqueta(entrada?: EtiquetaEmCache): HttpHeaders {
  const headers = new HttpHeaders();
  return entrada ? headers.set('If-None-Match', entrada.etag) : headers;
}

export function reutilizarEtiqueta(erro: unknown, entrada?: EtiquetaEmCache): EtiquetaEmCache | null {
  return erro instanceof HttpErrorResponse && erro.status === 304 ? entrada ?? null : null;
}
