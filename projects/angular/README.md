# Portal de Pedidos em Angular

Pratique quatro tarefas de frontend do Sprint Web em um aplicativo Angular 21 com TypeScript 5.9. O portal usa HttpClient, componentes standalone, signals e formulários reativos tipados. O servidor de desenvolvimento encaminha `/api/**` à API de pedidos em `http://127.0.0.1:5075`.

## Iniciar

1. Use Node.js 24 ou Node.js 22.18+ da série 22. Confira `node --version`. O verificador lê TypeScript diretamente no Node.js. [Matriz de compatibilidade do Angular](https://angular.dev/reference/versions).
2. Inicie a API na porta `5075`. Para estudar o frontend primeiro, siga o modo de referência descrito no README da pasta `api`.
3. Em um segundo terminal, abra esta pasta (`angular`) e rode:

   ```sh
   npm ci
   npm start
   ```

4. Abra [http://localhost:4200](http://localhost:4200). No PowerShell, `npm.cmd` também executa os comandos do npm.

O primeiro comando instala as dependências do projeto. O segundo inicia a versão com as tarefas pendentes. Para observar a solução, pare o servidor e rode `npm run start:referencia`. O CLI carrega `src/app/exercises.reference.ts` no lugar de `src/app/exercises.ts` nesse modo.

## Praticar

Edite `src/app/exercises.ts` e use os critérios de aceite de cada missão. O componente e o serviço já chamam as funções desse arquivo.

| Missão | Alteração | Cenário para reproduzir |
| --- | --- | --- |
| NG-401 | Inclua o status nos parâmetros do `HttpClient` e mantenha a paginação. | Abra Network, escolha `pendente` e confira a URL. Volte a **Todos** e confirme que a query deixa de enviar `status`. |
| NG-402 | Separe uma lista vazia de uma falha de carregamento. | Escolha `cancelado` na base inicial para obter lista vazia. Para ver o erro, pare a API e tente recarregar a lista. |
| NG-403 | Associe as mensagens de `422` aos controles tipados. | Envie `Ana`, CEP `123` e `12500` centavos. O erro aparece ao lado de CEP. Corrija para `01001000` e crie o pedido. |
| NG-404 | Envie `If-Match` com o `ETag` e trate `412` como conflito. | Abra o mesmo pedido em duas abas. Salve uma alteração na primeira. Na segunda, tente salvar a versão anterior. Use **Recarregar versão** antes de reenviar. |

## Verificar

`npm run verificar` testa as funções que o aplicativo usa. A versão inicial tem casos que falham para você investigar. Rode o comando após cada ajuste e procure pelo ID da tarefa no resultado.

`npm run verificar:referencia` testa a solução. Os testes das funções podem ser executados com a API parada. Use `npm run build` e `npm run build:referencia` para verificar a compilação das duas versões, incluindo os templates Angular.
