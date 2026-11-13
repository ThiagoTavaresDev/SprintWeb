using Microsoft.EntityFrameworkCore;

namespace Sprint.Hemoterapia;

public sealed record ResumoComponente(string Codigo, string Tipo, string Status, int Versao);
public sealed record LinhaTempo(string Tipo, string Instante, string Unidade);
public sealed record DetalheComponente(
    string Codigo, string Tipo, string Status, int Versao, IReadOnlyList<LinhaTempo> LinhaDoTempo);
public sealed record NovaOcorrencia(string? CodigoComponente, string? Descricao);
public sealed record OcorrenciaDto(long Id, string CodigoComponente, string Descricao, string Status);

internal static class Comum
{
    public static bool StatusAceito(string? status) => status is null or "disponivel" or "quarentena";

    public static async Task<IResult> Listar(IQueryable<Componente> consulta, CancellationToken ct)
    {
        var items = await consulta.OrderBy(x => x.Codigo)
            .Select(x => new ResumoComponente(x.Codigo, x.Tipo, x.Status, x.Versao))
            .ToListAsync(ct);
        return Results.Ok(new { items, total = items.Count });
    }

    public static OcorrenciaDto Converter(Ocorrencia item) =>
        new(item.Id, item.CodigoComponente, item.Descricao, item.Status);

    public static async Task<IResult> Salvar(
        BancoHemoterapia db, string codigo, string descricao, CancellationToken ct)
    {
        var item = new Ocorrencia { CodigoComponente = codigo, Descricao = descricao };
        db.Ocorrencias.Add(item);
        await db.SaveChangesAsync(ct);
        return Results.Created($"/api/hemoterapia/ocorrencias/{item.Id}", Converter(item));
    }
}
