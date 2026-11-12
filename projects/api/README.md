# API de pedidos | Sprint Web

Projeto local em C# com ASP.NET Core Minimal APIs, .NET 10 e Entity Framework Core 10. O SQLite cria e preenche um banco local na primeira execução. A API escuta somente em `127.0.0.1:5075` por padrão.

## Executar os exercícios

1. Instale o [SDK do .NET 10](https://dotnet.microsoft.com/download/dotnet/10.0) e confirme `dotnet --list-sdks`. O primeiro restore precisa de acesso ao NuGet.
2. Abra um terminal nesta pasta `api` e rode `dotnet run`. O modo inicial compila e deixa um comportamento incompleto por ticket.
3. Em outro terminal nesta mesma pasta, execute `node verificar.mjs NET-301`. O script usa Node.js 24 LTS e chama o servidor por HTTP.
4. Edite o método indicado em `PedidosIniciais.cs`, reinicie a API e rode a verificação de novo.
5. Para comparar com a solução ou testar o frontend Angular com o contrato completo, pare o modo inicial e rode `dotnet run -- --Sprint:Modo=referencia`. O modo de referência executa `PedidosReferencia.cs`. `node verificar.mjs` roda as quatro verificações.

O modo inicial e o de referência usam bancos separados em `dados/`. As verificações criam pedidos fictícios para testar a API. O comando `dotnet run -- --Sprint:Modo=referencia --Sprint:Banco=dados/pratica-nova.db` inicia outra base com os três pedidos de exemplo. Este projeto usa `EnsureCreatedAsync` para preparar uma base descartável de prática. Um sistema que evolui a estrutura do banco usa [migrações do EF Core](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/).

## Mapa dos tickets

| Ticket | Método | O que exercitar |
| --- | --- | --- |
| NET-301 | `Listar` | `IQueryable`, filtro e paginação no SQLite, contagem e projeção em DTO |
| NET-302 | `Detalhar` | Rota por ID, 404 e ETag calculada com a versão persistida |
| NET-303 | `Criar` | DTO de entrada, validação por campo, persistência, 201 e Location |
| NET-304 | `AlterarStatus` | `If-Match`, token de concorrência do EF e tratamento de 412 |

## Experimentar as requisições

Abra `requisicoes.http` no cliente REST do editor ou copie as partes da requisição para o Postman. A URL base é `http://127.0.0.1:5075`. Use dados fictícios.

- `GET /api/pedidos?status=pendente&pagina=1&limite=10` responde com `items`, `pagina`, `limite` e `total`. A página começa em 1, o limite padrão é 10 e o máximo é 100.
- `GET /api/pedidos/101` responde com os dados do pedido e a ETag. Se o ID não existe, retorna 404.
- `POST /api/pedidos` com `Content-Type: application/json` recebe `cliente`, `cep` e `valorCentavos`. A criação responde 201 com `Location` e `ETag`. Dados inválidos no DTO retornam 422 com `errors` por campo.
- `PATCH /api/pedidos/101/status` recebe `{"status":"enviado"}` e uma ETag forte em `If-Match`. Após 200, use a nova ETag. Uma versão antiga recebe 412. Um cabeçalho ausente recebe 428 e um valor malformado recebe 400. Para praticar, leia o pedido antes de tentar alterar.

Os status aceitos são `pendente`, `enviado` e `cancelado`. O projeto modela um ambiente local de prática com SQLite e dados fictícios.
