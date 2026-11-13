using Microsoft.EntityFrameworkCore;

namespace Sprint.Hemoterapia;

public sealed class BancoHemoterapia(DbContextOptions<BancoHemoterapia> options) : DbContext(options)
{
    public DbSet<Componente> Componentes => Set<Componente>();
    public DbSet<Movimento> Movimentos => Set<Movimento>();
    public DbSet<Ocorrencia> Ocorrencias => Set<Ocorrencia>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<Componente>().HasKey(x => x.Codigo);
        model.Entity<Componente>().HasIndex(x => x.Status);
        model.Entity<Movimento>().HasOne<Componente>().WithMany(x => x.Movimentos)
            .HasForeignKey(x => x.ComponenteCodigo);
        model.Entity<Ocorrencia>().HasOne<Componente>().WithMany()
            .HasForeignKey(x => x.CodigoComponente);

        model.Entity<Componente>().HasData(
            new Componente { Codigo = "BOL-101", Tipo = "CH", Status = "disponivel" },
            new Componente { Codigo = "BOL-102", Tipo = "PL", Status = "quarentena" },
            new Componente { Codigo = "BOL-103", Tipo = "CP", Status = "disponivel" });
        model.Entity<Movimento>().HasData(
            new Movimento { Id = 1, ComponenteCodigo = "BOL-101", Tipo = "registrado", Instante = "2026-10-01T09:00:00Z", Unidade = "U-A" },
            new Movimento { Id = 2, ComponenteCodigo = "BOL-101", Tipo = "recebido", Instante = "2026-10-01T11:00:00Z", Unidade = "U-B" },
            new Movimento { Id = 3, ComponenteCodigo = "BOL-102", Tipo = "registrado", Instante = "2026-10-01T10:00:00Z", Unidade = "U-A" },
            new Movimento { Id = 4, ComponenteCodigo = "BOL-103", Tipo = "registrado", Instante = "2026-10-01T12:00:00Z", Unidade = "U-A" });
    }
}

public sealed class Componente
{
    public required string Codigo { get; init; }
    public required string Tipo { get; init; }
    public required string Status { get; init; }
    public int Versao { get; init; } = 1;
    public List<Movimento> Movimentos { get; } = [];
}

public sealed class Movimento
{
    public long Id { get; init; }
    public required string ComponenteCodigo { get; init; }
    public required string Tipo { get; init; }
    public required string Instante { get; init; }
    public required string Unidade { get; init; }
}

public sealed class Ocorrencia
{
    public long Id { get; init; }
    public required string CodigoComponente { get; init; }
    public required string Descricao { get; init; }
    public string Status { get; init; } = "rascunho";
}
