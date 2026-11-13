using Microsoft.EntityFrameworkCore;

namespace Sprint.Hemoterapia;

internal static class OficinaNetInicio
{
    // HNT-304: o seletor usa apenas código e rótulo.
    public static async Task<IResult> Opcoes(BancoHemoterapia db, CancellationToken ct)
    {
        var items = await db.Componentes.AsNoTracking().OrderBy(x => x.Codigo)
            .Select(x => new ResumoComponente(x.Codigo, x.Tipo, x.Status, x.Versao)).ToListAsync(ct);
        return Results.Ok(new { items });
    }

    // HNT-305: o último registro pode representar outro tipo de movimentação.
    public static async Task<IResult> Recebimentos(BancoHemoterapia db, CancellationToken ct)
    {
        var items = await db.Componentes.AsNoTracking().OrderBy(x => x.Codigo)
            .Select(x => new ResumoRecebimento(x.Codigo, x.Movimentos.OrderByDescending(m => m.Instante)
                .ThenByDescending(m => m.Id).Select(m => m.Instante).FirstOrDefault()))
            .ToListAsync(ct);
        return Results.Ok(new { items });
    }

    // HNT-306: toda repetição vira conflito, inclusive quando o conteúdo é igual.
    public static async Task<IResult> Importar(OficinaNetBanco db, ImportacaoOficina registro, CancellationToken ct)
    {
        db.Importacoes.Add(registro);
        try
        {
            await db.SaveChangesAsync(ct);
            return OficinaNet.ImportacaoCriada(registro);
        }
        catch (DbUpdateException erro) when (OficinaNet.ChaveDuplicada(erro))
        {
            return Results.Conflict();
        }
    }

    // HNT-307: os limites chegam pela rota, mas a consulta devolve todo o histórico.
    public static async Task<IResult> Auditoria(BancoHemoterapia db, string? de, string? ate, CancellationToken ct)
    {
        var items = await OficinaNet.ListarAuditoria(db.Movimentos.AsNoTracking(), ct);
        return Results.Ok(new { items });
    }

    // HNT-308: a primeira gravação permanece mesmo quando o banco recusa a segunda.
    public static async Task<IResult> CriarDossie(OficinaNetBanco db, string codigo, string nota, CancellationToken ct)
    {
        try
        {
            await OficinaNet.SalvarDossie(db, codigo, nota, ct);
            return OficinaNet.DossieCriado(codigo, nota);
        }
        catch (DbUpdateException erro) when (OficinaNet.ChaveDuplicada(erro))
        {
            return Results.Conflict();
        }
        catch (DbUpdateException erro) when (OficinaNet.NotaRejeitada(erro))
        {
            return OficinaNet.ErroNota();
        }
    }
}
