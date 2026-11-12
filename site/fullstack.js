'use strict';

const stackMissions = [...window.fullstackExisting,...window.fullstackProduct,...window.fullstackNew];
const stackById = Object.fromEntries(stackMissions.map(mission => [mission.id,mission]));
const stackBySource = new Map(stackMissions.filter(mission => mission.sourceId).map(mission => [mission.sourceId,mission]));
const stackSteps = [
  {label:'Chamado', icon:'jira', title:'Alinhe o chamado', description:'Converta o relato em critérios verificáveis e assuma o ticket no Jira.'},
  {label:'Backend', icon:'database', title:'Implemente o backend', description:'Valide a entrada, aplique a regra e devolva a resposta combinada.'},
  {label:'Frontend', icon:'layers', title:'Implemente o frontend', description:'Transforme a resposta HTTP em uma tela que orienta a pessoa.'},
  {label:'Integração', icon:'route', title:'Integre as duas camadas', description:'Envie uma requisição, confira a resposta e veja o que a interface recebe.'},
  {label:'Entrega', icon:'chat', title:'Entregue ao time', description:'Registre a validação no PR, responda no Slack e peça revisão no Jira.'}
];
const stackRewards = [15,30,30,35,30];
const stackLabRuns = new Map();
const stackIntegrationRuns = new Map();
const stackContexts = new Map();
const stackRunning = new Set();
const stackFilters = {query:'',group:'',level:'',status:''};

function stackState(mission) {
  const records = state.fullstack ??= {};
  return records[mission.id] ??= {
    done:[false,false,false,false,false],
    reviews:[false,false,false],
    code:{},
    verified:{},
    revision:0,
    checks:mission.integration.map(() => false),
    thread:[]
  };
}

function activityState(mission) {
  return Object.hasOwn(stackById,mission.id) ? stackState(mission) : missionState(mission.id);
}

function stackValidated(saved,index) {
  return index === 3 && !saved.done[4] ? saved.checks.every(Boolean) : saved.done[index];
}

function stackStats() {
  return stackMissions.reduce((total,mission) => {
    const saved = stackState(mission);
    const {done,reviews} = saved;
    total.completed += Number(done[4]);
    total.steps += done.filter((_,index) => stackValidated(saved,index)).length;
    total.xp += done.reduce((xp,complete,index) => xp + (complete ? stackRewards[index] : 0),0);
    total.xp += reviews.filter(Boolean).length * 10;
    return total;
  },{completed:0,steps:0,xp:0});
}

function stackNextStage(mission) {
  const {done,checks} = stackState(mission);
  const next = done.slice(0,3).indexOf(false);
  if (next !== -1) return next;
  return done[4] || checks.every(Boolean) ? 4 : 3;
}

function stackHref(mission,step = stackNextStage(mission)) {
  return `#pratica/${mission.id}/${step + 1}`;
}

function stackContinue(mission,step,label) {
  return `<a class="button" id="stack-continue" href="${stackHref(mission,step)}">${label} ${icon('arrow')}</a>`;
}

function stackCard(mission,next) {
  const saved = stackState(mission);
  const {done} = saved;
  const count = done.filter((_,index) => stackValidated(saved,index)).length;
  const badge = done[4] ? `<span class="mission-status done">${icon('check')} Concluída</span>`
    : count ? `<span class="mission-status next">${count}/5 etapas</span>`
    : mission === next ? '<span class="mission-status next">Próxima missão</span>' : '';
  return `<a class="mission-card ${mission === next ? 'is-next' : ''}" href="${stackHref(mission)}">
    <div class="mission-top">${tile(mission.icon,mission.theme)}<div class="mission-badges">${levelBadge(mission)}${badge}</div></div>
    <p class="kicker stack-card-kicker">${mission.id} · ${escape(mission.category)}</p>
    <h3>${escape(mission.title)}</h3><p>${escape(mission.description)}</p>
    <div class="mission-bottom"><span>${icon('clock')} ${mission.minutes} min</span><span>${mission.sourceId ? `A partir de ${mission.sourceId}` : 'Novo chamado'}</span>${icon('arrow')}</div>
  </a>`;
}

function recommendedStackMission() {
  return stackMissions.find(mission => stackState(mission).done[0] && !stackState(mission).done[4])
    ?? stackMissions.find(mission => !stackState(mission).done[4]);
}

function stackHome() {
  const stats = stackStats();
  const next = recommendedStackMission();
  const themes = [...new Set(stackMissions.map(mission => mission.category))].map(category => [category,category]);
  return `<section class="stack-intro" aria-labelledby="stack-title">
    <div class="stack-intro-copy">
      <div class="hero-label">${icon('layers')} Trilha Full Stack</div>
      <h1 id="stack-title">Do chamado à tela.</h1>
      <p>Implemente a regra na API, cuide dos estados no frontend e mostre ao time como você validou a entrega.</p>
      <a class="button" href="${next ? stackHref(next) : '#revisao'}">${next ? stackState(next).done[0] ? 'Continuar missão full stack' : 'Começar missão full stack' : 'Abrir revisões'} ${icon('arrow')}</a>
    </div>
    <ol class="stack-pipeline" aria-label="Fluxo de trabalho full stack">
      ${stackSteps.map((stage,index) => `<li><span>${icon(stage.icon)}</span><div><strong>${stage.label}</strong><small>${['Critérios no Jira','Requisição e regra','Resposta e tela','Cenários conectados','PR, Slack e revisão'][index]}</small></div></li>`).join('')}
    </ol>
  </section>
  <section class="section" aria-labelledby="stack-missions">
    <div class="section-heading"><div><h2 id="stack-missions">Missões de ponta a ponta</h2><p>${stats.completed} de ${stackMissions.length} missões concluídas · ${stats.steps} de ${stackMissions.length * 5} etapas validadas</p></div></div>
    ${catalogControls('stack',stackFilters,themes,{placeholder:'Ex.: pedidos, cupom ou FS-201',groupTitle:'Tema',allGroups:'Todos os temas'},stackMissions)}
    <div id="stack-results">${stackResults()}</div>
  </section>`;
}

function stackResults() {
  const next = recommendedStackMission();
  const filtered = matchingMissions(stackMissions,stackFilters,mission => mission.category,mission => {
    const {done} = stackState(mission);
    return done[4] ? 'done' : done[0] ? 'active' : 'new';
  });
  return `<p class="result-count" role="status">${filtered.length} ${filtered.length === 1 ? 'missão encontrada' : 'missões encontradas'}</p>
    ${filtered.length ? `<div class="card-grid">${filtered.map(mission => stackCard(mission,next)).join('')}</div>` : emptyCatalog('stack')}`;
}

function stackNavigation(mission,step) {
  const saved = stackState(mission);
  const available = stackNextStage(mission);
  return `<nav class="stage-nav stack-stage-nav" aria-label="Etapas full stack">${stackSteps.map(({label,icon:name},index) => {
    const tag = index <= available ? 'a' : 'span';
    const attributes = index <= available ? `href="${stackHref(mission,index)}"${index === step ? ' aria-current="step"' : ''}` : 'aria-disabled="true"';
    const validated = stackValidated(saved,index);
    return `<${tag} class="stage-link" ${attributes}><span class="stage-number ${validated ? 'done' : ''}">${icon(validated ? 'check' : name)}</span>${label}${validated ? '<span class="sr-only">, validada</span>' : ''}</${tag}>`;
  }).join('')}</nav>`;
}

function stackPage(mission,step) {
  return `<a class="route-back" href="#fullstack">${icon('back')} Trilha Full Stack</a>
    <div class="page-heading mission-heading"><p class="kicker">${mission.id} · ${escape(mission.category)}</p><h1>${escape(mission.title)}</h1><p>${escape(mission.description)}</p>
    <div class="skills">${levelBadge(mission)}${mission.skills.map(skill => `<span class="skill">${escape(skill)}</span>`).join('')}
    ${mission.sourceId ? `<a class="skill stack-source" href="${missionHref(mission.sourceId,0)}">Ver chamado ${mission.sourceId} ${icon('external')}</a>` : ''}</div></div>
    ${stackNavigation(mission,step)}
    ${missionGuidePanel(mission,step)}
    ${[stackTicket, item => stackLab(item,'backend'), item => stackLab(item,'frontend'), stackIntegration, stackDelivery][step](mission)}`;
}

function stackStoryKey(mission) {
  return `${mission.id}-scope`;
}

function stackStoryReady(mission) {
  return attempts.get(stackStoryKey(mission)) === mission.story.question.answer;
}

function stackTicket(mission) {
  const {story} = mission;
  const saved = stackState(mission);
  return `<div class="workspace-grid">
    <section class="panel workspace-panel">
      <h2>${stackSteps[0].title}</h2><p>${stackSteps[0].description}</p>
      <div class="report"><div class="kicker">${escape(story.person)} · ${escape(story.role)}</div><p>“${escape(story.message)}”</p></div>
      <h3 class="stack-subheading">Critérios de aceite</h3>
      <ul class="criteria">${story.criteria.map(text => `<li>${escape(text)}</li>`).join('')}</ul>
      ${quiz(story.question,stackStoryKey(mission),saved.done[0])}
      ${saved.done[0] ? `<div class="actions">${stackContinue(mission,1,'Abrir backend')}</div>`
        : stackStoryReady(mission) ? '<p class="note">Mova o ticket para Em andamento no quadro do Jira para abrir o backend.</p>' : ''}
    </section>
    <aside class="stack">
      ${stackBoard(mission,!saved.done[0] && stackStoryReady(mission) ? 'assume' : null)}
      <section class="panel workspace-panel"><h3 class="panel-title">${icon('terminal')} ${escape(story.evidence.label)}</h3>${evidenceCode(mission)}</section>
      ${missionResources(mission)}
    </aside>
  </div>`;
}

function stackBoard(mission,action) {
  const saved = stackState(mission);
  const {done} = saved;
  const current = done[4] ? 2 : done[0] ? 1 : 0;
  const checklist = stackHandoffChecks(saved);
  return `<section class="panel workspace-panel">
    <h3 class="panel-title">${icon('jira')} Quadro do Jira <span class="simulation-label">Simulado</span></h3>
    <ol class="jira-flow" aria-label="Status do ticket">
      ${['A fazer','Em andamento','Em revisão'].map((status,index) => `<li${index === current ? ' aria-current="step"' : ''}><span>${index < current ? icon('check') : icon('dot')} ${status}</span>${index === current ? `<strong>${mission.id}</strong>` : ''}</li>`).join('')}
    </ol>
    ${action === 'assume' ? '<div class="actions"><button class="button" type="button" data-stack-action="assume">Mover para Em andamento</button></div>' : ''}
    ${action === 'review' ? `<ul class="stack-checklist" aria-label="Pronto para revisão">
      ${checklist.map(([label,complete]) => `<li>${icon(complete ? 'check' : 'dot')}<span class="sr-only">${complete ? 'Concluído.' : 'Pendente.'}</span> ${label}</li>`).join('')}
    </ul><div class="actions"><button class="button" type="button" data-stack-action="review"${checklist.every(([,complete]) => complete) ? '' : ' disabled'}>Mover para Em revisão ${icon('arrow')}</button></div>` : ''}
  </section>`;
}

function stackHandoffChecks(saved) {
  return [
    ['Cenários de integração validados',saved.checks.every(Boolean)],
    ['Resposta sobre a versão atual no Slack',saved.thread.length > 0 && saved.threadRevision === saved.revision],
    ['Descrição de PR para a versão atual',Boolean(saved.pr) && saved.prRevision === saved.revision]
  ];
}

function stackAnswer(index) {
  const {stack:mission,step} = activeRoute;
  const question = mission.story.question;
  if (step !== 0 || !question.choices[index] || stackState(mission).done[0] || stackStoryReady(mission)) return;
  attempts.set(stackStoryKey(mission),index);
  render({focus:'#quiz-feedback'});
}

function stackLabKey(mission,layer) {
  return `${mission.id}/${layer}`;
}

function stackLab(mission,layer) {
  const backend = layer === 'backend';
  const step = backend ? 1 : 2;
  const lab = mission[layer];
  const saved = stackState(mission);
  const busy = stackRunning.has(mission.id);
  const result = stackLabRuns.get(stackLabKey(mission,layer));
  const starter = saved.code[layer] ?? lab.starter;
  const scenario = mission.integration[0];
  return `<div class="workspace-grid">
    <section class="panel workspace-panel">
      <h2>${stackSteps[step].title}</h2><p>${stackSteps[step].description}</p>
      <div class="stack-task">${escape(lab.goal)}</div>
      <label class="editor-label" for="stack-editor"><span>${escape(lab.functionName)}.js</span><span>${backend ? 'API simulada' : 'Interface simulada'} · JavaScript</span></label>
      <textarea class="editor" id="stack-editor" data-language="js" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="12000">${escape(starter)}</textarea>
      <div class="actions">
        <button class="button" type="button" data-stack-action="test"${busy ? ' disabled' : ''}>${icon('play')} ${busy ? 'Executando…' : 'Executar testes'}</button>
        <button class="button secondary" type="button" data-stack-action="reset-code">Restaurar código inicial</button>
        ${saved.done[step] ? stackContinue(mission,step + 1,backend ? 'Abrir frontend' : 'Integrar as camadas') : ''}
      </div>
      ${lab.note ? `<p class="note">${escape(lab.note)}</p>` : ''}
      <details class="support-details"><summary>Preciso de uma pista</summary><ol>${lab.hints.map(hint => `<li>${escape(hint)}</li>`).join('')}</ol></details>
      <details class="support-details"><summary>Consultar solução</summary>${codeBlock(lab.answer,'js')}
        <div class="actions"><button class="button secondary" type="button" data-stack-action="example-code">Carregar solução no editor</button></div>
      </details>
    </section>
    <aside class="stack">
      <section class="panel workspace-panel"><h3 class="panel-title">${icon('terminal')} Testes do ${layer}</h3>
        <p class="note" id="stack-lab-status" tabindex="-1" role="status">${escape(busy ? 'Executando os casos…' : result?.message ?? 'Execute o código inicial para ver quais casos ainda falham.')}</p>
        <div id="stack-test-list">${testList({lab},result)}</div>
        ${saved.verified[layer] ? '<p class="note">A integração usa a última versão que passou em todos estes testes.</p>' : ''}
      </section>
      <section class="panel workspace-panel"><h3 class="panel-title">${icon('route')} Contrato entre as camadas</h3>
        <p class="note">${backend ? 'A resposta daqui será consumida diretamente pela interface.' : 'Os testes começam com respostas HTTP de exemplo. A integração usa a saída do seu backend.'}</p>
        <details class="support-details"><summary>Ver um exemplo do contrato</summary>
          ${codeBlock(`${scenario.method} ${scenario.path}\nEntrada do cliente\n${stackJson(stackRequestInput(scenario))}\n\nResposta\n${stackJson(scenario.response)}`,'http')}
        </details>
      </section>
    </aside>
  </div>`;
}

function stackJson(value) {
  return value === undefined ? 'undefined' : JSON.stringify(value,null,2);
}

async function stackTest(mission,layer) {
  if (stackRunning.has(mission.id)) return;
  const lab = mission[layer];
  const saved = stackState(mission);
  const source = document.querySelector('#stack-editor').value;
  const step = layer === 'backend' ? 1 : 2;
  saved.code[layer] = source;
  save();
  stackRunning.add(mission.id);
  const button = root.querySelector('[data-stack-action="test"]');
  button.disabled = true;
  button.textContent = 'Executando…';
  root.querySelector('#stack-lab-status').textContent = 'Executando os casos…';
  let result;
  try {
    const values = await runWorker(source,lab.functionName,lab.tests.map(test => test.args));
    const tests = evaluateCases(lab.tests,values);
    const passed = tests.filter(test => test.pass).length;
    const valid = passed === tests.length && saved.code[layer] === source;
    result = {tests,message:`${passed} de ${tests.length} testes passaram. ${valid ? 'Versão aprovada para integração.' : saved.code[layer] !== source ? 'O editor mudou durante o teste. Execute de novo.' : 'Abra os casos com falha para comparar a saída.'}`};
    if (valid) {
      if (saved.verified[layer] !== source) {
        saved.verified[layer] = source;
        saved.revision = (saved.revision ?? 0) + 1;
        saved.checks.fill(false);
        stackIntegrationRuns.delete(mission.id);
        stackContext(mission).message = '';
      }
      if (!saved.done[step]) announce(`${stackSteps[step].label} validado. Mais ${stackRewards[step]} XP.`);
      saved.done[step] = true;
      save();
    }
  } catch (error) {
    result = {message:`Falha na execução. ${error.message}`};
  } finally {
    stackLabRuns.set(stackLabKey(mission,layer),result);
    stackRunning.delete(mission.id);
    stackRefreshAfterRun(mission,step,'#stack-lab-status');
  }
}

function stackContext(mission) {
  if (!stackContexts.has(mission.id)) stackContexts.set(mission.id,{index:0,request:null,message:''});
  return stackContexts.get(mission.id);
}

function stackRequestInput(scenario) {
  const {sessao,...input} = scenario.args[0];
  return input;
}

function stackServerContext(scenario) {
  const {sessao} = scenario.args[0];
  if (sessao === undefined && scenario.args.length < 2) return '';
  return `<details class="support-details"><summary>Ver dados simulados do servidor</summary>
    ${sessao !== undefined ? `<p>A sessão é injetada pelo servidor conforme o cenário.</p>${codeBlock(stackJson({sessao}),'json')}` : ''}
    ${scenario.args.length > 1 ? `<p>Dados usados pela API neste cenário.</p>${codeBlock(stackJson(scenario.args[1]),'json')}` : ''}
  </details>`;
}

function stackIntegration(mission) {
  const saved = stackState(mission);
  const context = stackContext(mission);
  const {index} = context;
  const scenario = mission.integration[index];
  const trace = stackIntegrationRuns.get(mission.id)?.get(index);
  const count = saved.checks.filter(Boolean).length;
  const busy = stackRunning.has(mission.id);
  return `<div class="stack integration-workspace">
    <section class="panel workspace-panel">
      <h2>${stackSteps[3].title}</h2><p>As últimas versões aprovadas rodam juntas. O frontend recebe a saída do seu backend.</p>
      <div class="scenario-list" aria-label="Cenários de integração">${mission.integration.map((item,position) =>
        `<button class="scenario-button" type="button" data-stack-action="scenario" data-index="${position}" aria-pressed="${position === index}">${icon(saved.checks[position] ? 'check' : 'dot')} ${escape(item.label)}</button>`
      ).join('')}</div>
      <div class="progress-meta"><span>${count} de ${mission.integration.length} cenários padrão validados</span><strong>${Math.round(count / mission.integration.length * 100)}%</strong></div>
      <progress value="${count}" max="${mission.integration.length}" aria-label="Cenários de integração validados"></progress>
    </section>
    <div class="workspace-grid integration-grid">
      <section class="panel workspace-panel">
        <h3 class="panel-title">${icon('terminal')} Enviar requisição</h3>
        <div class="http-route" aria-label="Rota de referência do cenário"><strong>${escape(scenario.method)}</strong><code>${escape(scenario.path)}</code></div>
        <label class="editor-label" for="stack-request"><span>Entrada do cliente</span><span>JSON</span></label>
        <textarea class="editor request-editor" id="stack-request" data-language="json" maxlength="6000" spellcheck="false" autocomplete="off"${busy ? ' disabled' : ''}>${escape(context.request ?? stackJson(stackRequestInput(scenario)))}</textarea>
        <p class="note">Edite o JSON para explorar outras entradas para esta rota. Os cenários padrão liberam a entrega.</p>
        ${stackServerContext(scenario)}
        <div class="actions">
          <button class="button" type="button" data-stack-action="request"${busy ? ' disabled' : ''}>${icon('play')} Enviar cenário</button>
          <button class="button secondary" type="button" data-stack-action="all-cases"${busy ? ' disabled' : ''}>Rodar todos os cenários</button>
          <button class="button quiet" type="button" data-stack-action="reset-request"${busy ? ' disabled' : ''}>Restaurar JSON</button>
        </div>
        <p class="note" id="stack-integration-status" tabindex="-1" role="status">${escape(busy ? 'Conectando API e interface…' : context.message || 'Envie um cenário para ver a resposta da API e a prévia da tela.')}</p>
        ${count === mission.integration.length ? `<div class="actions">${stackContinue(mission,4,'Preparar entrega')}</div>` : ''}
      </section>
      <div class="stack" id="stack-trace">${stackTrace(scenario,trace)}</div>
    </div>
  </div>`;
}

function stackTrace(scenario,trace) {
  if (!trace) return `<section class="panel workspace-panel"><h3 class="panel-title">${icon('route')} Da API à interface</h3><p>Envie o cenário para acompanhar a resposta HTTP e o estado que o frontend produziu.</p></section>`;
  const {actual,error,exploratory,responsePass,viewPass} = trace;
  const label = exploratory ? 'Execução exploratória' : responsePass && viewPass ? 'Cenário validado' : 'Verifique o contrato';
  return `<section class="panel workspace-panel">
    <h3 class="panel-title">${icon('terminal')} Resposta do backend</h3>
    <p class="note">${label}${!exploratory && !error ? responsePass ? ' · Resposta compatível' : ' · Resposta fora do esperado' : ''}</p>
    ${error ? `<p class="feedback">${escape(error)}</p>` : codeBlock(stackJson(actual?.response),'json')}
    ${!exploratory && !responsePass ? `<details class="support-details"><summary>Ver resposta esperada</summary>${codeBlock(stackJson(scenario.response),'json')}</details>` : ''}
  </section>
  <section class="panel workspace-panel">
    <h3 class="panel-title">${icon('layers')} Prévia da interface</h3>
    ${actual?.viewError ? `<p class="feedback">${escape(actual.viewError)}</p>` : stackPreview(actual?.view)}
    ${!exploratory && !viewPass ? `<details class="support-details"><summary>Ver estado de tela esperado</summary>${codeBlock(stackJson(scenario.view),'json')}</details>` : ''}
  </section>`;
}

function stackPreview(view) {
  if (!view || typeof view !== 'object') return '<p>A interface precisa devolver um estado de tela.</p>';
  const states = {
    ready:['Estado da tela','layers'], success:['Operação concluída','check'],
    empty:['Estado vazio','dot'], error:['Erro','close'], denied:['Acesso negado','shield'], conflict:['Conflito','activity']
  };
  const [label,name] = Object.hasOwn(states,view.state) ? states[view.state] : ['Estado retornado','dot'];
  const items = Array.isArray(view.items) ? view.items : [];
  const css = ['ready','success','empty','error','denied','conflict'].includes(view.state) ? view.state : 'empty';
  return `<div class="stack-preview ${css}"><strong>${icon(name)} ${label}</strong><p>${escape(view.message)}</p>
    ${items.length ? `<ul>${items.map(item => `<li><strong>${escape(item?.label)}</strong>${item?.detail ? `<small>${escape(item.detail)}</small>` : ''}</li>`).join('')}</ul>` : ''}</div>`;
}

function stackIntegrationSource(mission,saved) {
  const wrap = layer => `(() => {\n${saved.verified[layer]}\nreturn ${mission[layer].functionName};\n})()`;
  return `const backend = ${wrap('backend')};
const frontend = ${wrap('frontend')};
async function integrar(...args) {
  const response = await backend(...args);
  try {
    const view = await frontend(structuredClone(response));
    return {response,view};
  } catch (error) {
    return {response,viewError:String(error?.message ?? error)};
  }
}`;
}

async function stackRunIntegration(mission,all) {
  if (stackRunning.has(mission.id)) return;
  const saved = stackState(mission);
  const context = stackContext(mission);
  let queue;
  if (all) {
    context.request = null;
    queue = mission.integration.map((scenario,index) => ({scenario,index,args:scenario.args,exploratory:false}));
  } else {
    const {index} = context;
    const scenario = mission.integration[index];
    let request;
    try {
      request = JSON.parse(root.querySelector('#stack-request').value);
      if (request === null || typeof request !== 'object' || Array.isArray(request)) throw new Error();
    } catch {
      context.message = 'Use um objeto JSON válido para enviar a requisição.';
      render({focus:'#stack-integration-status'});
      return;
    }
    const input = stackRequestInput(scenario);
    if (Object.hasOwn(request,'sessao')) {
      context.message = 'A sessão vem do servidor. Escolha um cenário para mudar o contexto de sessão.';
      render({focus:'#stack-integration-status'});
      return;
    }
    const clientAndContext = Object.hasOwn(scenario.args[0],'sessao') ? {...request,sessao:scenario.args[0].sessao} : request;
    queue = [{scenario,index,args:[clientAndContext,...scenario.args.slice(1)],exploratory:!sameValue(request,input)}];
  }
  stackRunning.add(mission.id);
  render();
  try {
    const values = await runWorker(stackIntegrationSource(mission,saved),'integrar',queue.map(item => item.args));
    const traces = stackIntegrationRuns.get(mission.id) ?? new Map();
    for (const [position,item] of queue.entries()) {
      const {actual,error} = values[position];
      const responsePass = !error && sameValue(actual?.response,item.scenario.response);
      const viewPass = !error && sameValue(actual?.view,item.scenario.view);
      traces.set(item.index,{actual,error,exploratory:item.exploratory,responsePass,viewPass});
      if (!item.exploratory) saved.checks[item.index] = responsePass && viewPass;
    }
    stackIntegrationRuns.set(mission.id,traces);
    const count = saved.checks.filter(Boolean).length;
    if (count === mission.integration.length && !saved.done[3]) {
      saved.done[3] = true;
      announce(`Integração validada. Mais ${stackRewards[3]} XP.`);
    }
    context.message = queue[0].exploratory ? 'Prévia atualizada com seu JSON. Os cenários padrão mantêm a validação anterior.'
      : count === mission.integration.length ? 'Todos os cenários padrão passaram. A entrega está liberada.'
      : `${count} de ${mission.integration.length} cenários padrão validados. Compare a resposta e a tela com o esperado.`;
    save();
  } catch (error) {
    context.message = `Falha na execução. ${error.message}`;
  } finally {
    stackRunning.delete(mission.id);
    stackRefreshAfterRun(mission,3,'#stack-integration-status');
  }
}

function stackRefreshAfterRun(mission,step,status) {
  if (activeRoute.stack !== mission || ![1,2,3].includes(activeRoute.step)) return;
  const field = document.activeElement;
  const fieldFocused = ['stack-editor','stack-request'].includes(field?.id);
  const selection = fieldFocused ? [field.selectionStart,field.selectionEnd] : null;
  const focus = fieldFocused ? `#${field.id}` : activeRoute.step === step ? status : undefined;
  render({focus});
  if (selection) root.querySelector(focus)?.setSelectionRange(...selection);
}

function stackDelivery(mission) {
  const saved = stackState(mission);
  const context = stackContext(mission);
  const editingPr = !saved.pr || saved.prRevision !== saved.revision || saved.prDraft !== saved.pr || context.editPr;
  const next = stackMissions.slice(stackMissions.indexOf(mission) + 1).find(item => !stackState(item).done[4]);
  const points = stackRewards.reduce((total,xp) => total + xp,0);
  return `<div class="workspace-grid">
    <div class="stack">
      <section class="panel workspace-panel">
        <h2>${stackSteps[4].title}</h2><p>${stackSteps[4].description}</p>
        ${saved.done[4] ? `<div class="completion" id="stack-complete" tabindex="-1">${icon('trophy')}<div><strong>Missão full stack concluída</strong><p>${points} XP no total. Revisões agendadas em 1, 3 e 7 dias.</p></div></div>
          <div class="actions"><a class="button" href="${next ? stackHref(next) : '#fullstack'}">${next ? 'Próxima missão full stack' : 'Voltar à trilha'} ${icon('arrow')}</a><a class="button secondary" href="#revisao">Ver revisões</a></div>` : ''}
      </section>
      <section class="panel workspace-panel">
        <h3 class="panel-title">${icon('slack')} Thread · ${escape(mission.handoff.channel)} <span class="simulation-label">Simulado</span></h3>
        <div class="slack-thread"><div class="thread-entry"><span class="thread-avatar" aria-hidden="true">${escape(mission.story.person.slice(0,1))}</span><div><strong>${escape(mission.story.person)}</strong><small>${escape(mission.story.role)}</small><p>${escape(mission.story.message)}</p></div></div>
          ${saved.thread.map(text => `<div class="thread-entry"><span class="thread-avatar self" aria-hidden="true">EU</span><div><strong>Você</strong><p>${escape(text)}</p></div></div>`).join('')}
        </div>
        ${saved.done[4] ? '' : `<form id="stack-slack-form">
          <label for="stack-slack" class="field-label">Responder na thread</label><textarea class="handoff-note" id="stack-slack" rows="3" required minlength="20" maxlength="1000" placeholder="O que você resolveu, como validou e o que acontece agora?">${escape(saved.slackDraft ?? '')}</textarea>
          <div class="actions"><button class="button secondary" type="button" data-stack-action="slack-example">Usar exemplo</button><button class="button" type="submit">Publicar resposta simulada</button></div>
        </form>`}
      </section>
    </div>
    <aside class="stack">
      <section class="panel workspace-panel">
        <h3 class="panel-title">${icon('git')} Pull request no GitHub <span class="simulation-label">Simulado</span></h3>
        ${saved.pr ? `<p class="note" id="stack-pr-saved" tabindex="-1">${saved.done[4] || saved.prRevision === saved.revision ? 'Descrição registrada para revisão.' : 'Há uma versão nova do código. Confira e registre a descrição atualizada.'}</p><pre class="artifact">${escape(saved.pr)}</pre>` : '<p class="note">Registre o que mudou no backend e no frontend e quais cenários você rodou.</p>'}
        ${saved.done[4] ? '' : editingPr ? `<form id="stack-pr-form">
          <label for="stack-pr" class="field-label">Descrição do PR</label><textarea class="handoff-note" id="stack-pr" rows="4" required minlength="20" maxlength="1500" placeholder="Backend, frontend e validação">${escape(saved.prDraft ?? saved.pr ?? '')}</textarea>
          <div class="actions"><button class="button secondary" type="button" data-stack-action="pr-example">Usar exemplo</button><button class="button" type="submit">Registrar PR simulado</button></div>
        </form>` : '<div class="actions"><button class="button secondary" type="button" data-stack-action="edit-pr">Editar descrição</button></div>'}
      </section>
      ${stackBoard(mission,saved.done[4] ? null : 'review')}
    </aside>
  </div>`;
}

function stackSetCode(mission,layer,example) {
  const field = root.querySelector('#stack-editor');
  const lab = mission[layer];
  const value = example ? lab.answer : lab.starter;
  if (field.value !== value && field.value !== lab.starter && !window.confirm('Substituir o código atual no editor?')) return;
  field.value = value;
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.focus();
}

function stackFillHandoff(mission,channel) {
  const field = root.querySelector(`#stack-${channel}`);
  if (field.value && !window.confirm('Substituir o rascunho pelo exemplo?')) return;
  field.value = mission.handoff[channel];
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.focus();
}

function bindStackEvents() {
  root.addEventListener('click',event => {
    const button = event.target.closest('[data-stack-action]');
    const {stack:mission,step} = activeRoute;
    if (!button || !mission) return;
    const saved = stackState(mission);
    const action = button.dataset.stackAction;
    const layer = step === 1 ? 'backend' : 'frontend';
    switch (action) {
      case 'assume':
        if (!stackStoryReady(mission) || saved.done[0]) return;
        saved.done[0] = true;
        save();
        announce(`Ticket em andamento. Mais ${stackRewards[0]} XP.`);
        render({focus:'#stack-continue'});
        break;
      case 'test': stackTest(mission,layer); break;
      case 'reset-code': stackSetCode(mission,layer,false); break;
      case 'example-code': stackSetCode(mission,layer,true); break;
      case 'scenario': {
        const context = stackContext(mission);
        context.index = Number(button.dataset.index);
        context.request = null;
        context.message = '';
        render({focus:`[data-stack-action="scenario"][data-index="${context.index}"]`});
        break;
      }
      case 'request': stackRunIntegration(mission,false); break;
      case 'all-cases': stackRunIntegration(mission,true); break;
      case 'reset-request': {
        const context = stackContext(mission);
        context.request = null;
        context.message = '';
        render({focus:'#stack-request'});
        break;
      }
      case 'slack-example': stackFillHandoff(mission,'slack'); break;
      case 'pr-example': stackFillHandoff(mission,'pr'); break;
      case 'edit-pr':
        stackContext(mission).editPr = true;
        render({focus:'#stack-pr'});
        break;
      case 'review':
        if (saved.done[4] || !stackHandoffChecks(saved).every(([,complete]) => complete)) return;
        saved.done[4] = true;
        saved.completedAt = Date.now();
        save();
        announce(`Ticket em revisão. Missão concluída. Mais ${stackRewards[4]} XP.`);
        render({focus:'#stack-complete'});
        break;
    }
  });
  root.addEventListener('input',event => {
    const {stack:mission,step} = activeRoute;
    if (!mission) return;
    const saved = stackState(mission);
    const field = event.target;
    if (field.id === 'stack-editor') {
      const layer = step === 1 ? 'backend' : 'frontend';
      saved.code[layer] = field.value;
      if (!stackRunning.has(mission.id) && stackLabRuns.delete(stackLabKey(mission,layer))) {
        root.querySelector('#stack-lab-status').textContent = 'Código editado. Execute os testes para validar esta versão.';
        const list = root.querySelector('#stack-test-list');
        list.innerHTML = testList({lab:mission[layer]},null);
        window.sprintSyntax.mount(list);
      }
    } else if (field.id === 'stack-slack') {
      saved.slackDraft = field.value;
      field.setCustomValidity('');
    } else if (field.id === 'stack-pr') {
      saved.prDraft = field.value;
      field.setCustomValidity('');
    } else if (field.id === 'stack-request') {
      stackContext(mission).request = field.value;
      return;
    } else return;
    save();
  });
  root.addEventListener('keydown',event => {
    const {stack:mission,step} = activeRoute;
    if (mission && event.target.id === 'stack-editor' && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      stackTest(mission,step === 1 ? 'backend' : 'frontend');
    }
  });
  root.addEventListener('submit',event => {
    const {stack:mission} = activeRoute;
    const slack = event.target.id === 'stack-slack-form';
    if (!mission || (!slack && event.target.id !== 'stack-pr-form')) return;
    event.preventDefault();
    const saved = stackState(mission);
    const field = root.querySelector(slack ? '#stack-slack' : '#stack-pr');
    const text = field.value.trim();
    if (text.length < 20) {
      field.setCustomValidity('Registre pelo menos 20 caracteres com o que mudou e como você validou.');
      field.reportValidity();
      return;
    }
    if (slack) {
      saved.thread.push(text);
      saved.threadRevision = saved.revision;
      saved.slackDraft = '';
      announce('Resposta registrada na thread simulada.');
    } else {
      saved.pr = text;
      saved.prRevision = saved.revision;
      saved.prDraft = text;
      stackContext(mission).editPr = false;
      announce('Descrição do PR registrada.');
    }
    save();
    render({focus:slack ? '#stack-slack' : '#stack-pr-saved'});
  });
}
