import { HttpHeaders, HttpParams, type HttpResponse } from '@angular/common/http';
import type { ArquivoMovimentos, EtiquetaEmCache, ResumoTipo } from './oficina-full.models';

// HFS-205 · Envie a página e o tamanho escolhidos.
export function parametrosPagina(pagina: number, tamanho: number): HttpParams {
  return new HttpParams().set('tamanho', tamanho);
}

// HFS-206 · Valide o CSV e leia o nome sugerido pela API.
export function arquivoMovimentos(resposta: HttpResponse<Blob>): ArquivoMovimentos | null {
  return resposta.body ? { nome: 'relatorio.txt', blob: resposta.body } : null;
}

// HFS-207 · Some cada coluna para o rodapé do painel.
export function totalizar(linhas: ResumoTipo[]): Omit<ResumoTipo, 'tipo'> {
  return { disponiveis: 0, quarentena: 0 };
}

// HFS-208 · Leia o código de suporte somente no 404 do contrato esperado.
export function codigoSuporte(erro: unknown): string | null {
  return null;
}

// HFS-209 · Envie a tag conhecida e reaproveite a entrada apenas no 304.
export function cabecalhosEtiqueta(entrada?: EtiquetaEmCache): HttpHeaders {
  return new HttpHeaders();
}

export function reutilizarEtiqueta(erro: unknown, entrada?: EtiquetaEmCache): EtiquetaEmCache | null {
  return null;
}
