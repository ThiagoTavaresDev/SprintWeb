'use strict';

(() => {
  const root = '/api/hemoterapia';
  const components = [
    {codigo:'BOL-101',tipo:'CH',status:'disponivel',versao:1,linhaDoTempo:[
      {tipo:'registrado',instante:'2026-10-01T09:00:00Z',unidade:'U-A'},
      {tipo:'recebido',instante:'2026-10-01T11:00:00Z',unidade:'U-B'}
    ]},
    {codigo:'BOL-102',tipo:'PL',status:'quarentena',versao:1,linhaDoTempo:[{tipo:'registrado',instante:'2026-10-01T10:00:00Z',unidade:'U-A'}]},
    {codigo:'BOL-103',tipo:'CP',status:'disponivel',versao:1,linhaDoTempo:[{tipo:'registrado',instante:'2026-10-01T12:00:00Z',unidade:'U-A'}]}
  ];
  const reasons = {200:'OK',201:'Created',400:'Bad Request',404:'Not Found',405:'Method Not Allowed',415:'Unsupported Media Type',422:'Unprocessable Content'};

  function response(status,body,headers = []) {
    return {status,reason:reasons[status],headers:[{name:'Content-Type',value:status < 400 ? 'application/json' : 'application/problem+json'},...headers],body};
  }

  function problem(status,detail,headers) {
    return response(status,{status,title:reasons[status],detail},headers);
  }

  function methodNotAllowed(allow) {
    return problem(405,'Confira os métodos aceitos nesta rota.',[{name:'Allow',value:allow}]);
  }

  function create(data,request) {
    const contentType = request.headers.find(item => item.name.trim().toLowerCase() === 'content-type')?.value;
    if (contentType?.split(';',1)[0].trim().toLowerCase() !== 'application/json') return problem(415,'Use Content-Type: application/json.');
    let input;
    try { input = JSON.parse(request.body); } catch { return problem(400,'O corpo deve conter um objeto JSON válido.'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return problem(400,'Envie um objeto JSON.');
    const codigoComponente = typeof input.codigoComponente === 'string' ? input.codigoComponente.trim() : '';
    const descricao = typeof input.descricao === 'string' ? input.descricao.trim() : '';
    const errors = {};
    if (!components.some(item => item.codigo === codigoComponente)) errors.codigoComponente = ['Selecione um código do estoque.'];
    if (!descricao || descricao.length > 240) errors.descricao = ['Descreva a ocorrência em até 240 caracteres.'];
    if (Object.keys(errors).length) return response(422,{status:422,title:'Revise os campos da ocorrência',errors});
    const item = {id:data.nextId,codigoComponente,descricao,status:'rascunho'};
    data.nextId += 1;
    data.occurrences.push(item);
    return response(201,{...item},[{name:'Location',value:root + '/ocorrencias/' + item.id}]);
  }

  function send(data,request) {
    const path = request.path;
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || /[\\\s#]/.test(path)) {
      return problem(400,'Use um caminho relativo da API simulada.');
    }
    const url = new URL(path,'https://sprint-web.invalid');
    const route = url.pathname.replace(/\/$/,'');
    if (route === root + '/componentes') {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      const values = url.searchParams.getAll('status');
      const status = values[0];
      if (values.length > 1 || status !== undefined && !['disponivel','quarentena'].includes(status)) {
        return problem(400,'Use disponivel ou quarentena.');
      }
      const items = components.filter(item => status === undefined || item.status === status).map(({codigo,tipo,status,versao}) => ({codigo,tipo,status,versao}));
      return response(200,{items,total:items.length});
    }
    if (route.startsWith(root + '/componentes/')) {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      const item = components.find(component => root + '/componentes/' + component.codigo === route);
      return item ? response(200,structuredClone(item),[{name:'ETag',value:'"' + item.versao + '"'}]) : problem(404,'Hemocomponente não localizado.');
    }
    if (route === root + '/ocorrencias') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return create(data,request);
    }
    if (route.startsWith(root + '/ocorrencias/')) {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      const item = data.occurrences.find(occurrence => root + '/ocorrencias/' + occurrence.id === route);
      return item ? response(200,{...item}) : problem(404,'Rascunho não localizado.');
    }
    return problem(404,'Rota fora da API simulada de hemoterapia.');
  }

  window.hemoHttp = {freshState:() => ({occurrences:[],nextId:1}),send};
})();

const hemoHttpLessons = [
  {id:'estoque',title:'Consultar o estoque',goal:'Adicione status=disponivel nos parâmetros de GET. Confira total e items no corpo da resposta. O estado do estoque neste cenário é operacional.',method:'GET',path:'/api/hemoterapia/componentes'},
  {id:'rastrear',title:'Rastrear uma unidade',goal:'Envie o GET inicial para observar o 404. Troque BOL-999 por BOL-101 e confira a linha do tempo e o ETag nos cabeçalhos.',method:'GET',path:'/api/hemoterapia/componentes/BOL-999'},
  {id:'ocorrencia',title:'Criar rascunho de ocorrência',goal:'Preencha a descrição com dados fictícios e envie o POST. Em 201, use Location para localizar o rascunho criado com um GET em Exploração livre.',method:'POST',path:'/api/hemoterapia/ocorrencias',body:{codigoComponente:'BOL-101',descricao:''}},
  {id:'validar',title:'Investigar um 422',goal:'Envie um código de componente que não existe e veja a chave codigoComponente no mapa errors. A API deve recusar a criação.',method:'POST',path:'/api/hemoterapia/ocorrencias',body:{codigoComponente:'BOL-999',descricao:'Teste fictício de integração'}}
];
const hemoHttpById = Object.fromEntries(hemoHttpLessons.map(item => [item.id,item]));
