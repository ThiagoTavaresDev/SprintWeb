using System.Globalization;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Sprint.Hemoterapia;

internal static class OficinaNet
{
    private const string FormatoUtc = "yyyy-MM-dd'T'HH:mm:ss'Z'";
    private static readonly string[] FormatosData = [FormatoUtc, "yyyy-MM-dd'T'HH:mm:sszzz"];

    public static void Configurar(IServiceCollection services, string arquivo)
    {
        var conexao = new SqliteConnectionStringBuilder { DataSource = arquivo + ".oficina-net.db" };
        services.AddDbContext<OficinaNetBanco>(options => options.UseSqlite(conexao.ToString()));
    }

    public static async Task Preparar(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<OficinaNetBanco>().Database.EnsureCreatedAsync();
    }

    public static void Mapear(RouteGroupBuilder hemo, bool referencia)
    {
        var rotas = hemo.MapGroup("/oficina-net");
        rotas.MapGet("/opcoes", (BancoHemoterapia db, CancellationToken ct) =>
            referencia ? OficinaNetReferencia.Opcoes(db, ct) : OficinaNetInicio.Opcoes(db, ct));
        rotas.MapGet("/recebimentos", (BancoHemoterapia db, CancellationToken ct) =>
            referencia ? OficinaNetReferencia.Recebimentos(db, ct) : OficinaNetInicio.Recebimentos(db, ct));
        rotas.MapPost("/importacoes", async (BancoHemoterapia hemoDb, OficinaNetBanco db, NovaImportacao entrada, CancellationToken ct) =>
        {
            var codigoExterno = NormalizarChave(entrada.CodigoExterno);
            var codigoComponente = entrada.CodigoComponente?.Trim().ToUpperInvariant();
            if (codigoExterno is null || codigoComponente is null ||
                !await hemoDb.Componentes.AnyAsync(x => x.Codigo == codigoComponente, ct))
                return Results.Problem("Informe um código de integração válido e um componente de teste existente.", statusCode: 422);

            var registro = new ImportacaoOficina { CodigoExterno = codigoExterno, CodigoComponente = codigoComponente };
            return await (referencia ? OficinaNetReferencia.Importar(db, registro, ct) : OficinaNetInicio.Importar(db, registro, ct));
        });
        rotas.MapGet("/importacoes/{codigo}", async (OficinaNetBanco db, string codigo, CancellationToken ct) =>
        {
            var registro = await db.Importacoes.AsNoTracking().SingleOrDefaultAsync(x => x.CodigoExterno == codigo, ct);
            return registro is null ? Results.NotFound() : Results.Ok(registro);
        });
        rotas.MapGet("/auditoria", (BancoHemoterapia db, string? de, string? ate, CancellationToken ct) =>
            referencia ? OficinaNetReferencia.Auditoria(db, de, ate, ct) : OficinaNetInicio.Auditoria(db, de, ate, ct));
        rotas.MapPost("/dossies", (OficinaNetBanco db, NovoDossie entrada, CancellationToken ct) =>
        {
            var codigo = NormalizarChave(entrada.Codigo);
            var nota = entrada.Nota?.Trim();
            if (codigo is null || string.IsNullOrEmpty(nota))
                return Task.FromResult(Results.Problem("Informe código e nota de teste.", statusCode: 422));

            return referencia ? OficinaNetReferencia.CriarDossie(db, codigo, nota, ct)
                              : OficinaNetInicio.CriarDossie(db, codigo, nota, ct);
        });
        rotas.MapGet("/dossies/{codigo}", async (OficinaNetBanco db, string codigo, CancellationToken ct) =>
        {
            var dossie = await db.Dossies.AsNoTracking().SingleOrDefaultAsync(x => x.Codigo == codigo, ct);
            if (dossie is null) return Results.NotFound();

            var eventos = await db.Registros.AsNoTracking().Where(x => x.DossieId == dossie.Id)
                .OrderBy(x => x.Id).Select(x => new EventoDossie(x.Nota)).ToListAsync(ct);
            return Results.Ok(new { dossie.Codigo, eventos });
        });
    }

    internal static string? NormalizarChave(string? entrada)
    {
        var codigo = entrada?.Trim();
        return codigo is { Length: >= 1 and <= 32 } && codigo.All(c => char.IsAsciiLetterOrDigit(c) || c == '-')
            ? codigo.ToUpperInvariant() : null;
    }

    internal static bool ChaveDuplicada(DbUpdateException erro) =>
        erro.InnerException is SqliteException { SqliteExtendedErrorCode: 1555 or 2067 };

    internal static bool NotaRejeitada(DbUpdateException erro) =>
        erro.InnerException is SqliteException { SqliteExtendedErrorCode: 275 };

    internal static IResult ImportacaoCriada(ImportacaoOficina registro) =>
        Results.Created($"/api/hemoterapia/oficina-net/importacoes/{registro.CodigoExterno}", registro);

    internal static IResult DossieCriado(string codigo, string nota) =>
        Results.Created($"/api/hemoterapia/oficina-net/dossies/{codigo}", new { codigo, eventos = new[] { new EventoDossie(nota) } });

    internal static IResult ErroNota() =>
        Results.ValidationProblem(new Dictionary<string, string[]> { ["nota"] = ["Limite de 80 caracteres nesta oficina."] }, statusCode: 422);

    internal static async Task SalvarDossie(OficinaNetBanco db, string codigo, string nota, CancellationToken ct)
    {
        var dossie = new DossieOficina { Codigo = codigo };
        db.Dossies.Add(dossie);
        await db.SaveChangesAsync(ct);

        db.Registros.Add(new RegistroOficina { DossieId = dossie.Id, Nota = nota });
        await db.SaveChangesAsync(ct);
    }

    internal static Task<List<EventoAuditoria>> ListarAuditoria(IQueryable<Movimento> consulta, CancellationToken ct) =>
        consulta.OrderBy(x => x.Instante).ThenBy(x => x.Id)
            .Select(x => new EventoAuditoria(x.ComponenteCodigo, x.Tipo, x.Instante, x.Unidade)).ToListAsync(ct);

    internal static string? EmUtc(string? valor) =>
        DateTimeOffset.TryParseExact(valor, FormatosData, CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var instante)
            ? instante.ToString(FormatoUtc, CultureInfo.InvariantCulture) : null;
}

internal sealed record OpcaoComponente(string Codigo, string Rotulo);
internal sealed record ResumoRecebimento(string Codigo, string? RecebidoEm);
internal sealed record EventoAuditoria(string CodigoComponente, string Tipo, string Instante, string Unidade);
internal sealed record NovaImportacao(string? CodigoExterno, string? CodigoComponente);
internal sealed record NovoDossie(string? Codigo, string? Nota);
internal sealed record EventoDossie(string Nota);
