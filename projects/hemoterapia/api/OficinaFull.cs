using Microsoft.EntityFrameworkCore;

namespace Sprint.Hemoterapia;

public static class OficinaFull
{
    public static void Mapear(RouteGroupBuilder hemo, bool referencia)
    {
        var oficina = hemo.MapGroup("/oficina-full");
        oficina.MapGet("/estoque", (BancoHemoterapia db, int? pagina, int? tamanho, CancellationToken ct) =>
            Estoque(db, pagina ?? 1, tamanho ?? 2, referencia, ct));
        oficina.MapGet("/movimentos.csv", (BancoHemoterapia db, CancellationToken ct) =>
            referencia ? OficinaFullReferencia.Exportar(db, ct) : OficinaFullExercicios.Exportar(db, ct));
        oficina.MapGet("/resumo", (BancoHemoterapia db, CancellationToken ct) =>
            referencia ? OficinaFullReferencia.Resumir(db, ct) : OficinaFullExercicios.Resumir(db, ct));
        oficina.MapGet("/conferencia/{codigo}", async (BancoHemoterapia db, string codigo, HttpContext http, CancellationToken ct) =>
        {
            var item = await Buscar(db, codigo, ct);
            return item is not null ? Results.Ok(item) : referencia
                ? OficinaFullReferencia.FalhaConferencia(http)
                : OficinaFullExercicios.FalhaConferencia(http);
        });
        oficina.MapGet("/etiquetas/{codigo}", async (BancoHemoterapia db, string codigo, HttpContext http, CancellationToken ct) =>
        {
            var item = await Buscar(db, codigo, ct);
            return item is null ? Results.NotFound() : referencia
                ? OficinaFullReferencia.LerEtiqueta(item, http)
                : OficinaFullExercicios.LerEtiqueta(item, http);
        });
    }

    private static async Task<IResult> Estoque(BancoHemoterapia db, int pagina, int tamanho, bool referencia, CancellationToken ct)
    {
        if (pagina is < 1 or > 10_000 || tamanho is < 1 or > 50)
            return Results.BadRequest(new { erro = "Use pagina entre 1 e 10000 e tamanho entre 1 e 50." });

        var consulta = db.Componentes.AsNoTracking().OrderBy(item => item.Codigo);
        var total = await consulta.CountAsync(ct);
        var itensDaPagina = referencia
            ? OficinaFullReferencia.Paginar(consulta, pagina, tamanho)
            : OficinaFullExercicios.Paginar(consulta, pagina, tamanho);
        var items = await itensDaPagina.Select(x => new ResumoComponente(x.Codigo, x.Tipo, x.Status, x.Versao)).ToListAsync(ct);
        return Results.Ok(new { items, total, pagina, tamanho });
    }

    private static Task<ResumoComponente?> Buscar(BancoHemoterapia db, string codigo, CancellationToken ct) =>
        db.Componentes.AsNoTracking().Where(item => item.Codigo == codigo)
            .Select(item => new ResumoComponente(item.Codigo, item.Tipo, item.Status, item.Versao)).SingleOrDefaultAsync(ct);
}
