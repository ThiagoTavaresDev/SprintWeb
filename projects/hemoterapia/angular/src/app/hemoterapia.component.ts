import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Subscription } from 'rxjs';
import type { DetalheCarregado, ErrosOcorrencia, FiltroEstoque, ResumoComponente } from './contracts';
import { detalheRecebido, errosDeOcorrencia } from './exercises';
import { HemoterapiaApi } from './hemoterapia.api';
import { OficinaAngularComponent } from './oficina/oficina.component';
import { OficinaFullComponent } from './oficina-full/oficina-full.component';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, OficinaAngularComponent, OficinaFullComponent],
  templateUrl: './hemoterapia.component.html'
})
export class HemoterapiaComponent {
  private readonly api = inject(HemoterapiaApi);
  private readonly destroyRef = inject(DestroyRef);
  private listaAtiva?: Subscription;
  private detalheAtivo?: Subscription;

  protected readonly filtro = signal<FiltroEstoque>('');
  protected readonly itens = signal<ResumoComponente[]>([]);
  protected readonly consultando = signal(false);
  protected readonly erroEstoque = signal('');
  protected readonly detalhe = signal<DetalheCarregado | null>(null);
  protected readonly consultandoDetalhe = signal(false);
  protected readonly erroDetalhe = signal('');
  protected readonly erros = signal<ErrosOcorrencia>({});
  protected readonly mensagem = signal('');
  protected readonly salvando = signal(false);
  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    codigoComponente: ['', Validators.required],
    descricao: ['', Validators.required]
  });

  constructor() {
    this.carregar('');
  }

  protected carregar(status: FiltroEstoque) {
    this.listaAtiva?.unsubscribe();
    this.filtro.set(status);
    this.consultando.set(true);
    this.erroEstoque.set('');
    this.listaAtiva = this.api.estoque(status).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: dados => { this.itens.set(dados.items); this.consultando.set(false); },
      error: () => { this.erroEstoque.set('Falha ao consultar o estoque.'); this.consultando.set(false); }
    });
  }

  protected abrir(codigo: string) {
    this.detalheAtivo?.unsubscribe();
    this.detalhe.set(null);
    this.erroDetalhe.set('');
    this.consultandoDetalhe.set(true);
    this.detalheAtivo = this.api.detalhe(codigo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resposta => {
        const detalhe = detalheRecebido(resposta);
        this.detalhe.set(detalhe);
        if (!detalhe) this.erroDetalhe.set('O servidor retornou um detalhe vazio.');
        this.consultandoDetalhe.set(false);
      },
      error: (error: unknown) => {
        this.erroDetalhe.set(error instanceof HttpErrorResponse && error.status === 404
          ? 'Componente não encontrado.'
          : 'Falha ao abrir a linha do tempo.');
        this.consultandoDetalhe.set(false);
      }
    });
  }

  protected registrar() {
    if (this.formulario.invalid || this.salvando()) return;
    this.salvando.set(true);
    this.erros.set({});
    this.mensagem.set('');
    this.api.criarOcorrencia(this.formulario.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: registro => {
        this.mensagem.set('Rascunho interno #' + registro.id + ' registrado.');
        this.formulario.reset();
        this.salvando.set(false);
      },
      error: (erro: unknown) => {
        const campos = errosDeOcorrencia(erro);
        this.erros.set(campos);
        this.mensagem.set(Object.keys(campos).length ? 'Confira os campos destacados.' : 'Não foi possível salvar o rascunho.');
        this.salvando.set(false);
      }
    });
  }
}
