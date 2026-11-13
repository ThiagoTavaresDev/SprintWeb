(() => {
  const registros = {
    label:'Ministério da Saúde · Registros hemoterápicos',
    url:'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11685_03_07_2026.html',
    description:'Localize a seção Dos Registros do Anexo IV-B para entender o papel da rastreabilidade.'
  };
  const vigilancia = {
    label:'Anvisa · Sistema Nacional de Hemovigilância',
    url:'https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/hemovigilancia/sistema-nacional',
    description:'Conheça o contexto da investigação de ocorrências no ciclo do sangue. Aqui o fluxo termina em rascunho interno.'
  };
  const respostas = {
    label:'Microsoft Learn · Respostas de Minimal APIs',
    url:'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses?view=aspnetcore-10.0',
    description:'Compare respostas de sucesso, criação de recurso e validação por campo.'
  };
  const http = {
    label:'Angular · Enviando requisições HTTP',
    url:'https://angular.dev/guide/http/making-requests',
    description:'Veja como tipar o corpo, passar HttpParams e observar o objeto completo da resposta.'
  };

  window.hemoTechMissions = [
    {
      id:'HNT-301', area:'estoque', title:'Aplique o filtro no estoque com EF Core', level:'essencial', minutes:20,
      description:'O inventário retorna todos os componentes mesmo com o estado selecionado. Leve o filtro até a consulta SQLite.',
      technologies:['csharp','aspnet','efcore'],
      prerequisites:['Ler uma rota GET e seus parâmetros de consulta.','Usar lambdas e Where em C#.','Reconhecer a diferença entre IQueryable e uma lista materializada.'],
      theory:[{label:'Microsoft Learn · Consultas eficientes',url:'https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying',description:'Leia sobre projeção, índices e o momento de materializar a consulta.'},registros],
      file:'hemoterapia/api/Exercicios.cs',
      goal:'Em Listar, acrescente um Where condicional ao IQueryable antes de chamar Comum.Listar. Mantenha a validação dos estados e a projeção já existentes.',
      criteria:['GET sem status devolve três componentes, por código.','Status disponivel devolve BOL-101 e BOL-103, com total 2.','Status desconhecido devolve 400.'],
      example:{language:'csharp',code:'var consulta = db.Componentes.AsNoTracking();\nif (status is not null)\n    consulta = consulta.Where(x => x.Status == status);'},
      verify:'Em hemoterapia/api, rode dotnet run. Em outro terminal nessa pasta, rode node verificar.mjs HNT-301. Inspecione também as requisições do arquivo requisicoes.http.',
      question:{
        prompt:'Onde aplicar o filtro para que o SQLite execute a seleção?',
        choices:['Ao compor o IQueryable, antes de executar a consulta.','Depois de devolver o JSON.','Só escondendo as linhas no CSS.'],
        answer:0,
        feedback:['Assim o EF Core traduz o predicado para a consulta ao banco.','O corpo já foi serializado quando o cliente o recebe.','O estoque devolvido e o total continuariam incorretos.']
      },
      httpLesson:'estoque'
    },
    {
      id:'HNT-302', area:'transfusao', title:'Entregue a linha do tempo pela Minimal API', level:'intermediario', minutes:30,
      description:'Ao abrir um componente, a equipe precisa reconstruir a sequência de movimentações e identificar a versão exibida.',
      technologies:['csharp','aspnet','efcore'],
      prerequisites:['Projetar registros relacionados para DTOs em LINQ.','Distinguir corpo JSON de cabeçalhos HTTP.','Ordenar por instante e usar um desempate estável.'],
      theory:[registros,{label:'IETF · ETag no HTTP',url:'https://www.rfc-editor.org/rfc/rfc9110.html#name-etag',description:'Entenda ETag como identificador da versão da representação.'}],
      file:'hemoterapia/api/Exercicios.cs',
      goal:'Em Detalhar, projete os movimentos associados em LinhaTempo. Ordene pelo instante e desempate por Id. Envie a versão entre aspas em ETag. Preserve o 404 para código inexistente.',
      criteria:['BOL-101 devolve registrado em U-A seguido de recebido em U-B.','A resposta de detalhe inclui ETag "1".','Código inexistente devolve 404.'],
      example:{language:'csharp',code:'var eventos = db.Movimentos.Where(m => m.ComponenteCodigo == codigo)\n    .OrderBy(m => m.Instante).ThenBy(m => m.Id)\n    .Select(m => new LinhaTempo(m.Tipo, m.Instante, m.Unidade));'},
      verify:'Com a API local rodando, execute node verificar.mjs HNT-302 em hemoterapia/api. Na consulta manual, compare a ordem do JSON com o cabeçalho ETag.',
      question:{
        prompt:'Por que devolver a versão também como cabeçalho ETag?',
        choices:['Para que a versão passe a representar a unidade hospitalar.','Para expor a versão da representação no contrato HTTP.','Para ordenar os eventos automaticamente no Angular.'],
        answer:1,
        feedback:['A unidade é um dado separado do histórico.','O cliente pode ler a tag junto da resposta sem deduzir sua formatação.','A ordem deve ser definida na consulta ou em uma transformação explícita.']
      },
      httpLesson:'rastrear'
    },
    {
      id:'HNT-303', area:'vigilancia', title:'Persista rascunhos e devolva erros por campo', level:'avancado', minutes:35,
      description:'O suporte recebe 201 com descrição vazia. Colete as falhas do formulário antes de persistir um rascunho.',
      technologies:['csharp','aspnet','efcore'],
      prerequisites:['Normalizar strings e tratar entradas nulas em C#.','Usar um dicionário de erros e associá-los ao DTO de entrada.','Verificar uma referência e persistir com SaveChangesAsync.'],
      theory:[vigilancia,respostas,{label:'Microsoft Learn · Salvando com EF Core',url:'https://learn.microsoft.com/en-us/ef/core/saving/basic',description:'Confira o papel de Add e SaveChangesAsync antes de responder à criação.'}],
      file:'hemoterapia/api/Exercicios.cs',
      goal:'Em CriarOcorrencia, normalize os dois campos. Reúna as falhas em errors.codigoComponente e errors.descricao. Exija um código do estoque e uma descrição de 1 a 240 caracteres após Trim. Grave somente após validar os campos.',
      criteria:['Campos inválidos aparecem juntos num 422.','Descrição longa recebe erro de descricao.','A entrada válida retorna 201, Location e status rascunho. A consulta por Location recupera o registro persistido.'],
      example:{language:'csharp',code:'if (errors.Count > 0)\n    return Results.ValidationProblem(errors, statusCode: 422);\nreturn await Comum.Salvar(db, codigo, descricao, ct);'},
      verify:'Com a API local rodando, execute node verificar.mjs HNT-303 em hemoterapia/api. Confira 422 no formulário e GET no Location depois da criação válida.',
      question:{
        prompt:'Quando chamar SaveChangesAsync para um rascunho?',
        choices:['Assim que o POST chegar.','Depois de enviar 201 para a interface.','Depois que a validação terminar sem erros.'],
        answer:2,
        feedback:['Isso permitiria persistir dados que o próprio contrato rejeita.','O 201 confirma criação. Aguarde a gravação antes de respondê-lo.','O caminho de erro pode retornar 422 sem alterar o banco.']
      },
      httpLesson:'ocorrencia'
    },
    {
      id:'HNG-401', area:'estoque', title:'Conecte o filtro Angular à query HTTP', level:'essencial', minutes:20,
      description:'O seletor mostra Quarentena, mas os itens continuam iguais. Confira o que o HttpClient está enviando.',
      technologies:['typescript','angular'],
      prerequisites:['Declarar uniões de strings no TypeScript.','Ler o caminho e os parâmetros de uma requisição no DevTools.','Usar funções puras para montar opções do HttpClient.'],
      theory:[http,registros],
      file:'hemoterapia/angular/src/app/exercises.ts',
      goal:'Em parametrosEstoque, devolva HttpParams com status quando houver seleção. Para Todos, omita o parâmetro.',
      criteria:['Disponível envia status=disponivel.','Quarentena envia status=quarentena.','Todos consulta a mesma rota sem status.'],
      example:{language:'typescript',code:"const params = new HttpParams();\nreturn status ? params.set('status', status) : params;"},
      verify:'Deixe a API em modo referência. Em hemoterapia/angular, rode npm ci, npm start e npm run verificar em outro terminal. Confira o filtro no DevTools e o resultado de HNG-401.',
      question:{
        prompt:'Ao chamar HttpParams.set, o que o HttpClient deve receber?',
        choices:['A nova instância retornada por set.','A instância anterior, pois set a modifica diretamente.','O valor do filtro no corpo de um GET.'],
        answer:0,
        feedback:['HttpParams é imutável e set devolve a versão com o parâmetro.','A instância anterior permanece vazia.','Neste contrato, o filtro faz parte da query da URL.']
      },
      httpLesson:'estoque'
    },
    {
      id:'HNG-402', area:'transfusao', title:'Mostre o histórico e a versão recebida', level:'intermediario', minutes:25,
      description:'A API tem movimentações do componente. Ajuste o adaptador TypeScript para a tela conseguir exibir o histórico e sua ETag.',
      technologies:['typescript','angular'],
      prerequisites:['Trabalhar com tipos anuláveis em TypeScript.','Ler HttpResponse e HttpHeaders.','Preservar a ordem do array recebido na representação da tela.'],
      theory:[http,registros],
      file:'hemoterapia/angular/src/app/exercises.ts',
      goal:'Em detalheRecebido, devolva null para corpo ausente. Se houver corpo, mantenha seus movimentos e leia ETag de resposta.headers. Preserve null se o cabeçalho não existir.',
      criteria:['BOL-101 exibe os dois eventos da API e a ETag recebida.','Corpo sem eventos produz estado vazio.','Resposta sem corpo não gera um componente inventado.'],
      example:{language:'typescript',code:"if (!resposta.body) return null;\nreturn { componente: resposta.body, etag: resposta.headers.get('ETag') };"},
      verify:'Em hemoterapia/angular, rode npm run verificar e confira HNG-402. Com a API de referência rodando, clique em Rastrear BOL-101.',
      question:{
        prompt:'Qual opção do HttpClient permite ler corpo e cabeçalhos juntos?',
        choices:["observe: 'body'","observe: 'response'","responseType: 'text'"],
        answer:1,
        feedback:['O modo body entrega apenas o corpo ao consumidor.','O HttpResponse reúne corpo, status e cabeçalhos.','Isso muda a interpretação do corpo, mas não pede a resposta completa.']
      },
      httpLesson:'rastrear'
    },
    {
      id:'HNG-403', area:'vigilancia', title:'Mostre o 422 junto aos campos corretos', level:'avancado', minutes:30,
      description:'O formulário de ocorrência exibe erro genérico. Faça o adaptador interpretar a resposta do backend sem perder o texto digitado.',
      technologies:['typescript','angular'],
      prerequisites:['Usar formulários reativos tipados no Angular.','Estreitar um valor unknown com verificações em tempo de execução.','Distinguir falha de validação 422 de falhas de rede e servidor.'],
      theory:[{label:'Angular · Formulários reativos tipados',url:'https://angular.dev/guide/forms/typed-forms',description:'Revise o modelo do formulário e as chaves conhecidas dos controles.'},vigilancia],
      file:'hemoterapia/angular/src/app/exercises.ts',
      goal:'Em errosDeOcorrencia, aceite apenas HttpErrorResponse 422 com objeto errors. Retorne as mensagens de texto não vazias de codigoComponente e descricao. Deixe o componente tratar os demais erros com a mensagem geral.',
      criteria:['BOL-999 mostra a falha ao lado de código.','Uma descrição inválida aparece no campo descricao sem apagar o rascunho.','Status diferente ou campos desconhecidos não entram nos controles do formulário.'],
      example:{language:'typescript',code:"if (!(erro instanceof HttpErrorResponse) || erro.status !== 422) return {};\nconst body: unknown = erro.error;\nif (typeof body !== 'object' || body === null || !('errors' in body)) return {};"},
      verify:'Em hemoterapia/angular, rode npm run verificar e confira HNG-403. Depois, no modo inicial da interface com API de referência, envie BOL-999 e corrija para BOL-101. Confira o erro por campo e o 201.',
      question:{
        prompt:'Como lidar com um campo desconhecido no mapa errors?',
        choices:['Criar um controle novo para toda chave devolvida.','Exibir a resposta bruta no formulário.','Mapear apenas as chaves que o formulário conhece.'],
        answer:2,
        feedback:['A interface controla seu próprio esquema de formulário.','A resposta pode conter detalhes sem utilidade para a pessoa usuária.','Isso preserva o contrato visual dos campos e permite um fallback geral.']
      },
      httpLesson:'validar'
    }
  ];
})();
