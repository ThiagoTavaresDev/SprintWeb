using Microsoft.EntityFrameworkCore;

namespace Sprint.Hemoterapia;

internal static class ExerciciosReferencia
{
    public static async Task<IResult> Listar(BancoHemoterapia db, string? status, CancellationToken ct)
    {
        if (!Comum.StatusAceito(status))
            return Results.Problem("Use disponivel ou quarentena.", statusCode: 400);

        var consulta = db.Componentes.AsNoTracking();
        if (status is not null)
            consulta = consulta.Where(x => x.Status == status);
        return await Comum.Listar(consulta, ct);
    }

    public static async Task<IResult> Detalhar(
        BancoHemoterapia db, string codigo, HttpContext http, CancellationToken ct)
    {
        var item = await db.Componentes.AsNoTracking()
            .Where(x => x.Codigo == codigo)
            .Select(x => new DetalheComponente(
                x.Codigo, x.Tipo, x.Status, x.Versao,
                x.Movimentos.OrderBy(m => m.Instante).ThenBy(m => m.Id)
                    .Select(m => new LinhaTempo(m.Tipo, m.Instante, m.Unidade)).ToList()))
            .SingleOrDefaultAsync(ct);
        if (item is null) return Results.NotFound();

        http.Response.Headers.ETag = $"\"{item.Versao}\"";
        return Results.Ok(item);
    }

    public static async Task<IResult> CriarOcorrencia(
        BancoHemoterapia db, NovaOcorrencia entrada, CancellationToken ct)
    {
        var codigo = entrada.CodigoComponente?.Trim() ?? "";
        var descricao = entrada.Descricao?.Trim() ?? "";
        var errors = new Dictionary<string, string[]>();

        if (!await db.Componentes.AnyAsync(x => x.Codigo == codigo, ct))
            errors["codigoComponente"] = ["Selecione um código do estoque."];
        if (descricao.Length is 0 or > 240)
            errors["descricao"] = ["Descreva a ocorrência em até 240 caracteres."];
        if (errors.Count > 0)
            return Results.ValidationProblem(errors, statusCode: 422);

        return await Comum.Salvar(db, codigo, descricao, ct);
    }
}
