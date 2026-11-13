'use strict';

const visualCases = window.sprintVisualCases = {};
const visualReward = 40;

function visualRecords() {
  return state.visualIncidents ??= {};
}

function visualXp() {
  return Object.keys(visualCases).filter(id => state.visualIncidents?.[id]?.completed).length * visualReward;
}

function visualLink(id) {
  return `#plantao/telas/${id}`;
}

function visualCatalogue() {
  const records = visualRecords();
  const entries = Object.entries(visualCases);
  const completed = entries.filter(([id]) => records[id]?.completed).length;
  return `<div class="incident-home visual-catalogue">
    <a class="route-back" href="#plantao">${icon('back')} Voltar ao plantão</a>
    <section class="incident-hero">
      <div><p class="kicker">${icon('layers')} Plantão de incidentes</p><h1>Chamados com tela</h1>
        <p>Use a interface como o cliente usou. Reproduza o sintoma, escolha a correção e repita a operação na versão corrigida.</p></div>
      <div class="incident-hero-aside"><p>${icon('trophy')} <strong>${completed} de ${entries.length} chamados concluídos</strong></p>
        <progress value="${completed}" max="${entries.length}" aria-label="Progresso dos chamados com tela"></progress></div>
    </section>
    <div class="incident-catalog section">${entries.map(([id,scene]) => {
      const record = records[id];
      const status = record?.completed ? 'Concluído' : record ? 'Em andamento' : 'Disponível';
      return `<a class="panel visual-catalog-card" href="${visualLink(id)}">
        <p class="incident-variant-meta">${escape(scene.area)} · ${status}</p><h2>${escape(scene.title)}</h2>
        <p>${escape(scene.description)}</p><span class="visual-card-action">${record?.completed ? 'Rever chamado' : record ? 'Continuar chamado' : 'Abrir chamado'} ${icon('arrow')}</span>
      </a>`;
    }).join('')}</div>
  </div>`;
}

function visualInput(field,values) {
  const value = values?.[field.id] ?? field.value;
  const name = escape(field.id);
  const input = field.type === 'select' ? `<select name="${name}">${field.options.map(option => `<option value="${escape(option.value)}"${String(value) === String(option.value) ? ' selected' : ''}>${escape(option.label)}</option>`).join('')}</select>`
    : `<input name="${name}" type="${escape(field.type)}"${field.type === 'checkbox' ? (value ? ' checked' : '') : ` value="${escape(value)}"${field.type === 'text' ? ' maxlength="240"' : ''}`}>`;
  return `<label class="visual-field${field.type === 'checkbox' ? ' visual-checkbox' : ''}"><span>${escape(field.label)}</span>${input}</label>`;
}

function visualScreen(scene,record,fixed = false,interactive = true) {
  const phase = fixed ? 'after' : 'before';
  const {fields,actions,table,details,message} = scene.view(record[phase] ?? scene.create());
  const tone = ['error','success','info'].includes(message?.tone) ? message.tone : 'info';
  const controls = fields?.length ? `<div class="visual-fields">${fields.map(field => visualInput(field,record[`${phase}Inputs`])).join('')}</div>` : '';
  return `<section class="visual-screen" aria-label="${escape(scene.screen.title)}">
    <header class="visual-screen-header"><div><p class="kicker">${fixed ? 'Versão corrigida' : 'Tela de homologação'}</p><h2>${escape(scene.screen.title)}</h2></div>${icon('layers')}</header>
    <div class="visual-screen-body">
      <p class="note">${escape(scene.screen.context)}</p>
      ${interactive ? `<form id="visual-demo">
        ${controls}
        <div class="actions">${actions.map(action => `<button type="submit" class="button ${action.primary ? '' : 'secondary'}" value="${escape(action.id)}"${action.disabled ? ' disabled' : ''}>${escape(action.label)}</button>`).join('')}</div>
      </form>` : controls ? `<fieldset class="visual-readonly" disabled><legend class="sr-only">Valores após a correção</legend>${controls}</fieldset>` : ''}
      <div id="visual-demo-result" class="visual-screen-result" tabindex="-1">
        ${!fixed && record.reproduced ? `<p class="visual-reproduced">${icon('check')} Reprodução registrada</p>` : ''}
        ${message ? `<p class="visual-message ${tone}" role="status">${escape(message.text)}</p>` : ''}
        ${details?.length ? `<dl class="visual-details">${details.map(item => `<div><dt>${escape(item.label)}</dt><dd>${escape(item.value)}</dd></div>`).join('')}</dl>` : ''}
        ${table ? `<div class="visual-table"><table><thead><tr>${table.columns.map(column => `<th scope="col">${escape(column)}</th>`).join('')}</tr></thead>
          <tbody>${table.rows.length ? table.rows.map(row => `<tr>${row.map(cell => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${table.columns.length}">Nenhum registro</td></tr>`}</tbody></table></div>` : ''}
      </div>
    </div>
  </section>`;
}

function visualExercise(id) {
  const scene = visualCases[id];
  const record = visualRecords()[id] ??= {hints:0};
  const fixed = record.choice === scene.answer;
  const step = record.completed ? 3 : fixed ? 2 : record.reproduced ? 1 : 0;
  const choice = scene.choices[record.choice];
  return `<div class="incident-page visual-page">
    <a class="route-back" href="#plantao/telas">${icon('back')} Voltar aos chamados com tela</a>
    <div class="page-heading"><p class="kicker">${escape(scene.area)} · Chamado com tela</p><h1>${escape(scene.title)}</h1></div>
    <ol class="incident-steps" aria-label="Etapas do chamado">${['Reproduzir','Corrigir','Conferir','Concluir'].map((label,index) => `<li${index === step ? ' aria-current="step"' : index < step ? ' class="is-done"' : ''}><span>${index < step ? icon('check') : index + 1}</span>${label}</li>`).join('')}</ol>
    <div class="incident-layout">
      <div class="incident-workspace">
        ${record.completed ? `<section class="panel workspace-panel incident-completion"><h2 id="visual-step-heading" tabindex="-1">Chamado concluído · +${visualReward} XP</h2>
          <p>${escape(choice.feedback)}</p><div class="actions"><a class="button" href="#plantao/telas">Ver outros chamados ${icon('arrow')}</a>${scene.mission ? `<a class="button secondary" href="#tecnologia/${escape(scene.mission)}">Praticar no projeto local</a>` : ''}</div></section>` : `
          <section class="panel workspace-panel"><h2 id="visual-step-heading" tabindex="-1">${fixed ? 'Repita a operação na versão corrigida' : record.reproduced ? 'Confira o resultado da reprodução' : 'Reproduza na tela'}</h2>
            <p>${escape(fixed ? scene.verify ?? 'Refaça os passos do chamado e confira o comportamento esperado.' : record.reproduced ? 'Compare o resultado com o comportamento esperado e escolha uma correção.' : 'Siga o relato do suporte usando os controles da tela de homologação.')}</p></section>`}
        ${visualScreen(scene,record,fixed,!record.completed)}
        ${record.reproduced && !fixed ? `<section class="panel workspace-panel"><h2>Escolha a correção</h2><p>Identifique o ajuste que explica o comportamento que você observou.</p>
          <form id="visual-correction">
            ${incidentChoices('fix',scene.choices,record.choice,'Qual mudança resolve o chamado?')}
            ${choice ? `<p class="incident-feedback fail" id="visual-feedback" tabindex="-1" role="status">${escape(choice.feedback)}</p>` : ''}
            <div class="actions"><button class="button" type="submit">Testar correção ${icon('arrow')}</button></div>
          </form></section>` : ''}
      </div>
      <aside class="incident-aside" aria-label="Contexto do chamado">
        <section class="incident-slack"><h2 class="panel-title">${icon('slack')} Suporte · Slack simulado</h2><blockquote>${escape(scene.report)}</blockquote></section>
        <section class="panel workspace-panel"><h2>Comportamento esperado</h2><p>${escape(scene.goal)}</p>
          ${!record.completed ? `<div class="incident-hints"><h3>Pistas opcionais</h3>
            ${record.hints ? `<ol>${scene.hints.slice(0,record.hints).map(hint => `<li tabindex="-1">${escape(hint)}</li>`).join('')}</ol>` : ''}
            ${record.hints < scene.hints.length ? `<button class="button secondary" type="button" data-visual-hint>${record.hints ? 'Ver próxima pista' : 'Ver primeira pista'}</button>` : ''}
          </div>` : ''}</section>
        ${fixed && record.observed ? `<section class="panel workspace-panel"><h2>Antes da correção</h2><p>${escape(record.observed)}</p></section>` : ''}
      </aside>
    </div>
  </div>`;
}

function visualActiveContext() {
  const {visualId,incidentId} = activeRoute;
  if (visualId) {
    const scene = visualCases[visualId];
    const record = visualRecords()[visualId];
    if (!record.completed) return {scene,record,fixed:record.choice === scene.answer};
  }
  if (incidentId && Object.hasOwn(visualExistingCases,incidentId)) {
    const run = incidentRun(incidentId);
    if (!run.fixStarted && !run.completedAt) return {scene:visualExistingCases[incidentId],record:run.visual ??= {},fixed:false};
  }
  return null;
}

function visualFormValues(form,fields = []) {
  const data = new FormData(form);
  return Object.fromEntries(fields.map(field => [field.id,field.type === 'checkbox' ? data.has(field.id) : String(data.get(field.id) ?? '')]));
}

function bindVisualEvents() {
  root.addEventListener('input',event => {
    const form = event.target.form;
    if (form?.id !== 'visual-demo') return;
    const context = visualActiveContext();
    if (!context) return;
    const {scene,record,fixed} = context;
    const phase = fixed ? 'after' : 'before';
    record[`${phase}Inputs`] = visualFormValues(form,scene.view(record[phase] ?? scene.create()).fields);
    save();
  });

  root.addEventListener('submit',event => {
    const form = event.target;
    if (!['visual-demo','visual-correction'].includes(form.id)) return;
    event.preventDefault();
    const context = visualActiveContext();
    if (!context) return;
    const {scene,record,fixed} = context;
    if (form.id === 'visual-correction') {
      if (!activeRoute.visualId || !record.reproduced || fixed) return;
      const choice = incidentSelection(form,'fix',scene.choices);
      if (choice === null) return;
      record.choice = choice;
      incidentRefresh(choice === scene.answer ? '#visual-step-heading' : '#visual-feedback');
      return;
    }
    const phase = fixed ? 'after' : 'before';
    const model = record[phase] ?? scene.create();
    const {actions,fields} = scene.view(model);
    const action = event.submitter?.value;
    if (!actions.some(item => item.id === action && !item.disabled)) return;
    const result = scene.interact(model,action,visualFormValues(form,fields),fixed);
    record[phase] = result.state;
    delete record[`${phase}Inputs`];
    if (!fixed && result.outcome === 'reproduced') {
      record.reproduced = true;
      record.observed = scene.view(result.state).message?.text;
      announce('Erro reproduzido na tela.');
    }
    if (fixed && record.reproduced && result.outcome === 'verified') {
      record.completed = true;
      announce(`Correção conferida. Mais ${visualReward} XP.`);
    }
    incidentRefresh(record.completed ? '#visual-step-heading' : '#visual-demo-result');
  });

  root.addEventListener('click',event => {
    if (!event.target.closest('[data-visual-hint]') || !activeRoute.visualId) return;
    const {scene,record} = visualActiveContext();
    record.hints = Math.min(record.hints + 1,scene.hints.length);
    incidentRefresh('.visual-page .incident-hints li:last-child');
  });
}
