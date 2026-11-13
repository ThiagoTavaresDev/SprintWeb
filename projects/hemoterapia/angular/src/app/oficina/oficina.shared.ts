import { HttpErrorResponse, type HttpResponse } from '@angular/common/http';
import { catchError, map, of, startWith, type Observable } from 'rxjs';
import type { DetalheComponente, NovaOcorrencia, Ocorrencia } from '../contracts';

export type EstadoConsulta =
  | { tipo: 'carregando'; codigo: string }
  | { tipo: 'pronto'; componente: DetalheComponente }
  | { tipo: 'erro'; mensagem: string };

export type EstadoEnvio =
  | { tipo: 'enviando' }
  | { tipo: 'salvo'; ocorrencia: Ocorrencia }
  | { tipo: 'erro'; causa: unknown };

export type ConsultarComponente = (codigo: string) => Observable<HttpResponse<DetalheComponente>>;
export type CriarRascunho = (entrada: NovaOcorrencia) => Observable<Ocorrencia>;
export type CamposComErro = Partial<Record<keyof NovaOcorrencia, string[]>>;
export type Controles = Record<keyof NovaOcorrencia, Pick<HTMLElement, 'focus'>>;

export function abrirConsulta(codigo: string, consultar: ConsultarComponente): Observable<EstadoConsulta> {
  const carregando: EstadoConsulta = { tipo: 'carregando', codigo };
  return consultar(codigo).pipe(
    map((resposta): EstadoConsulta => resposta.body
      ? { tipo: 'pronto', componente: resposta.body }
      : { tipo: 'erro', mensagem: 'O servidor devolveu um detalhe vazio.' }),
    catchError((erro: unknown) => of<EstadoConsulta>({
      tipo: 'erro',
      mensagem: erro instanceof HttpErrorResponse && erro.status === 404
        ? 'Componente não encontrado.' : 'Falha ao consultar o componente.'
    })),
    startWith(carregando)
  );
}

export function abrirEnvio(entrada: NovaOcorrencia, criar: CriarRascunho): Observable<EstadoEnvio> {
  const enviando: EstadoEnvio = { tipo: 'enviando' };
  return criar(entrada).pipe(
    map((ocorrencia): EstadoEnvio => ({ tipo: 'salvo', ocorrencia })),
    catchError((causa: unknown) => of<EstadoEnvio>({ tipo: 'erro', causa })),
    startWith(enviando)
  );
}
