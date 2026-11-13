'use strict';

const httpLessons = [
  {id:'listar',title:'Filtrar a lista',goal:'Use GET e adicione status=pendente em Parâmetros. Confira o 200 e os itens da resposta.',method:'GET',path:'/api/pedidos'},
  {id:'criar',title:'Criar um pedido',goal:'Corrija o CEP no corpo JSON para ter oito dígitos. Envie o POST e procure o status 201 e o cabeçalho Location.',method:'POST',path:'/api/pedidos',body:{cliente:'Marina',cep:'01001',valorCentavos:15990}},
  {id:'validar',title:'Investigar um 422',goal:'Envie um CEP inválido e descubra em qual campo a API explica a falha. Um 422 traz o mapa de erros.',method:'POST',path:'/api/pedidos',body:{cliente:'Marina',cep:'01001000',valorCentavos:15990}},
  {id:'etag',title:'Atualizar com ETag',goal:'Busque o pedido 101. Na resposta, leia o ETag. Prepare o PATCH e preencha If-Match com o valor, incluindo as aspas.',method:'GET',path:'/api/pedidos/101'},
  {id:'conflito',title:'Reproduzir um conflito',goal:'Simule uma alteração concorrente e envie o PATCH com o ETag anterior. Compare o 412 com o que ocorreu no exercício de atualização.',method:'GET',path:'/api/pedidos/102'}
];
const httpById = Object.fromEntries(httpLessons.map(item => [item.id,item]));
const httpProfiles = {
  pedidos:{name:'Portal de Pedidos',route:'#cliente-http',storage:'http',engine:window.sprintHttp,lessons:httpLessons,byId:httpById,path:'/api/pedidos',port:'5075'},
  hemoterapia:{name:'Hemoterapia',route:'#cliente-hemoterapia',storage:'hemoHttp',engine:window.hemoHttp,lessons:hemoHttpLessons,byId:hemoHttpById,path:'/api/hemoterapia/componentes',port:'5085'},
  plantao:{name:'Plantão de incidentes',byId:{}}
};
const httpRequestTabs = [['params','Parâmetros'],['headers','Cabeçalhos'],['body','Corpo JSON']];
const httpResponseTabs = [['body','Corpo'],['headers','Cabeçalhos']];
const httpView = {profile:'pedidos',key:null,requestTab:'params',responseTab:'body',draft:null,response:null,message:'',observed:null,stale:null};

function httpState(profile = httpView.profile) {
  if (profile === 'plantao') {
    const investigations = state.plantaoHttp ??= {};
    return investigations[httpView.key] ??= {history:[]};
  }
  const config = httpProfiles[profile];
  return state[config.storage] ??= {database:config.engine.freshState(),completed:{},history:[]};
}

function httpStats(profile = 'pedidos') {
  const completed = httpProfiles[profile].lessons.filter(item => httpState(profile).completed[item.id]).length;
  return {completed,xp:completed * 15};
}

function httpDraft(template) {
  const body = template?.body ? stackJson(template.body) : '';
  const path = template?.path ?? httpProfiles[httpView.profile].path;
  const headers = template?.headers?.map(header => ({...header})) ?? [];
  if (body && !httpHeader(headers,'Content-Type')) headers.push({name:'Content-Type',value:'application/json'});
  return {method:template?.method ?? 'GET',path,params:httpParams(path),headers,body};
}

function httpSelect(key,profile = httpView.profile) {
  if (httpView.key === key && httpView.profile === profile) return;
  httpView.profile = profile;
  const config = httpProfiles[profile];
  const lesson = profile === 'plantao' ? incidentByVariant.get(key).exercise.probes[0].request : config.byId[key];
  Object.assign(httpView,{key,draft:httpDraft(lesson),requestTab:lesson?.body ? 'body' : lesson?.headers?.length ? 'headers' : 'params',
    responseTab:'body',response:null,message:'',observed:null,stale:null});
}

function httpPage(key,profile = 'pedidos') {
  httpSelect(key,profile);
  const config = httpProfiles[profile];
  const lesson = config.byId[key];
  const hemo = profile === 'hemoterapia';
  const plantao = profile === 'plantao';
  const context = plantao ? incidentByVariant.get(key) : null;
  const evidence = plantao ? incidentState().runs[key]?.http : null;
  const intro = plantao ? 'Compare as respostas da API com a captura da interface.'
    : hemo ? 'Pratique estoque, rastreabilidade e ocorrências internas com dados fictícios.'
    : 'Monte uma requisição e inspecione a resposta, como faria no Postman.';
  const feedback = httpView.message ? `<p class="note" id="http-lesson-feedback" tabindex="-1" role="status">${escape(httpView.message)}</p>` : '';
  const {draft,response} = httpView;
  return `${plantao ? `<a class="route-back" href="#plantao/${key}">${icon('back')} Voltar à investigação</a>` : ''}
    <div class="page-heading"><p class="kicker">API simulada · ${config.name}</p><h1>Cliente HTTP</h1><p>${intro} O envio roda neste navegador.</p></div>
    <div class="http-layout">
      <aside class="stack">
        ${plantao ? `<section class="panel workspace-panel http-guide">
          <h3 class="panel-title">${icon('book')} ${escape(context.variant.label)}</h3>
          <p><strong>${escape(context.exercise.title)}</strong></p><p>${escape(context.exercise.investigation)}</p>
        </section>` : `
        <section class="panel workspace-panel http-collection">
          <h2>Coleção de exercícios</h2><p class="note">${httpStats(profile).completed} de ${config.lessons.length} validados</p>
          <nav aria-label="Exercícios de requisições" class="http-lessons">${config.lessons.map(item => {
            const complete = httpState().completed[item.id];
            return `<a href="${config.route}/${item.id}"${key === item.id ? ' aria-current="page"' : ''}>${icon(complete ? 'check' : 'terminal')}${item.title}${complete ? '<span class="sr-only">, concluído</span>' : ''}</a>`;
          }).join('')}<a href="${config.route}/livre"${key === 'livre' ? ' aria-current="page"' : ''}>${icon('play')} Exploração livre</a></nav>
        </section>
        <section class="panel workspace-panel http-guide">
          <h3 class="panel-title">${icon('book')} Como ler uma requisição</h3>
          <details class="support-details"><summary>Método e caminho</summary><p>GET consulta dados. ${hemo ? 'POST registra um rascunho interno de ocorrência.' : 'POST cria um pedido e PATCH altera parte de um recurso.'} O caminho identifica a coleção ou o recurso.</p></details>
          <details class="support-details"><summary>Parâmetros, cabeçalhos e JSON</summary><p>Parâmetros refinam a consulta. Cabeçalhos trazem metadados, como Content-Type e If-Match. O corpo JSON contém os dados da alteração.</p></details>
          <details class="support-details"><summary>Status da resposta</summary><p>Leia o status antes do corpo. 201 indica criação, 422 aponta validação e ${hemo ? '404 informa que o recurso não foi localizado.' : '412 indica que a precondição falhou.'}</p></details>
          <details class="support-details"><summary>Repetir no Postman</summary><p>Inicie a API do ZIP em modo referência e use ${hemo ? 'os exemplos em hemoterapia/api' : 'a coleção do Portal de Pedidos'}. Ao montar a URL no Postman, coloque <code>http://127.0.0.1:${config.port}</code> antes do caminho. Params, Headers e Body correspondem às abas deste cliente.</p></details>
          <div class="support-details">${link('https://learning.postman.com/docs/use/send-requests/requests/','Documentação do Postman')}</div>
        </section>`}
      </aside>
      <div class="stack http-main">
        ${plantao ? `<section class="panel workspace-panel http-challenge">
          <h2>Registre as evidências</h2><p>Prepare cada requisição, confira seus dados e envie para registrar a resposta no chamado.</p>
          <div class="actions">${context.exercise.probes.map((probe,index) => `<button class="button secondary" type="button" data-http-action="incident-probe" data-probe-index="${index}">${escape(probe.label)}${evidence && Object.hasOwn(evidence,probe.id) ? `${icon('check')}<span class="sr-only"> · evidência registrada</span>` : ''}</button>`).join('')}</div>
          ${feedback}
        </section>` : lesson ? `<section class="panel workspace-panel http-challenge">
          <h2>${lesson.title}</h2><p>${lesson.goal}</p>
          <div class="actions">
            ${key === 'etag' && httpView.observed ? '<button class="button secondary" type="button" data-http-action="patch">Preparar PATCH</button>' : ''}
            ${key === 'conflito' ? '<button class="button secondary" type="button" data-http-action="conflict">Simular alteração concorrente</button>' : ''}
            <button class="button quiet" type="button" data-http-action="reset-request">Restaurar requisição inicial</button>
          </div>
          ${feedback}
          ${httpState().completed[key] ? `<div class="http-completed">${icon('check')} Exercício validado · +15 XP${httpNextLink(key)}</div>` : ''}
        </section>` : ''}
        <div class="http-workbench">
          <section class="panel workspace-panel http-request">
            <h2>Requisição</h2>
            <form id="http-form">
              <div class="http-address">
                <label class="filter-field">Método<select id="http-method">${selectOptions(['GET','POST','PATCH','PUT','DELETE','OPTIONS'].map(method => [method,method]),draft.method)}</select></label>
                <label class="filter-field">Caminho<input id="http-path" type="text" maxlength="1000" value="${escape(draft.path)}" spellcheck="false" autocomplete="off" placeholder="${escape(context?.exercise.probes[0].request.path ?? config.path)}"></label>
                <button class="button" type="submit">${icon('play')} Enviar</button>
              </div>
              ${httpTabs('request',httpRequestTabs,httpView.requestTab)}
              <div id="http-request-content">${httpRequestContent()}</div>
            </form>
          </section>
          <section class="panel workspace-panel http-response">
            <div class="http-response-title"><h2>Resposta</h2>${response ? `<span id="http-status" tabindex="-1" class="http-status ${response.status < 400 ? 'ok' : 'error'}">${response.status} ${escape(response.reason)}</span>` : ''}</div>
            ${response ? `${httpTabs('response',httpResponseTabs,httpView.responseTab)}${httpResponseContent(response)}`
              : '<p class="note">Envie uma requisição para ver o status, os cabeçalhos e o corpo.</p>'}
          </section>
        </div>
        ${httpHistory()}
      </div>
    </div>`;
}

function httpNextLink(key) {
  const {lessons,route} = httpProfiles[httpView.profile];
  const next = lessons[lessons.findIndex(item => item.id === key) + 1];
  return next ? `<a href="${route}/${next.id}">Próximo exercício ${icon('arrow')}</a>` : `<a href="${route}/livre">Explorar a API</a>`;
}

function httpTabs(side,tabs,selected) {
  return `<div class="http-tabs" role="group" aria-label="${side === 'request' ? 'Partes da requisição' : 'Partes da resposta'}">${tabs.map(([value,label]) =>
    `<button type="button" data-http-action="${side}-tab" data-tab="${value}" aria-pressed="${selected === value}">${label}</button>`
  ).join('')}</div>`;
}

function httpRequestContent() {
  const {draft,requestTab} = httpView;
  if (requestTab === 'body') return `<label class="editor-label" for="http-body"><span>Corpo da requisição</span><span>JSON</span></label>
    <textarea class="editor request-editor" id="http-body" data-language="json" maxlength="8000" spellcheck="false" autocomplete="off">${escape(draft.body)}</textarea>
    <p class="note">Em POST e PATCH, adicione Content-Type: application/json na aba Cabeçalhos.</p>`;
  const rows = draft[requestTab];
  const parameters = requestTab === 'params';
  return `<div class="http-pairs">
    ${rows.map(({name,value},index) => `<div class="http-pair">
      <label class="filter-field"><span class="sr-only">${parameters ? 'Nome do parâmetro' : 'Nome do cabeçalho'} ${index + 1}</span><input type="text" maxlength="100" data-http-field="name" data-row="${index}" value="${escape(name)}" placeholder="${parameters ? 'status' : 'Content-Type'}" spellcheck="false" autocomplete="off"></label>
      <label class="filter-field"><span class="sr-only">Valor ${index + 1}</span><input type="text" maxlength="500" data-http-field="value" data-row="${index}" value="${escape(value)}" placeholder="${parameters ? 'pendente' : 'application/json'}" spellcheck="false" autocomplete="off"></label>
      <button class="button secondary http-remove" type="button" data-http-action="remove-row" data-row="${index}" aria-label="Remover linha ${index + 1}">${icon('close')}</button>
    </div>`).join('')}
    <div class="actions"><button type="button" class="button secondary" data-http-action="add-row">${parameters ? 'Adicionar parâmetro' : 'Adicionar cabeçalho'}</button></div>
  </div>`;
}

function httpResponseContent(response) {
  if (httpView.responseTab === 'headers') return `<dl class="http-response-headers">${response.headers.map(({name,value}) => `<div><dt>${escape(name)}</dt><dd><code>${escape(value)}</code></dd></div>`).join('')}</dl>`;
  return response.body === null ? '<p class="note">Resposta sem corpo.</p>' : codeBlock(stackJson(response.body),'json','http-response-code');
}

function httpHistory() {
  const {history} = httpState();
  const plantao = httpView.profile === 'plantao';
  return `<section class="panel workspace-panel">
    <div class="http-response-title"><h3>${plantao ? 'Histórico desta investigação' : 'Histórico local'}</h3>${plantao ? '' : '<button class="button quiet" type="button" data-http-action="reset-data">Reiniciar dados da API</button>'}</div>
    ${history.length ? `<ol class="http-history">${history.map(item => `<li><strong>${escape(item.method)}</strong><code>${escape(item.path)}</code><span>${item.status}</span></li>`).join('')}</ol>`
      : '<p class="note">As últimas requisições aparecem aqui.</p>'}
  </section>`;
}

function httpHeader(headers,name) {
  return headers.find(item => item.name.trim().toLowerCase() === name.toLowerCase())?.value.trim();
}

function httpParams(path) {
  const separator = path.indexOf('?');
  return separator < 0 ? [] : [...new URLSearchParams(path.slice(separator + 1))].map(([name,value]) => ({name,value}));
}

function httpPathFromParams() {
  const {draft} = httpView;
  const query = new URLSearchParams(draft.params.filter(row => row.name.trim()).map(row => [row.name.trim(),row.value])).toString();
  draft.path = draft.path.split('?')[0] + (query ? '?' + query : '');
  const input = root.querySelector('#http-path');
  if (input) input.value = draft.path;
}

function httpAssess(request,response) {
  const url = new URL(request.path,'https://sprint-web.invalid');
  const {key,profile} = httpView;
  if (profile === 'hemoterapia') {
    switch (key) {
      case 'estoque':
        return request.method === 'GET' && url.pathname === '/api/hemoterapia/componentes' &&
          url.searchParams.get('status') === 'disponivel' && response.status === 200 && response.body.items.every(item => item.status === 'disponivel');
      case 'rastrear':
        return request.method === 'GET' && response.status === 200 && response.body.codigo === 'BOL-101' &&
          response.body.linhaDoTempo?.length > 0 && Boolean(httpHeader(response.headers,'ETag'));
      case 'ocorrencia':
        return request.method === 'POST' && response.status === 201 && response.body.status === 'rascunho' && Boolean(httpHeader(response.headers,'Location'));
      case 'validar':
        return request.method === 'POST' && response.status === 422 && Boolean(response.body.errors?.codigoComponente?.length);
      default: return false;
    }
  }
  switch (key) {
    case 'listar':
      return request.method === 'GET' && url.pathname === '/api/pedidos' && url.searchParams.get('status') === 'pendente' &&
        response.status === 200 && response.body.items.every(item => item.status === 'pendente');
    case 'criar':
      return request.method === 'POST' && url.pathname === '/api/pedidos' && response.status === 201 && Boolean(httpHeader(response.headers,'location'));
    case 'validar':
      return request.method === 'POST' && url.pathname === '/api/pedidos' && response.status === 422 && Boolean(response.body?.errors?.cep?.length);
    case 'etag':
      return request.method === 'PATCH' && url.pathname === '/api/pedidos/101/status' && response.status === 200 &&
        httpHeader(request.headers,'If-Match') === httpView.observed;
    case 'conflito':
      return request.method === 'PATCH' && url.pathname === '/api/pedidos/102/status' && response.status === 412 &&
        httpHeader(request.headers,'If-Match') === httpView.stale;
    default: return false;
  }
}

function httpSend() {
  const data = httpState();
  const {draft,key,profile} = httpView;
  const config = httpProfiles[profile];
  const request = {method:draft.method,path:draft.path.trim(),headers:draft.headers.filter(row => row.name.trim()),body:draft.body};
  const plantao = profile === 'plantao';
  const response = plantao ? incidentByVariant.get(key).exercise.respond(key,request) : config.engine.send(data.database,request);
  httpView.response = response;
  httpView.responseTab = 'body';
  httpView.message = '';
  const etag = httpHeader(response.headers,'ETag');
  if (plantao) {
    const captured = incidentObserveHttp(key,request,response);
    httpView.message = captured ? 'Resposta registrada como evidência para o plantão.'
      : 'Use as requisições listadas no chamado para registrar a comparação.';
  } else if (key === 'etag' && response.status === 200 && request.method === 'GET' && response.body?.id === 101 && etag) {
    httpView.observed = etag;
    httpView.responseTab = 'headers';
    httpView.message = 'ETag encontrado. Prepare o PATCH e copie esse valor em If-Match.';
  } else if (config.byId[key]) {
    let valid = false;
    try { valid = httpAssess(request,response); } catch { /* A rota inválida já aparece na resposta. */ }
    if (valid) {
      if (!data.completed[key]) announce('Exercício HTTP validado. Mais 15 XP.');
      data.completed[key] = true;
      httpView.message = 'O resultado atende ao objetivo do exercício.';
      if (key === 'criar' || key === 'ocorrencia') httpView.responseTab = 'headers';
    } else {
      httpView.message = 'Compare o status e o corpo recebidos com o objetivo do exercício.';
    }
  }
  data.history.unshift({method:request.method,path:request.path.slice(0,240),status:response.status});
  data.history.length = Math.min(data.history.length,8);
  save();
  render({focus:'#http-status'});
}

function httpPreparePatch(id,tag,status) {
  httpView.draft = httpDraft({method:'PATCH',path:`/api/pedidos/${id}/status`,body:{status}});
  httpView.draft.headers.push({name:'If-Match',value:tag});
  httpView.requestTab = 'headers';
}

function httpSimulateConflict() {
  const {database} = httpState();
  const detail = window.sprintHttp.send(database,{method:'GET',path:'/api/pedidos/102',headers:[],body:''});
  const etag = httpHeader(detail.headers,'ETag');
  if (!etag || detail.status !== 200) return;
  const status = detail.body.status === 'cancelado' ? 'pendente' : 'cancelado';
  const changed = window.sprintHttp.send(database,{method:'PATCH',path:'/api/pedidos/102/status',
    headers:[{name:'Content-Type',value:'application/json'},{name:'If-Match',value:etag}],body:JSON.stringify({status})});
  if (changed.status !== 200) return;
  httpView.stale = etag;
  httpView.response = null;
  httpPreparePatch(102,etag,'enviado');
  httpView.message = `Outro usuário atualizou o pedido. A API agora devolve ETag ${httpHeader(changed.headers,'ETag')}. Seu PATCH ainda carrega o valor anterior. Envie para ver o resultado.`;
  save();
  render({focus:'#http-lesson-feedback'});
}

function bindHttpEvents() {
  root.addEventListener('submit',event => {
    if (event.target.id !== 'http-form') return;
    event.preventDefault();
    httpSend();
  });
  root.addEventListener('input',event => {
    if (!['cliente-http','cliente-hemoterapia','cliente-plantao'].includes(activeRoute.page)) return;
    const field = event.target;
    const {draft,requestTab} = httpView;
    if (field.id === 'http-path') {
      draft.path = field.value;
      draft.params = httpParams(draft.path);
      if (requestTab === 'params') root.querySelector('#http-request-content').innerHTML = httpRequestContent();
    } else if (field.id === 'http-body') draft.body = field.value;
    else if (field.dataset.httpField) {
      draft[requestTab][Number(field.dataset.row)][field.dataset.httpField] = field.value;
      if (requestTab === 'params') httpPathFromParams();
    }
  });
  root.addEventListener('change',event => {
    if (event.target.id === 'http-method') httpView.draft.method = event.target.value;
  });
  root.addEventListener('click',event => {
    const button = event.target.closest('[data-http-action]');
    if (!button) return;
    const {key,draft,requestTab} = httpView;
    switch (button.dataset.httpAction) {
      case 'incident-probe': {
        const probe = incidentByVariant.get(key)?.exercise.probes[Number(button.dataset.probeIndex)];
        if (httpView.profile !== 'plantao' || !probe) return;
        const template = probe.request;
        Object.assign(httpView,{draft:httpDraft(template),requestTab:template.body ? 'body' : template.headers?.length ? 'headers' : 'params',response:null,message:''});
        render({focus:'#http-path'});
        break;
      }
      case 'request-tab':
        httpView.requestTab = button.dataset.tab;
        render({focus:`[data-http-action="request-tab"][data-tab="${button.dataset.tab}"]`});
        break;
      case 'response-tab':
        httpView.responseTab = button.dataset.tab;
        render({focus:`[data-http-action="response-tab"][data-tab="${button.dataset.tab}"]`});
        break;
      case 'add-row': {
        const rows = draft[requestTab];
        rows.push({name:'',value:''});
        render({focus:`[data-http-field="name"][data-row="${rows.length - 1}"]`});
        break;
      }
      case 'remove-row':
        draft[requestTab].splice(Number(button.dataset.row),1);
        if (requestTab === 'params') httpPathFromParams();
        render({focus:'[data-http-action="add-row"]'});
        break;
      case 'reset-request':
        httpView.key = null;
        httpSelect(key);
        render({focus:'#http-path'});
        break;
      case 'patch':
        if (!httpView.observed) return;
        httpPreparePatch(101,'','enviado');
        httpView.message = 'Use o ETag exibido na resposta como valor de If-Match.';
        render({focus:'[data-http-field="value"][data-row="1"]'});
        break;
      case 'conflict': httpSimulateConflict(); break;
      case 'reset-data':
        if (!window.confirm('Repor os pedidos de exemplo e limpar o histórico do Cliente HTTP?')) return;
        Object.assign(httpState(),{database:httpProfiles[httpView.profile].engine.freshState(),history:[]});
        httpView.key = null;
        httpSelect(key);
        save();
        render({focus:'#http-path'});
        break;
    }
  });
}
