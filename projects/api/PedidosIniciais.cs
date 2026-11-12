using Microsoft.EntityFrameworkCore;

namespace Sprint.Api;

// Trabalhe neste arquivo. Cada método contém um problema de um ticket NET-30x.
public sealed class PedidosIniciais : IPedidosEndpoints
{
    public async Task<IResult> Listar(HttpRequest request, PedidosDbContext db, CancellationToken ct)
    {
        if (!PedidoHttp.NumeroDeConsulta(request, "pagina", 1, 10_000, out var pagina)
            || !PedidoHttp.NumeroDeConsulta(request, "limite", 10, 100, out var limite))
        {
            return PedidoHttp.Erro(400, "Pagina ou limite fora do intervalo aceito.");
        }

        // NET-301: o filtro é ignorado e todos os registros são carregados antes da paginação.
        var todos = await db.Pedidos.OrderBy(pedido => pedido.Id).ToListAsync(ct);
        var items = todos.Skip((pagina - 1) * limite).Take(limite).Select(PedidoDto.De).ToArray();
        return Results.Ok(new PaginaPedidos(items, pagina, limite, todos.Count));
    }

    public async Task<IResult> Detalhar(int id, HttpResponse response, PedidosDbContext db, CancellationToken ct)
    {
        var pedido = await db.Pedidos.AsNoTracking().Where(p => p.Id == id)
            .Select(PedidoDto.Projetar).SingleOrDefaultAsync(ct);
        if (pedido is null) return PedidoHttp.Erro(404, "Pedido não encontrado.");

        // NET-302: a leitura está correta, mas o cliente não recebe a ETag do recurso.
        return Results.Ok(pedido);
    }

    public async Task<IResult> Criar(CriarPedido entrada, HttpResponse response, PedidosDbContext db, CancellationToken ct)
    {
        var erros = PedidoHttp.ValidarCriacao(entrada);
        if (erros.Count > 0)
        {
            // NET-303: o formulário espera 422 com erros por campo.
            return PedidoHttp.Erro(400, "Pedido inválido.");
        }

        var pedido = new Pedido
        {
            Cliente = entrada.Cliente!.Trim(),
            Cep = entrada.Cep!,
            ValorCentavos = entrada.ValorCentavos!.Value
        };
        db.Pedidos.Add(pedido);
        await db.SaveChangesAsync(ct);

        // NET-303: falta a ETag na resposta 201.
        return Results.Created($"/api/pedidos/{pedido.Id}", PedidoDto.De(pedido));
    }

    public async Task<IResult> AlterarStatus(int id, AlterarStatusPedido entrada, HttpContext context, PedidosDbContext db, CancellationToken ct)
    {
        if (!PedidoHttp.StatusValido(entrada.Status)) return PedidoHttp.StatusInvalido();
        var pedido = await db.Pedidos.SingleOrDefaultAsync(pedido => pedido.Id == id, ct);
        if (pedido is null) return PedidoHttp.Erro(404, "Pedido não encontrado.");

        // NET-304: um cliente pode sobrescrever uma versão que nunca leu.
        pedido.Status = entrada.Status!;
        pedido.Versao++;
        await db.SaveChangesAsync(ct);
        context.Response.Headers.ETag = PedidoHttp.ETag(pedido.Versao);
        return Results.Ok(PedidoDto.De(pedido));
    }
}
