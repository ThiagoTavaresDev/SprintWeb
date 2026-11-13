namespace Sprint.Hemoterapia;

internal static class OficinaFullExercicios
{
    // HFS-205 · A consulta já está ordenada. Falta usar a página solicitada.
    internal static IQueryable<Componente> Paginar(IOrderedQueryable<Componente> consulta, int pagina, int tamanho) =>
        consulta.Take(tamanho);

    // HFS-206 · Consulte as movimentações e devolva um arquivo CSV.
    internal static Task<IResult> Exportar(BancoHemoterapia db, CancellationToken ct) =>
        Task.FromResult(Results.Ok(new { mensagem = "Exportação ainda indisponível" }));

    // HFS-207 · Produza uma linha por tipo, com as duas contagens de estado.
    internal static Task<IResult> Resumir(BancoHemoterapia db, CancellationToken ct) =>
        Task.FromResult(Results.Ok(new { items = Array.Empty<object>() }));

    // HFS-208 · Acrescente o ProblemDetails e a referência para o suporte.
    internal static IResult FalhaConferencia(HttpContext http) => Results.NotFound();

    // HFS-209 · Consulte a condição enviada em If-None-Match antes de serializar o item.
    internal static IResult LerEtiqueta(ResumoComponente item, HttpContext http)
    {
        http.Response.Headers.ETag = $"\"{item.Codigo}-{item.Versao}\"";
        http.Response.Headers.CacheControl = "private, no-cache";
        return Results.Ok(item);
    }
}
