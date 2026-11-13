# Projeto local de hemoterapia

Este laboratório usa um estoque de hemocomponentes, uma linha do tempo e rascunhos de ocorrências fictícios. Os rótulos do estoque são estados da simulação. Registre apenas dados sintéticos neste ambiente de treinamento.

## Preparar

- SDK .NET 10 para a API ASP.NET Core e EF Core 10 com SQLite.
- Node.js 24 e npm para a interface Angular 21 com TypeScript 5.9 e para os testes HTTP.

## Escolher uma missão

| Missões | Onde trabalhar | Verificação em modo inicial |
| --- | --- | --- |
| HNT-301 a HNT-303 | `api/Exercicios.cs` | Em `api`, rode `node verificar.mjs HNT-301` com o ID da missão. |
| HNT-304 a HNT-308 | Arquivos `api/OficinaNet*.cs` indicados no chamado | Em `api`, rode `node verificar-net.mjs HNT-304` com o ID da missão. |
| HNG-401 a HNG-403 | `angular/src/app/exercises.ts` | Em `angular`, rode `npm run verificar`. |
| HNG-404 a HNG-408 | `angular/src/app/oficina/` | Em `angular`, rode `npm run verificar:oficina`. |
| HFS-205 a HFS-209 | API `OficinaFull*.cs` e interface `angular/src/app/oficina-full/` | Rode `node verificar-full.mjs HFS-205` em `api` com o ID da missão e `npm run verificar:full` em `angular`. |

Cada cartão da trilha de Hemoterapia indica a função a editar, os critérios de aceite e o comando para testar a missão separadamente. No modo inicial, as verificações apontam as lacunas que você precisa resolver. Rode o teste antes da alteração para ver a falha e depois para confirmar a correção.

## Trabalhar no backend

Abra um terminal em `hemoterapia/api` e rode `dotnet run`. A API escuta em `http://127.0.0.1:5085` e cria sua base SQLite de treinamento em `dados/inicial.db`.

Em outro terminal na mesma pasta, execute o comando da missão. Edite o método indicado, reinicie a API e repita o teste.

Para executar as soluções, pare a API inicial e use `dotnet run -- --Hemo:Modo=referencia`. Esse modo usa uma base separada em `dados/referencia.db`. Execute os scripts da tabela sem o ID para rodar todos os testes de cada grupo. O arquivo `requisicoes.http` tem requisições para inspecionar manualmente.

### Usar o Postman

Com a API no modo referência, use o aplicativo de desktop do Postman e importe `Hemoterapia.postman_collection.json`. Abra uma requisição da coleção, clique em **Send** e confira o código HTTP, o corpo e os cabeçalhos da resposta. Abra **Test Results** para ver as verificações. A variável `baseUrl` aponta para a API local. [Como importar uma coleção no Postman](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-data/)

## Trabalhar no frontend

Deixe a API em modo referência. Em `hemoterapia/angular`, rode `npm ci` e `npm start`. Abra [a interface local](http://localhost:4210). O proxy do Angular encaminha `/api/**` para a porta 5085.

Implemente cada função indicada em `src/app/exercises.ts` e rode `npm run verificar`. Confira as requisições no DevTools, use `BOL-101` para uma consulta válida e `BOL-999` para testar a validação do formulário.

`npm run start:referencia` abre a interface com as soluções. `npm run build` e `npm run build:referencia` verificam os dois modos. Para rodar as suítes com as soluções, use `npm run verificar:referencia`, `npm run verificar:oficina:referencia` e `npm run verificar:full:referencia`.

## Fazer uma missão Full Stack

1. Leia o chamado e os critérios de aceite na plataforma. Rode `dotnet run` em `api` e reproduza a falha do contrato com o teste HTTP da missão.
2. Corrija o backend, reinicie a API e execute o teste novamente. Anote o status, os cabeçalhos ou o corpo que comprovam o critério de aceite.
3. Rode `npm start` em `angular` com a API ativa e abra o painel Full Stack da interface local. Corrija o comportamento na tela e confirme com o teste Angular e com o DevTools.
4. Volte ao Sprint Web, marque as duas camadas que você verificou e registre o que comunicaria no Slack e no pull request. Inclua um caso que passou na API e o comportamento correspondente na tela.

## Contexto do produto

A prática usa identificadores sintéticos e separa lista de estoque, rastreabilidade e rascunho interno de ocorrência. O rascunho existe apenas no banco local. [Procedimentos hemoterápicos do Ministério da Saúde](https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11685_03_07_2026.html) · [Sistema Nacional de Hemovigilância da Anvisa](https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/hemovigilancia/sistema-nacional)
