using Microsoft.EntityFrameworkCore;

namespace Sprint.Hemoterapia;

internal sealed class OficinaNetBanco(DbContextOptions<OficinaNetBanco> options) : DbContext(options)
{
    public DbSet<ImportacaoOficina> Importacoes => Set<ImportacaoOficina>();
    public DbSet<DossieOficina> Dossies => Set<DossieOficina>();
    public DbSet<RegistroOficina> Registros => Set<RegistroOficina>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<ImportacaoOficina>().HasKey(x => x.CodigoExterno);
        model.Entity<DossieOficina>().HasIndex(x => x.Codigo).IsUnique();
        model.Entity<RegistroOficina>().HasOne<DossieOficina>().WithMany().HasForeignKey(x => x.DossieId);
        model.Entity<RegistroOficina>().ToTable("Registros", tabela =>
            tabela.HasCheckConstraint("CK_Registros_Nota", "length(Nota) BETWEEN 1 AND 80"));
    }
}

internal sealed class ImportacaoOficina
{
    public required string CodigoExterno { get; init; }
    public required string CodigoComponente { get; init; }
}

internal sealed class DossieOficina
{
    public long Id { get; init; }
    public required string Codigo { get; init; }
}

internal sealed class RegistroOficina
{
    public long Id { get; init; }
    public required long DossieId { get; init; }
    public required string Nota { get; init; }
}
