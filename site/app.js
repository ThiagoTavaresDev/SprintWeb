'use strict';

const paths = {
  bolt: '<path d="m13 2-8 12h6l-1 8 9-12h-6l1-8z"/>',
  home: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>',
  repeat: '<path d="M20 7H7a4 4 0 0 0-4 4v1m14-8 3 3-3 3M4 17h13a4 4 0 0 0 4-4v-1m-14 8-3-3 3-3"/>',
  terminal: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/>',
  book: '<path d="M12 5a8 8 0 0 0-8-2H3v15h1a8 8 0 0 1 8 2 8 8 0 0 1 8-2h1V3h-1a8 8 0 0 0-8 2v15"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6 6-6-6 6-6"/>',
  filter: '<path d="M3 5h18l-7 8v5l-4 2v-7z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5zm-9 9 9 5 9-5m-18 4 9 5 9-5"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
  git: '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 8v8m12-8c0 5-5 6-12 6"/>',
  shield: '<path d="M12 22s7-3 7-10V5l-7-3-7 3v7c0 7 7 10 7 10z"/><path d="m9 12 2 2 4-4"/>',
  activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  slack: '<path d="M10 3v7H7m7-7h3v7m4 0h-7v3m7 1v3h-7m0 4v-7h3m-7 7H7v-7m-4 0h7v-3m-7-1V7h7"/>',
  jira: '<path d="m12 3 9 9-9 9-9-9 9-9z"/><path d="m12 8 4 4-4 4-4-4 4-4z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  dot: '<circle cx="12" cy="12" r="4"/>',
  play: '<path d="m8 5 12 7-12 7z"/>',
  trophy: '<path d="M8 3h8v7a4 4 0 0 1-8 0V3zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 3v6m-4 0h8"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h3"/>',
  external: '<path d="M13 5h6v6m0-6-9 9m7 0v5H5V7h5"/>',
  chat: '<path d="M4 4h16v12H9l-5 4V4z"/><path d="M8 8h8m-8 4h5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'
};

const icon = (name, extra = '') => `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.terminal}</svg>`;
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const link = (url, label) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ${icon('external')}</a>`;
const tile = (name, theme = 'violet') => `<span class="tile-icon ${theme}">${icon(name)}</span>`;

const missionGroups = [
  {id:'primeira', label:'Primeira sprint', missions:[...window.coreMissions, ...window.extraMissions]},
  {id:'dados', label:'APIs e dados', missions:window.apiMissions},
  {id:'interface', label:'Interface e acessibilidade', missions:window.frontendMissions},
  {id:'equipe', label:'Testes, entrega e equipe', missions:window.deliveryMissions},
  {id:'integracoes', label:'Segurança e integrações', missions:window.integrationMissions}
];
const missions = missionGroups.flatMap(group => group.missions);
const byId = Object.fromEntries(missions.map(mission => [mission.id, mission]));
const groupByMission = new Map(missionGroups.flatMap(group => group.missions.map(mission => [mission.id,group.id])));
const stages = ['Investigar', 'Corrigir e testar', 'Entregar'];
const rewards = [20, 40, 30];
const reviewDays = [1, 3, 7];
const navigation = [
  {title:'Aprendizado', pages:[['inicio','Visão geral','home','Início'],['trilha','Trilha de produto','route','Trilha'],['fullstack','Trilha Full Stack','layers','Full stack'],['tecnologias','Tecnologias','database','Tecnologias'],['cliente-http','Cliente HTTP','terminal','HTTP'],['revisao','Revisão','repeat','Revisão']]},
  {title:'Referências', pages:[['ferramentas','Ferramentas','terminal','Guia'],['modelo','Modelo de estudo','book','Modelo'],['como-usar','Como usar','chat','Ajuda']]}
];
const navLabels = Object.fromEntries(navigation.flatMap(group => group.pages).map(([id, label]) => [id, label]));
const root = document.querySelector('#app');
const dateFormat = new Intl.DateTimeFormat('pt-BR', {day:'numeric', month:'short'});
const storeKey = 'sprint-web-v1';
let storageAvailable = true;
let state = {missions:{}};
try {
  const saved = JSON.parse(localStorage.getItem(storeKey));
  if (saved?.missions && typeof saved.missions === 'object') state = saved;
} catch {
  storageAvailable = false;
}

const attempts = new Map();
const labResults = new Map();
const running = new Set();
const pageSize = 12;
const trailFilters = {query:'', group:'', level:'', status:'', limit:pageSize};
const catalogs = {trail:{filters:trailFilters,results:trailResults},stack:{filters:stackFilters,results:stackResults},tech:{filters:techFilters,results:techResults}};
const reviewFilters = {status:'', limit:pageSize};
let activeRoute;

function missionState(id) {
  return state.missions[id] ??= {done:[false,false,false], reviews:[false,false,false]};
}

function save() {
  try {
    localStorage.setItem(storeKey, JSON.stringify(state));
  } catch {
    storageAvailable = false;
  }
}

function stats() {
  return missions.reduce((total, {id}) => {
    const {done, reviews} = missionState(id);
    total.completed += Number(done.every(Boolean));
    total.stages += done.filter(Boolean).length;
    total.xp += done.reduce((xp, complete, index) => xp + (complete ? rewards[index] : 0), 0);
    total.xp += reviews.filter(Boolean).length * 10;
    return total;
  }, {completed:0, stages:0, xp:0});
}

function nextStage(id) {
  const index = missionState(id).done.findIndex(done => !done);
  return index === -1 ? 2 : index;
}

function recommendedMission() {
  const current = Object.hasOwn(byId,state.currentMission) ? byId[state.currentMission] : undefined;
  if (current && !missionState(current.id).done[2]) return current;
  return missions.find(({id}) => missionState(id).done[0] && !missionState(id).done[2])
    ?? missions.find(({id}) => !missionState(id).done[2]);
}

function missionHref(id, step = nextStage(id)) {
  return `#missao/${id}/${step + 1}`;
}

function reviewSchedule() {
  return [...missions,...stackMissions].flatMap(mission => {
    const {completedAt, reviews} = activityState(mission);
    if (!completedAt) return [];
    return reviewDays.map((days, index) => {
      const due = new Date(completedAt);
      due.setDate(due.getDate() + days);
      return {mission, days, index, due, ready:due.getTime() <= Date.now(), done:reviews[index]};
    });
  }).sort((a,b) => a.due - b.due);
}

function getRoute() {
  const [page, id, step] = location.hash.slice(1).split('/');
  if (page === 'missao' && Object.hasOwn(byId, id)) {
    const requested = /^[1-3]$/.test(step) ? Number(step) - 1 : nextStage(id);
    return {page, mission:byId[id], step:Math.min(requested, nextStage(id))};
  }
  if (page === 'pratica' && Object.hasOwn(stackById,id)) {
    const available = stackNextStage(stackById[id]);
    const requested = /^[1-5]$/.test(step) ? Number(step) - 1 : available;
    if (requested > available) history.replaceState(null,'',stackHref(stackById[id],available));
    return {page,stack:stackById[id],step:Math.min(requested,available)};
  }
  if (page === 'tecnologia' && Object.hasOwn(techById,id)) return {page,tech:techById[id]};
  if (page === 'cliente-http') return {page,http:id === 'livre' || Object.hasOwn(httpById,id) ? id : 'listar'};
  if (page === 'revisao' && (Object.hasOwn(byId,id) || Object.hasOwn(stackById,id)) && /^[1-3]$/.test(step)) {
    const review = reviewSchedule().find(item => item.mission.id === id && item.index === Number(step) - 1);
    if (review) return {page, review};
  }
  return {page:Object.hasOwn(navLabels, page) ? page : 'inicio'};
}

function sidebar(page, ready) {
  const selected = page === 'missao' ? 'trilha' : page === 'pratica' ? 'fullstack' : page === 'tecnologia' ? 'tecnologias' : page;
  return `<aside class="sidebar">
    <a class="brand" href="#inicio" aria-label="Sprint Web, visão geral">
      <img class="brand-mark" src="assets/icon.svg" alt="" width="39" height="39">
      <span><strong>Sprint Web</strong><small>Laboratório de produto</small></span>
    </a>
    <a class="mobile-brand" href="#inicio" aria-label="Sprint Web, visão geral"><img src="assets/icon.svg" alt="" width="29" height="29"></a>
    <nav aria-label="Navegação principal">
      ${navigation.map(({title,pages}) => `<div class="nav-group"><p class="nav-heading">${title}</p>${pages.map(([id,label,name,compact]) =>
        `<a class="nav-link" href="#${id}" aria-label="${label}${id === 'revisao' && ready ? `, ${ready} ${ready === 1 ? 'disponível' : 'disponíveis'}` : ''}"${selected === id ? ' aria-current="page"' : ''}>${icon(name)}<span class="nav-label">${label}</span><span class="nav-compact">${compact}</span>${id === 'revisao' && ready ? `<span class="nav-count">${ready}</span>` : ''}</a>`
      ).join('')}</div>`).join('')}
    </nav>
    <div class="sidebar-bottom"><div class="sidebar-note">
      <strong>${icon('shield')} Ambiente de prática</strong>
      <p>Portal, tickets e conversas simulados. ${storageAvailable ? 'Progresso salvo neste navegador.' : 'Progresso disponível nesta sessão.'}</p>
    </div></div>
  </aside>`;
}

function topbar(route, xp) {
  const parent = route.mission ? ['#trilha','Trilha'] : route.stack ? ['#fullstack','Full Stack'] : route.tech ? ['#tecnologias','Tecnologias'] : ['#inicio','Sprint Web'];
  const label = route.mission?.id || route.stack?.id || route.tech?.id || navLabels[route.page];
  return `<header class="topbar">
    <div class="breadcrumb"><a href="${parent[0]}">${parent[1]}</a>${icon('chevron')}<span>${label}</span></div>
    <div class="top-meta"><span class="xp-pill" id="xp-count" aria-label="${xp} pontos de experiência">${icon('bolt')} ${xp} XP</span><span class="avatar" title="Seu perfil de prática" aria-hidden="true">EU</span></div>
  </header>`;
}

function missionCard(mission, next) {
  const {done} = missionState(mission.id);
  const count = done.filter(Boolean).length;
  const isNext = next?.id === mission.id;
  const badge = count === 3 ? `<span class="mission-status done">${icon('check')} Concluída</span>`
    : count ? `<span class="mission-status next">${count}/3 etapas</span>`
    : isNext ? '<span class="mission-status next">Próxima missão</span>' : stackBySource.has(mission.id) ? '<span class="mission-status">Com prática full stack</span>' : '';
  return `<a class="mission-card ${isNext ? 'is-next' : ''}" href="${missionHref(mission.id)}">
    <div class="mission-top">${tile(mission.icon, mission.theme)}<div class="mission-badges">${levelBadge(mission)}${badge}</div></div>
    <div class="kicker">${mission.id} <span aria-hidden="true">·</span> ${escape(mission.category)}</div>
    <h3>${escape(mission.title)}</h3>
    <p>${escape(mission.description)}</p>
    <div class="mission-bottom"><span>${icon('clock')} ${mission.minutes} min</span>${icon('arrow')}</div>
  </a>`;
}

function dashboard(totals, schedule) {
  const next = recommendedMission();
  const fullstack = stackStats();
  const nextReview = schedule.find(item => !item.done);
  const ready = schedule.filter(item => item.ready && !item.done).length;
  const progress = Math.round(totals.stages / (missions.length * 3) * 100);
  const heroButton = next ? (missionState(next.id).done.some(Boolean) ? 'Continuar missão' : 'Começar missão') : 'Abrir revisões';
  const firstShown = Math.min(Math.floor((next ? missions.indexOf(next) : missions.length - 1) / 3) * 3, missions.length - 3);
  return `<section class="hero" aria-labelledby="hero-title">
    <img class="hero-art" src="assets/hero.webp" alt="" width="1050" height="700">
    <div class="hero-copy">
      <div class="hero-label">${icon('terminal')} Laboratório interativo</div>
      <h1 id="hero-title">Da tarefa<br>ao deploy.</h1>
      <p>Aprenda desenvolvimento web resolvendo tickets, testando código e entregando como em um time de produto.</p>
      <div class="hero-actions"><a class="button" href="${next ? missionHref(next.id) : '#revisao'}">${heroButton} ${icon('arrow')}</a>
      <a class="button hero-secondary" href="#fullstack">Trilha Full Stack ${icon('layers')}</a></div>
    </div>
  </section>
  <section class="section" aria-labelledby="product-trail">
    <div class="section-heading">
      <div><h2 id="product-trail">Trilha de produto</h2><p>${missions.length} missões no Portal de Pedidos, em ${missionGroups.length} trilhas temáticas.</p></div>
      <a class="section-link" href="#trilha">Ver toda a trilha ${icon('arrow')}</a>
    </div>
    <div class="card-grid">${missions.slice(firstShown, firstShown + 3).map(mission => missionCard(mission, next)).join('')}</div>
  </section>
  <div class="dashboard-bottom">
    <section class="panel mini-panel">
      <h3>${icon('trophy')} Progresso na trilha de produto</h3>
      <div class="progress-meta"><span>${totals.completed} de ${missions.length} missões concluídas</span><strong>${progress}%</strong></div>
      <progress value="${totals.stages}" max="${missions.length * 3}" aria-label="Etapas validadas"></progress>
      <p>${totals.stages} de ${missions.length * 3} etapas validadas</p>
      <a class="section-link" href="#fullstack">Full Stack · ${fullstack.completed} de ${stackMissions.length} missões ${icon('arrow')}</a>
    </section>
    <section class="panel mini-panel">
      <h3>${icon('calendar')} Revisão programada</h3>
      <p>${ready ? `${ready} ${ready === 1 ? 'revisão disponível' : 'revisões disponíveis'} agora.` : nextReview ? `Próxima revisão em ${dateFormat.format(nextReview.due)}.` : totals.completed ? 'As revisões das suas missões concluídas estão em dia.' : 'Conclua uma missão para agendar revisões em 1, 3 e 7 dias.'}</p>
      <a class="section-link" href="#revisao">Abrir revisões ${icon('arrow')}</a>
    </section>
  </div>
  <div class="dashboard-bottom">
    <section class="panel mini-panel"><h3>${icon('database')} Projetos .NET e Angular</h3><p>Trabalhe no código real da API e da interface do Portal de Pedidos.</p><a class="section-link" href="#tecnologias">Explorar tecnologias ${icon('arrow')}</a></section>
    <section class="panel mini-panel"><h3>${icon('terminal')} Cliente HTTP</h3><p>Monte e envie requisições na API simulada, com cinco exercícios guiados.</p><a class="section-link" href="#cliente-http">Praticar requisições ${icon('arrow')}</a></section>
  </div>`;
}

function trail() {
  return `<div class="page-heading"><p class="kicker">Portal de Pedidos</p><h1>Trilha de produto</h1><p>Explore ${missions.length} tickets do mesmo produto. Continue a sua missão ou escolha um tema para praticar.</p></div>
    ${catalogControls('trail',trailFilters,missionGroups.map(group => [group.id,`${group.label} (${group.missions.length})`]),{
      placeholder:'Ex.: SQL Server, Slack ou WEB-101',groupTitle:'Trilha temática',allGroups:'Todas as trilhas'
    },missions)}
    <div id="trail-results">${trailResults()}</div>`;
}

function selectOptions(options, selected) {
  return options.map(([value,label]) => `<option value="${escape(value)}" ${selected === value ? 'selected' : ''}>${escape(label)}</option>`).join('');
}

function normalizedSearch(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
}

function trailResults() {
  const {limit} = trailFilters;
  const filtered = matchingMissions(missions,trailFilters,mission => groupByMission.get(mission.id),mission => {
    const {done} = missionState(mission.id);
    return done[2] ? 'done' : done[0] ? 'active' : 'new';
  });
  const next = recommendedMission();
  return `<p class="result-count" role="status">${filtered.length} ${filtered.length === 1 ? 'missão encontrada' : 'missões encontradas'}${filtered.length > limit ? ` · ${limit} visíveis` : ''}</p>
    ${filtered.length ? `<div class="card-grid">${filtered.slice(0,limit).map(mission => missionCard(mission,next)).join('')}</div>${moreButton('trail-more',filtered.length,limit,'missões')}`
      : emptyCatalog('trail')}`;
}

function moreButton(action, count, limit, label) {
  return count > limit ? `<div class="list-footer"><button class="button secondary" type="button" data-action="${action}">Mostrar mais ${label}</button></div>` : '';
}

function quiz(question, key, alreadyCorrect = false) {
  const selected = attempts.get(key) ?? (alreadyCorrect ? question.answer : null);
  const correct = selected === question.answer;
  return `<fieldset class="quiz">
    <legend>${escape(question.prompt)}</legend>
    <div class="choices">${question.choices.map((choice,index) => {
      const chosen = selected === index;
      const outcome = chosen ? (correct ? 'correct' : 'wrong') : '';
      return `<button type="button" class="choice ${outcome}" data-action="answer" data-index="${index}" aria-pressed="${chosen}" ${correct ? 'aria-disabled="true"' : ''}>
        <span class="choice-marker" aria-hidden="true">${chosen ? icon(correct ? 'check' : 'close') : String.fromCharCode(65 + index)}</span><span>${escape(choice)}</span>
      </button>`;
    }).join('')}</div>
    <div id="quiz-feedback" tabindex="-1" class="feedback ${correct ? 'success' : ''}">${selected === null ? '' : escape(question.feedback[selected])}</div>
  </fieldset>`;
}

function stageButton(id, step, label) {
  return `<a class="button" href="${missionHref(id,step)}">${label} ${icon('arrow')}</a>`;
}

function stageNavigation(id, step) {
  const {done} = missionState(id);
  return `<nav class="stage-nav" aria-label="Etapas da missão">${stages.map((label,index) => {
    const available = index <= nextStage(id);
    const attributes = available ? `href="${missionHref(id,index)}"${index === step ? ' aria-current="step"' : ''}` : 'aria-disabled="true"';
    const tag = available ? 'a' : 'span';
    return `<${tag} class="stage-link" ${attributes}><span class="stage-number ${done[index] ? 'done' : ''}">${done[index] ? icon('check') : index + 1}</span>${label}${done[index] ? '<span class="sr-only">, validada</span>' : ''}</${tag}>`;
  }).join('')}</nav>`;
}

function filterDemo(corrected) {
  return `<section class="panel workspace-panel">
    <h3 class="panel-title">${icon('filter')} Portal simulado</h3>
    <div class="filter-demo">
      <label for="demo-status">Filtrar por status</label>
      <select id="demo-status" data-corrected="${corrected}"><option value="todos">Todos</option><option value="pendente">Pendentes</option><option value="enviado">Enviados</option><option value="cancelado">Cancelados</option></select>
      <div class="demo-result" id="demo-result" aria-live="polite"></div>
    </div>
  </section>`;
}

function updateDemo() {
  const input = document.querySelector('#demo-status');
  if (!input) return;
  const orders = [[104,'pendente'],[105,'enviado'],[106,'pendente']];
  const filter = input.dataset.corrected === 'true' && input.value !== 'todos';
  const shown = filter ? orders.filter(([,status]) => status === input.value) : orders;
  const request = filter ? `/api/pedidos?status=${input.value}` : '/api/pedidos';
  const result = document.querySelector('#demo-result');
  result.innerHTML = `${codeBlock(`GET ${request} → 200`,'http','demo-request-code')}${shown.length
    ? `<table><thead><tr><th>Pedido</th><th>Status</th></tr></thead><tbody>${shown.map(([id,status]) => `<tr><td>#${id}</td><td>${status}</td></tr>`).join('')}</tbody></table>`
    : '<p>Nenhum pedido para este filtro.</p>'}`;
  window.sprintSyntax.mount(result);
}

function missionResources(mission) {
  const studied = new Set(missionGuide[mission.id].theory.map(({url}) => url));
  const additional = mission.refs.filter(({url}) => !studied.has(url));
  if (!mission.bridge && !additional.length) return '';
  return `<section class="panel workspace-panel">
    <h3 class="panel-title">${icon('book')} Referências da missão</h3>
    ${mission.bridge ? `<details class="support-details"><summary>${escape(mission.bridge.title)}</summary><p>${escape(mission.bridge.text)}</p>${mission.bridge.code ? codeBlock(mission.bridge.code,bridgeLanguages[mission.id]) : ''}</details>` : ''}
    ${additional.length ? `<details class="support-details"><summary>Documentação complementar</summary><ul>${additional.map(({url,label}) => `<li>${link(url,label)}</li>`).join('')}</ul></details>` : ''}
  </section>`;
}

function investigate(mission) {
  const {story} = mission;
  const done = missionState(mission.id).done[0];
  return `<div class="workspace-grid">
    <section class="panel workspace-panel">
      <h2>Investigue o chamado</h2>
      <div class="report"><div class="kicker">${escape(story.person)} · ${escape(story.role)}</div><p>“${escape(story.message)}”</p></div>
      <ul class="criteria" aria-label="Critérios de aceite">${story.criteria.map(text => `<li>${escape(text)}</li>`).join('')}</ul>
      ${quiz(story.question, `${mission.id}-story`, done)}
      ${done ? `<div class="actions">${stageButton(mission.id,1,'Ir para o laboratório')}</div>` : ''}
    </section>
    <aside class="stack">
      <section class="panel workspace-panel"><h3 class="panel-title">${icon('terminal')} ${escape(story.evidence.label)}</h3>${evidenceCode(mission)}</section>
      ${mission.id === 'WEB-101' ? filterDemo(false) : ''}
      ${missionResources(mission)}
    </aside>
  </div>`;
}

function showValue(value) {
  return value === undefined ? 'undefined' : JSON.stringify(value);
}

function testList(mission, result) {
  return `<ul class="tests">${mission.lab.tests.map((test,index) => {
    const run = result?.tests?.[index];
    return `<li class="test ${run ? (run.pass ? 'pass' : 'fail') : ''}">
      <details><summary>${icon(run ? (run.pass ? 'check' : 'close') : 'dot')}<span class="sr-only">${run ? (run.pass ? 'Passou. ' : 'Falhou. ') : ''}</span>${escape(test.label)}</summary>
      <div class="test-details">
        <div>Entrada${codeBlock(showValue(test.args),'json','case-code')}</div>
        <div>Esperado${codeBlock(showValue(test.expected),'json','case-code')}</div>
        ${run ? `<div>Observado${codeBlock(run.error || showValue(run.actual),run.error ? 'text' : 'json','case-code')}</div>` : ''}
      </div></details>
    </li>`;
  }).join('')}</ul>`;
}

function lab(mission) {
  const saved = missionState(mission.id);
  const busy = running.has(mission.id);
  const result = labResults.get(mission.id);
  return `<div class="workspace-grid">
    <section class="panel workspace-panel">
      <h2>Corrija e teste</h2>
      <p>${escape(mission.lab.goal)}</p>
      <label class="editor-label" for="editor"><span>${escape(mission.lab.functionName)}.js</span><span>JavaScript</span></label>
      <textarea class="editor" id="editor" data-language="js" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="12000">${escape(saved.code ?? mission.lab.starter)}</textarea>
      <div class="actions">
        <button type="button" class="button" data-action="run" ${busy ? 'disabled' : ''}>${icon('play')} ${busy ? 'Executando…' : 'Executar testes'}</button>
        <button type="button" class="button secondary" data-action="reset">Restaurar código inicial</button>
        ${saved.done[1] ? stageButton(mission.id,2,'Preparar entrega') : ''}
      </div>
      ${mission.lab.note ? `<p class="note">${escape(mission.lab.note)}</p>` : ''}
      <details class="support-details"><summary>Preciso de uma pista</summary><ol>${mission.lab.hints.map(hint => `<li>${escape(hint)}</li>`).join('')}</ol></details>
      <details class="support-details"><summary>Consultar solução</summary>
        <p>Compare com a sua hipótese. Você pode editar a solução e executar os testes.</p>${codeBlock(mission.lab.answer,'js')}
        <div class="actions"><button class="button secondary" type="button" data-action="example">Carregar solução no editor</button></div>
      </details>
    </section>
    <aside class="stack">
      <section class="panel workspace-panel">
        <h3 class="panel-title">${icon('terminal')} Testes de aceitação</h3>
        <p id="test-status" class="note" tabindex="-1">${escape(busy ? 'Executando os casos de teste…' : result?.message ?? 'Execute o código inicial e compare os resultados.')}</p>
        ${testList(mission,result)}
      </section>
      ${mission.id === 'WEB-101' && saved.done[1] ? filterDemo(true) : ''}
      ${missionResources(mission)}
    </aside>
  </div>`;
}

function delivery(mission) {
  const item = mission.delivery;
  const saved = missionState(mission.id);
  const chosen = attempts.get(`${mission.id}-delivery`) === item.answer || saved.done[2];
  const status = jiraStatus(mission);
  return `<div class="workspace-grid">
    <section class="panel workspace-panel">
      <h2>Registre a entrega</h2>
      ${quiz(item,`${mission.id}-delivery`,saved.done[2])}
      ${chosen && !saved.done[2] ? `<form id="handoff">
        <label for="handoff-note" class="field-label">${escape(item.artifact.label)}</label>
        <textarea class="handoff-note" id="handoff-note" rows="4" minlength="20" maxlength="1000" required placeholder="Descreva a evidência e o próximo passo.">${escape(saved.draft ?? '')}</textarea>
        <label for="handoff-status" class="field-label">Status no Jira após a atualização</label>
        <select class="handoff-status" id="handoff-status" required>
          <option value="">Selecione o status</option>
          ${['A fazer','Em andamento','Em revisão','Concluído'].map(option => `<option${saved.draftStatus === option ? ' selected' : ''}>${option}</option>`).join('')}
        </select>
        <div class="actions"><button class="button secondary" type="button" data-action="fill">Usar exemplo</button><button class="button" type="submit">Registrar entrega ${icon('check')}</button></div>
      </form>` : ''}
      ${saved.done[2] ? `<div class="completion" tabindex="-1" id="mission-complete">${icon('trophy')}<div><strong>Missão concluída</strong><p>90 XP no total. Revisões agendadas em 1, 3 e 7 dias.</p></div></div>
        <pre class="artifact">${escape(saved.handoff)}</pre>
        <div class="actions">${nextMissionLink(mission)}<a class="button secondary" href="#revisao">Ver revisões</a></div>` : ''}
    </section>
    <aside class="stack">
      <section class="panel workspace-panel">
        <h3 class="panel-title">${icon('jira')} Jira simulado</h3>
        <div class="report"><div class="kicker">${mission.id}</div><p><strong>${escape(mission.title)}</strong></p></div>
        <div class="actions"><span class="mission-status ${saved.done[2] ? 'done' : 'next'}">${saved.done[2] ? saved.draftStatus ?? status : 'Em andamento'}</span></div>
        <p class="note">${escape(item.guide || 'Registre uma atualização com o contexto, a validação e o próximo passo.')}</p>
        ${chosen ? `<details class="support-details"><summary>Ver exemplo de entrega</summary><pre class="artifact">${escape(item.artifact.text)}</pre></details>` : ''}
      </section>
      ${missionResources(mission)}
    </aside>
  </div>`;
}

function nextMissionLink(mission) {
  const after = missions.slice(missions.indexOf(mission) + 1);
  const next = after.find(item => !missionState(item.id).done[2]);
  return next ? stageButton(next.id,nextStage(next.id),'Próxima missão') : '<a class="button" href="#trilha">Voltar à trilha</a>';
}

function jiraStatus(mission) {
  return mission.delivery.jiraStatus ?? (mission.id === 'WEB-106' ? 'Em andamento' : 'Em revisão');
}

function missionPage(mission, step) {
  const extended = stackBySource.get(mission.id);
  return `<a class="route-back" href="#trilha">${icon('back')} Trilha de produto</a>
    <div class="page-heading mission-heading"><p class="kicker">${mission.id} · ${escape(mission.category)}</p><h1>${escape(mission.title)}</h1><p>${escape(mission.description)}</p>
    <div class="skills">${levelBadge(mission)}${mission.skills.map(skill => `<span class="skill">${escape(skill)}</span>`).join('')}</div></div>
    ${extended ? `<div class="stack-extension"><div>${icon('layers')}<span><strong>Prática full stack</strong><small>Leve este chamado do contrato da API até a tela e a entrega ao time.</small></span></div><a class="button secondary" href="${stackHref(extended)}">Abrir ${extended.id} ${icon('arrow')}</a></div>` : ''}
    ${stageNavigation(mission.id,step)}${missionGuidePanel(mission,step)}${[investigate,lab,delivery][step](mission)}`;
}

function reviewPage(schedule, selected) {
  if (selected) {
    const {mission,index,days,ready,done} = selected;
    return `<a class="route-back" href="#revisao">${icon('back')} Voltar às revisões</a>
      <div class="page-heading"><p class="kicker">${mission.id} · Revisão D+${days}</p><h1>${escape(mission.title)}</h1><p>${ready ? 'Responda de memória e confira a explicação.' : `Prévia de prática. A revisão com XP abre em ${dateFormat.format(selected.due)}.`}</p></div>
      <section class="panel workspace-panel review-quiz">
        <h2>Um novo caso</h2>
        ${quiz(mission.recall[index], reviewKey(selected), done)}
        ${done ? `<p class="feedback success">${icon('check')} Revisão concluída · +10 XP</p>` : ''}
        <div class="actions"><a class="button secondary" href="#revisao">Voltar à lista</a></div>
      </section>`;
  }
  return `<div class="page-heading"><h1>Revisão</h1><p>Retome as decisões de cada missão em cenários novos, 1, 3 e 7 dias após a entrega.</p></div>
    ${schedule.length ? `<div class="panel filter-panel review-filter"><label class="filter-field">Mostrar revisões
      <select id="review-status">${selectOptions([['','Todas'],['ready','Disponíveis'],['future','Agendadas'],['done','Concluídas']],reviewFilters.status)}</select>
      </label></div><div id="review-results">${reviewResults(schedule)}</div>`
      : `<section class="panel workspace-panel review-quiz"><h2>Nenhuma revisão agendada</h2><p>Quando você registrar a entrega de uma missão, as três revisões aparecem aqui.</p><div class="actions"><a class="button" href="#trilha">Abrir trilha ${icon('arrow')}</a></div></section>`}`;
}

function reviewResults(schedule) {
  const {status,limit} = reviewFilters;
  const filtered = schedule.filter(item => !status || status === (item.done ? 'done' : item.ready ? 'ready' : 'future'));
  return `<p class="result-count" role="status">${filtered.length} ${filtered.length === 1 ? 'revisão encontrada' : 'revisões encontradas'}${filtered.length > limit ? ` · ${limit} visíveis` : ''}</p>
    ${filtered.length ? `<div class="review-list">${filtered.slice(0,limit).map(item => {
      const {mission,index,days,ready,done,due} = item;
      const text = done ? 'Concluída' : ready ? 'Disponível · +10 XP' : `Abre em ${dateFormat.format(due)}`;
      return `<article class="panel review-item">
        ${tile('repeat',done ? 'mint' : 'violet')}
        <div class="review-name"><h3>${escape(mission.title)} · D+${days}</h3><p>${text}</p></div>
        <a class="button ${ready && !done ? '' : 'secondary'}" href="#revisao/${mission.id}/${index + 1}">${done ? 'Rever' : ready ? 'Revisar' : 'Praticar agora'}</a>
      </article>`;
    }).join('')}</div>${moreButton('review-more',filtered.length,limit,'revisões')}`
      : '<section class="panel workspace-panel review-quiz"><h2>Nenhuma revisão nesse estado</h2><p>Escolha outro estado para ver suas revisões.</p></section>'}`;
}

function reviewKey(item) {
  return `${item.mission.id}-review-${item.index}-${item.ready ? 'due' : 'practice'}`;
}

function toolsPage() {
  const colors = ['violet','blue','mint','orange','rose','violet'];
  return `<div class="page-heading"><h1>Ferramentas de equipe</h1><p>Consulte um exemplo de uso durante uma missão e leve o mesmo fluxo para seu ambiente de trabalho.</p></div>
    <div class="card-grid">${window.toolGuide.map((tool,index) => `<article class="panel tool-card">
      ${tile(tool.icon,colors[index])}<h3>${escape(tool.title)}</h3><p>${escape(tool.description)}</p>
      <details class="support-details"><summary>Exemplo de uso</summary><p>${escape(tool.example)}</p></details>
      <div class="section-link">${link(tool.url,tool.label)}</div>
    </article>`).join('')}</div>`;
}

function modelPage() {
  const guide = window.studyGuide;
  return `<div class="page-heading"><h1>Modelo de estudo</h1><p>${escape(guide.intro)}</p></div>
    <section><div class="section-heading"><h2>Como criar uma missão</h2></div>
      <div class="study-grid">${guide.steps.map((step,index) => `<article class="panel study-card"><div class="study-num">Etapa ${index + 1}</div><h3>${escape(step.title)}</h3><p>${escape(step.description)}</p></article>`).join('')}
      <article class="panel study-card"><div class="study-num">Na trilha</div><h3>Progresso e revisões</h3><p>${escape(guide.cycle)}</p></article></div>
    </section>
    <section class="section"><div class="section-heading"><h2>Pesquisa que orienta o modelo</h2></div>
      <div class="study-grid">${guide.research.map(source => `<article class="panel study-card"><h3>${escape(source.title)}</h3><p>${escape(source.description)}</p>${link(source.url,source.label)}</article>`).join('')}</div>
    </section>`;
}

function render({navigationChanged = false, focus} = {}) {
  activeRoute = getRoute();
  const totals = stats();
  const schedule = reviewSchedule();
  const {page,mission,stack,tech,http,step,review} = activeRoute;
  let content;
  switch (page) {
    case 'trilha': content = trail(); break;
    case 'missao': content = missionPage(mission,step); break;
    case 'fullstack': content = stackHome(); break;
    case 'pratica': content = stackPage(stack,step); break;
    case 'tecnologias': content = techHome(); break;
    case 'tecnologia': content = techPage(tech); break;
    case 'cliente-http': content = httpPage(http); break;
    case 'revisao': content = reviewPage(schedule,review); break;
    case 'ferramentas': content = toolsPage(); break;
    case 'modelo': content = modelPage(); break;
    case 'como-usar': content = howToPage(); break;
    default: content = dashboard(totals,schedule);
  }
  const ready = schedule.filter(item => item.ready && !item.done).length;
  const label = mission?.title || stack?.title || tech?.title || navLabels[page];
  document.title = page === 'inicio' ? 'Sprint Web — Laboratório de produto' : `${label} — Sprint Web`;
  root.innerHTML = `<div class="shell">${sidebar(page,ready)}<div class="main-area">${topbar(activeRoute,totals.xp + stackStats().xp + techStats().xp + httpStats().xp)}<main class="content" id="main" tabindex="-1">${content}</main></div></div>`;
  updateDemo();
  window.sprintSyntax.mount(root);
  if (navigationChanged) {
    window.scrollTo(0,0);
    const heading = root.querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({preventScroll:true});
  } else if (focus) {
    const narrowTestResults = ['#test-status','#stack-lab-status','#stack-integration-status','#http-status'].includes(focus) && matchMedia('(max-width: 650px)').matches;
    document.querySelector(focus)?.focus({preventScroll:!narrowTestResults});
  }
}

function announce(message) {
  document.querySelector('#announce').textContent = message;
}

function answer(index) {
  if (activeRoute.tech) return techAnswer(activeRoute.tech,index);
  if (activeRoute.stack) return stackAnswer(index);
  const {mission,step,review} = activeRoute;
  let question, key, alreadyCorrect;
  if (review) {
    question = review.mission.recall[review.index];
    key = reviewKey(review);
    alreadyCorrect = review.done;
  } else if (mission && step !== 1) {
    question = step === 0 ? mission.story.question : mission.delivery;
    key = `${mission.id}-${step === 0 ? 'story' : 'delivery'}`;
    alreadyCorrect = missionState(mission.id).done[step];
  }
  if (!question || !question.choices[index] || alreadyCorrect || attempts.get(key) === question.answer) return;
  attempts.set(key,index);
  if (index === question.answer) {
    if (review?.ready) {
      activityState(review.mission).reviews[review.index] = true;
      save();
      announce('Revisão validada. Mais 10 XP.');
    } else if (mission && step === 0) {
      missionState(mission.id).done[0] = true;
      state.currentMission = mission.id;
      save();
      announce('Investigação validada. Mais 20 XP.');
    }
  }
  render({focus:'#quiz-feedback'});
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key,normalize(value[key])]));
  }
  return value;
}

function sameValue(left,right) {
  return showValue(normalize(left)) === showValue(normalize(right));
}

function evaluateCases(cases,results) {
  return cases.map((test,index) => ({
    ...results[index],
    pass: Boolean(results[index]) && !results[index].error && sameValue(results[index].actual,test.expected)
  }));
}

function runWorker(source, functionName, args) {
  return new Promise((resolve,reject) => {
    const body = `"use strict";
      ${source}
      self.addEventListener("message", async ({data}) => {
        const results = [];
        for (const args of data) {
          try {
            const actual = await ${functionName}(...args);
            results.push({actual: structuredClone(actual)});
          } catch (error) {
            results.push({error: String(error?.message ?? error)});
          }
        }
        self.postMessage(results);
      });`;
    const url = URL.createObjectURL(new Blob([body],{type:'text/javascript'}));
    let worker, timer;
    function finish(callback,result) {
      clearTimeout(timer);
      worker?.terminate();
      URL.revokeObjectURL(url);
      callback(result);
    }
    try {
      worker = new Worker(url);
      timer = setTimeout(() => finish(reject,new Error('Tempo de execução excedido. Procure loops ou operações que não terminam.')),2500);
      worker.addEventListener('message',event => finish(resolve,event.data),{once:true});
      worker.addEventListener('error',event => {
        event.preventDefault();
        finish(reject,new Error(event.message || 'Confira a sintaxe e tente novamente.'));
      },{once:true});
      worker.postMessage(args);
    } catch (error) {
      finish(reject,error);
    }
  });
}

async function runTests(mission) {
  if (!mission || running.has(mission.id)) return;
  const saved = missionState(mission.id);
  const editor = document.querySelector('#editor');
  if (!editor) return;
  const source = editor.value;
  saved.code = source;
  state.currentMission = mission.id;
  save();
  running.add(mission.id);
  const runButton = document.querySelector('[data-action="run"]');
  runButton.disabled = true;
  runButton.textContent = 'Executando…';
  document.querySelector('#test-status').textContent = 'Executando os casos de teste…';
  let result;
  try {
    const cases = mission.lab.tests;
    const results = await runWorker(source,mission.lab.functionName,cases.map(test => test.args));
    const tests = evaluateCases(cases,results);
    const passed = tests.filter(test => test.pass).length;
    const valid = passed === tests.length;
    const unchanged = saved.code === source;
    result = {
      tests,
      message: `${passed} de ${tests.length} testes passaram. ${!unchanged ? 'O editor mudou durante a execução. Rode novamente.' : valid ? 'Correção validada.' : 'Abra os casos que falharam para comparar os resultados.'}`
    };
    if (valid && unchanged && !saved.done[1]) {
      saved.done[1] = true;
      save();
      announce('Laboratório validado. Mais 40 XP.');
    }
  } catch (error) {
    result = {message:`Falha na execução. ${error.message}`};
  } finally {
    labResults.set(mission.id,result);
    running.delete(mission.id);
    if (activeRoute.mission === mission && activeRoute.step === 1) {
      const focus = document.activeElement?.id === 'editor' ? '#editor' : '#test-status';
      render({focus});
    }
  }
}

function replaceCode(mission, useExample) {
  if (!mission) return;
  const editor = document.querySelector('#editor');
  if (!editor) return;
  if (useExample && !window.confirm('Substituir o código atual pela solução de exemplo?')) return;
  if (!useExample && editor.value !== mission.lab.starter && !window.confirm('Restaurar o código inicial e substituir suas alterações?')) return;
  editor.value = useExample ? mission.lab.answer : mission.lab.starter;
  editor.dispatchEvent(new Event('input',{bubbles:true}));
  editor.focus();
}

root.addEventListener('click',event => {
  const guide = event.target.closest('summary')?.parentElement;
  if (guide?.dataset.missionGuide) guideDisclosure.set(guide.dataset.missionGuide,!guide.open);
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const {mission} = activeRoute;
  switch (button.dataset.action) {
    case 'answer': answer(Number(button.dataset.index)); break;
    case 'run': runTests(mission); break;
    case 'reset': replaceCode(mission,false); break;
    case 'example': replaceCode(mission,true); break;
    case 'trail-more': showMore(trailFilters,'#trail-results',trailResults,'.mission-card'); break;
    case 'review-more': showMore(reviewFilters,'#review-results',() => reviewResults(reviewSchedule()),'.review-item a'); break;
    case 'catalog-clear': {
      const id = button.dataset.catalog;
      Object.assign(catalogs[id].filters,{query:'',group:'',level:'',status:''});
      if (id === 'trail') trailFilters.limit = pageSize;
      render({focus:`#${id}-query`});
      break;
    }
    case 'fill': {
      const field = document.querySelector('#handoff-note');
      if (!field.value || window.confirm('Substituir o rascunho pelo exemplo?')) {
        field.value = mission.delivery.artifact.text;
        field.dispatchEvent(new Event('input',{bubbles:true}));
      }
      field.focus();
      break;
    }
  }
});

root.addEventListener('input',event => {
  if (event.target.dataset.filter === 'query') {
    updateCatalog(event.target);
    return;
  }
  const {mission} = activeRoute;
  if (!mission) return;
  const saved = missionState(mission.id);
  if (event.target.id === 'editor') {
    saved.code = event.target.value;
    state.currentMission = mission.id;
    if (labResults.has(mission.id) && !running.has(mission.id)) {
      labResults.delete(mission.id);
      document.querySelector('#test-status').textContent = 'Código editado. Execute novamente para atualizar os resultados.';
      const list = root.querySelector('.tests');
      list.outerHTML = testList(mission,null);
      window.sprintSyntax.mount(root.querySelector('.tests'));
    }
  } else if (event.target.id === 'handoff-note') {
    saved.draft = event.target.value;
    event.target.setCustomValidity('');
  } else return;
  save();
});

root.addEventListener('keydown',event => {
  if (event.target.id === 'editor' && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    runTests(activeRoute.mission);
  }
});

root.addEventListener('change',event => {
  const {id,value} = event.target;
  if (event.target.dataset.catalog && event.target.dataset.filter !== 'query') updateCatalog(event.target);
  if (id === 'review-status') {
    reviewFilters.status = value;
    reviewFilters.limit = pageSize;
    document.querySelector('#review-results').innerHTML = reviewResults(reviewSchedule());
  }
  if (event.target.id === 'demo-status') updateDemo();
  if (event.target.id === 'handoff-status') {
    event.target.setCustomValidity('');
    missionState(activeRoute.mission.id).draftStatus = event.target.value;
    save();
  }
});

function updateCatalog(control) {
  const id = control.dataset.catalog;
  const {filters,results} = catalogs[id];
  filters[control.dataset.filter] = control.value;
  if (id === 'trail') filters.limit = pageSize;
  document.querySelector(`#${id}-results`).innerHTML = results();
}

function showMore(filters,container,results,focusTarget) {
  const previousLimit = filters.limit;
  filters.limit += pageSize;
  const list = document.querySelector(container);
  list.innerHTML = results();
  list.querySelectorAll(focusTarget)[previousLimit]?.focus();
}

root.addEventListener('submit',event => {
  if (event.target.id !== 'handoff') return;
  event.preventDefault();
  const {mission} = activeRoute;
  if (!mission || attempts.get(`${mission.id}-delivery`) !== mission.delivery.answer) return;
  const field = event.target.querySelector('#handoff-note');
  const handoff = field.value.trim();
  if (handoff.length < 20) {
    field.setCustomValidity('Escreva pelo menos 20 caracteres com a evidência e o próximo passo.');
    field.reportValidity();
    return;
  }
  const select = event.target.querySelector('#handoff-status');
  const expectedStatus = jiraStatus(mission);
  if (select.value !== expectedStatus) {
    select.setCustomValidity(`Use o status esperado neste fluxo: ${expectedStatus}.`);
    select.reportValidity();
    return;
  }
  const saved = missionState(mission.id);
  saved.draftStatus = select.value;
  saved.handoff = handoff;
  saved.done[2] = true;
  saved.completedAt = Date.now();
  save();
  announce('Entrega registrada. Mais 30 XP. Missão concluída.');
  render({focus:'#mission-complete'});
});

document.querySelector('.skip-link').addEventListener('click',event => {
  event.preventDefault();
  document.querySelector('#main').focus();
});
window.addEventListener('hashchange',() => render({navigationChanged:true}));
bindStackEvents();
bindTechEvents();
bindHttpEvents();
render();
