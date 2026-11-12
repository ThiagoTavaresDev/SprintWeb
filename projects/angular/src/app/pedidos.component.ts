import { ChangeDetectionStrategy, Component, DestroyRef, type OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Subscription } from 'rxjs';
import { eStatusPedido, statusPedido } from './contracts';
import type { CamposPedido, DetalhePedido, ErrosCampos, EstadoLista, FeedbackAlteracao, FiltroStatus, StatusPedido } from './contracts';
import { alteracaoFalhou, errosDeCriacao, listaCarregada, listaFalhou } from './exercises';
import { PedidosApi } from './pedidos.api';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './pedidos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PedidosComponent implements OnInit {
  private readonly api = inject(PedidosApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dinheiro = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  private listaAtiva?: Subscription;
  private detalheAtivo?: Subscription;

  readonly statusDisponiveis = statusPedido;
  readonly lista = signal<EstadoLista>({ kind: 'loading' });
  readonly filtro = signal<FiltroStatus>('');
  readonly pagina = signal(1);
  readonly detalhe = signal<DetalhePedido | null>(null);
  readonly carregandoDetalhe = signal(false);
  readonly erroDetalhe = signal('');
  readonly novoStatus = signal<StatusPedido>('pendente');
  readonly salvandoStatus = signal(false);
  readonly atualizacao = signal<FeedbackAlteracao | null>(null);
  readonly erros = signal<ErrosCampos>({});
  readonly criando = signal(false);
  readonly criacao = signal<{ kind: 'success' | 'error'; message: string } | null>(null);
  readonly form = new FormGroup({
    cliente: new FormControl('', { nonNullable: true, validators: Validators.required }),
    cep: new FormControl('', { nonNullable: true, validators: Validators.required }),
    valorCentavos: new FormControl<number | null>(null, [Validators.required, Validators.min(1)])
  });

  ngOnInit(): void {
    this.carregarLista();
  }

  carregarLista(pagina = this.pagina()): void {
    this.listaAtiva?.unsubscribe();
    this.pagina.set(pagina);
    this.lista.set({ kind: 'loading' });
    this.listaAtiva = this.api.listar(this.filtro(), pagina).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resultado => this.lista.set(listaCarregada(resultado)),
      error: error => this.lista.set(listaFalhou(error))
    });
  }

  filtrar(value: string): void {
    this.filtro.set(eStatusPedido(value) ? value : '');
    this.carregarLista(1);
  }

  formatarValor(valorCentavos: number): string {
    return this.dinheiro.format(valorCentavos / 100);
  }

  limparErro(campo: CamposPedido): void {
    this.erros.update(errors => ({ ...errors, [campo]: undefined }));
  }

  mensagemCampo(campo: CamposPedido): string {
    const control = this.form.controls[campo];
    return this.erros()[campo]?.join(' ') || (control.touched && control.invalid ? 'Preencha este campo com um valor válido.' : '');
  }

  criarPedido(): void {
    if (this.criando()) return;
    this.form.markAllAsTouched();
    this.criacao.set(null);
    this.erros.set({});
    const { cliente, cep, valorCentavos } = this.form.getRawValue();
    if (this.form.invalid || valorCentavos === null) return;
    if (!cliente.trim() || !cep.trim() || !Number.isSafeInteger(valorCentavos)) {
      this.criacao.set({ kind: 'error', message: 'Preencha o cliente, o CEP e um valor inteiro em centavos.' });
      return;
    }

    this.criando.set(true);
    this.api.criar({ cliente: cliente.trim(), cep: cep.trim(), valorCentavos }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: pedido => {
        this.criando.set(false);
        this.form.reset();
        this.criacao.set({ kind: 'success', message: `Pedido #${pedido.id} criado.` });
        this.filtrar('pendente');
      },
      error: error => {
        this.criando.set(false);
        const errors = errosDeCriacao(error);
        this.erros.set(errors);
        this.criacao.set({ kind: 'error', message: Object.keys(errors).length ? 'Revise os campos indicados.' : 'Não foi possível criar o pedido.' });
      }
    });
  }

  abrirDetalhe(id: number, preservarStatus = false): void {
    if (this.salvandoStatus()) return;
    this.detalheAtivo?.unsubscribe();
    this.carregandoDetalhe.set(true);
    this.detalhe.set(null);
    this.atualizacao.set(null);
    this.erroDetalhe.set('');
    this.detalheAtivo = this.api.detalhar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: detalhe => {
        this.carregandoDetalhe.set(false);
        this.detalhe.set(detalhe);
        if (!preservarStatus) this.novoStatus.set(detalhe.pedido.status);
      },
      error: () => {
        this.carregandoDetalhe.set(false);
        this.erroDetalhe.set('Não foi possível carregar o detalhe deste pedido.');
      }
    });
  }

  escolherStatus(value: string): void {
    if (eStatusPedido(value)) this.novoStatus.set(value);
  }

  salvarStatus(): void {
    const detalhe = this.detalhe();
    if (!detalhe?.etag || this.salvandoStatus() || this.atualizacao()?.kind === 'conflict') return;

    this.salvandoStatus.set(true);
    this.atualizacao.set(null);
    this.api.atualizarStatus(detalhe.pedido.id, this.novoStatus(), detalhe.etag).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: atual => {
        this.salvandoStatus.set(false);
        this.detalhe.set(atual);
        this.novoStatus.set(atual.pedido.status);
        this.atualizacao.set({ kind: 'success', message: 'Status atualizado.' });
        this.carregarLista(1);
      },
      error: error => {
        this.salvandoStatus.set(false);
        this.atualizacao.set(alteracaoFalhou(error));
      }
    });
  }
}
