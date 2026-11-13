import type { Estoque, ResumoComponente } from '../contracts';

export interface PaginaEstoque extends Estoque {
  pagina: number;
  tamanho: number;
}

export interface ResumoTipo {
  tipo: string;
  disponiveis: number;
  quarentena: number;
}

export interface ArquivoMovimentos {
  nome: string;
  blob: Blob;
}

export interface EtiquetaEmCache {
  item: ResumoComponente;
  etag: string;
}
