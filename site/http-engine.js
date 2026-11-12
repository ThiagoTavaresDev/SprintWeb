(() => {
  'use strict';

  const origin = 'https://sprint-web.test';
  const orderPath = '/api/pedidos';
  const statuses = new Set(['pendente', 'enviado', 'cancelado']);
  const maxInt32 = 2147483647;
  const reasons = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    404: 'Not Found',
    405: 'Method Not Allowed',
    412: 'Precondition Failed',
    413: 'Content Too Large',
    415: 'Unsupported Media Type',
    422: 'Unprocessable Content',
    428: 'Precondition Required',
    500: 'Internal Server Error'
  };

  function freshState() {
    return {
      orders: [
        {id:101, cliente:'Ana', cep:'01001000', status:'pendente', valorCentavos:12500, versao:1},
        {id:102, cliente:'Bruno', cep:'20040002', status:'enviado', valorCentavos:7990, versao:1},
        {id:103, cliente:'Carla', cep:'30130010', status:'pendente', valorCentavos:21900, versao:1}
      ],
      nextId:104
    };
  }

  function response(status, body, headers = []) {
    const mediaType = status < 400 ? 'application/json' : 'application/problem+json';
    return {
      status, reason:reasons[status],
      headers:[{name:'Content-Type', value:mediaType}, ...headers],
      body
    };
  }

  function problem(status, detail, {errors, headers} = {}) {
    const body = {type:'about:blank', title:reasons[status], status, detail};
    if (errors) body.errors = errors;
    return response(status, body, headers);
  }

  function parsePath(value) {
    const path = typeof value === 'string' ? value.trim() : '';
    if (!path.startsWith('/') || path.startsWith('//') || /[\\#\u0000-\u001f]/u.test(path)) return null;
    try {
      const url = new URL(path, origin);
      return url.origin === origin ? url : null;
    } catch {
      return null;
    }
  }

  function collectHeaders(entries) {
    const result = new Map();
    if (!Array.isArray(entries)) return result;
    for (const entry of entries) {
      const name = String(entry?.name ?? '').trim().toLowerCase();
      const value = String(entry?.value ?? '').trim();
      if (!name) continue;
      result.set(name, result.has(name) ? result.get(name) + ', ' + value : value);
    }
    return result;
  }

  function positiveInteger(value, max) {
    if (!/^[1-9][0-9]*$/u.test(value)) return null;
    const number = Number(value);
    return number <= max ? number : null;
  }

  function listOrders(state, url) {
    const params = url.searchParams;
    if (['status','pagina','limite'].some(name => params.getAll(name).length > 1)) {
      return problem(400,'Envie apenas um valor para cada parâmetro de consulta.');
    }
    const status = params.get('status');
    const pagina = positiveInteger(params.get('pagina') ?? '1',10000);
    const limite = positiveInteger(params.get('limite') ?? '10',100);
    if (status !== null && !statuses.has(status)) {
      return problem(400,'O status deve ser pendente, enviado ou cancelado.');
    }
    if (pagina === null || limite === null) {
      return problem(400,'Use pagina entre 1 e 10000 e limite entre 1 e 100.');
    }

    const matching = state.orders.filter(order => status === null || order.status === status);
    matching.sort((left,right) => left.id - right.id);
    const offset = (pagina - 1) * limite;
    const items = matching.slice(offset,offset + limite).map(order => ({...order}));
    return response(200,{items,pagina,limite,total:matching.length});
  }

  function entityTag(version) {
    return {name:'ETag', value:'"' + version + '"'};
  }

  function getOrder(order) {
    return response(200,{...order},[entityTag(order.versao)]);
  }

  function readJson(headers, body) {
    const contentType = headers.get('content-type') ?? '';
    const mediaType = contentType.split(';',1)[0].trim().toLowerCase();
    if (mediaType !== 'application/json') {
      return {error:problem(415,'Defina Content-Type como application/json.')};
    }
    if (typeof body !== 'string') {
      return {error:problem(400,'O corpo deve ser um objeto JSON.')};
    }
    if (body.length > 16384) {
      return {error:problem(413,'O corpo da requisição ultrapassa o limite deste laboratório.')};
    }
    try {
      const data = JSON.parse(body);
      if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        return {error:problem(400,'O corpo deve ser um objeto JSON.')};
      }
      return {data};
    } catch {
      return {error:problem(400,'Revise a sintaxe JSON do corpo da requisição.')};
    }
  }

  function createOrder(state, input) {
    const cliente = typeof input.cliente === 'string' ? input.cliente.trim() : '';
    const {cep,valorCentavos} = input;
    const errors = {};
    if (!cliente || cliente.length > 120) errors.cliente = ['Informe um nome com 1 a 120 caracteres.'];
    if (typeof cep !== 'string' || !/^[0-9]{8}$/u.test(cep)) errors.cep = ['Informe o CEP como texto com oito dígitos.'];
    if (!Number.isInteger(valorCentavos) || valorCentavos < 1 || valorCentavos > maxInt32) {
      errors.valorCentavos = ['Informe um inteiro positivo em centavos, até 2147483647.'];
    }
    if (Object.keys(errors).length) {
      return problem(422,'Corrija os campos indicados em errors.',{errors});
    }
    if (!Number.isInteger(state.nextId) || state.nextId < 1 || state.nextId > maxInt32) {
      return problem(500,'A base simulada atingiu o limite de pedidos. Reinicie a base para continuar.');
    }

    const id = state.nextId;
    const order = {id,cliente,cep,status:'pendente',valorCentavos,versao:1};
    state.orders.push(order);
    state.nextId += 1;
    return response(201,{...order},[{name:'Location',value:orderPath + '/' + id},entityTag(order.versao)]);
  }

  function updateStatus(order, headers, input) {
    const ifMatch = headers.get('if-match');
    if (!ifMatch) {
      return problem(428,'Consulte o pedido e copie o valor do ETag no cabeçalho If-Match.',{
        headers:[{name:'Cache-Control',value:'no-store'}]
      });
    }
    const match = /^"([1-9][0-9]*)"$/u.exec(ifMatch);
    if (!match || positiveInteger(match[1],maxInt32) === null) {
      return problem(400,'Use a versão como uma tag forte entre aspas, por exemplo "1".');
    }
    if (ifMatch !== entityTag(order.versao).value) {
      return problem(412,'A versão do pedido mudou. Consulte o pedido para obter o ETag atual.');
    }
    if (!statuses.has(input.status)) {
      return problem(422,'Corrija o status do pedido.',{
        errors:{status:['Use pendente, enviado ou cancelado.']}
      });
    }

    order.status = input.status;
    order.versao += 1;
    return getOrder(order);
  }

  function wrongMethod(allowed) {
    return problem(405,'Métodos disponíveis para esta rota: ' + allowed + '.',{
      headers:[{name:'Allow',value:allowed}]
    });
  }

  function send(state, request = {}) {
    if (!Array.isArray(state?.orders)) return problem(500,'Reinicie a base simulada para continuar.');
    const url = parsePath(request.path);
    if (!url) return problem(400,'Use um caminho relativo, por exemplo /api/pedidos.');

    const method = String(request.method ?? '').trim().toUpperCase();
    const path = url.pathname.endsWith('/') ? url.pathname.slice(0,-1) : url.pathname;
    if (path === orderPath) {
      if (method === 'GET') return listOrders(state,url);
      if (method !== 'POST') return wrongMethod('GET, POST');
      const json = readJson(collectHeaders(request.headers),request.body);
      return json.error ?? createOrder(state,json.data);
    }

    const match = /^\/api\/pedidos\/([1-9][0-9]*)(\/status)?$/u.exec(path);
    if (!match) return problem(404,'Esta rota não existe na API simulada.');
    const statusRoute = Boolean(match[2]);
    if (method !== (statusRoute ? 'PATCH' : 'GET')) return wrongMethod(statusRoute ? 'PATCH' : 'GET');
    const id = positiveInteger(match[1],maxInt32);
    if (statusRoute) {
      const headers = collectHeaders(request.headers);
      const json = readJson(headers,request.body);
      if (json.error) return json.error;
      const order = state.orders.find(item => item.id === id);
      return order ? updateStatus(order,headers,json.data) : problem(404,'Pedido não encontrado.');
    }
    const order = state.orders.find(item => item.id === id);
    return order ? getOrder(order) : problem(404,'Pedido não encontrado.');
  }

  window.sprintHttp = {freshState,send};
})();
