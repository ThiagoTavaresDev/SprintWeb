'use strict';

(() => {
  const path = '/api/hemoterapia/oficina-full/estoque';
  const baseUrl = 'https://sprint-web.invalid';
  const stock = [
    {codigo:'BOL-101',tipo:'CH',status:'disponivel',versao:1},
    {codigo:'BOL-102',tipo:'PL',status:'quarentena',versao:1},
    {codigo:'BOL-103',tipo:'CP',status:'disponivel',versao:1}
  ];
  const reasons = {200:'OK',400:'Bad Request',404:'Not Found',405:'Method Not Allowed'};

  function orderedPage(page,size) {
    const offset = (page - 1) * size;
    return stock.slice(offset,offset + size);
  }

  function firstPage(_page,size) {
    return stock.slice(0,size);
  }

  function pageBody(page,size,read = orderedPage) {
    return {items:read(page,size).map(item => ({...item})),total:stock.length,pagina:page,tamanho:size};
  }

  function response(status,body,headers = []) {
    return {status,reason:reasons[status],headers:[{name:'Content-Type',value:'application/json'},...headers],body};
  }

  function queryInt(params,name,fallback) {
    const value = params.get(name);
    if (value === null) return fallback;
    return /^[+-]?\d+$/.test(value) ? Number(value) : NaN;
  }

  function respond(variant,request) {
    const address = request.path;
    if (typeof address !== 'string' || !address.startsWith('/') || address.startsWith('//') || /[\\\s#]/.test(address)) {
      return response(400,{erro:'Use um caminho relativo da API simulada.'});
    }
    const url = new URL(address,baseUrl);
    if (!Object.hasOwn(variants,variant) || url.origin !== baseUrl || url.pathname !== path) {
      return response(404,{erro:'Rota indisponível no plantão.'});
    }
    if (request.method !== 'GET') return response(405,{erro:'Use GET para consultar o estoque.'},[{name:'Allow',value:'GET'}]);

    const page = queryInt(url.searchParams,'pagina',1);
    const size = queryInt(url.searchParams,'tamanho',2);
    if (!(page >= 1 && page <= 10000 && size >= 1 && size <= 50)) {
      return response(400,{erro:'Use pagina entre 1 e 10000 e tamanho entre 1 e 50.'});
    }
    return response(200,pageBody(page,size,variant === 'backend' ? firstPage : orderedPage));
  }

  const corrections = {
    frontend:[
      {
        label:'Usar o tamanho nos dois parâmetros',
        language:'typescript',
        code:"return new HttpParams()\n  .set('pagina', tamanho)\n  .set('tamanho', tamanho);",
        apply:(_page,size) => pageBody(size,size)
      },
      {
        label:'Enviar a página escolhida e o tamanho',
        language:'typescript',
        code:"return new HttpParams()\n  .set('pagina', pagina)\n  .set('tamanho', tamanho);",
        apply:pageBody
      },
      {
        label:'Chamar set sem guardar a instância retornada',
        language:'typescript',
        code:"const params = new HttpParams().set('tamanho', tamanho);\nparams.set('pagina', pagina);\nreturn params;",
        apply:(_page,size) => pageBody(1,size)
      }
    ],
    backend:[
      {
        label:'Pular uma página inteira já na primeira consulta',
        language:'csharp',
        code:'var deslocamento = pagina * tamanho;\nreturn consulta.Skip(deslocamento).Take(tamanho);',
        apply:(page,size) => pageBody(page,size,() => orderedPage(page + 1,size))
      },
      {
        label:'Limitar a consulta antes de pular os registros',
        language:'csharp',
        code:'var deslocamento = (pagina - 1) * tamanho;\nreturn consulta.Take(tamanho).Skip(deslocamento);',
        apply:(page,size) => pageBody(page,size,() => firstPage(page,size).slice((page - 1) * size))
      },
      {
        label:'Pular os registros anteriores e aplicar o limite',
        language:'csharp',
        code:'var deslocamento = (pagina - 1) * tamanho;\nreturn consulta.Skip(deslocamento).Take(tamanho);',
        apply:pageBody
      }
    ]
  };

  function capture(request,body) {
    return {request:'GET ' + request,response:'HTTP/1.1 200 OK',body};
  }

  const variants = {
    frontend:{
      label:'Ocorrência A',
      scenario:'Cliquei em Próxima página na conferência do estoque. Continuo vendo BOL-101 e BOL-102.',
      network:capture(path + '?tamanho=2',pageBody(1,2)),
      hints:[
        'Abra a aba Rede e confira os parâmetros da requisição disparada pelo botão.',
        'A API usa página 1 quando a query omite pagina. Compare com o resultado ao informar pagina=2 no Cliente HTTP.',
        'No Angular, HttpParams.set devolve uma nova instância. Encadeie as chamadas ou guarde o retorno de cada uma.'
      ],
      diagnosis:{
        choices:[
          {label:'A tela Angular envia a consulta sem o número da página.',feedback:'A captura contém apenas tamanho. O GET direto com pagina=2 devolve BOL-103 e confirma que a API consegue paginar.'},
          {label:'A consulta do EF Core ignora o deslocamento.',feedback:'Compare os GETs diretos. Se cada página devolve registros diferentes, a consulta aplica o recorte.'},
          {label:'A contagem total impede a mudança de página.',feedback:'O total representa os três registros antes do recorte. Use o caminho da requisição para localizar a falha.'}
        ],
        answer:0
      },
      patches:corrections.frontend.map(({label,language,code}) => ({label,language,code}))
    },
    backend:{
      label:'Ocorrência B',
      scenario:'Cliquei em Próxima página na conferência do estoque. Continuo vendo BOL-101 e BOL-102.',
      network:capture(path + '?pagina=2&tamanho=2',pageBody(2,2,firstPage)),
      hints:[
        'Compare a URL capturada na aba Rede com os itens que chegaram na resposta.',
        'Se o GET direto repete os itens com pagina=2, investigue o recorte da consulta ordenada no EF Core.',
        'Calcule quantos registros pertencem às páginas anteriores com (pagina - 1) * tamanho. Aplique Skip antes de Take.'
      ],
      diagnosis:{
        choices:[
          {label:'O Angular perdeu o parâmetro pagina ao montar a URL.',feedback:'A captura da tela já contém pagina=2. Confirme no Cliente HTTP se a resposta também repete as linhas.'},
          {label:'A consulta do EF Core ignora o deslocamento da página.',feedback:'A API recebe pagina=2 e responde com os itens da primeira página. O GET direto reproduz o mesmo defeito.'},
          {label:'A tela conserva os dados de uma resposta vazia.',feedback:'A resposta capturada contém BOL-101 e BOL-102. A repetição já aparece no corpo recebido.'}
        ],
        answer:1
      },
      patches:corrections.backend.map(({label,language,code}) => ({label,language,code}))
    }
  };

  function visibleCodes(items) {
    return items.length ? items.map(item => item.codigo).join(', ') : 'Lista vazia';
  }

  function check(name,expected,actual) {
    return {name,expected,actual,pass:expected === actual};
  }

  function checks(variant,patchIndex) {
    if (!Object.hasOwn(corrections,variant) || !Number.isInteger(patchIndex)) return [];
    const correction = corrections[variant][patchIndex];
    if (!correction) return [];
    const first = correction.apply(1,2);
    const second = correction.apply(2,2);
    const totals = [first.total,second.total].join(' / ');
    return [
      check('Página 1 na tela',visibleCodes(orderedPage(1,2)),visibleCodes(first.items)),
      check('Página 2 na tela',visibleCodes(orderedPage(2,2)),visibleCodes(second.items)),
      check('Total nas duas respostas',[stock.length,stock.length].join(' / '),totals)
    ];
  }

  const reviewDiff = {
    language:'diff',
    code:[
      '--- oficina-full.component.ts',
      '+++ oficina-full.component.ts',
      '@@ carregarEstoque(pagina: number) @@',
      '-    this.estoque.set(resultado);',
      '+    if (resultado.items.length > 0) {',
      '+      this.estoque.set(resultado);',
      '+    }'
    ].join('\n')
  };
  const reviewOptions = [
    {label:'Avançar da página 1 para a 2',pages:[1,2],feedback:'As duas respostas contêm itens. O PR atualiza a tela nos dois passos e o teste passa.'},
    {label:'Consultar a página 3 após carregar a página 2',pages:[2,3],feedback:'A resposta da página 3 contém items: []. A condição do PR impede a atualização e a tela conserva BOL-103 da página 2.'},
    {label:'Voltar da página 2 para a 1',pages:[2,1],feedback:'A página 1 contém itens, então o PR atualiza a tela. Procure uma resposta que tome o outro caminho da condição.'}
  ];

  function reviewChecks(testIndex) {
    if (!Number.isInteger(testIndex) || !reviewOptions[testIndex]) return [];
    let visible = [];
    return reviewOptions[testIndex].pages.map(page => {
      const {items} = pageBody(page,2);
      if (items.length > 0) visible = items;
      return check('Página ' + page + ' na tela',visibleCodes(items),visibleCodes(visible));
    });
  }

  const reviewQuestion = {
    prompt:'Um novo estoque tem sete registros. A tela envia pagina=3&tamanho=3 e a resposta confirma pagina=3. Mesmo assim, ela repete BOL-214, BOL-215 e BOL-216 da página anterior. Qual teste ajuda a localizar a falha?',
    choices:[
      'Conferir se o Angular troca tamanho para 7 ao clicar em Próxima página.',
      'Repetir o GET com pagina=3 e tamanho=3. Se os códigos se repetirem, verificar se a consulta pula seis registros.',
      'Conferir se o total da API passou de 7 para 3 depois do recorte.'
    ],
    answer:1,
    feedback:[
      'A captura já mostra o tamanho esperado. Reproduza a consulta diretamente para isolar a tela.',
      'O GET direto isola a API. A terceira página começa depois de seis registros e deve trazer apenas BOL-217.',
      'O total permanece 7. Compare o recorte da terceira página com o retorno observado.'
    ]
  };

  const probes = [1,2].map(page => ({id:String(page),label:`Página ${page}`,request:{method:'GET',path:`${path}?pagina=${page}&tamanho=2`}}));

  function observe(request,result) {
    if (request.method !== 'GET' || result.status !== 200) return null;
    const {pagina,tamanho,items} = result.body;
    if (tamanho !== 2 || ![1,2].includes(pagina)) return null;
    return {id:String(pagina),summary:visibleCodes(items)};
  }

  window.sprintIncidentCases = {
    estoque:{
      title:'A segunda página do estoque repete a primeira',area:'Estoque',minutes:'15–20',mission:'HFS-205',
      description:'Separe um parâmetro que a interface deixou de enviar de um recorte aplicado incorretamente na API.',
      investigation:'O estoque tem três componentes fictícios. A página 1 deveria mostrar dois, e a página 2 deveria mostrar o último. Compare a captura da aba Rede com as duas respostas da API.',
      reviewIntro:'Um colega preparou outra versão da mudança. Ela funciona com resultados nas páginas 1 e 2. Se o estoque mudar entre consultas, a API pode devolver uma página vazia. Leia o diff e escolha como testar o componente.',
      regressionSummary:'A regressão da página vazia ficou registrada na revisão do PR.',
      probes,observe,variants,respond,checks,reviewDiff,reviewOptions,reviewChecks,reviewQuestion
    }
  };
})();
