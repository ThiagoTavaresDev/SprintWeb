using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Sprint.Hemoterapia;

var builder = WebApplication.CreateBuilder(args);
if (string.IsNullOrWhiteSpace(builder.Configuration["urls"]))
    builder.WebHost.UseUrls("http://127.0.0.1:5085");

var modo = builder.Configuration["Hemo:Modo"] ?? "inicial";
if (modo is not ("inicial" or "referencia"))
    throw new InvalidOperationException("Use Hemo:Modo=inicial ou Hemo:Modo=referencia.");
var referencia = modo == "referencia";

var arquivo = Path.GetFullPath(builder.Configuration["Hemo:Banco"] ?? Path.Combine("dados", $"{modo}.db"));
Directory.CreateDirectory(Path.GetDirectoryName(arquivo)!);
var conexao = new SqliteConnectionStringBuilder { DataSource = arquivo };
builder.Services.AddDbContext<BancoHemoterapia>(options => options.UseSqlite(conexao.ToString()));
OficinaNet.Configurar(builder.Services, arquivo);

var app = builder.Build();
await using (var scope = app.Services.CreateAsyncScope())
{
    await scope.ServiceProvider.GetRequiredService<BancoHemoterapia>().Database.EnsureCreatedAsync();
}

var hemo = app.MapGroup("/api/hemoterapia");
OficinaNet.Mapear(hemo, referencia);
OficinaFull.Mapear(hemo, referencia);
hemo.MapGet("/componentes", (BancoHemoterapia db, string? status, CancellationToken ct) =>
    referencia ? ExerciciosReferencia.Listar(db, status, ct) : Exercicios.Listar(db, status, ct));
hemo.MapGet("/componentes/{codigo}", (BancoHemoterapia db, string codigo, HttpContext http, CancellationToken ct) =>
    referencia ? ExerciciosReferencia.Detalhar(db, codigo, http, ct) : Exercicios.Detalhar(db, codigo, http, ct));
hemo.MapPost("/ocorrencias", (BancoHemoterapia db, NovaOcorrencia entrada, CancellationToken ct) =>
    referencia ? ExerciciosReferencia.CriarOcorrencia(db, entrada, ct) : Exercicios.CriarOcorrencia(db, entrada, ct));
hemo.MapGet("/ocorrencias/{id:long}", async (BancoHemoterapia db, long id, CancellationToken ct) =>
{
    var item = await db.Ocorrencias.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
    return item is null ? Results.NotFound() : Results.Ok(Comum.Converter(item));
});
await OficinaNet.Preparar(app.Services);
await app.RunAsync();
