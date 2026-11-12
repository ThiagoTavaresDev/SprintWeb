using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;

namespace Sprint.Api;

public sealed class PedidosDbContext(DbContextOptions<PedidosDbContext> options) : DbContext(options)
{
    public DbSet<Pedido> Pedidos => Set<Pedido>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var pedidos = modelBuilder.Entity<Pedido>();
        pedidos.Property(pedido => pedido.Cliente).HasMaxLength(120);
        pedidos.Property(pedido => pedido.Cep).HasMaxLength(8);
        pedidos.Property(pedido => pedido.Status).HasMaxLength(12);
        pedidos.HasIndex(pedido => new { pedido.Status, pedido.Id });
        pedidos.Property(pedido => pedido.Versao).IsConcurrencyToken();
    }
}

public sealed class Pedido
{
    public int Id { get; set; }
    public required string Cliente { get; init; }
    public required string Cep { get; init; }
    public string Status { get; set; } = "pendente";
    public int ValorCentavos { get; init; }
    public int Versao { get; set; } = 1;
}

public sealed record PedidoDto(int Id, string Cliente, string Cep, string Status, int ValorCentavos, int Versao)
{
    public static readonly Expression<Func<Pedido, PedidoDto>> Projetar = pedido => new PedidoDto(
        pedido.Id, pedido.Cliente, pedido.Cep, pedido.Status, pedido.ValorCentavos, pedido.Versao);

    public static PedidoDto De(Pedido pedido) => new(
        pedido.Id, pedido.Cliente, pedido.Cep, pedido.Status, pedido.ValorCentavos, pedido.Versao);
}

public sealed record CriarPedido(string? Cliente, string? Cep, int? ValorCentavos);
public sealed record AlterarStatusPedido(string? Status);
public sealed record PaginaPedidos(IReadOnlyList<PedidoDto> Items, int Pagina, int Limite, int Total);
