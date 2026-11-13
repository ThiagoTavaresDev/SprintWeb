using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Net.Http.Headers;

namespace Sprint.Hemoterapia;

internal static class OficinaFullReferencia
{
    internal static IQueryable<Componente> Paginar(IOrderedQueryable<Componente> consulta, int pagina, int tamanho) =>
        consulta.Skip((pagina - 1) * tamanho).Take(tamanho);

    internal static async Task<IResult> Exportar(BancoHemoterapia db, CancellationToken ct)
    {
        var movimentos = await db.Movimentos.AsNoTracking()
            .OrderBy(x => x.Instante).ThenBy(x => x.Id)
            .Select(x => new { x.ComponenteCodigo, x.Tipo, x.Instante, x.Unidade })
            .ToListAsync(ct);
        var csv = new StringBuilder("código,tipo,instante,unidade\r\n");
        foreach (var item in movimentos)
        {
            csv.AppendJoin(',', CampoCsv(item.ComponenteCodigo), CampoCsv(item.Tipo), CampoCsv(item.Instante), CampoCsv(item.Unidade))
                .Append("\r\n");
        }
        return Results.File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv; charset=utf-8", "movimentos.csv");
    }

    private static string CampoCsv(string valor)
    {
        // O relatório usa dados sintéticos; proteja também campos que uma planilha poderia executar.
        if (valor.Length > 0 && valor[0] is '=' or '+' or '-' or '@' or '\t' or '\r' or '\n')
            valor = "'" + valor;
        return '"' + valor.Replace("\"", "\"\"") + '"';
    }

    internal static async Task<IResult> Resumir(BancoHemoterapia db, CancellationToken ct)
    {
        var items = await db.Componentes.AsNoTracking().GroupBy(x => x.Tipo)
            .Select(grupo => new
            {
                tipo = grupo.Key,
                disponiveis = grupo.Count(x => x.Status == "disponivel"),
                quarentena = grupo.Count(x => x.Status == "quarentena")
            })
            .OrderBy(x => x.tipo).ToListAsync(ct);
        return Results.Ok(new { items });
    }

    internal static IResult FalhaConferencia(HttpContext http)
    {
        var correlacao = http.TraceIdentifier;
        http.Response.Headers["X-Correlation-ID"] = correlacao;
        return Results.Problem(statusCode: 404, title: "Componente não encontrado",
            extensions: new Dictionary<string, object?> { ["correlacao"] = correlacao });
    }

    internal static IResult LerEtiqueta(ResumoComponente item, HttpContext http)
    {
        var etag = new EntityTagHeaderValue($"\"{item.Codigo}-{item.Versao}\"");
        http.Response.GetTypedHeaders().ETag = etag;
        http.Response.Headers.CacheControl = "private, no-cache";
        var recebidas = http.Request.GetTypedHeaders().IfNoneMatch;
        return recebidas.Any(tag => tag.Equals(EntityTagHeaderValue.Any) || tag.Compare(etag, useStrongComparison: false))
            ? Results.StatusCode(StatusCodes.Status304NotModified)
            : Results.Ok(item);
    }
}
