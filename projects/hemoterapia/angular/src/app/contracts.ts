export type TipoComponente = 'CH' | 'PL' | 'CP';
export type StatusComponente = 'disponivel' | 'quarentena';
export type FiltroEstoque = StatusComponente | '';

export interface ResumoComponente {
  codigo: string;
  tipo: TipoComponente;
  status: StatusComponente;
  versao: number;
}

export interface Estoque {
  items: ResumoComponente[];
  total: number;
}

export interface Movimento {
  tipo: string;
  instante: string;
  unidade: string;
}

export interface DetalheComponente extends ResumoComponente {
  linhaDoTempo: Movimento[];
}

export interface DetalheCarregado {
  componente: DetalheComponente;
  etag: string | null;
}

export interface NovaOcorrencia {
  codigoComponente: string;
  descricao: string;
}

export interface Ocorrencia extends NovaOcorrencia {
  id: number;
  status: 'rascunho';
}

export type ErrosOcorrencia = Partial<Record<keyof NovaOcorrencia, string[]>>;
