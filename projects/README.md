# Sprint Web · Portal de Pedidos

Os projetos deste pacote usam o mesmo contrato de pedidos do Cliente HTTP no Sprint Web. A API e a interface executam de verdade na sua máquina e usam dados fictícios.

## Preparar o ambiente

- Instale o [SDK do .NET 10](https://dotnet.microsoft.com/download/dotnet/10.0) e confirme com `dotnet --list-sdks`.
- Use o [Node.js 24 LTS](https://nodejs.org/en/download). Rode `node --version` e `npm --version`.
- A primeira instalação busca dependências no NuGet e no npm. O SQLite roda com a API e cria o arquivo de banco local.

## Rodar a API e a interface juntas

1. Abra um terminal na pasta `api` e rode `dotnet run -- --Sprint:Modo=referencia`. A API ficará em `http://127.0.0.1:5075`.
2. Abra outro terminal na pasta `angular`. Rode `npm ci` e depois `npm run start:referencia`.
3. Abra `http://localhost:4200`. Use o filtro de pendentes, crie um pedido e atualize seu status. As requisições `/api` passam pelo proxy de desenvolvimento do Angular.

## Fazer os exercícios

| Trilha | O que editar | Como conferir |
| --- | --- | --- |
| NET-301 a NET-304 | Pare o servidor e rode `dotnet run` em `api`. Edite o método do ticket em `PedidosIniciais.cs`. | Em outro terminal, rode `node verificar.mjs NET-301`, substituindo pelo ID do chamado. |
| NG-401 a NG-404 | Deixe a API em modo referência. Em `angular`, rode `npm start` e edite o arquivo indicado no ticket. | Use `npm run verificar` para os exercícios e `npm run build` para compilar a aplicação. |

O modo inicial tem lacunas intencionais. Os READMEs de [API](api/README.md) e [Angular](angular/README.md) descrevem os arquivos e a execução das soluções.

## Repetir as requisições no Postman

1. Com a API em modo referência, importe `Portal de Pedidos.postman_collection.json` no Postman. A coleção usa `{{baseUrl}}` com valor `http://127.0.0.1:5075`.
2. Envie **Listar pendentes**. Confira `status`, `pagina` e `limite` em **Params** e veja o resultado em **Body**.
3. Compare **Criar pedido** e **Provocar erro de validação**. Em **Body**, use **raw** e **JSON**. Confira `Location` no 201 e o mapa `errors` no 422.
4. Envie **Consultar pedido e guardar ETag**. A coleção salva o ETag que aparece nos cabeçalhos da resposta. Depois, envie **Alterar status com If-Match** duas vezes. A primeira requisição usa a versão atual e retorna 200. A segunda repete a tag antiga e retorna 412.
5. Volte ao GET do pedido para obter a versão atual. No editor, o arquivo `api/requisicoes.http` também traz exemplos de requisição.

O Cliente HTTP do HTML tem seu próprio conjunto de pedidos para praticar sem subir os projetos.
