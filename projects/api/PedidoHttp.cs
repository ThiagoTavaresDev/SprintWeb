using System.Globalization;

namespace Sprint.Api;

public interface IPedidosEndpoints
{
    Task<IResult> Listar(HttpRequest request, PedidosDbContext db, CancellationToken ct);
    Task<IResult> Detalhar(int id, HttpResponse response, PedidosDbContext db, CancellationToken ct);
    Task<IResult> Criar(CriarPedido entrada, HttpResponse response, PedidosDbContext db, CancellationToken ct);
    Task<IResult> AlterarStatus(int id, AlterarStatusPedido entrada, HttpContext context, PedidosDbContext db, CancellationToken ct);
}

internal static class PedidoHttp
{
    public static bool StatusValido(string? status) => status is "pendente" or "enviado" or "cancelado";

    public static bool NumeroDeConsulta(HttpRequest request, string chave, int padrao, int maximo, out int valor)
    {
        if (!request.Query.TryGetValue(chave, out var valores))
        {
            valor = padrao;
            return true;
        }

        return int.TryParse(valores.ToString(), NumberStyles.None, CultureInfo.InvariantCulture, out valor)
            && valor >= 1 && valor <= maximo;
    }

    public static Dictionary<string, string[]> ValidarCriacao(CriarPedido entrada)
    {
        var erros = new Dictionary<string, string[]>();
        var cliente = entrada.Cliente?.Trim();
        if (string.IsNullOrEmpty(cliente) || cliente.Length > 120)
        {
            erros["cliente"] = ["Informe um cliente com até 120 caracteres."];
        }
        if (entrada.Cep is not { Length: 8 } || entrada.Cep.Any(digito => !char.IsAsciiDigit(digito)))
        {
            erros["cep"] = ["Informe um CEP com oito dígitos."];
        }
        if (entrada.ValorCentavos is null or <= 0)
        {
            erros["valorCentavos"] = ["Informe um valor inteiro positivo em centavos."];
        }
        return erros;
    }

    public static IResult StatusInvalido() => Results.ValidationProblem(
        new Dictionary<string, string[]> { ["status"] = ["Use pendente, enviado ou cancelado."] },
        statusCode: StatusCodes.Status422UnprocessableEntity);

    public static string ETag(int versao) => $"\"{versao.ToString(CultureInfo.InvariantCulture)}\"";

    public static bool TentarLerETag(string valor, out int versao)
    {
        versao = 0;
        return valor.Length >= 3 && valor[0] == '"' && valor[^1] == '"'
            && int.TryParse(valor.AsSpan(1, valor.Length - 2), NumberStyles.None, CultureInfo.InvariantCulture, out versao)
            && versao > 0 && valor == ETag(versao);
    }

    public static IResult Erro(int status, string titulo) => Results.Problem(title: titulo, statusCode: status);
}
