import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { DetalheComponente, Estoque, FiltroEstoque, NovaOcorrencia, Ocorrencia } from './contracts';
import { parametrosEstoque } from './exercises';

@Injectable({ providedIn: 'root' })
export class HemoterapiaApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/hemoterapia';

  estoque(status: FiltroEstoque) {
    return this.http.get<Estoque>(this.base + '/componentes', { params: parametrosEstoque(status) });
  }

  detalhe(codigo: string) {
    return this.http.get<DetalheComponente>(this.base + '/componentes/' + encodeURIComponent(codigo), { observe: 'response' });
  }

  criarOcorrencia(entrada: NovaOcorrencia) {
    return this.http.post<Ocorrencia>(this.base + '/ocorrencias', entrada);
  }
}
