'use strict';

(() => {
  const baseUrl = 'https://sprint-web.invalid';
  const route = '/api/hemoterapia/oficina-full/etiquetas/';
  const code = 'BOL-101';
  const alternateCode = 'BOL-102';
  const labels = {
    [code]:{codigo:code,tipo:'CH',status:'disponivel',versao:2},
    [alternateCode]:{codigo:alternateCode,tipo:'PL',status:'quarentena',versao:1}
  };
  const currentTag = entityTag(labels[code]);
  const oldTag = entityTag({...labels[code],versao:1});
  const reasons = {200:'OK',304:'Not Modified',400:'Bad Request',404:'Not Found',405:'Method Not Allowed'};

  function entityTag(item) {
    return '"' + item.codigo + '-' + item.versao + '"';
  }

  function header(headers,name) {
    return (headers ?? []).filter(row => row.name.trim().toLowerCase() === name.toLowerCase())
      .map(row => row.value.trim()).join(', ');
  }

  function get(codigo,tag) {
    return {method:'GET',path:route + codigo,headers:tag ? [{name:'If-None-Match',value:tag}] : []};
  }

  function response(status,body,headers = []) {
    return {
      status,reason:reasons[status],
      headers:body === null ? headers : [{name:'Content-Type',value:'application/json'},...headers],
      body
    };
  }

  function weakMatch(received,tag) {
    return received === '*' || received.split(',').some(value => value.trim().replace(/^W\//,'') === tag);
  }

  function strongMatch(received,tag) {
    return received === '*' || received.split(',').some(value => value.trim() === tag);
  }

  function readLabel(codigo,received,matches = weakMatch) {
    if (!Object.hasOwn(labels,codigo)) return response(404,{erro:'Componente não encontrado.'});
    const label = labels[codigo];
    const tag = entityTag(label);
    const headers = [{name:'ETag',value:tag},{name:'Cache-Control',value:'private, no-cache'}];
    return matches(received,tag) ? response(304,null,headers) : response(200,{...label},headers);
  }

  function matchAnyTag(received) {
    return Boolean(received);
  }

  function respond(variant,request) {
    const address = request.path;
    if (typeof address !== 'string' || !address.startsWith('/') || address.startsWith('//') || /[\\\s#]/.test(address)) {
      return response(400,{erro:'Use um caminho relativo da API simulada.'});
    }
    const url = new URL(address,baseUrl);
    if (!Object.hasOwn(variants,variant) || url.origin !== baseUrl || !url.pathname.startsWith(route)) {
      return response(404,{erro:'Rota indisponível no plantão.'});
    }
    if (request.method !== 'GET') return response(405,{erro:'Use GET para consultar a etiqueta.'},[{name:'Allow',value:'GET'}]);
    return readLabel(url.pathname.slice(route.length),header(request.headers,'If-None-Match'),
      variant === 'etag-b' ? matchAnyTag : weakMatch);
  }

  const probes = [
    {id:'atual',label:'Consultar a etiqueta sem ETag',request:get(code)},
    {id:'revalidar',label:'Revalidar com a tag da versão atual',request:get(code,currentTag)},
    {id:'antiga',label:'Revalidar com a tag da versão anterior',request:get(code,oldTag)}
  ];

  function observe(request,result) {
    if (request.method !== 'GET' || request.path !== route + code || ![200,304].includes(result.status)) return null;
    const tag = header(request.headers,'If-None-Match');
    const probe = probes.find(item => header(item.request.headers,'If-None-Match') === tag);
    if (!probe) return null;
    const version = result.body ? 'versão ' + result.body.versao : 'sem corpo';
    return {id:probe.id,summary:result.status + ' · ' + version + ' · ETag ' + header(result.headers,'ETag')};
  }

  const frontendPatches = [
    {
      label:'Reaproveitar a etiqueta guardada para qualquer falha',
      language:'typescript',
      code:'return entrada ?? null;',
      reuse:(_status,entry) => entry ?? null
    },
    {
      label:'Reaproveitar a entrada do código consultado apenas no 304',
      language:'typescript',
      code:"return falha instanceof HttpErrorResponse && falha.status === 304\n  ? entrada ?? null\n  : null;",
      reuse:(status,entry) => status === 304 ? entry ?? null : null
    },
    {
      label:'Descartar a representação guardada quando não vier corpo',
      language:'typescript',
      code:'return null;',
      reuse:() => null
    }
  ];

  const backendPatches = [
    {
      label:'Responder 304 sempre que o cabeçalho estiver presente',
      language:'csharp',
      code:'var tags = http.Request.GetTypedHeaders().IfNoneMatch;\nreturn tags.Count > 0 ? Results.StatusCode(304) : Results.Ok(item);',
      matches:matchAnyTag
    },
    {
      label:'Comparar somente as tags fortes e manter o curinga',
      language:'csharp',
      code:'var tags = http.Request.GetTypedHeaders().IfNoneMatch;\nvar igual = tags.Any(t => t.Equals(EntityTagHeaderValue.Any)\n    || t.Compare(etag, useStrongComparison: true));\nreturn igual ? Results.StatusCode(304) : Results.Ok(item);',
      matches:strongMatch
    },
    {
      label:'Comparar com a tag atual do recurso usando comparação fraca',
      language:'csharp',
      code:'var tags = http.Request.GetTypedHeaders().IfNoneMatch;\nvar igual = tags.Any(t => t.Equals(EntityTagHeaderValue.Any)\n    || t.Compare(etag, useStrongComparison: false));\nreturn igual ? Results.StatusCode(304) : Results.Ok(item);',
      matches:weakMatch
    }
  ];

  function capture(tag) {
    return {
      request:'GET ' + route + code + '\nIf-None-Match: ' + tag,
      response:'HTTP/1.1 304 Not Modified\nETag: ' + currentTag + '\nCache-Control: private, no-cache',
      body:null
    };
  }

  const scenario = 'A primeira consulta da etiqueta BOL-101 abriu normalmente.';
  const variants = {
    'etag-a':{
      label:'Ocorrência A',
      scenario:scenario + ' A tela mostrou a versão 2. Quando reabri a etiqueta, o painel ficou em branco.',
      network:capture(currentTag),
      hints:[
        'Compare o valor enviado em If-None-Match com o ETag que aparece na resposta.',
        'Na revalidação da mesma versão, o 304 vem sem corpo. A versão já guardada continua válida.',
        'Confira reutilizarEtiqueta no Angular. Em um 304, use a entrada do código consultado que o componente encontrou no cache.'
      ],
      diagnosis:{
        choices:[
          {label:'A API deveria sempre mandar o JSON junto com o 304.',feedback:'No GET condicional, o 304 indica que a representação guardada ainda vale. Compare o resultado sem o cabeçalho.'},
          {label:'O Angular descarta a representação que o 304 confirma.',feedback:'A tag enviada coincide com a atual e o cache contém a versão 2. O cliente precisa manter essa representação visível.'},
          {label:'O servidor considera iguais a tag atual e a anterior.',feedback:'O GET direto com a tag anterior retorna 200 e traz a versão 2. Compare esse resultado com o 304 da captura.'}
        ],
        answer:1
      },
      patches:frontendPatches.map(({label,language,code}) => ({label,language,code})),
      competency:{label:'Revalidação no Angular',description:'Reaproveite a etiqueta guardada para o código consultado quando a API responde 304.'}
    },
    'etag-b':{
      label:'Ocorrência B',
      scenario:scenario + ' A tela continuou mostrando a versão 1 depois de a conferência apontar a versão 2.',
      network:capture(oldTag),
      hints:[
        'Leia o número da versão na tag enviada e compare com a tag informada pelo servidor.',
        'Com a tag anterior, um GET condicional deve trazer a representação atual em uma resposta 200.',
        'No ASP.NET Core, compare cada If-None-Match com o ETag do recurso usando Compare com useStrongComparison: false.'
      ],
      diagnosis:{
        choices:[
          {label:'O Angular deveria interpretar qualquer 304 como falha e apagar a etiqueta.',feedback:'Apagar a etiqueta prejudicaria a revalidação válida. Investigue por que a API enviou 304 para uma versão antiga.'},
          {label:'A etiqueta atual ainda está na versão 1 no servidor.',feedback:'O GET sem condição traz a versão 2. Compare essa versão com a condição da requisição capturada.'},
          {label:'A API devolve 304 mesmo quando a tag enviada difere da atual.',feedback:'O GET sem condição confirma a versão 2. Enviar a tag da versão 1 reproduz o 304 indevido e impede a atualização.'}
        ],
        answer:2
      },
      patches:backendPatches.map(({label,language,code}) => ({label,language,code})),
      competency:{label:'GET condicional no ASP.NET',description:'Compare a tag enviada com a versão atual e entregue o JSON quando a representação mudou.'}
    }
  };

  function check(name,expected,actual) {
    return {name,expected,actual,pass:expected === actual};
  }

  function visible(item) {
    return item ? item.codigo + ' · versão ' + item.versao : 'Sem etiqueta';
  }

  function responseSummary(result) {
    return result.status + (result.body ? ' · ' + visible(result.body) : ' · sem corpo');
  }

  function checks(variant,patchIndex) {
    if (!Number.isInteger(patchIndex)) return [];
    if (variant === 'etag-a') {
      const patch = frontendPatches[patchIndex];
      if (!patch) return [];
      return [
        check('Revalidar a etiqueta guardada',visible(labels[code]),visible(patch.reuse(304,labels[code]))),
        check('Receber 404 após consultar a etiqueta','Sem etiqueta',visible(patch.reuse(404,labels[code]))),
        check('Receber 304 sem entrada para o código','Sem etiqueta',visible(patch.reuse(304)))
      ];
    }
    const patch = backendPatches[patchIndex];
    if (variant !== 'etag-b' || !patch) return [];
    return [
      check('Consultar com a versão anterior','200 · ' + visible(labels[code]),responseSummary(readLabel(code,oldTag,patch.matches))),
      check('Revalidar a versão atual','304 · sem corpo',responseSummary(readLabel(code,currentTag,patch.matches))),
      check('Revalidar a versão atual com tag fraca','304 · sem corpo',responseSummary(readLabel(code,'W/' + currentTag,patch.matches)))
    ];
  }

  const reviewDiff = {
    language:'diff',
    code:[
      '--- oficina-full.component.ts',
      '+++ oficina-full.component.ts',
      '@@ consultarEtiqueta(codigo: string) @@',
      '-    const entrada = this.cache.get(segmento);',
      '+    const entrada = [...this.cache.values()].at(-1);'
    ].join('\n')
  };

  const reviewOptions = [
    {label:'Abrir BOL-101 com cache vazio',code,feedback:'Sem nenhuma entrada, as duas versões enviam o GET sem If-None-Match.'},
    {label:'Abrir BOL-102 após consultar somente BOL-101',previous:code,code:alternateCode,feedback:'BOL-102 ainda não tem entrada própria. O PR envia indevidamente a tag guardada para BOL-101.'},
    {label:'Reabrir BOL-101 depois da primeira consulta',previous:code,code,feedback:'Como o código é o mesmo, a última entrada coincide com a entrada que a consulta precisa.'}
  ];

  function reviewChecks(testIndex) {
    if (!Number.isInteger(testIndex) || !reviewOptions[testIndex]) return [];
    const {previous,code:requestedCode} = reviewOptions[testIndex];
    const cache = previous ? new Map([[previous,entityTag(labels[previous])]]) : new Map();
    const expected = cache.get(requestedCode);
    const actual = [...cache.values()].at(-1);
    return [
      check('If-None-Match enviado para ' + requestedCode,expected ?? 'Cabeçalho ausente',actual ?? 'Cabeçalho ausente'),
      check('Resposta da API',responseSummary(readLabel(requestedCode,expected ?? '')),responseSummary(readLabel(requestedCode,actual ?? '')))
    ];
  }

  const reviewQuestion = {
    prompt:'A tela guardou a versão 5 da etiqueta ETQ-410. Depois de uma atualização no servidor, ela envia If-None-Match: "ETQ-410-5" e recebe 304 com ETag "ETQ-410-6". Qual resultado deveria aparecer?',
    choices:[
      'Um 304 seguido de um JSON da versão 6 no corpo.',
      'Um 200 com a representação da versão 6, porque a tag enviada não coincide com a atual.',
      'Um 304 sem corpo. A presença de If-None-Match basta para confirmar a versão guardada.'
    ],
    answer:1,
    feedback:[
      'O 304 vem sem corpo. Para entregar a representação nova, o GET devolve 200.',
      'A tag guardada é diferente da atual. O 200 entrega a versão 6 e a sua tag.',
      'O servidor compara a tag enviada com a representação atual antes de decidir se pode enviar 304.'
    ]
  };

  window.sprintIncidentCases.etag = {
    title:'A etiqueta não mostra os dados atuais ao reabrir',
    area:'Estoque',
    description:'Investigue a revalidação de etiquetas e o reaproveitamento do cache entre Angular e ASP.NET Core.',
    minutes:18,
    mission:'HFS-209',
    investigation:'A captura mostra a requisição feita ao reabrir BOL-101. No Cliente HTTP, compare as respostas sem condição, com a tag atual e com a tag anterior. Confira o status, o ETag e o corpo.',
    reviewIntro:'O PR tenta reaproveitar a última entrada guardada no cache. Compare a requisição que ele monta quando a equipe reabre uma etiqueta e quando troca o código consultado.',
    regressionSummary:'A revisão registrou o envio da tag de BOL-101 em uma requisição de BOL-102.',
    probes,respond,observe,variants,checks,reviewDiff,reviewOptions,reviewChecks,reviewQuestion
  };
})();
