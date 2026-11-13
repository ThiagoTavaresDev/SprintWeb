using Microsoft.EntityFrameworkCore;

namespace Sprint.Hemoterapia;

internal static class OficinaNetReferencia
{
    public static async Task<IResult> Opcoes(BancoHemoterapia db, CancellationToken ct)
    {
        var items = await db.Componentes.AsNoTracking().OrderBy(x => x.Codigo)
            .Select(x => new OpcaoComponente(x.Codigo, x.Codigo + " · " + x.Tipo)).ToListAsync(ct);
        return Results.Ok(new { items });
    }

    public static async Task<IResult> Recebimentos(BancoHemoterapia db, CancellationToken ct)
    {
        var items = await db.Componentes.AsNoTracking().OrderBy(x => x.Codigo)
            .Select(x => new ResumoRecebimento(x.Codigo, x.Movimentos.Where(m => m.Tipo == "recebido")
                .OrderByDescending(m => m.Instante).ThenByDescending(m => m.Id)
                .Select(m => m.Instante).FirstOrDefault()))
            .ToListAsync(ct);
        return Results.Ok(new { items });
    }

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
            db.Entry(registro).State = EntityState.Detached;
            var existente = await db.Importacoes.AsNoTracking()
                .SingleAsync(x => x.CodigoExterno == registro.CodigoExterno, ct);
            return existente.CodigoComponente == registro.CodigoComponente ? Results.Ok(existente) : Results.Conflict();
        }
    }

    public static async Task<IResult> Auditoria(BancoHemoterapia db, string? de, string? ate, CancellationToken ct)
    {
        var inicio = OficinaNet.EmUtc(de);
        var fim = OficinaNet.EmUtc(ate);
        if (inicio is null || fim is null || string.CompareOrdinal(inicio, fim) >= 0)
            return Results.Problem("Informe de e ate em ISO 8601 com fuso e de anterior a ate.", statusCode: 400);

        // A coluna da oficina usa texto UTC com formato e precisão fixos.
        var consulta = db.Movimentos.AsNoTracking()
            .Where(x => string.Compare(x.Instante, inicio) >= 0 && string.Compare(x.Instante, fim) < 0);
        var items = await OficinaNet.ListarAuditoria(consulta, ct);
        return Results.Ok(new { items });
    }

    public static async Task<IResult> CriarDossie(OficinaNetBanco db, string codigo, string nota, CancellationToken ct)
    {
        await using var transacao = await db.Database.BeginTransactionAsync(ct);
        try
        {
            await OficinaNet.SalvarDossie(db, codigo, nota, ct);
            await transacao.CommitAsync(ct);
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
