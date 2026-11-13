import { HttpErrorResponse } from '@angular/common/http';
import { computed, type Signal } from '@angular/core';
import { defer, exhaustMap, of, retry, switchMap, throwError, type Observable } from 'rxjs';
import type { Estoque, NovaOcorrencia, ResumoComponente } from '../contracts';
import { abrirConsulta, abrirEnvio, type CamposComErro, type ConsultarComponente, type Controles, type CriarRascunho } from './oficina.shared';

export function criarVisiveis(itens: Signal<ResumoComponente[]>, termo: Signal<string>) {
  return computed(() => {
    const filtro = termo().trim().toUpperCase();
    return itens().filter(item => item.codigo.toUpperCase().includes(filtro));
  });
}

export function detalhesRecentes(codigos: Observable<string>, consultar: ConsultarComponente) {
  return codigos.pipe(switchMap(codigo => abrirConsulta(codigo, consultar)));
}

export function consultarEstoque(carregar: () => Observable<Estoque>) {
  return defer(carregar).pipe(retry({
    count: 1,
    delay: (erro: unknown) => erro instanceof HttpErrorResponse && (erro.status === 0 || erro.status === 503)
      ? of(null)
      : throwError(() => erro)
  }));
}

export function focarPrimeiroErro(campos: CamposComErro, controles: Controles): void {
  const ordem: (keyof NovaOcorrencia)[] = ['codigoComponente', 'descricao'];
  const primeiro = ordem.find(campo => campos[campo]?.length);
  if (primeiro) controles[primeiro].focus();
}

export function enviarRascunhos(entradas: Observable<NovaOcorrencia>, criar: CriarRascunho) {
  return entradas.pipe(exhaustMap(entrada => abrirEnvio(entrada, criar)));
}
