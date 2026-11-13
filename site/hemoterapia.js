'use strict';

const hemoBrowserMissions = [...window.hemoCycleMissions,...window.hemoOperationsMissions];
const hemoStackMissions = window.hemoFullstackMissions;
const hemoMissions = [...hemoBrowserMissions,...hemoStackMissions,...hemoProjectMissions];
const hemoIds = new Set(hemoMissions.map(mission => mission.id));
const hemoAreas = {
  coleta:'Doação e coleta', estoque:'Processamento e estoque', transfusao:'Fluxo transfusional',
  vigilancia:'Hemovigilância e qualidade', integracao:'Integrações e segurança'
};
const hemoTypes = {
  browser:'Laboratório no navegador', stack:'Full Stack no navegador',
  tech:'Projeto local .NET ou Angular', 'full-local':'Full Stack local com .NET e Angular'
};
const hemoShortcuts = [
  ['Full Stack local','full-local',''],['Projetos .NET','tech','aspnet'],['Projetos Angular','tech','angular']
];
const hemoTechnology = {
  javascript:'JavaScript',csharp:'C#',aspnet:'ASP.NET Core / .NET 10',efcore:'Entity Framework Core',
  typescript:'TypeScript',angular:'Angular',http:'HTTP',sqlserver:'SQL Server',foxpro:'Visual FoxPro',
  jira:'Jira',slack:'Slack',git:'Git / CI',privacidade:'Privacidade'
};
const hemoFilters = {query:'',group:'',level:'',status:'',kind:'',technology:'',limit:12};

function isHemoMission(mission) {
  return Boolean(mission && hemoIds.has(mission.id));
}

function hemoType(mission) {
  return mission.format === 'full-local' ? 'full-local' : mission.backend ? 'stack' : mission.file ? 'tech' : 'browser';
}

function hemoHref(mission) {
  const type = hemoType(mission);
  return type === 'stack' ? stackHref(mission) : type === 'browser' ? missionHref(mission.id) : techHref(mission);
}

function hemoProgress(mission) {
  const type = hemoType(mission);
  if (type === 'tech' || type === 'full-local') return techProgress(mission);
  const {done} = type === 'stack' ? stackState(mission) : missionState(mission.id);
  return done.at(-1) ? 'done' : done.some(Boolean) ? 'active' : 'new';
}

function hemoTechnologies(mission) {
  if (mission.format === 'full-local') return [...mission.technologies,'http','jira','slack','git'];
  return mission.technologies ?? [];
}

function hemoHome() {
  const next = hemoMissions.find(mission => hemoProgress(mission) === 'active')
    ?? hemoBrowserMissions.find(mission => missionGuide[mission.id].level === 'essencial' && hemoProgress(mission) === 'new')
    ?? hemoMissions.find(mission => hemoProgress(mission) === 'new');
  const levels = levelOptions.map(([id,label]) => [label,hemoMissions.filter(mission => missionGuide[mission.id].level === id).length]);
  const tech = [...new Set(hemoMissions.flatMap(hemoTechnologies))]
    .map(id => [id,hemoTechnology[id] ?? id]).sort((a,b) => a[1].localeCompare(b[1],'pt-BR'));
  const completed = hemoMissions.filter(mission => hemoProgress(mission) === 'done').length;
  return `<section class="hemo-hero">
    <div><p class="hero-label">${icon('activity')} Laboratório de produto · dados sintéticos</p>
      <h1 id="hero-title">Desenvolva um sistema de hemoterapia.</h1>
      <p>Assuma chamados de uma empresa fictícia de software. Investigue o fluxo da coleta ao destino do hemocomponente, teste as mudanças e registre a entrega com a equipe.</p>
      <div class="actions">
        ${next ? `<a class="button" href="${hemoHref(next)}">${hemoProgress(next) === 'active' ? 'Continuar' : 'Começar'} ${next.id} ${icon('arrow')}</a>` : ''}
        <a class="button secondary" href="#cliente-hemoterapia">Abrir Cliente HTTP ${icon('terminal')}</a>
        <a class="button secondary" href="#plantao">Abrir Plantão ${icon('route')}</a>
      </div>
    </div>
    <div class="hemo-overview">
      <div class="hemo-overview-title">${icon('trophy')} <strong>${completed} de ${hemoMissions.length} missões concluídas</strong></div>
      <progress value="${completed}" max="${hemoMissions.length}" aria-label="Progresso em hemoterapia"></progress>
      <dl>${levels.map(([label,count]) => `<div><dt>${label}</dt><dd>${count}</dd></div>`).join('')}</dl>
    </div>
  </section>
  <section class="section" aria-labelledby="hemo-title">
    <div class="section-heading"><div><h2 id="hemo-title">Exercícios de hemoterapia</h2>
      <p>${hemoBrowserMissions.length + hemoStackMissions.length} práticas no navegador e ${hemoProjectMissions.length} missões em projetos .NET e Angular.</p></div></div>
    <div class="hemo-orientation"><p><strong>Comece pelo nível Essencial</strong> para praticar fluxos e validações com pistas. Em Intermediário e Avançado, combine camadas, trate concorrência e revise privacidade.</p>
      <p>Os casos usam dados fictícios e regras didáticas de software. Decisões clínicas, critérios de doação e liberação transfusional pertencem aos protocolos e equipes responsáveis.</p></div>
    <div class="hemo-shortcuts" role="group" aria-label="Atalhos para projetos locais">
      ${hemoShortcuts.map(([label,kind,technology],index) => `<button class="button secondary" type="button" data-action="hemo-shortcut" data-index="${index}">${label}</button>`).join('')}
    </div>
    ${catalogControls('hemo',hemoFilters,Object.entries(hemoAreas),{
      placeholder:'Ex.: rastreabilidade, quarentena ou HEM-101',groupTitle:'Área do produto',allGroups:'Todas as áreas',
      extra:[['kind','Tipo de prática',[['','Todos os tipos'],...Object.entries(hemoTypes)]],['technology','Tecnologia ou ferramenta',[['','Todas'],...tech]]]
    },hemoMissions)}
    <div id="hemo-results">${hemoResults()}</div>
  </section>
  <section class="panel workspace-panel section"><h3 class="panel-title">${icon('book')} Referências do domínio</h3>
    <p>Consulte as fontes de contexto operacional e as leituras técnicas de cada missão.</p>
    <details class="support-details"><summary>Glossário para começar</summary>
      <ul>
        <li><strong>Hemocomponente.</strong> Produto obtido do processamento do sangue, como concentrado de hemácias, plasma ou concentrado de plaquetas.</li>
        <li><strong>Amostra.</strong> Material identificado e vinculado à coleta ou ao atendimento para os exames previstos no processo.</li>
        <li><strong>Rastreabilidade.</strong> Possibilidade de acompanhar a origem, as movimentações e o destino de uma unidade pelos registros.</li>
        <li><strong>Hemovigilância.</strong> Acompanhamento de eventos adversos no ciclo do sangue, incluindo registro e investigação.</li>
        <li><strong>Quarentena no exercício.</strong> Estado operacional do estoque que impede tratá-lo como disponível na interface.</li>
      </ul>
    </details>
    <ul class="criteria">
      <li>${link('https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11685_03_07_2026.html','Ministério da Saúde · Regulamentos de hemoterapia')}</li>
      <li>${link('https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/hemovigilancia/sistema-nacional','Anvisa · Sistema Nacional de Hemovigilância')}</li>
    </ul>
  </section>`;
}

function hemoResults() {
  const {kind,technology,limit} = hemoFilters;
  const candidates = hemoMissions.filter(mission => (!kind || hemoType(mission) === kind) && (!technology || hemoTechnologies(mission).includes(technology)));
  const filtered = matchingMissions(candidates,hemoFilters,mission => mission.area,hemoProgress,mission => [
    ...(mission.skills ?? []),hemoAreas[mission.area],hemoTypes[hemoType(mission)],...hemoTechnologies(mission).map(id => hemoTechnology[id] ?? id)
  ]);
  return `<p class="result-count" role="status">${filtered.length} ${filtered.length === 1 ? 'missão encontrada' : 'missões encontradas'}${filtered.length > limit ? ` · ${limit} visíveis` : ''}</p>
    ${filtered.length ? `<div class="card-grid">${filtered.slice(0,limit).map(hemoCard).join('')}</div>${moreButton('hemo-more',filtered.length,limit,'missões')}` : emptyCatalog('hemo')}`;
}

function hemoCard(mission) {
  const progress = hemoProgress(mission);
  const type = hemoType(mission);
  const techBackend = mission.technologies?.includes('csharp');
  const typeLabel = {
    tech:techBackend ? 'Projeto .NET' : 'Projeto Angular', stack:'Full Stack',
    'full-local':'Full Stack local', browser:'Navegador'
  }[type];
  return `<a class="mission-card hemo-card" href="${hemoHref(mission)}">
    <div class="mission-top">${tile(mission.icon ?? (techBackend ? 'database' : 'layers'),mission.theme ?? 'mint')}
      <div class="mission-badges">${levelBadge(mission)}${progress === 'done' ? `<span class="mission-status done">${icon('check')} Concluída</span>` : progress === 'active' ? '<span class="mission-status next">Em andamento</span>' : ''}</div></div>
    <p class="kicker hemo-card-kicker">${mission.id} · ${escape(hemoAreas[mission.area])}</p>
    <h3>${escape(mission.title)}</h3><p>${escape(mission.description)}</p>
    <div class="mission-bottom"><span>${icon('clock')} ${mission.minutes} min</span><span>${typeLabel}</span>${icon('arrow')}</div>
  </a>`;
}

function diverseHome() {
  const next = recommendedMission();
  const groups = [
    ['route','Trilha de produto',`${missions.length} tickets do Portal de Pedidos. Pratique HTTP, SQL Server, Git, segurança e entrega em equipe.`,'#trilha'],
    ['layers','Trilha Full Stack',`${stackMissions.length} missões ligando backend, frontend, Jira, Slack e PR no Portal de Pedidos.`,'#fullstack'],
    ['database','Tecnologias',`${techMissions.length} tarefas nos projetos .NET e Angular do Portal de Pedidos.`,'#tecnologias'],
    ['terminal','Cliente HTTP · Pedidos','Monte requisições, pratique ETag e reproduza conflitos na API simulada do Portal de Pedidos.','#cliente-http']
  ];
  return `<section class="hero" aria-labelledby="diverse-title"><img class="hero-art" src="assets/hero.webp" alt="" width="1050" height="700">
    <div class="hero-copy"><p class="hero-label">${icon('layers')} Outros produtos e ferramentas</p><h1 id="diverse-title">Exercícios diversos</h1>
      <p>Retome as trilhas e laboratórios do Portal de Pedidos.</p>${next ? `<a class="button" href="${missionHref(next.id)}">${missionState(next.id).done[0] ? 'Continuar missão' : 'Começar missão'} ${icon('arrow')}</a>` : ''}</div></section>
    <div class="section study-grid help-entry">${groups.map(([name,title,description,href]) => `<article class="panel study-card">${tile(name)}<h2>${title}</h2><p>${description}</p><a class="button" href="${href}">Abrir ${title} ${icon('arrow')}</a></article>`).join('')}</div>`;
}
