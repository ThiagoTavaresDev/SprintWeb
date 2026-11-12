window.techBackend = [
  {
    id:'NET-301',
    title:'Filtrar e paginar pedidos com EF Core',
    description:'Mova o filtro, a ordenação e a paginação para a consulta ao SQLite e devolva um DTO.',
    level:'intermediario',
    minutes:30,
    technologies:['csharp','aspnet','efcore'],
    prerequisites:['Conhecer lambdas e LINQ em C#.','Ler parâmetros de consulta de uma requisição GET.','Entender a diferença entre consultar e materializar uma lista.'],
    theory:[
      {label:'Microsoft Learn · Consultas eficientes com EF Core',url:'https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying',description:'Veja a projeção de colunas e por que limitar o volume de registros retornados.'},
      {label:'Microsoft Learn · Paginação no EF Core',url:'https://learn.microsoft.com/en-us/ef/core/querying/pagination',description:'Leia o exemplo de Skip e Take e o motivo de usar uma ordenação única.'}
    ],
    file:'api/PedidosIniciais.cs',
    goal:'Ajuste Listar. Aplique status sobre um IQueryable, conte o conjunto filtrado, ordene por Id e use Skip, Take e Select antes de ToListAsync. Use PedidoDto.Projetar para selecionar os campos do contrato.',
    criteria:['GET aceita pendente, enviado e cancelado e responde 400 para um status desconhecido.','Total conta os registros filtrados antes da paginação.','A resposta usa items, pagina, limite e total e ordena os registros por Id.','A consulta final materializa somente a página solicitada.'],
    example:{language:'csharp',code:'IQueryable<Pedido> consulta = db.Pedidos.AsNoTracking();\n// Valide o status e aplique Where antes de contar.\nvar total = await consulta.CountAsync(ct);\n// Ordene, pagine e projete antes de materializar os itens.'},
    verify:'node verificar.mjs NET-301',
    question:{
      prompt:'Em que ponto Total deve ser calculado?',
      choices:['Depois de aplicar Skip e Take.','Depois do filtro e antes de Skip e Take.','Antes de aplicar o filtro por status.'],
      answer:1,
      feedback:['Essa contagem só informa quantos pedidos vieram na página atual.','Assim o frontend sabe quantos resultados existem para o filtro em todas as páginas.','O total passaria a incluir pedidos fora do filtro.']
    },
    httpLesson:'listar'
  },
  {
    id:'NET-302',
    title:'Expor a versão do pedido no cabeçalho ETag',
    description:'Complete o GET de detalhe para que o cliente possa usar a versão em uma edição futura.',
    level:'essencial',
    minutes:20,
    technologies:['csharp','aspnet','efcore'],
    prerequisites:['Identificar a diferença entre corpo e cabeçalhos HTTP.','Ler um método assíncrono em C#.','Entender como uma rota captura o ID do pedido.'],
    theory:[
      {label:'Microsoft Learn · Respostas em Minimal APIs',url:'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses?view=aspnetcore-10.0',description:'Compare Results.Ok e Results.NotFound e examine a estrutura de IResult.'},
      {label:'RFC 9110 · ETag',url:'https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.3',description:'Leia a sintaxe das aspas e a diferença entre identificadores fortes e fracos.'}
    ],
    file:'api/PedidosIniciais.cs',
    goal:'Ajuste Detalhar. Depois de ler o DTO do SQLite e confirmar que existe, escreva em HttpResponse.Headers.ETag a versão do pedido entre aspas. Use PedidoHttp.ETag para aplicar a formatação comum.',
    criteria:['GET de um pedido existente retorna 200 e uma ETag igual à versão entre aspas.','GET de um ID inexistente retorna 404.','O DTO continua com os mesmos campos usados pelo Angular.'],
    example:{language:'csharp',code:'var pedido = await db.Pedidos.AsNoTracking()\n    .Where(p => p.Id == id)\n    .Select(PedidoDto.Projetar)\n    .SingleOrDefaultAsync(ct);\n// Após o 404, associe a versão lida ao cabeçalho ETag.'},
    verify:'node verificar.mjs NET-302',
    question:{
      prompt:'O pedido tem versao = 3. Qual valor vai no cabeçalho ETag?',
      choices:['3, sem aspas.','W/\"3\", um identificador fraco.','\"3\", um identificador forte.'],
      answer:2,
      feedback:['A sintaxe de uma tag HTTP exige aspas.','If-Match usa comparação forte. Neste contrato, o backend emite uma tag forte.','O identificador forte pode ser reutilizado pelo cliente em If-Match.']
    },
    httpLesson:'etag'
  },
  {
    id:'NET-303',
    title:'Criar pedido com validação por campo',
    description:'Transforme o DTO de entrada em um pedido persistido e devolva erros que o formulário consiga apresentar.',
    level:'intermediario',
    minutes:30,
    technologies:['csharp','aspnet','efcore'],
    prerequisites:['Ler records, tipos anuláveis e coleções em C#.','Distinguir POST com JSON de GET por ID.','Conhecer o papel do DbContext na gravação.'],
    theory:[
      {label:'Microsoft Learn · Criar respostas em Minimal APIs',url:'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses?view=aspnetcore-10.0',description:'Consulte a família Results para devolver 201 e respostas no formato Problem Details.'},
      {label:'Microsoft Learn · Gravar dados com EF Core',url:'https://learn.microsoft.com/en-us/ef/core/saving/basic',description:'Veja como Add e SaveChanges registram uma nova entidade.'}
    ],
    file:'api/PedidosIniciais.cs',
    goal:'Ajuste Criar. Se ValidarCriacao apontar erros, devolva ValidationProblem com 422. No caminho válido, preserve a gravação, responda 201 com Location e inclua a ETag gerada a partir da versão persistida.',
    criteria:['CEP inválido, cliente vazio e valor não positivo recebem 422 com chaves em errors.','O erro de validação mantém o total de pedidos.','A criação válida devolve 201, Location e ETag. Um novo GET em Location recupera o registro gravado.'],
    example:{language:'csharp',code:'var erros = PedidoHttp.ValidarCriacao(entrada);\nif (erros.Count > 0)\n{\n    // Devolva um problema de validação com 422 e os erros por campo.\n}\n// Preserve a gravação e inclua os cabeçalhos da criação.'},
    verify:'node verificar.mjs NET-303',
    question:{
      prompt:'Por que a resposta 422 inclui errors.cep em vez de só uma mensagem geral?',
      choices:['Para associar a mensagem ao campo de CEP no formulário.','Para criar o registro com CEP pendente de revisão.','Para trocar o Content-Type enviado pelo navegador.'],
      answer:0,
      feedback:['A chave identifica onde a pessoa precisa corrigir o dado.','Uma requisição reprovada pela validação mantém o banco como estava.','O tipo de conteúdo é parte da requisição. A chave descreve a validação do campo.']
    },
    httpLesson:'validar'
  },
  {
    id:'NET-304',
    title:'Evitar uma sobrescrita com If-Match',
    description:'Combine a precondição HTTP com o token de concorrência do EF Core na atualização de status.',
    level:'avancado',
    minutes:35,
    technologies:['csharp','aspnet','efcore'],
    prerequisites:['Ler ETag e If-Match em requisições e respostas.','Entender como SaveChangesAsync grava uma entidade rastreada.','Interpretar captura de exceções em C#.'],
    theory:[
      {label:'Microsoft Learn · Concorrência otimista com EF Core',url:'https://learn.microsoft.com/en-us/ef/core/saving/concurrency',description:'Leia como o token entra no WHERE da atualização e quando ocorre DbUpdateConcurrencyException.'},
      {label:'RFC 9110 · If-Match',url:'https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1',description:'Veja como a condição protege contra a perda de uma alteração já gravada.'}
    ],
    file:'api/PedidosIniciais.cs',
    goal:'Ajuste AlterarStatus. Leia If-Match com PedidoHttp.TentarLerETag, compare com Versao, incremente a versão ao gravar e trate DbUpdateConcurrencyException. Em SQLite o campo Versao já está configurado como token gerenciado pela aplicação em PedidosDbContext.cs.',
    criteria:['Sem If-Match retorna 428 e um valor malformado retorna 400.','Uma versão válida e atual produz 200 e uma nova ETag.','Uma versão desatualizada, inclusive se outro cliente gravar durante a operação, produz 412.','O pedido conserva o status gravado quando a precondição falha.'],
    example:{language:'csharp',code:'// Compare a versão do If-Match com a Versao do pedido antes da alteração.\npedido.Status = entrada.Status!;\npedido.Versao++;\ntry\n{\n    await db.SaveChangesAsync(ct);\n}\ncatch (DbUpdateConcurrencyException)\n{\n    return PedidoHttp.Erro(412, "A versão do pedido mudou durante a gravação.");\n}'},
    verify:'node verificar.mjs NET-304',
    question:{
      prompt:'Por que capturar DbUpdateConcurrencyException se If-Match já foi comparado?',
      choices:['Porque outro cliente ainda pode gravar depois da leitura e antes do SaveChangesAsync.','Porque o cabeçalho If-Match sempre vem como JSON.','Porque as requisições PATCH precisam gravar o mesmo pedido duas vezes.'],
      answer:0,
      feedback:['A condição na atualização do banco fecha a janela entre a leitura e a gravação.','If-Match é um cabeçalho HTTP e sua comparação acontece antes de gravar.','O fluxo grava uma vez e devolve a nova versão se a condição continuar válida.']
    },
    httpLesson:'conflito'
  }
];
