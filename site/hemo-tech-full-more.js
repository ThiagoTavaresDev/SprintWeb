(() => {
  const api = 'hemoterapia/api/OficinaFullExercicios.cs';
  const angular = 'hemoterapia/angular/src/app/oficina-full/oficina-full.ts';
  const technologies = ['csharp','aspnet','efcore','typescript','angular'];
  const http = {
    label:'Angular · Requisições HTTP',url:'https://angular.dev/guide/http/making-requests',
    description:'Confira como informar parâmetros, escolher o tipo de resposta e ler cabeçalhos.'
  };
  const registros = {
    label:'Ministério da Saúde · Registros hemoterápicos',url:'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11685_03_07_2026.html',
    description:'Use a seção Dos Registros do Anexo IV-B para contextualizar a rastreabilidade das movimentações fictícias.'
  };

  function mission({backend,frontend,check,...details}) {
    return {
      ...details,format:'full-local',technologies,
      sections:[
        {title:'Backend',file:api,goal:backend.goal,example:{language:'csharp',code:backend.code}},
        {title:'Frontend',file:angular,goal:frontend.goal,example:{language:'typescript',code:frontend.code}}
      ],
      verify:`Em hemoterapia/api, rode dotnet run e, em outro terminal, node verificar-full.mjs ${details.id}. Em hemoterapia/angular, rode npm ci na primeira vez e depois node --import @angular/compiler --test --test-name-pattern=${details.id} tests/oficina-full.test.mjs. Com os dois serviços rodando, abra a Oficina Full Stack no Angular (npm start). ${check}`
    };
  }

  window.hemoFullMoreMissions = [
    mission({
      id:'HFS-205',area:'estoque',level:'essencial',minutes:35,title:'A próxima página repete o estoque',
      description:'Ao avançar na conferência de estoque, o mesmo grupo aparece de novo. Corrija o parâmetro Angular e o recorte da consulta EF Core.',
      prerequisites:['Ler uma URL com query string.','Entender a diferença entre a página atual e o total de registros.','Reconhecer OrderBy, Skip e Take em LINQ.'],
      theory:[{label:'Microsoft Learn · Paginação no EF Core',url:'https://learn.microsoft.com/en-us/ef/core/querying/pagination',description:'Leia sobre ordenação única e paginação por deslocamento.'},http],
      backend:{goal:'Em Paginar, aplique Skip e Take ao IQueryable já ordenado por código. Preserve a contagem total do endpoint e a validação de página e tamanho.',code:'var deslocamento = (pagina - 1) * tamanho;\nreturn consulta.Skip(deslocamento).Take(tamanho);'},
      frontend:{goal:'Em parametrosPagina, devolva um HttpParams com pagina e tamanho. O botão Próxima página já calcula o próximo número e entrega os parâmetros a HttpClient.',code:"let params = new HttpParams();\nparams = params.set('pagina', pagina);"},
      criteria:['Página 1 mostra BOL-101 e BOL-102. A página 2 mostra apenas BOL-103.','O total continua 3 mesmo quando a página contém um registro.','A página fora do intervalo retorna lista vazia e a página 0 é rejeitada.'],
      check:'Clique em Carregar estoque paginado e em Próxima página. Compare os códigos e a query no DevTools.',
      delivery:{ticket:'Registre os passos para reproduzir a repetição e os códigos esperados por página.',slack:'Compartilhe as queries das duas páginas e confirme que o total permanece 3.',pullRequest:'Explique por que a ordenação por código vem antes do recorte e liste os casos testados.'},
      question:{prompt:'Por que ordenar pelo código antes de Skip e Take?',choices:['Para manter um recorte determinístico quando se troca de página.','Para converter o total em tamanho da página.','Para obrigar o Angular a ordenar de novo.'],answer:0,feedback:['Com uma chave única, a ordem define quais registros pertencem a cada recorte.','O total representa a consulta antes do recorte.','O cliente deve receber a ordenação aplicada pelo backend.']}
    }),
    mission({
      id:'HFS-206',area:'integracao',level:'intermediario',minutes:50,title:'O relatório chega como JSON',
      description:'A equipe de operações precisa comparar movimentações em uma planilha. Gere um CSV com cabeçalhos HTTP e finalize o download no Angular.',
      prerequisites:['Ler um DTO projetado pelo EF Core.','Distinguir JSON, texto UTF-8 e Blob.','Reconhecer a função de Content-Type e Content-Disposition.'],
      theory:[{label:'IETF · Formato CSV',url:'https://www.rfc-editor.org/rfc/rfc4180.html',description:'Observe delimitadores, cabeçalho, aspas e final de linha.'},http,registros],
      backend:{goal:'Em Exportar, consulte apenas código, tipo, instante e unidade, ordenando por instante e Id. Gere CSV UTF-8 com o cabeçalho código,tipo,instante,unidade e linhas CRLF. Coloque os valores de cada linha entre aspas, duplique aspas internas e retorne o arquivo movimentos.csv. Para consultar o banco, importe Microsoft.EntityFrameworkCore.',code:'return Results.File(Encoding.UTF8.GetBytes(csv.ToString()),\n    "text/csv; charset=utf-8", "movimentos.csv");'},
      frontend:{goal:'Em arquivoMovimentos, confira se a resposta tem Blob e Content-Type text/csv. Use o filename seguro do Content-Disposition ou movimentos.csv. Aceite nomes CSV ASCII simples e rejeite caminhos como ../lote.csv.',code:"const tipo = resposta.headers.get('Content-Type')?.split(';', 1)[0].trim();\nif (!resposta.body || tipo?.toLowerCase() !== 'text/csv') return null;"},
      criteria:['A API responde 200, text/csv e Content-Disposition attachment com movimentos.csv.','O CSV tem quatro movimentações sintéticas em ordem cronológica.','O Angular baixa o Blob com um nome CSV seguro e evita baixar JSON como relatório.'],
      check:'Clique em Baixar movimentações em CSV e abra o arquivo. Confira as quatro linhas e os quatro campos.',
      delivery:{ticket:'Descreva as colunas necessárias e anexe a reprodução com a resposta original em JSON.',slack:'Envie o nome do arquivo e o total de linhas sintéticas, com o resultado da conferência de cabeçalhos.',pullRequest:'Registre os cabeçalhos, a ordem das linhas e o que acontece ao receber um nome inesperado.'},
      question:{prompt:'Como o Angular recebe o arquivo e ainda consegue consultar o nome sugerido?',choices:['Só com responseType blob.','Com responseType blob e observe response.','Lendo a extensão da rota no corpo JSON.'],answer:1,feedback:['O Blob sozinho não expõe os cabeçalhos.','Essa combinação entrega o conteúdo binário e os cabeçalhos no HttpResponse.','A API devolve um CSV e fornece o nome pelo cabeçalho.']}
    }),
    mission({
      id:'HFS-207',area:'estoque',level:'intermediario',minutes:45,title:'O resumo não bate com o inventário',
      description:'Calcule quantos componentes de cada tipo estão em cada estado operacional e faça o total da tabela acompanhar a resposta.',
      prerequisites:['Compor GroupBy e Count em LINQ.','Ler arrays tipados em TypeScript.','Reconhecer estado derivado no Angular.'],
      theory:[{label:'Microsoft Learn · Operadores de consulta complexos',url:'https://learn.microsoft.com/en-us/ef/core/querying/complex-query-operators#groupby',description:'Compare grupos materializados com agregações traduzidas pelo provedor relacional.'},{label:'Angular · Signals',url:'https://angular.dev/guide/signals',description:'Veja como um computed depende dos sinais que lê.'}],
      backend:{goal:'Em Resumir, agrupe Componentes por Tipo, projete tipo, disponiveis e quarentena e ordene por tipo. Faça a agregação antes de ToListAsync e devolva { items }. Importe Microsoft.EntityFrameworkCore.',code:'var resumo = db.Componentes.AsNoTracking().GroupBy(x => x.Tipo)\n    .Select(g => new { tipo = g.Key, disponiveis = g.Count(x => x.Status == "disponivel") });'},
      frontend:{goal:'Em totalizar, some separadamente disponiveis e quarentena das linhas recebidas. Use zero para uma lista vazia. O computed do componente já usa a função para atualizar o rodapé.',code:'const inicial = { disponiveis: 0, quarentena: 0 };\nconst disponiveis = linhas.reduce((soma, linha) => soma + linha.disponiveis, 0);'},
      criteria:['A API entrega linhas CH, CP e PL, nessa ordem, com as duas contagens.','O rodapé da tabela mostra 2 disponíveis e 1 em quarentena nos dados fictícios.','Uma lista vazia não produz NaN nem uma linha fictícia.'],
      check:'Clique em Carregar resumo por tipo e compare o rodapé com a soma das três linhas.',
      delivery:{ticket:'Liste os valores esperados para os três tipos no inventário de teste.',slack:'Informe a conferência do total e deixe claro que os estados são operacionais.',pullRequest:'Mostre por que o EF agrega antes de materializar e como testou o estado vazio do Angular.'},
      question:{prompt:'Em que momento o backend deve materializar a consulta de resumo?',choices:['Antes do GroupBy, para carregar o inventário inteiro.','Antes de ordenar a lista de componentes individuais.','Depois de agrupar e projetar as contagens.'],answer:2,feedback:['O banco pode produzir as contagens sem enviar as linhas individuais.','A ordenação útil aqui é pela chave das linhas agregadas.','A resposta já vem no formato compacto esperado pela tabela.']}
    }),
    mission({
      id:'HFS-208',area:'integracao',level:'intermediario',minutes:45,title:'O suporte recebe um print sem referência',
      description:'Um código inexistente só mostra erro genérico. Padronize a resposta de erro e apresente um identificador para rastrear a requisição.',
      prerequisites:['Interpretar o status HTTP 404.','Reconhecer o identificador de uma requisição no HttpContext.','Estreitar unknown com verificações de tipo em TypeScript.'],
      theory:[{label:'IETF · Problem Details',url:'https://www.rfc-editor.org/rfc/rfc9457.html',description:'Veja os membros padrão e as extensões de uma resposta de problema.'},{label:'Microsoft Learn · Erros em APIs ASP.NET Core',url:'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling-api?view=aspnetcore-10.0',description:'Encontre exemplos de ProblemDetails em Minimal APIs.'},http],
      backend:{goal:'Em FalhaConferencia, produza ProblemDetails 404 com título Componente não encontrado. Use http.TraceIdentifier no campo correlacao e no cabeçalho X-Correlation-ID, sem incluir exceções internas na resposta.',code:'return Results.Problem(statusCode: 404, title: "Componente não encontrado",\n    extensions: new Dictionary<string, object?> { ["correlacao"] = http.TraceIdentifier });'},
      frontend:{goal:'Em codigoSuporte, aceite HttpErrorResponse 404. Verifique se error é objeto e correlacao é uma string não vazia. Retorne null para outros erros ou corpos inválidos.',code:"if (!(erro instanceof HttpErrorResponse) || erro.status !== 404) return null;\nconst corpo: unknown = erro.error;"},
      criteria:['GET de BOL-999 devolve 404 application/problem+json e um identificador igual no corpo e no cabeçalho.','A tela mostra o código de suporte para o problema previsto e dá feedback genérico quando o formato não corresponde.','GET de BOL-101 continua retornando 200.'],
      check:'Confira BOL-999 e veja a referência no painel. Depois, consulte BOL-101 e confirme que a referência anterior some.',
      delivery:{ticket:'Inclua a rota, o código de teste e a diferença esperada entre 404 e falha de rede.',slack:'Compartilhe apenas o identificador sintético da requisição e o status observado.',pullRequest:'Documente o campo adicional, a validação no frontend e a cobertura de erro inesperado.'},
      question:{prompt:'O que ajuda o suporte a localizar a requisição sem expor detalhes internos?',choices:['Exibir a stack trace completa na tela.','Copiar todos os cabeçalhos no chat.','Exibir um identificador de correlação da requisição.'],answer:2,feedback:['Uma stack trace pode expor detalhes do servidor.','O suporte precisa de uma referência pontual para a investigação.','A referência conecta o relato da interface à requisição registrada.']}
    }),
    mission({
      id:'HFS-209',area:'estoque',level:'avancado',minutes:55,title:'A mesma etiqueta volta inteira a cada consulta',
      description:'Implemente GET condicional na API e reaproveite a representação em memória quando a etiqueta fictícia continuar igual.',
      prerequisites:['Distinguir os papéis de ETag, If-None-Match e 304.','Trabalhar com cabeçalhos tipados em ASP.NET Core.','Entender o tratamento de respostas não 2xx e cache por chave no cliente.'],
      theory:[{label:'IETF · If-None-Match',url:'https://www.rfc-editor.org/rfc/rfc9110.html#name-if-none-match',description:'Leia a semântica de GET, comparação fraca e a resposta 304 sem corpo.'},http],
      backend:{goal:'Em LerEtiqueta, leia If-None-Match com GetTypedHeaders e compare as tags com EntityTagHeaderValue.Compare(etag, false). Em correspondência ou *, devolva 304 sem corpo e preserve o ETag. Para versão diferente, devolva 200 e o DTO. Importe Microsoft.Net.Http.Headers.',code:'var tags = http.Request.GetTypedHeaders().IfNoneMatch;\nvar corresponde = tags.Any(tag => tag.Equals(EntityTagHeaderValue.Any)\n    || tag.Compare(etag, useStrongComparison: false));'},
      frontend:{goal:'Em cabecalhosEtiqueta, envie If-None-Match apenas se o componente já possuir entrada em cache. Em reutilizarEtiqueta, retorne a entrada recebida somente no HttpErrorResponse 304. O componente seleciona o cache pela chave consultada.',code:"return entrada ? new HttpHeaders().set('If-None-Match', entrada.etag) : new HttpHeaders();"},
      criteria:['A primeira consulta devolve 200 e ETag. A repetida com a mesma tag devolve 304 sem corpo.','Tag diferente devolve 200, e a tag de BOL-101 não é reutilizada para BOL-102.','O Angular conserva a etiqueta no 304, mas não disfarça um 404 ou erro de rede como sucesso.'],
      check:'Clique duas vezes em Consultar etiqueta com BOL-101 e observe o 200 seguido de 304. Troque para BOL-102 e confirme um novo 200.',
      delivery:{ticket:'Escreva a sequência dos três cenários com código e tag, incluindo a ausência de corpo no 304.',slack:'Resuma o que viu em Network e confirme que a etiqueta permaneceu visível no 304.',pullRequest:'Explique a chave do cache, a condição de reaproveitamento e o comportamento em 404.'},
      question:{prompt:'O que fazer ao receber 304 com uma entrada em cache para o mesmo código?',choices:['Usar a representação armazenada.','Substituir a entrada pelo corpo vazio.','Usar a etiqueta de qualquer código que já esteja no cache.'],answer:0,feedback:['O 304 indica que a representação associada à tag continua válida.','O status 304 não traz uma representação nova.','Cada entrada está ligada ao recurso consultado.']}
    })
  ];
})();
