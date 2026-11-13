'use strict';

(() => {
  const path = '/api/hemoterapia/ocorrencias';
  const baseUrl = 'https://sprint-web.invalid';
  const fields = ['codigoComponente','descricao'];
  const componentCodes = new Set(['BOL-101','BOL-102','BOL-103']);
  const messages = {
    codigoComponente:'Selecione um código do estoque.',
    descricao:'Descreva a ocorrência em até 240 caracteres.'
  };
  const reasons = {201:'Created',400:'Bad Request',404:'Not Found',405:'Method Not Allowed',415:'Unsupported Media Type',422:'Unprocessable Content'};
  const jsonHeader = {name:'Content-Type',value:'application/json'};
  const onlyCode = {codigoComponente:'BOL-999',descricao:'Conferência de teste.'};
  const onlyDescription = {codigoComponente:'BOL-101',descricao:' '};
  const bothFields = {...onlyCode,descricao:' '};
  const validInput = {...onlyCode,codigoComponente:'BOL-101'};

  const probes = [
    {id:'codigo',label:'Enviar código desconhecido',request:{method:'POST',path,headers:[jsonHeader],body:onlyCode}},
    {id:'descricao',label:'Enviar descrição em branco',request:{method:'POST',path,headers:[jsonHeader],body:onlyDescription}}
  ];

  function inputFrom(request) {
    try {
      const payload = JSON.parse(request.body);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
      return Object.fromEntries(fields.map(field => [field,typeof payload[field] === 'string' ? payload[field].trim() : '']));
    } catch {
      return null;
    }
  }

  function validation(input) {
    const errors = {};
    const descricao = input.descricao.trim();
    if (!componentCodes.has(input.codigoComponente)) errors.codigoComponente = [messages.codigoComponente];
    if (!descricao || descricao.length > 240) errors.descricao = [messages.descricao];
    return errors;
  }

  function response(status,body,headers = []) {
    const mediaType = status === 201 || status === 400 ? 'application/json' : 'application/problem+json';
    return {status,reason:reasons[status],headers:[{name:'Content-Type',value:mediaType},...headers],body};
  }

  function problem(status,title,headers) {
    return response(status,{status,title},headers);
  }

  function draftResponse(input,invalid = errors => response(422,{title:'Revise os campos do rascunho.',status:422,errors})) {
    const errors = validation(input);
    if (Object.keys(errors).length) return invalid(errors);
    return response(201,{id:781,...input,status:'rascunho'},[{name:'Location',value:`${path}/781`}]);
  }

  function genericProblem() {
    return problem(422,'O rascunho contém dados inválidos.');
  }

  function requestRoute(address) {
    if (typeof address !== 'string' || !address.startsWith('/') || address.startsWith('//') || /[\\\s#]/.test(address)) return null;
    return new URL(address,baseUrl).pathname;
  }

  function respond(variant,request) {
    const route = requestRoute(request.path);
    if (route === null) return problem(400,'Use um caminho relativo da API simulada.');
    if (route !== path || !Object.hasOwn(variants,variant)) return problem(404,'Rota indisponível neste plantão.');
    if (request.method !== 'POST') return problem(405,'Envie um POST para testar o rascunho.',[{name:'Allow',value:'POST'}]);
    const mediaType = request.headers?.find(header => header.name.trim().toLowerCase() === 'content-type')?.value?.split(';')[0].trim().toLowerCase();
    if (mediaType !== 'application/json') return problem(415,'Envie Content-Type: application/json.');
    const input = inputFrom(request);
    if (!input) return problem(400,'Envie um objeto JSON.');
    return draftResponse(input,variant === 'validacao-b' ? genericProblem : undefined);
  }

  function observe(request,result) {
    if (request.method !== 'POST' || requestRoute(request.path) !== path || result.status !== 422) return null;
    const input = inputFrom(request);
    const invalid = input ? Object.keys(validation(input)) : [];
    if (invalid.length !== 1) return null;
    const field = invalid[0];
    const id = field === 'codigoComponente' ? 'codigo' : 'descricao';
    const detail = result.body?.errors?.[field]?.join(' ');
    return {id,summary:detail ? `422 · errors.${field} · ${detail}` : '422 · Resposta sem o mapa errors.'};
  }

  function capture(result) {
    return {
      request:`POST ${path}\nContent-Type: application/json\n\n${JSON.stringify(onlyCode,null,2)}`,
      response:`HTTP/1.1 ${result.status} ${result.reason}\n${result.headers.map(({name,value}) => `${name}: ${value}`).join('\n')}`,
      body:result.body
    };
  }

  function mapFields(result,property = 'errors',keys = fields) {
    if (result.status !== 422) return {};
    const errors = result.body[property];
    const known = {};
    for (const field of keys) {
      const texts = Array.isArray(errors?.[field]) ? errors[field].filter(text => typeof text === 'string' && text.trim()) : [];
      if (texts.length) known[field] = texts;
    }
    return known;
  }

  const corrections = {
    'validacao-a':[
      {label:'Ler o mapa traduzido chamado erros',language:'typescript',code:'return mapearCampos(problema.erros);',apply:input => mapFields(draftResponse(input),'erros')},
      {label:'Ler errors e validar as mensagens dos campos conhecidos',language:'typescript',code:[
        'if (!(erro instanceof HttpErrorResponse) || erro.status !== 422) return {};',
        'const problema: unknown = erro.error;',
        'if (typeof problema !== "object" || !problema || !("errors" in problema)) return {};',
        'const campos = problema.errors;',
        'if (typeof campos !== "object" || !campos) return {};',
        'const mensagens: ErrosOcorrencia = {};',
        'for (const campo of ["codigoComponente", "descricao"] as const) {',
        '  const valores = (campos as Record<string, unknown>)[campo];',
        '  if (!Array.isArray(valores)) continue;',
        '  const textos = valores.filter((valor): valor is string =>',
        '    typeof valor === "string" && valor.trim().length > 0);',
        '  if (textos.length) mensagens[campo] = textos;',
        '}',
        'return mensagens;'
      ].join('\n'),apply:input => mapFields(draftResponse(input))},
      {label:'Copiar apenas a validação do código',language:'typescript',code:'return { codigoComponente: problema.errors?.codigoComponente };',apply:input => mapFields(draftResponse(input),'errors',['codigoComponente'])}
    ],
    'validacao-b':[
      {label:'Enviar o mapa com HTTP 400',language:'csharp',code:'return Results.BadRequest(new { errors });',apply:input => draftResponse(input,errors => response(400,{errors}))},
      {label:'Manter HTTP 422 e juntar tudo no detalhe geral',language:'csharp',code:'return Results.Problem(detail: string.Join(" ", errors.Values.SelectMany(x => x)),\n    statusCode: 422);',apply:input => draftResponse(input,errors => response(422,{status:422,detail:Object.values(errors).flat().join(' ')}))},
      {label:'Devolver o mapa de validação por campo com HTTP 422',language:'csharp',code:'return Results.ValidationProblem(errors, statusCode: 422);',apply:draftResponse}
    ]
  };

  const scenario = 'Ao enviar o rascunho, aparece um aviso genérico. O formulário não indica qual campo corrigir.';
  const variants = {
    'validacao-a':{
      label:'Ocorrência A',scenario,network:capture(draftResponse(onlyCode)),
      competency:{label:'Validação no Angular',description:'Identifique e apresente as mensagens dos campos conhecidos do formulário.'},
      hints:[
        'Na aba Rede, abra o corpo da resposta 422 e localize os nomes das propriedades.',
        'Os dois POSTs diretos entregam mensagens específicas em errors. Compare esse nome com a leitura que o Angular faz.',
        'No adaptador, leia erro.error.errors e conserve as listas de texto dos campos conhecidos.'
      ],
      diagnosis:{answer:0,choices:[
        {label:'O Angular procura o mapa em erros, mas a API usa errors.',feedback:'As duas respostas têm errors com a chave do campo correspondente. A leitura no Angular perde as mensagens ao buscar outro nome.'},
        {label:'A API devolve um problema genérico sem erros por campo.',feedback:'Os POSTs diretos devolvem errors. Confira as chaves no corpo e como o formulário as lê.'},
        {label:'O servidor considera válido o rascunho e responde 201.',feedback:'O servidor responde 422 para cada entrada inválida. Investigue o tratamento dessa resposta.'}
      ]},
      patches:corrections['validacao-a'].map(({label,language,code}) => ({label,language,code}))
    },
    'validacao-b':{
      label:'Ocorrência B',mission:'HNT-303',scenario,network:capture(draftResponse(onlyCode,genericProblem)),
      competency:{label:'Contrato de validação no ASP.NET',description:'Devolva HTTP 422 com as mensagens associadas às chaves dos campos.'},
      hints:[
        'Na aba Rede, confira se o corpo da resposta contém as mensagens e suas chaves.',
        'As duas entradas inválidas retornam o mesmo 422 genérico. O Angular precisa do mapa errors para associar as mensagens.',
        'No ASP.NET, devolva Results.ValidationProblem com o dicionário e defina statusCode: 422.'
      ],
      diagnosis:{answer:1,choices:[
        {label:'O Angular descarta um mapa que a API já envia.',feedback:'Os POSTs diretos isolam a API. O corpo recebido não traz as chaves dos campos.'},
        {label:'A API devolve 422 sem incluir o mapa de erros por campo.',feedback:'O corpo do 422 tem apenas título e status. O contrato da tela espera as listas de mensagens em errors.'},
        {label:'O navegador cancela a requisição antes de a API responder.',feedback:'A captura e os POSTs mostram a resposta da API. Observe quais informações ela contém.'}
      ]},
      patches:corrections['validacao-b'].map(({label,language,code}) => ({label,language,code}))
    }
  };

  function check(name,expected,actual) {
    return {name,expected,actual,pass:expected === actual};
  }

  function visible(fieldsWithErrors) {
    return fields.filter(field => fieldsWithErrors[field]?.length).join(' e ') || 'Aviso genérico';
  }

  function checks(variant,patchIndex) {
    if (!Object.hasOwn(corrections,variant) || !Number.isInteger(patchIndex)) return [];
    const patch = corrections[variant][patchIndex];
    if (!patch) return [];
    const backend = variant === 'validacao-b';
    const scenarios = [
      ['Código desconhecido',onlyCode],
      ['Descrição em branco',onlyDescription],
      ['Dois campos inválidos',bothFields]
    ];
    return scenarios.map(([name,input]) => {
      const result = patch.apply(input);
      const expected = visible(validation(input));
      return backend ? check(name,`422 · ${expected}`,`${result.status} · ${visible(mapFields(result))}`)
        : check(name,expected,visible(result));
    });
  }

  const reviewDiff = {language:'diff',code:[
    '--- hemoterapia.component.ts',
    '+++ hemoterapia.component.ts',
    '@@ aplicar erros do formulário @@',
    '  const campos = errosDeOcorrencia(erro);',
    '- this.erros.set(campos);',
    '+ const [primeiro] = Object.entries(campos);',
    '+ this.erros.set(primeiro ? { [primeiro[0]]: primeiro[1] } : {});'
  ].join('\n')};
  const reviewOptions = [
    {label:'Enviar só o código desconhecido',feedback:'Com uma única falha, o primeiro campo é também o único que precisa receber mensagem.',input:onlyCode},
    {label:'Enviar um rascunho válido',feedback:'O fluxo de sucesso continua em HTTP 201. Escolha uma entrada com falhas em mais de um campo.',input:validInput},
    {label:'Enviar código desconhecido e descrição só com espaços',feedback:'A API devolve duas chaves. O PR conserva só a primeira, então o aviso da descrição some.',input:bothFields}
  ];

  function reviewChecks(testIndex) {
    if (!Number.isInteger(testIndex)) return [];
    const option = reviewOptions[testIndex];
    if (!option) return [];
    const result = draftResponse(option.input);
    if (result.status === 201) return [check('Rascunho válido','201 · Rascunho criado',`${result.status} · Rascunho criado`)];
    const mapped = mapFields(result);
    const firstOnly = Object.fromEntries(Object.entries(mapped).slice(0,1));
    return [check('Campos com mensagens visíveis',visible(mapped),visible(firstOnly))];
  }

  const reviewQuestion = {
    prompt:'A API responde 422 com errors.descricao e errors.unidade. O formulário só tem código do componente e descrição. Como o Angular deve lidar com a resposta?',
    choices:['Mostrar a mensagem no campo de descrição e manter o aviso geral do formulário.','Mostrar a mensagem de unidade no campo de código do componente.','Descartar toda a resposta porque existe uma chave desconhecida.'],
    answer:0,
    feedback:['A mensagem orienta a correção da descrição, e o aviso geral informa que o envio falhou.','A chave unidade não identifica o campo de código. Conserve a associação feita pelo contrato.','A mensagem de descricao continua válida para o campo correspondente.']
  };

  window.sprintIncidentCases.validacao = {
    title:'O rascunho rejeitado não mostra o campo com erro',area:'Validação de rascunhos',minutes:'15–20',mission:'HNG-403',
    description:'Compare o corpo do 422 com as mensagens que o formulário consegue apresentar.',
    investigation:'Envie os dois rascunhos de teste no Cliente HTTP. Confira se o 422 identifica o código inválido e a descrição em branco em suas respectivas respostas.',
    reviewIntro:'O PR muda a forma como o formulário exibe as mensagens. Procure uma entrada que exercite mais de uma validação no mesmo envio.',
    regressionSummary:'O teste mostrou que o PR perde a mensagem da descrição quando a API devolve dois campos inválidos.',
    probes,respond,observe,variants,checks,reviewDiff,reviewOptions,reviewChecks,reviewQuestion
  };
})();
