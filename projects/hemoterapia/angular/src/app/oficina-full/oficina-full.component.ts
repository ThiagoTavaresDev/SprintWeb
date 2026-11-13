import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ResumoComponente } from '../contracts';
import type { EtiquetaEmCache, PaginaEstoque, ResumoTipo } from './oficina-full.models';
import { arquivoMovimentos, cabecalhosEtiqueta, codigoSuporte, parametrosPagina, reutilizarEtiqueta, totalizar } from './oficina-full';

const base = '/api/hemoterapia/oficina-full';

@Component({
  selector: 'app-oficina-full',
  templateUrl: './oficina-full.component.html',
  styleUrl: './oficina-full.component.css'
})
export class OficinaFullComponent {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, EtiquetaEmCache>();

  readonly tamanho = 2;
  readonly estoque = signal<PaginaEstoque | null>(null);
  readonly ocupacaoEstoque = signal(false);
  readonly erroEstoque = signal('');
  readonly paginas = computed(() => Math.max(1, Math.ceil((this.estoque()?.total ?? 0) / this.tamanho)));

  readonly exportando = signal(false);
  readonly mensagemExportacao = signal('');

  readonly linhasResumo = signal<ResumoTipo[] | null>(null);
  readonly totalResumo = computed(() => totalizar(this.linhasResumo() ?? []));
  readonly ocupacaoResumo = signal(false);
  readonly erroResumo = signal('');

  readonly conferencia = signal('');
  readonly ocupacaoConferencia = signal(false);
  readonly referenciaSuporte = signal<string | null>(null);

  readonly etiqueta = signal<ResumoComponente | null>(null);
  readonly mensagemEtiqueta = signal('');
  readonly ocupacaoEtiqueta = signal(false);

  async carregarEstoque(pagina: number): Promise<void> {
    this.ocupacaoEstoque.set(true);
    this.erroEstoque.set('');
    try {
      const resultado = await firstValueFrom(this.http.get<PaginaEstoque>(`${base}/estoque`, {
        params: parametrosPagina(pagina, this.tamanho)
      }));
      this.estoque.set(resultado);
    } catch {
      this.erroEstoque.set('Não foi possível consultar o estoque.');
    } finally {
      this.ocupacaoEstoque.set(false);
    }
  }

  async exportar(): Promise<void> {
    this.exportando.set(true);
    this.mensagemExportacao.set('');
    try {
      const resposta = await firstValueFrom(this.http.get(`${base}/movimentos.csv`, { observe: 'response', responseType: 'blob' }));
      const arquivo = arquivoMovimentos(resposta);
      if (!arquivo) {
        this.mensagemExportacao.set('A API não retornou um arquivo CSV.');
        return;
      }
      const url = URL.createObjectURL(arquivo.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = arquivo.nome;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      this.mensagemExportacao.set(`Arquivo recebido: ${arquivo.nome}.`);
    } catch {
      this.mensagemExportacao.set('Não foi possível baixar o relatório.');
    } finally {
      this.exportando.set(false);
    }
  }

  async carregarResumo(): Promise<void> {
    this.ocupacaoResumo.set(true);
    this.erroResumo.set('');
    try {
      const resultado = await firstValueFrom(this.http.get<{ items: ResumoTipo[] }>(`${base}/resumo`));
      this.linhasResumo.set(resultado.items);
    } catch {
      this.erroResumo.set('Não foi possível carregar o resumo.');
    } finally {
      this.ocupacaoResumo.set(false);
    }
  }

  async conferir(codigo: string): Promise<void> {
    this.ocupacaoConferencia.set(true);
    this.conferencia.set('');
    this.referenciaSuporte.set(null);
    try {
      const item = await firstValueFrom(this.http.get<ResumoComponente>(`${base}/conferencia/${this.codificar(codigo)}`));
      this.conferencia.set(`Componente ${item.codigo} encontrado.`);
    } catch (erro: unknown) {
      const referencia = codigoSuporte(erro);
      this.referenciaSuporte.set(referencia);
      this.conferencia.set(referencia ? 'Componente não encontrado.' : 'A consulta falhou. Verifique o código e tente novamente.');
    } finally {
      this.ocupacaoConferencia.set(false);
    }
  }

  async consultarEtiqueta(codigo: string): Promise<void> {
    const segmento = this.codificar(codigo);
    const entrada = this.cache.get(segmento);
    this.ocupacaoEtiqueta.set(true);
    this.mensagemEtiqueta.set('');
    this.etiqueta.set(null);
    try {
      const resposta = await firstValueFrom(this.http.get<ResumoComponente>(`${base}/etiquetas/${segmento}`, {
        headers: cabecalhosEtiqueta(entrada), observe: 'response'
      }));
      const item = resposta.body;
      const etag = resposta.headers.get('ETag');
      if (item && etag) this.cache.set(segmento, { item, etag });
      else this.cache.delete(segmento);
      this.etiqueta.set(item);
      this.mensagemEtiqueta.set(item ? '200 · Etiqueta recebida da API.' : 'A resposta veio sem uma etiqueta.');
    } catch (erro: unknown) {
      const reutilizada = reutilizarEtiqueta(erro, entrada);
      if (!reutilizada) this.cache.delete(segmento);
      this.etiqueta.set(reutilizada?.item ?? null);
      this.mensagemEtiqueta.set(reutilizada ? '304 · Etiqueta sem alteração; dados reaproveitados.' : 'Não foi possível consultar a etiqueta.');
    } finally {
      this.ocupacaoEtiqueta.set(false);
    }
  }

  private codificar(codigo: string): string {
    return encodeURIComponent(codigo.trim().toUpperCase());
  }
}
