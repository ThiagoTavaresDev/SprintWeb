import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import type { CriarPedidoDto, DetalhePedido, FiltroStatus, PaginaPedidos, PedidoDto, StatusPedido } from './contracts';
import { cabecalhosDeAlteracao, parametrosLista } from './exercises';

@Injectable({ providedIn: 'root' })
export class PedidosApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/pedidos';

  listar(status: FiltroStatus, pagina = 1, limite = 5) {
    return this.http.get<PaginaPedidos>(this.base, { params: parametrosLista(status, pagina, limite) });
  }

  detalhar(id: number) {
    return this.http.get<PedidoDto>(`${this.base}/${id}`, { observe: 'response' }).pipe(
      map(({ body, headers }): DetalhePedido => {
        if (!body) throw new Error('A API devolveu um detalhe sem pedido.');
        return { pedido: body, etag: headers.get('ETag') };
      })
    );
  }

  criar(payload: CriarPedidoDto) {
    return this.http.post<PedidoDto>(this.base, payload);
  }

  atualizarStatus(id: number, status: StatusPedido, etag: string) {
    return this.http.patch<PedidoDto>(`${this.base}/${id}/status`, { status }, {
      headers: cabecalhosDeAlteracao(etag),
      observe: 'response'
    }).pipe(
      map(({ body, headers }): DetalhePedido => {
        if (!body) throw new Error('A API devolveu uma atualização sem pedido.');
        return { pedido: body, etag: headers.get('ETag') };
      })
    );
  }
}
