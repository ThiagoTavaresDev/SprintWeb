import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, throwError, type Subscription } from 'rxjs';
import type { NovaOcorrencia, ResumoComponente } from '../contracts';
import { errosDeOcorrencia } from '../exercises.reference';
import { HemoterapiaApi } from '../hemoterapia.api';
import { consultarEstoque, criarVisiveis, detalhesRecentes, enviarRascunhos, focarPrimeiroErro } from './oficina';
import type { CamposComErro, EstadoEnvio } from './oficina.shared';

@Component({
  selector: 'app-oficina-angular',
  imports: [ReactiveFormsModule],
  templateUrl: './oficina.component.html',
  styles: `
    :host { display: block; }
    .subgrid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .subgrid article { min-width: 0; }
    .subgrid h3, form h3 { margin: .75rem 0; }
    .status { margin-top: .5rem; }
    .pesquisa { display: grid; max-width: 24rem; gap: .25rem; margin-top: .75rem; }
    [aria-invalid="true"] { border-color: #962448; }
    @media (max-width: 660px) { .subgrid { grid-template-columns: 1fr; } }
  `
})
export class OficinaAngularComponent {
  private readonly api = inject(HemoterapiaApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly codigos = new Subject<string>();
  private readonly entradas = new Subject<NovaOcorrencia>();
  private readonly codigoInput = viewChild.required<ElementRef<HTMLInputElement>>('oficinaCodigo');
  private readonly descricaoInput = viewChild.required<ElementRef<HTMLTextAreaElement>>('oficinaDescricao');
  private readonly itens = signal<ResumoComponente[]>([]);
  private consultaAtiva?: Subscription;

  protected readonly termo = signal('');
  protected readonly visiveis = criarVisiveis(this.itens, this.termo);
  protected readonly leitura = signal<'inicial' | 'carregando' | 'pronto' | 'erro'>('inicial');
  protected readonly tentativas = signal(0);
  protected readonly detalhe = toSignal(detalhesRecentes(this.codigos, codigo => this.api.detalhe(codigo)));
  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    codigoComponente: ['', Validators.required],
    descricao: ['', Validators.required]
  });
  protected readonly erros = signal<CamposComErro>({});
  protected readonly envio = signal<EstadoEnvio | null>(null);
  protected readonly enviando = computed(() => this.envio()?.tipo === 'enviando');

  constructor() {
    enviarRascunhos(this.entradas, entrada => this.api.criarOcorrencia(entrada))
      .pipe(takeUntilDestroyed())
      .subscribe(estado => this.atualizarEnvio(estado));
  }

  protected carregar(simularFalha = false) {
    this.consultaAtiva?.unsubscribe();
    this.leitura.set('carregando');
    this.tentativas.set(0);
    this.consultaAtiva = consultarEstoque(() => {
      this.tentativas.update(total => total + 1);
      if (simularFalha && this.tentativas() === 1) {
        return throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Falha simulada' }));
      }
      return this.api.estoque('');
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: dados => { this.itens.set(dados.items); this.leitura.set('pronto'); },
      error: () => this.leitura.set('erro')
    });
  }

  protected abrir(codigo: string) {
    this.codigos.next(codigo);
  }

  protected enviar() {
    if (this.formulario.valid) this.entradas.next(this.formulario.getRawValue());
  }

  private atualizarEnvio(estado: EstadoEnvio) {
    this.envio.set(estado);
    const campos = estado.tipo === 'erro' ? errosDeOcorrencia(estado.causa) : {};
    this.erros.set(campos);
    if (!Object.keys(campos).length) return;

    afterNextRender({ write: () => {
      if (this.erros() !== campos) return;
      focarPrimeiroErro(campos, {
        codigoComponente: this.codigoInput().nativeElement,
        descricao: this.descricaoInput().nativeElement
      });
    } }, { injector: this.injector });
  }
}
