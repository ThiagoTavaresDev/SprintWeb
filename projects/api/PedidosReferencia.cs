using Microsoft.EntityFrameworkCore;

namespace Sprint.Api;

public sealed class PedidosReferencia : IPedidosEndpoints
{
    public async Task<IResult> Listar(HttpRequest request, PedidosDbContext db, CancellationToken ct)
    {
        if (!PedidoHttp.NumeroDeConsulta(request, "pagina", 1, 10_000, out var pagina)
            || !PedidoHttp.NumeroDeConsulta(request, "limite", 10, 100, out var limite))
        {
            return PedidoHttp.Erro(400, "Pagina ou limite fora do intervalo aceito.");
        }

        var consulta = db.Pedidos.AsNoTracking();
        if (request.Query.TryGetValue("status", out var filtro))
        {
            var status = filtro.ToString();
            if (!PedidoHttp.StatusValido(status)) return PedidoHttp.Erro(400, "Status de filtro inválido.");
            consulta = consulta.Where(pedido => pedido.Status == status);
        }

        var total = await consulta.CountAsync(ct);
        var items = await consulta.OrderBy(pedido => pedido.Id)
            .Skip((pagina - 1) * limite).Take(limite).Select(PedidoDto.Projetar).ToListAsync(ct);
        return Results.Ok(new PaginaPedidos(items, pagina, limite, total));
    }

    public async Task<IResult> Detalhar(int id, HttpResponse response, PedidosDbContext db, CancellationToken ct)
    {
        var pedido = await db.Pedidos.AsNoTracking().Where(p => p.Id == id)
            .Select(PedidoDto.Projetar).SingleOrDefaultAsync(ct);
        if (pedido is null) return PedidoHttp.Erro(404, "Pedido não encontrado.");

        response.Headers.ETag = PedidoHttp.ETag(pedido.Versao);
        return Results.Ok(pedido);
    }

    public async Task<IResult> Criar(CriarPedido entrada, HttpResponse response, PedidosDbContext db, CancellationToken ct)
    {
        var erros = PedidoHttp.ValidarCriacao(entrada);
        if (erros.Count > 0) return Results.ValidationProblem(erros, statusCode: StatusCodes.Status422UnprocessableEntity);

        var pedido = new Pedido
        {
            Cliente = entrada.Cliente!.Trim(),
            Cep = entrada.Cep!,
            ValorCentavos = entrada.ValorCentavos!.Value
        };
        db.Pedidos.Add(pedido);
        await db.SaveChangesAsync(ct);
        response.Headers.ETag = PedidoHttp.ETag(pedido.Versao);
        return Results.Created($"/api/pedidos/{pedido.Id}", PedidoDto.De(pedido));
    }

    public async Task<IResult> AlterarStatus(int id, AlterarStatusPedido entrada, HttpContext context, PedidosDbContext db, CancellationToken ct)
    {
        if (!context.Request.Headers.TryGetValue("If-Match", out var condicao))
        {
            return PedidoHttp.Erro(428, "Envie a ETag atual no cabeçalho If-Match.");
        }
        if (!PedidoHttp.TentarLerETag(condicao.ToString(), out var versao))
        {
            return PedidoHttp.Erro(400, "If-Match deve conter uma única versão entre aspas.");
        }
        if (!PedidoHttp.StatusValido(entrada.Status)) return PedidoHttp.StatusInvalido();

        var pedido = await db.Pedidos.SingleOrDefaultAsync(pedido => pedido.Id == id, ct);
        if (pedido is null) return PedidoHttp.Erro(404, "Pedido não encontrado.");
        if (pedido.Versao != versao) return PedidoHttp.Erro(412, "A versão do pedido mudou.");

        pedido.Status = entrada.Status!;
        pedido.Versao++;
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return PedidoHttp.Erro(412, "A versão do pedido mudou durante a gravação.");
        }

        context.Response.Headers.ETag = PedidoHttp.ETag(pedido.Versao);
        return Results.Ok(PedidoDto.De(pedido));
    }
}
