using Microsoft.EntityFrameworkCore;

namespace Sprint.Hemoterapia;

internal static class Exercicios
{
    // HNT-301 · O filtro chega à rota e ainda precisa entrar na consulta.
    public static async Task<IResult> Listar(BancoHemoterapia db, string? status, CancellationToken ct)
    {
        if (!Comum.StatusAceito(status))
            return Results.Problem("Use disponivel ou quarentena.", statusCode: 400);
        return await Comum.Listar(db.Componentes.AsNoTracking(), ct);
    }

    // HNT-302 · Complete a linha do tempo e o cabeçalho ETag.
    public static async Task<IResult> Detalhar(
        BancoHemoterapia db, string codigo, HttpContext http, CancellationToken ct)
    {
        var item = await db.Componentes.AsNoTracking().SingleOrDefaultAsync(x => x.Codigo == codigo, ct);
        if (item is null) return Results.NotFound();
        return Results.Ok(new DetalheComponente(item.Codigo, item.Tipo, item.Status, item.Versao, []));
    }

    // HNT-303 · Colete também o erro de descrição antes de salvar.
    public static async Task<IResult> CriarOcorrencia(
        BancoHemoterapia db, NovaOcorrencia entrada, CancellationToken ct)
    {
        var codigo = entrada.CodigoComponente?.Trim() ?? "";
        if (!await db.Componentes.AnyAsync(x => x.Codigo == codigo, ct))
            return Results.ValidationProblem(
                new Dictionary<string, string[]> { ["codigoComponente"] = ["Selecione um código do estoque."] },
                statusCode: 422);
        return await Comum.Salvar(db, codigo, entrada.Descricao?.Trim() ?? "", ct);
    }
}
