import { HttpParams } from '@angular/common/http';
import type { HttpResponse } from '@angular/common/http';
import type { DetalheCarregado, DetalheComponente, ErrosOcorrencia, FiltroEstoque } from './contracts';

// HNG-401 · Inclua o filtro do estoque quando um estado estiver selecionado.
export function parametrosEstoque(_status: FiltroEstoque): HttpParams {
  return new HttpParams();
}

// HNG-402 · Preserve a linha do tempo e leia a versão da representação.
export function detalheRecebido(resposta: HttpResponse<DetalheComponente>): DetalheCarregado | null {
  if (!resposta.body) return null;
  return { componente: { ...resposta.body, linhaDoTempo: [] }, etag: null };
}

// HNG-403 · Associe os erros de validação aos campos conhecidos da tela.
export function errosDeOcorrencia(_erro: unknown): ErrosOcorrencia {
  return {};
}
