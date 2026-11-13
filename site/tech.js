'use strict';

const techMissions = [...window.techBackend,...window.techFrontend];
const allTechMissions = [...techMissions,...hemoProjectMissions];
const techById = Object.fromEntries(allTechMissions.map(item => [item.id,item]));
const techNames = {
  csharp:'C#', aspnet:'ASP.NET Core / .NET 10', efcore:'Entity Framework Core 10',
  typescript:'TypeScript', angular:'Angular 21'
};
const techFilters = {query:'',group:'',level:'',status:''};
const techArchive = 'Sprint Web - Projetos.zip';
const techArchiveData = '';

function techRecords() {
  return state.tech ??= {};
}

function techProgress(mission) {
  const record = techRecords()[mission.id];
  return record?.completed ? 'done' : record?.started ? 'active' : 'new';
}

function techStats(list = allTechMissions) {
  const completed = list.filter(mission => techProgress(mission) === 'done').length;
  return {completed,xp:completed * 40};
}

function techHref(mission) {
  return `#tecnologia/${mission.id}`;
}

function techDownload(label = 'Baixar projetos') {
  return `<a class="button secondary" href="${techArchiveData || encodeURI(techArchive)}" download="${techArchive}">${label} ${icon('external')}</a>`;
}

function techHome() {
  const count = techStats(techMissions).completed;
  return `<section class="tech-hero">
    <div><p class="hero-label">${icon('terminal')} Laboratório local</p><h1>C# e Angular no mesmo produto.</h1>
      <p>Implemente a API do Portal de Pedidos com ASP.NET Core e EF Core. Depois, trabalhe na interface Angular que consome o mesmo contrato.</p>
      <div class="actions">${techDownload()}<a class="button tech-hero-link" href="#cliente-http">Praticar requisições ${icon('arrow')}</a></div>
    </div>
    <div class="tech-pair">
      <div>${tile('database','violet')}<span><strong>Backend</strong><small>C# · .NET 10 · EF Core · SQLite</small></span></div>
      <div>${tile('layers','mint')}<span><strong>Frontend</strong><small>TypeScript 5.9 · Angular 21</small></span></div>
    </div>
  </section>
  <section class="section" aria-labelledby="tech-catalog-title">
    <div class="section-heading"><div><h2 id="tech-catalog-title">Missões de tecnologia</h2><p>${count} de ${techMissions.length} práticas concluídas. Use o ZIP para executar o código na sua máquina.</p></div></div>
    ${catalogControls('tech',techFilters,Object.entries(techNames),{placeholder:'Ex.: EF Core, formulários ou NET-301',groupTitle:'Tecnologia',allGroups:'Todas as tecnologias'},techMissions)}
    <div id="tech-results">${techResults()}</div>
  </section>`;
}

function techResults() {
  const items = matchingMissions(techMissions,techFilters,item => item.technologies,techProgress,item => item.technologies.map(id => techNames[id]));
  return `<p class="result-count" role="status">${items.length} ${items.length === 1 ? 'missão encontrada' : 'missões encontradas'}</p>
    ${items.length ? `<div class="card-grid">${items.map(techCard).join('')}</div>` : emptyCatalog('tech')}`;
}

function techCard(item) {
  const progress = techProgress(item);
  const backend = item.technologies.includes('csharp');
  return `<a class="mission-card" href="${techHref(item)}">
    <div class="mission-top">${tile(backend ? 'database' : 'layers',backend ? 'violet' : 'mint')}
      <div class="mission-badges">${levelBadge(item)}${progress === 'done' ? `<span class="mission-status done">${icon('check')} Concluída</span>` : progress === 'active' ? '<span class="mission-status next">Em andamento</span>' : ''}</div>
    </div>
    <div class="kicker">${item.id} · ${backend ? 'Backend' : 'Frontend'}</div><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p>
    <div class="mission-bottom"><span>${icon('clock')} ${item.minutes} min</span><span>${backend ? 'C# e .NET 10' : 'Angular e TypeScript'}</span>${icon('arrow')}</div>
  </a>`;
}

function techLayersReady(item,record) {
  return !item.sections || item.sections.every((_,index) => record.layers?.[index]);
}

function techLayerSection(section,index,record) {
  return `<section class="panel workspace-panel">
    <h2>${escape(section.title)}</h2>
    <p class="tech-file">${icon('terminal')} <code>${escape(section.file)}</code></p>
    <div class="stack-task">${escape(section.goal)}</div>
    <details class="support-details"><summary>Ver trecho de referência</summary>${codeBlock(section.example.code,section.example.language)}</details>
    <label class="tech-layer-check" for="tech-layer-${index}">
      <input type="checkbox" id="tech-layer-${index}" data-tech-layer="${index}"${record.layers?.[index] ? ' checked' : ''}${record.completed ? ' disabled' : ''}>
      Verifiquei no projeto local · ${escape(section.title)}
    </label>
  </section>`;
}

function techPage(item) {
  const record = techRecords()[item.id] ?? {};
  const quizKey = `${item.id}-tech`;
  const correct = record.completed || record.correct;
  const layersReady = techLayersReady(item,record);
  const hemo = isHemoMission(item);
  const returnLink = hemo ? '#hemoterapia' : '#tecnologias';
  return `<a class="route-back" href="${returnLink}">${icon('back')} ${hemo ? 'Hemoterapia' : 'Tecnologias'}</a>
    <div class="page-heading mission-heading"><p class="kicker">${item.id} · ${item.sections ? 'Full Stack local' : 'Projeto local'}</p><h1>${escape(item.title)}</h1><p>${escape(item.description)}</p>
      <div class="skills">${levelBadge(item)}${item.technologies.map(id => `<span class="skill">${escape(techNames[id])}</span>`).join('')}</div></div>
    ${missionGuidePanel(item,0)}
    <div class="workspace-grid tech-workspace">
      <div class="stack">
        ${item.sections ? `
          <section class="panel workspace-panel"><h2>Chamado no Jira</h2><p>${escape(item.delivery.ticket)}</p>
            <h3 class="stack-subheading">Critérios de aceite</h3>
            <ul class="criteria">${item.criteria.map(criterion => `<li>${escape(criterion)}</li>`).join('')}</ul>
          </section>
          ${item.sections.map((section,index) => techLayerSection(section,index,record)).join('')}` : `<section class="panel workspace-panel">
          <h2>Implemente no projeto</h2><p>Abra o arquivo indicado após extrair o ZIP. Rode a verificação no terminal.</p>
          <p class="tech-file">${icon('terminal')} <code>${escape(item.file)}</code></p>
          <div class="stack-task">${escape(item.goal)}</div>
          <h3 class="stack-subheading">Critérios de aceite</h3>
          <ul class="criteria">${item.criteria.map(criterion => `<li>${escape(criterion)}</li>`).join('')}</ul>
          <details class="support-details"><summary>Ver trecho de referência</summary>${codeBlock(item.example.code,item.example.language)}</details>
        </section>`}
        <section class="panel workspace-panel">
          <h2>${item.sections ? 'Validação e entrega' : 'Confira o que aprendeu'}</h2>
          ${item.delivery ? `<dl class="tech-delivery"><dt>Slack</dt><dd>${escape(item.delivery.slack)}</dd><dt>Pull request</dt><dd>${escape(item.delivery.pullRequest)}</dd></dl>` : ''}
          ${quiz(item.question,quizKey,correct)}
          ${record.completed ? `<div class="completion" id="tech-complete" tabindex="-1">${icon('trophy')}<div><strong>Prática concluída · 40 XP</strong><p>Validação registrada por você.</p></div></div>
            <pre class="artifact">${escape(record.evidence)}</pre><div class="actions"><a class="button secondary" href="${returnLink}">Voltar à trilha</a></div>`
          : correct && layersReady ? `<form id="tech-check-form">
            <label for="tech-evidence" class="field-label">${item.sections ? 'Que evidências você colocaria na entrega?' : 'O que você observou ao rodar a verificação?'}</label>
            <textarea id="tech-evidence" class="handoff-note" rows="3" required minlength="20" maxlength="1200" placeholder="${item.sections ? 'Registre o resultado na API e na tela.' : 'Ex.: a segunda atualização com o ETag antigo retornou 412.'}">${escape(record.draft ?? '')}</textarea>
            <div class="actions"><button class="button" type="submit">Registrar minha validação ${icon('check')}</button></div>
          </form>` : correct ? '<p role="status">Marque as duas verificações locais para registrar a entrega.</p>' : ''}
        </section>
      </div>
      <aside class="stack">
        <section class="panel workspace-panel">
          <h3 class="panel-title">${icon('terminal')} Como verificar</h3>
          ${item.sections ? `<p><strong>${item.sections.filter((_,index) => record.layers?.[index]).length} de ${item.sections.length} camadas verificadas</strong></p>` : ''}
          <p class="tech-verify">${escape(item.verify)}</p>
          <div class="actions">${techDownload()}<a class="button quiet" href="#como-usar">Ver o guia</a></div>
          ${item.httpLesson ? `<details class="support-details" open><summary>Praticar o contrato HTTP</summary><p>O cliente simulado permite experimentar a requisição antes de testar seu projeto local.</p><div class="actions"><a class="button secondary" href="#${hemo ? 'cliente-hemoterapia' : 'cliente-http'}/${escape(item.httpLesson)}">Abrir Cliente HTTP ${icon('arrow')}</a></div></details>` : ''}
        </section>
      </aside>
    </div>`;
}

function techAnswer(item,index) {
  const key = `${item.id}-tech`;
  const record = techRecords()[item.id] ??= {};
  if (!item.question.choices[index] || record.completed || record.correct) return;
  attempts.set(key,index);
  record.started = true;
  record.correct = index === item.question.answer;
  save();
  render({focus:'#quiz-feedback'});
}

function bindTechEvents() {
  root.addEventListener('change',event => {
    const item = activeRoute.tech;
    const layer = event.target.dataset.techLayer;
    if (!item?.sections || layer === undefined || !item.sections[layer]) return;
    const record = techRecords()[item.id] ??= {};
    if (record.completed) return;
    record.started = true;
    (record.layers ??= [])[layer] = event.target.checked;
    save();
    render({focus:`#tech-layer-${layer}`});
  });
  root.addEventListener('input',event => {
    const item = activeRoute.tech;
    if (!item || event.target.id !== 'tech-evidence') return;
    techRecords()[item.id].draft = event.target.value;
    event.target.setCustomValidity('');
    save();
  });
  root.addEventListener('submit',event => {
    const item = activeRoute.tech;
    if (!item || event.target.id !== 'tech-check-form') return;
    event.preventDefault();
    const record = techRecords()[item.id];
    if (!record?.correct || record.completed || !techLayersReady(item,record)) return;
    const field = event.target.querySelector('#tech-evidence');
    const evidence = field.value.trim();
    if (evidence.length < 20) {
      field.setCustomValidity('Descreva em pelo menos 20 caracteres o que você observou no teste local.');
      field.reportValidity();
      return;
    }
    record.evidence = evidence;
    record.completed = true;
    delete record.draft;
    save();
    announce('Prática registrada. Mais 40 XP.');
    render({focus:'#tech-complete'});
  });
}
