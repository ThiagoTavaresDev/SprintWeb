'use strict';

const incidentCases = window.sprintIncidentCases;
const incidentByVariant = new Map(Object.entries(incidentCases).flatMap(([caseId,exercise]) =>
  Object.entries(exercise.variants).map(([id,variant]) => [id,{caseId,exercise,variant}])));
const incidentStages = ['Investigar','Corrigir','Revisar PR','Concluir'];
const incidentReward = 50;
const incidentReviewReward = 10;

function incidentState() {
  return state.incident ??= {runs:{}};
}

function incidentRun(id) {
  return incidentState().runs[id] ??= {http:{},hints:0};
}

function incidentDiagnosed(variant,run) {
  return run.diagnosis === variant.diagnosis.answer;
}

function incidentHasEvidence(id,exercise,run) {
  return visualEvidenceReady(id,run) && run.network && exercise.probes.every(probe => Object.hasOwn(run.http,probe.id));
}

function incidentPassed(id,run) {
  const {exercise,variant} = incidentByVariant.get(id);
  return Number.isInteger(run.patch) && Object.hasOwn(variant.patches,run.patch) &&
    exercise.checks(id,run.patch).every(row => row.pass);
}

function incidentFoundRegression(exercise,run) {
  return Number.isInteger(run.test) && exercise.reviewChecks(run.test).some(row => !row.pass);
}

function incidentObserveHttp(id,request,response) {
  const {exercise} = incidentByVariant.get(id);
  const evidence = exercise.observe(request,response);
  if (!evidence || !exercise.probes.some(probe => probe.id === evidence.id)) return false;
  incidentRun(id).http[evidence.id] = evidence.summary;
  return true;
}

function incidentReviewInfo(caseId) {
  const record = incidentState();
  const completions = Object.keys(incidentCases[caseId].variants).map(id => record.runs[id]?.completedAt).filter(Boolean);
  if (!completions.length) return null;
  const due = new Date(Math.min(...completions));
  due.setDate(due.getDate() + 3);
  const done = Boolean(record.reviews?.[caseId] ?? (caseId === 'estoque' && record.reviewed));
  return {caseId,due,ready:due.getTime() <= Date.now(),done};
}

function incidentReviewSchedule() {
  return Object.keys(incidentCases).map(incidentReviewInfo).filter(Boolean);
}

function incidentReviewCard(review) {
  if (!review) return '';
  const {caseId} = review;
  const summary = review.done ? 'Revisão concluída' : review.ready ? `Disponível · +${incidentReviewReward} XP` : `Abre em ${dateFormat.format(review.due)}`;
  return `<article class="panel workspace-panel incident-review-card">
    <div>${tile('repeat','mint')}<div><h3>${escape(incidentCases[caseId].title)} · D+3</h3><p>${summary}</p></div></div>
    ${review.ready || review.done ? `<a class="button ${review.done ? 'secondary' : ''}" href="#plantao/revisao/${caseId}">${review.done ? 'Rever resposta' : 'Abrir revisão'} ${icon('arrow')}</a>` : ''}
  </article>`;
}

function incidentXp() {
  const record = incidentState();
  const completed = [...incidentByVariant.keys()].filter(id => record.runs[id]?.completedAt).length;
  const reviewed = incidentReviewSchedule().filter(review => review.done).length;
  return completed * incidentReward + reviewed * incidentReviewReward;
}

function incidentHome() {
  const entries = [...incidentByVariant.entries()];
  const runs = incidentState().runs;
  const completed = entries.filter(([id]) => runs[id]?.completedAt).length;
  const next = entries.find(([id]) => runs[id] && !runs[id].completedAt) ?? entries.find(([id]) => !runs[id]?.completedAt);
  const practiced = caseId => Object.keys(incidentCases[caseId].variants).some(id => runs[id] && incidentPassed(id,runs[id]));
  const demonstrated = [
    ['terminal','Diagnóstico HTTP','Compare a captura da interface com as respostas da API.',entries.some(([id,{variant}]) => runs[id] && incidentDiagnosed(variant,runs[id]))],
    ['layers','Angular','Valide a requisição que a tela envia ao mudar de página.',runs.frontend && incidentPassed('frontend',runs.frontend)],
    ['database','EF Core','Valide o recorte dos registros e preserve o total do estoque.',runs.backend && incidentPassed('backend',runs.backend)],
    ['git','Teste de regressão','Encontre um cenário que uma correção deixou de cobrir.',entries.some(([id,{exercise}]) => runs[id] && incidentFoundRegression(exercise,runs[id]))],
    ['repeat','Cache e ETag','Investigue a versão de uma etiqueta e o efeito de um HTTP 304.',practiced('etag')],
    ['check','Validação de formulários','Rastreie os erros por campo entre a API e a interface.',practiced('validacao')],
    ['chat','Diagnóstico para suporte','Rastreie a referência de um erro do servidor até a tela.',practiced('suporte')]
  ];
  return `<div class="incident-home">
    <section class="incident-hero">
      <div><p class="kicker">${icon('activity')} Hemoterapia</p>
        <h1>Plantão de incidentes</h1>
        <p>Escolha um chamado do suporte, investigue a causa e comprove a correção. Cada chamado tem duas ocorrências com o mesmo sintoma.</p>
        <div class="actions">
          ${next ? `<a class="button" href="#plantao/${next[0]}">${runs[next[0]] ? 'Retomar ocorrência' : 'Começar investigação'} ${icon('arrow')}</a>` : `<button type="button" class="button" data-incident-action="competencies">Ver competências ${icon('arrow')}</button>`}
          <a class="button secondary visual-entry" href="#plantao/telas">Chamados com tela ${icon('layers')}</a>
        </div>
      </div>
      <div class="incident-hero-aside">
        <p>${icon('trophy')} <strong>${completed} de ${entries.length} ocorrências concluídas</strong></p>
        <progress max="${entries.length}" value="${completed}" aria-label="Progresso no plantão"></progress>
        <p>${demonstrated.filter(([, , ,done]) => done).length} de ${demonstrated.length} competências demonstradas</p>
      </div>
    </section>
    <section class="section" aria-labelledby="incident-variants-title">
      <div class="section-heading"><h2 id="incident-variants-title">Chamados para investigar</h2></div>
      <div class="incident-catalog">${Object.values(incidentCases).map(exercise => `<article class="panel workspace-panel incident-exercise">
        <p class="incident-variant-meta">${escape(exercise.area)} · ${escape(exercise.minutes)} min por ocorrência</p>
        <h3>${escape(exercise.title)}</h3><p>${escape(exercise.description)}</p>
        <div class="incident-variants">${Object.entries(exercise.variants).map(([id,variant]) => {
          const run = runs[id];
          const status = run?.completedAt ? 'Concluída' : run ? 'Em andamento' : 'Disponível';
          return `<a class="panel incident-variant" href="#plantao/${id}">
            ${tile('chat','mint')}<div><strong>${escape(variant.label)}</strong><p>${status}</p></div>${icon('arrow')}
          </a>`;
        }).join('')}</div>
      </article>`).join('')}</div>
    </section>
    <section class="section" aria-labelledby="incident-competencies-title" id="incident-competencies">
      <div class="section-heading"><h2 id="incident-competencies-title" tabindex="-1">Competências deste plantão</h2></div>
      <div class="incident-competencies">${demonstrated.map(([symbol,label,description,done]) => `<article class="panel incident-competency">
        ${tile(symbol,done ? 'mint' : 'violet')}<h3>${label}</h3><p>${description}</p>
        <span class="incident-variant-meta${done ? ' is-done' : ''}">${icon(done ? 'check' : 'dot')} ${done ? 'Demonstrada' : 'A praticar'}</span>
      </article>`).join('')}</div>
    </section>
    ${incidentReviewSchedule().map(incidentReviewCard).join('')}
  </div>`;
}

function incidentCapture(variant) {
  return `${codeBlock(`${variant.network.request}\n\n${variant.network.response}`,'http')}
    ${variant.network.body === null ? '<p class="note">Resposta sem corpo.</p>' : codeBlock(JSON.stringify(variant.network.body,null,2),'json')}`;
}

function incidentHttpEvidence(exercise,run) {
  return `<ul class="criteria">
    ${exercise.probes.map(probe => {
      const result = run.http[probe.id];
      const summary = Array.isArray(result) ? result.join(', ') || 'Sem itens' : result;
      return `<li><strong>${escape(probe.label)}</strong> · ${escape(summary ?? 'Aguardando requisição')}</li>`;
    }).join('')}
  </ul>`;
}

function incidentChoices(name,options,selected,legend) {
  return `<fieldset class="incident-choice-group"><legend>${legend}</legend>${options.map((option,index) => `<div class="incident-patch">
    <label><input type="radio" name="${name}" value="${index}"${selected === index ? ' checked' : ''} required> <strong>${escape(option.label)}</strong></label>
    ${option.code ? codeBlock(option.code,option.language) : ''}
  </div>`).join('')}</fieldset>`;
}

function incidentHintPanel(variant,run) {
  return `<div class="incident-hints"><h3>Pistas opcionais</h3>
    ${run.hints ? `<ol>${variant.hints.slice(0,run.hints).map(hint => `<li tabindex="-1">${escape(hint)}</li>`).join('')}</ol>` : ''}
    ${run.hints < variant.hints.length ? `<button class="button secondary" type="button" data-incident-action="hint">${run.hints ? 'Ver próxima pista' : 'Ver primeira pista'}</button>` : ''}
  </div>`;
}

function incidentTestResults(rows) {
  return `<div class="incident-tests">${rows.map(row => `<article class="incident-test ${row.pass ? 'pass' : 'fail'}">
    <h3>${icon(row.pass ? 'check' : 'close')} ${escape(row.name)} <span class="sr-only">${row.pass ? 'passou' : 'falhou'}</span></h3>
    <div class="incident-test-values"><p><strong>Esperado</strong><code>${escape(row.expected)}</code></p>
      <p><strong>Observado</strong><code>${escape(row.actual)}</code></p></div>
  </article>`).join('')}</div>`;
}

function incidentInvestigation(id,exercise,variant,run) {
  const reproduced = visualEvidenceReady(id,run);
  const enough = incidentHasEvidence(id,exercise,run);
  const diagnosed = incidentDiagnosed(variant,run);
  return `<section class="panel workspace-panel incident-evidence">
    <h2 id="incident-step-heading" tabindex="-1">Investigue o chamado</h2>
    <p>${escape(exercise.investigation)}</p>
    <div class="actions incident-evidence-list">
      <button class="button secondary" type="button" data-incident-action="network" aria-controls="incident-capture"${run.network || !reproduced ? ' disabled' : ''}>${icon('activity')} ${run.network ? 'Captura aberta' : 'Ver captura da interface'}</button>
      <a class="button secondary" href="#cliente-plantao/${id}">${icon('terminal')} Comparar no Cliente HTTP</a>
    </div>
    ${reproduced ? '' : '<p class="note">Reproduza o erro na tela de homologação para liberar a captura.</p>'}
    <div id="incident-capture" tabindex="-1"${run.network && reproduced ? '' : ' hidden'}>${run.network && reproduced ? incidentCapture(variant) : ''}</div>
    ${incidentHttpEvidence(exercise,run)}
    ${incidentHintPanel(variant,run)}
    ${diagnosed ? `<p class="incident-feedback" id="incident-feedback" role="status" tabindex="-1">${escape(variant.diagnosis.choices[run.diagnosis].feedback)}</p>
      <div class="actions"><button class="button" type="button" data-incident-action="fix"${enough ? '' : ' disabled'}>Abrir correção ${icon('arrow')}</button></div>` : `
      <form id="incident-diagnosis">
        ${incidentChoices('hypothesis',variant.diagnosis.choices,run.diagnosis,'Qual hipótese explica a captura e as respostas?')}
        ${run.diagnosis === undefined ? '' : `<p class="incident-feedback fail" id="incident-feedback" role="status" tabindex="-1">${escape(variant.diagnosis.choices[run.diagnosis].feedback)}</p>`}
        ${enough ? '' : '<p class="note">Reproduza o erro, abra a captura e registre as respostas do Cliente HTTP para confirmar sua hipótese.</p>'}
        <div class="actions"><button class="button" type="submit"${enough ? '' : ' disabled'}>Testar hipótese</button></div>
      </form>`}
  </section>`;
}

function incidentCorrection(id,exercise,variant,run) {
  const checked = Number.isInteger(run.patch);
  const rows = checked ? exercise.checks(id,run.patch) : [];
  const passed = checked && rows.every(row => row.pass);
  return `<section class="panel workspace-panel">
    <h2 id="incident-step-heading" tabindex="-1">Corrija e teste</h2>
    <p>Escolha a mudança que resolve a causa encontrada e compare o resultado simulado com o esperado.</p>
    <form id="incident-patch-form">
      ${incidentChoices('patch',variant.patches,run.patch,'Qual mudança você faria?')}
      <div class="actions"><button class="button" type="submit">Rodar testes da correção ${icon('play')}</button></div>
    </form>
    ${checked ? `<p class="incident-feedback${passed ? '' : ' fail'}" id="incident-feedback" tabindex="-1" role="status">${rows.filter(row => row.pass).length} de ${rows.length} testes passaram. ${passed ? 'Correção validada para esta ocorrência.' : 'Confira quais resultados ainda divergem do esperado.'}</p>
      ${incidentTestResults(rows)}
      ${passed ? `<div class="actions"><button class="button" type="button" data-incident-action="review">Abrir PR para revisão ${icon('arrow')}</button></div>` : ''}` : ''}
  </section>`;
}

function incidentPrReview(exercise,run) {
  const checked = Number.isInteger(run.test);
  const rows = checked ? exercise.reviewChecks(run.test) : [];
  const regression = rows.some(row => !row.pass);
  return `<section class="panel workspace-panel">
    <h2 id="incident-step-heading" tabindex="-1">Revise o pull request</h2>
    <p>${escape(exercise.reviewIntro)}</p>
    ${codeBlock(exercise.reviewDiff.code,exercise.reviewDiff.language)}
    <form id="incident-test-form">
      ${incidentChoices('test',exercise.reviewOptions,run.test,'Qual teste você acrescentaria ao PR?')}
      <div class="actions"><button class="button" type="submit">Executar teste no PR ${icon('play')}</button></div>
    </form>
    ${checked ? `<p class="incident-feedback${regression ? '' : ' fail'}" id="incident-feedback" tabindex="-1" role="status">${escape(exercise.reviewOptions[run.test].feedback)}</p>${incidentTestResults(rows)}` : ''}
    ${regression ? `<form id="incident-comment-form" class="incident-comment">
      <label class="field-label" for="incident-comment">Comentário de revisão</label>
      <p class="note" id="incident-comment-help">Diga como reproduzir a falha, o que aparece na tela e qual ajuste você pediria.</p>
      <textarea class="handoff-note" id="incident-comment" rows="4" minlength="25" maxlength="700" aria-describedby="incident-comment-help" required>${escape(run.comment ?? '')}</textarea>
      <div class="actions"><button class="button" type="submit">Registrar comentário e concluir ${icon('check')}</button></div>
    </form>` : ''}
  </section>`;
}

function incidentCompletion(id,exercise,variant,run) {
  const alternate = Object.keys(exercise.variants).find(key => key !== id);
  const alternateLabel = incidentState().runs[alternate]?.completedAt ? 'Rever' : 'Jogar';
  return `<section class="panel workspace-panel incident-completion">
    <h2 id="incident-step-heading" tabindex="-1">Plantão concluído · +${incidentReward} XP</h2>
    <p>${escape(variant.diagnosis.choices[run.diagnosis].feedback)} ${escape(exercise.regressionSummary)}</p>
    <blockquote>${escape(run.comment)}</blockquote>
    <details class="support-details"><summary>Rever o teste de regressão</summary>${incidentTestResults(exercise.reviewChecks(run.test))}</details>
    <div class="actions">
      <a class="button" href="#tecnologia/${escape(variant.mission ?? exercise.mission)}">Praticar no projeto local ${icon('arrow')}</a>
      <a class="button secondary" href="#plantao/${alternate}">${alternateLabel} ${escape(exercise.variants[alternate].label)}</a>
    </div>
  </section>`;
}

function incidentCase(id) {
  const {caseId,exercise,variant} = incidentByVariant.get(id);
  const run = incidentRun(id);
  const stage = run.completedAt ? 3 : run.reviewStarted ? 2 : run.fixStarted ? 1 : 0;
  const scene = visualExistingCases[id];
  let content;
  switch (stage) {
    case 1: content = incidentCorrection(id,exercise,variant,run); break;
    case 2: content = incidentPrReview(exercise,run); break;
    case 3: content = incidentCompletion(id,exercise,variant,run); break;
    default: content = incidentInvestigation(id,exercise,variant,run);
  }
  return `<div class="incident-page">
    <a class="route-back" href="#plantao">${icon('back')} Voltar ao plantão</a>
    <div class="page-heading"><p class="kicker">${escape(variant.label)} · ${escape(exercise.area)}</p><h1>${escape(exercise.title)}</h1></div>
    <ol class="incident-steps" aria-label="Etapas da ocorrência">${incidentStages.map((label,index) => `<li${index === stage ? ' aria-current="step"' : index < stage ? ' class="is-done"' : ''}><span>${index < stage ? icon('check') : index + 1}</span>${label}</li>`).join('')}</ol>
    <div class="incident-layout">
      <div class="incident-workspace">${stage === 0 && scene ? visualScreen(scene,run.visual ?? {}) : ''}${content}</div>
      <aside class="incident-aside" aria-label="Contexto do chamado">
        <section class="incident-slack">
          <h2 class="panel-title">${icon('slack')} Suporte · Slack simulado</h2>
          <blockquote>${escape(variant.scenario)}</blockquote>
        </section>
        ${stage > 0 ? `<details class="panel workspace-panel support-details"><summary>Consultar evidências da investigação</summary>${incidentCapture(variant)}${incidentHttpEvidence(exercise,run)}</details>` : ''}
        ${stage === 3 ? incidentReviewCard(incidentReviewInfo(caseId)) : ''}
      </aside>
    </div>
  </div>`;
}

function incidentReviewPage(caseId) {
  const review = incidentReviewInfo(caseId);
  const exercise = incidentCases[caseId];
  return `<div class="incident-page">
    <a class="route-back" href="#revisao">${icon('back')} Voltar às revisões</a>
    <div class="page-heading"><p class="kicker">Plantão · Revisão D+3</p><h1>Uma nova captura</h1><p>${escape(exercise.title)}</p></div>
    <section class="panel workspace-panel review-quiz">
      <h2>Encontre a próxima pista</h2>
      ${review?.ready || review?.done ? quiz(exercise.reviewQuestion,`incident-recall-${caseId}`,review.done) : `<p>${review ? `A revisão fica disponível em ${dateFormat.format(review.due)}.` : 'Conclua uma ocorrência deste chamado para agendar a revisão.'}</p>`}
      ${review?.done ? `<p class="feedback success">${icon('check')} Revisão concluída · +${incidentReviewReward} XP</p>` : ''}
    </section>
  </div>`;
}

function incidentReviewAnswer(caseId,index) {
  const review = incidentReviewInfo(caseId);
  const question = incidentCases[caseId].reviewQuestion;
  if (!review?.ready || review.done || !Object.hasOwn(question.choices,index)) return;
  attempts.set(`incident-recall-${caseId}`,index);
  if (index === question.answer) {
    (incidentState().reviews ??= {})[caseId] = true;
    save();
    announce(`Revisão validada. Mais ${incidentReviewReward} XP.`);
  }
  render({focus:'#quiz-feedback'});
}

function incidentRefresh(selector) {
  save();
  render();
  root.querySelector(selector)?.focus();
}

function incidentSelection(form,name,options) {
  const selection = Number(new FormData(form).get(name) ?? NaN);
  return Number.isInteger(selection) && selection >= 0 && selection < options.length ? selection : null;
}

function bindIncidentEvents() {
  root.addEventListener('click',event => {
    if (activeRoute.page !== 'plantao') return;
    const button = event.target.closest('[data-incident-action]');
    if (!button) return;
    const action = button.dataset.incidentAction;
    if (action === 'competencies') {
      root.querySelector('#incident-competencies-title')?.focus();
      return;
    }
    const id = activeRoute.incidentId;
    if (!id) return;
    const {exercise,variant} = incidentByVariant.get(id);
    const run = incidentRun(id);
    switch (action) {
      case 'network':
        if (!visualEvidenceReady(id,run)) return;
        run.network = true;
        incidentRefresh('#incident-capture');
        break;
      case 'hint':
        run.hints = Math.min(run.hints + 1,variant.hints.length);
        incidentRefresh('.incident-hints li:last-child');
        break;
      case 'fix':
        if (!incidentHasEvidence(id,exercise,run) || !incidentDiagnosed(variant,run)) return;
        run.fixStarted = true;
        incidentRefresh('#incident-step-heading');
        break;
      case 'review':
        if (!incidentPassed(id,run)) return;
        run.reviewStarted = true;
        incidentRefresh('#incident-step-heading');
        break;
    }
  });

  root.addEventListener('input',event => {
    if (event.target.id !== 'incident-comment' || !activeRoute.incidentId) return;
    incidentRun(activeRoute.incidentId).comment = event.target.value;
    event.target.setCustomValidity('');
    save();
  });

  root.addEventListener('submit',event => {
    const id = activeRoute.incidentId;
    const form = event.target;
    if (!id || !form.id.startsWith('incident-')) return;
    event.preventDefault();
    const {exercise,variant} = incidentByVariant.get(id);
    const run = incidentRun(id);
    if (run.completedAt) return;
    switch (form.id) {
      case 'incident-diagnosis': {
        if (!incidentHasEvidence(id,exercise,run) || run.fixStarted) return;
        const choice = incidentSelection(form,'hypothesis',variant.diagnosis.choices);
        if (choice === null) return;
        run.diagnosis = choice;
        incidentRefresh('#incident-feedback');
        break;
      }
      case 'incident-patch-form': {
        if (!run.fixStarted || run.reviewStarted) return;
        const patch = incidentSelection(form,'patch',variant.patches);
        if (patch === null) return;
        run.patch = patch;
        incidentRefresh('#incident-feedback');
        break;
      }
      case 'incident-test-form': {
        if (!run.reviewStarted) return;
        const test = incidentSelection(form,'test',exercise.reviewOptions);
        if (test === null) return;
        run.test = test;
        incidentRefresh('#incident-feedback');
        break;
      }
      case 'incident-comment-form': {
        if (!run.reviewStarted || !incidentFoundRegression(exercise,run)) return;
        const field = form.querySelector('#incident-comment');
        const comment = field.value.trim();
        if (comment.length < 25) {
          field.setCustomValidity('Registre pelo menos 25 caracteres com sua evidência e o ajuste pedido.');
          field.reportValidity();
          return;
        }
        run.comment = comment;
        run.completedAt = Date.now();
        announce(`Plantão concluído. Mais ${incidentReward} XP.`);
        incidentRefresh('#incident-step-heading');
        break;
      }
    }
  });
}
