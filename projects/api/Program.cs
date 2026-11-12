using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Sprint.Api;

var builder = WebApplication.CreateBuilder(args);
if (string.IsNullOrWhiteSpace(builder.Configuration["urls"]))
{
    builder.WebHost.UseUrls("http://127.0.0.1:5075");
}

var modo = builder.Configuration["Sprint:Modo"] ?? "inicial";
IPedidosEndpoints pedidos = modo switch
{
    "inicial" => new PedidosIniciais(),
    "referencia" => new PedidosReferencia(),
    _ => throw new InvalidOperationException("Use Sprint:Modo=inicial ou Sprint:Modo=referencia.")
};

var banco = Path.GetFullPath(builder.Configuration["Sprint:Banco"] ?? Path.Combine("dados", $"pedidos-{modo}.db"));
Directory.CreateDirectory(Path.GetDirectoryName(banco)!);
var conexao = new SqliteConnectionStringBuilder { DataSource = banco };
builder.Services.AddDbContext<PedidosDbContext>(options => options.UseSqlite(conexao.ToString()));

var app = builder.Build();
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PedidosDbContext>();
    await db.Database.EnsureCreatedAsync();
    if (!await db.Pedidos.AnyAsync())
    {
        db.Pedidos.AddRange(
            new Pedido { Id = 101, Cliente = "Ana", Cep = "01001000", Status = "pendente", ValorCentavos = 12500 },
            new Pedido { Id = 102, Cliente = "Bruno", Cep = "20040002", Status = "enviado", ValorCentavos = 7990 },
            new Pedido { Id = 103, Cliente = "Carla", Cep = "30130010", Status = "pendente", ValorCentavos = 21900 }
        );
        await db.SaveChangesAsync();
    }
}

var api = app.MapGroup("/api/pedidos");
api.MapGet("", pedidos.Listar);
api.MapGet("/{id:int}", pedidos.Detalhar);
api.MapPost("", pedidos.Criar);
api.MapPatch("/{id:int}/status", pedidos.AlterarStatus);

app.Logger.LogInformation("Laboratório de pedidos no modo {Modo}. Banco {Banco}.", modo, banco);
await app.RunAsync();
