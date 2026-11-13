'use strict';

(() => {
  const path = '/api/hemoterapia/oficina-full/conferencia';
  const baseUrl = 'https://sprint-web.invalid';
  const headerName = 'X-Correlation-ID';
  const missingCode = 'BOL-999';
  const existingCode = 'BOL-101';
  const stock = {
    'BOL-101':{codigo:'BOL-101',tipo:'CH',status:'disponivel',versao:1},
    'BOL-102':{codigo:'BOL-102',tipo:'PL',status:'quarentena',versao:1},
    'BOL-103':{codigo:'BOL-103',tipo:'CP',status:'disponivel',versao:1}
  };
  const reasons = {200:'OK',400:'Bad Request',404:'Not Found',405:'Method Not Allowed'};

  function response(status,body,headers = [],contentType = 'application/json') {
    return {status,reason:reasons[status],headers:[{name:'Content-Type',value:contentType},...headers],body};
  }

  function isRelativePath(address) {
    return typeof address === 'string' && address.startsWith('/') && !address.startsWith('//') && !/[\\\s#]/.test(address);
  }

  function codeFromPath(address) {
    const url = new URL(address,baseUrl);
    const code = url.pathname.slice(path.length + 1);
    return url.origin === baseUrl && url.pathname.startsWith(`${path}/`) && /^BOL-\d{3}$/.test(code) ? code : null;
  }

  function correlation(code) {
    return `req-208-${code.slice(4)}`;
  }

  function lookup(code,format = 'both') {
    if (Object.hasOwn(stock,code)) return response(200,{...stock[code]});
    const id = correlation(code);
    const body = {type:'about:blank',title:'Componente não encontrado',status:404};
    if (format !== 'header') body.correlacao = id;
    const headers = format === 'body' ? [] : [{name:headerName,value:id}];
    return response(404,body,headers,'application/problem+json');
  }

  function respond(variant,request) {
    const address = request.path;
    if (!isRelativePath(address)) {
      return response(400,{erro:'Use um caminho relativo da API simulada.'});
    }
    const code = codeFromPath(address);
    if (!Object.hasOwn(variants,variant) || !code) return response(404,{erro:'Rota indisponível no plantão.'});
    if (request.method !== 'GET') return response(405,{erro:'Use GET para conferir um componente.'},[{name:'Allow',value:'GET'}]);
    return lookup(code,variant === 'suporte-b' ? 'header' : 'both');
  }

  function headerOf(result,name) {
    return result.headers.find(header => header.name.toLowerCase() === name.toLowerCase())?.value;
  }

  const probes = [
    {id:'ausente',label:'Consultar BOL-999',request:{method:'GET',path:`${path}/${missingCode}`}},
    {id:'existente',label:'Consultar BOL-101',request:{method:'GET',path:`${path}/${existingCode}`}}
  ];

  function observe(request,result) {
    if (request.method !== 'GET' || !isRelativePath(request.path)) return null;
    const code = codeFromPath(request.path);
    if (code === missingCode && result.status === 404 && result.body?.status === 404) {
      return {id:'ausente',summary:`HTTP 404 · ${headerName} ${headerOf(result,headerName) ?? 'ausente'} · correlacao no corpo ${result.body.correlacao ?? 'ausente'}`};
    }
    if (code === existingCode && result.status === 200 && result.body?.codigo === existingCode) {
      return {id:'existente',summary:`HTTP 200 · ${existingCode} encontrado · resposta sem referência de erro`};
    }
    return null;
  }

  function readReference(result,field = 'correlacao') {
    const value = result.body?.[field];
    return result.status === 404 && typeof value === 'string' && value.trim() ? value : null;
  }

  const corrections = {
    'suporte-a':[
      {
        label:'Usar o título do problema como referência',language:'typescript',
        code:"if (erro instanceof HttpErrorResponse && erro.status === 404) {\n  return erro.error?.title ?? null;\n}\nreturn null;",
        format:'both',field:'title'
      },
      {
        label:'Manter a leitura de correlationId no corpo',language:'typescript',
        code:"if (erro instanceof HttpErrorResponse && erro.status === 404) {\n  return erro.error?.correlationId ?? null;\n}\nreturn null;",
        format:'both',field:'correlationId'
      },
      {
        label:'Validar correlacao como uma string no corpo do 404',language:'typescript',
        code:"if (!(erro instanceof HttpErrorResponse) || erro.status !== 404) return null;\nconst corpo: unknown = erro.error;\nif (typeof corpo !== 'object' || corpo === null || !('correlacao' in corpo)) return null;\nreturn typeof corpo.correlacao === 'string' && corpo.correlacao.trim() ? corpo.correlacao : null;",
        format:'both',field:'correlacao'
      }
    ],
    'suporte-b':[
      {
        label:'Usar o mesmo TraceIdentifier no cabeçalho e em correlacao',language:'csharp',
        code:'var correlacao = http.TraceIdentifier;\nhttp.Response.Headers["X-Correlation-ID"] = correlacao;\nreturn Results.Problem(statusCode: 404, title: "Componente não encontrado",\n    extensions: new Dictionary<string, object?> { ["correlacao"] = correlacao });',
        format:'both',field:'correlacao'
      },
      {
        label:'Conservar o identificador só no cabeçalho',language:'csharp',
        code:'http.Response.Headers["X-Correlation-ID"] = http.TraceIdentifier;\nreturn Results.Problem(statusCode: 404, title: "Componente não encontrado");',
        format:'header',field:'correlacao'
      },
      {
        label:'Substituir o cabeçalho pelo campo no corpo',language:'csharp',
        code:'return Results.Problem(statusCode: 404, title: "Componente não encontrado",\n    extensions: new Dictionary<string, object?> { ["correlacao"] = http.TraceIdentifier });',
        format:'body',field:'correlacao'
      }
    ]
  };

  function capture(format) {
    const result = lookup(missingCode,format);
    const headers = result.headers.map(({name,value}) => `${name}: ${value}`);
    return {request:`GET ${path}/${missingCode}`,response:[`HTTP/1.1 ${result.status} ${result.reason}`,...headers].join('\n'),body:result.body};
  }

  const scenario = 'Na conferência, consultei BOL-999. Apareceu um erro sem referência. Preciso desse código para encontrar a requisição nos logs.';
  const variants = {
    'suporte-a':{
      label:'Ocorrência A',scenario,network:capture('both'),
      hints:[
        'Abra a captura da interface e compare o cabeçalho e o JSON do 404.',
        'O contrato de conferência usa correlacao no corpo. Se a API devolve esse campo, siga para a leitura feita pelo Angular.',
        'No HttpErrorResponse, o corpo está em error. Valide o status e o tipo do campo correlacao antes de exibir a referência.'
      ],
      diagnosis:{choices:[
        {label:'O Angular consulta uma chave diferente da enviada pela API.',feedback:'O cabeçalho e o JSON do 404 trazem a mesma referência. A leitura da interface precisa usar a chave correlacao do corpo.'},
        {label:'O ASP.NET enviou a referência só no cabeçalho.',feedback:'Confira o JSON capturado. O campo correlacao aparece junto de status e title.'},
        {label:'O código BOL-999 foi encontrado no estoque.',feedback:'O GET de BOL-999 volta com 404. Compare com o 200 de BOL-101.'}
      ],answer:0},
      patches:corrections['suporte-a'].map(({label,language,code}) => ({label,language,code})),
      competency:{label:'Ler ProblemDetails no Angular',description:'Valide o status e extraia uma extensão do corpo HTTP com verificação de tipo.'}
    },
    'suporte-b':{
      label:'Ocorrência B',scenario,network:capture('header'),
      hints:[
        'Compare o cabeçalho X-Correlation-ID com as propriedades do JSON capturado.',
        'O contrato entrega a mesma referência em dois lugares. O Angular consome a extensão correlacao do corpo.',
        'Em Results.Problem, coloque correlacao no dicionário de extensions com o mesmo HttpContext.TraceIdentifier do cabeçalho.'
      ],
      diagnosis:{choices:[
        {label:'O Angular ignorou um campo correlacao presente no JSON.',feedback:'Repita o GET sem passar pela tela. O corpo do 404 também chega sem essa propriedade no Cliente HTTP.'},
        {label:'A API escreveu a referência no cabeçalho e deixou de incluí-la no corpo.',feedback:'O GET direto reproduziu o contrato incompleto. O ASP.NET precisa escrever a mesma referência na extensão correlacao.'},
        {label:'O Cliente HTTP perdeu o código porque recebeu 200.',feedback:'O código ausente retorna 404. O 200 pertence ao controle BOL-101, que existe no estoque.'}
      ],answer:1},
      patches:corrections['suporte-b'].map(({label,language,code}) => ({label,language,code})),
      competency:{label:'Preservar a correlação no ASP.NET',description:'Mantenha a mesma referência no cabeçalho e no corpo do erro previsto.'}
    }
  };

  function check(name,expected,actual) {
    return {name,expected,actual,pass:expected === actual};
  }

  function checks(variant,patchIndex) {
    if (!Object.hasOwn(corrections,variant) || !Number.isInteger(patchIndex)) return [];
    const patch = corrections[variant][patchIndex];
    if (!patch) return [];
    const missing = lookup(missingCode,patch.format);
    const found = lookup(existingCode,patch.format);
    const id = correlation(missingCode);
    return [
      check('Formato de erro', '404 application/problem+json', `${missing.status} ${headerOf(missing,'Content-Type')}`),
      check('Referência no cabeçalho',id,headerOf(missing,headerName) ?? 'Ausente'),
      check('Referência no corpo',id,missing.body.correlacao ?? 'Ausente'),
      check('Referência mostrada na tela',id,readReference(missing,patch.field) ?? 'Ausente'),
      check('Consulta de controle',`200 ${existingCode}`,`${found.status} ${found.body.codigo}`)
    ];
  }

  const reviewDiff = {
    language:'diff',
    code:[
      '--- oficina-full.component.ts',
      '+++ oficina-full.component.ts',
      '@@ conferir(codigo: string) @@',
      "     this.conferencia.set('');",
      '-    this.referenciaSuporte.set(null);',
      '     try {',
      '       const item = await consultar(codigo);',
      '       this.conferencia.set(`Componente ${item.codigo} encontrado.`);',
      '     } catch (erro: unknown) {',
      '       this.referenciaSuporte.set(codigoSuporte(erro));',
      '     }'
    ].join('\n')
  };
  const reviewOptions = [
    {label:'Consultar BOL-101 em uma tela recém-aberta',codes:[existingCode],feedback:'A tela começa sem referência e o 200 mantém esse estado. Experimente uma sequência em que já existe uma referência exibida.'},
    {label:'Consultar dois códigos inexistentes em sequência',codes:[missingCode,'BOL-998'],feedback:'Os dois erros entram no catch. A segunda referência substitui a primeira e o teste passa.'},
    {label:'Consultar BOL-999 e, em seguida, BOL-101',codes:[missingCode,existingCode],feedback:'O 404 grava uma referência. A consulta válida deixa essa referência na tela porque o PR removeu a limpeza antes da requisição.'}
  ];

  function reviewChecks(testIndex) {
    if (!Number.isInteger(testIndex) || !reviewOptions[testIndex]) return [];
    let reference = null;
    return reviewOptions[testIndex].codes.map(code => {
      const result = lookup(code);
      const expected = readReference(result);
      if (result.status === 404) reference = expected;
      return check(`Referência após ${code}`,expected ?? 'Nenhuma',reference ?? 'Nenhuma');
    });
  }

  const reviewQuestion = {
    prompt:'Em outro chamado, a consulta de BOL-778 retorna HTTP 404. O cabeçalho traz req-778-a e o corpo traz req-778-b. A tela mostra req-778-b e o suporte só encontra req-778-a nos logs. Qual ajuste mantém o contrato útil para a investigação?',
    choices:[
      'Usar o código BOL-778 como referência de todos os erros do componente.',
      'Gravar o mesmo identificador da requisição no log, no cabeçalho e em correlacao.',
      'Trocar o status para 200 e exibir o título do erro como referência.'
    ],
    answer:1,
    feedback:[
      'O mesmo componente pode aparecer em várias requisições. A referência precisa identificar a consulta específica.',
      'O suporte consegue encontrar a consulta quando o log, o cabeçalho e o corpo usam a mesma referência.',
      'O 404 informa que o componente está ausente. O título descreve o problema, mas não identifica a requisição.'
    ]
  };

  window.sprintIncidentCases.suporte = {
    title:'O erro chega ao suporte sem referência',area:'Suporte',minutes:15,mission:'HFS-208',
    description:'Compare um componente ausente e um existente para investigar onde se perdeu o identificador de correlação.',
    investigation:'Consulte BOL-999, que está ausente, e BOL-101, que existe. Compare os status, o cabeçalho X-Correlation-ID e o campo correlacao na resposta de erro com a captura da interface.',
    reviewIntro:'Um colega simplificou a atualização da referência no painel. Leia o diff e escolha uma sequência de consultas que revele o efeito dessa mudança.',
    regressionSummary:'A revisão do PR registrou que o painel preservava a referência anterior depois de uma consulta bem-sucedida.',
    probes,respond,observe,variants,checks,reviewDiff,reviewOptions,reviewChecks,reviewQuestion
  };
})();
