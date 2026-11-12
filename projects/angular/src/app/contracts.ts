export const statusPedido = ['pendente', 'enviado', 'cancelado'] as const;
export type StatusPedido = typeof statusPedido[number];
export type FiltroStatus = StatusPedido | '';

export interface PedidoDto {
  id: number;
  cliente: string;
  cep: string;
  status: StatusPedido;
  valorCentavos: number;
  versao: number;
}

export interface PaginaPedidos {
  items: PedidoDto[];
  pagina: number;
  limite: number;
  total: number;
}

export interface CriarPedidoDto {
  cliente: string;
  cep: string;
  valorCentavos: number;
}

export type CamposPedido = keyof CriarPedidoDto;
export type ErrosCampos = Partial<Record<CamposPedido, string[]>>;

export type EstadoLista =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; pedidos: PedidoDto[]; pagina: number; limite: number; total: number };

export interface DetalhePedido {
  pedido: PedidoDto;
  etag: string | null;
}

export type FeedbackAlteracao = {
  kind: 'success' | 'error' | 'conflict';
  message: string;
};

export function eStatusPedido(value: string): value is StatusPedido {
  return statusPedido.some(status => status === value);
}
