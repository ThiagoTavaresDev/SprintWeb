'use strict';

const missionGuide = {
  ...window.missionGuideFirst,...window.missionGuideSecond,
  ...Object.fromEntries([...window.techBackend,...window.techFrontend].map(item => [item.id,item]))
};
const guideDisclosure = new Map();
const levelOptions = [
  ['essencial','Essencial','Pratique uma regra comum dentro de uma camada. Você já deve conseguir ler e editar funções simples em JavaScript.'],
  ['intermediario','Intermediário','Combine casos de sucesso e erro, interprete um contrato ou acompanhe dados entre partes do produto.'],
  ['avancado','Avançado','Trabalhe com cenários em que concorrência, segurança ou operação exigem mais cuidado na validação.']
];
const levelLabels = Object.fromEntries(levelOptions.map(([value,label]) => [value,label]));
const evidenceLanguages = {
  'WEB-101':'http','WEB-102':'http','WEB-103':'sql','WEB-105':'http','WEB-106':'http',
  'WEB-107':'http','WEB-108':'http','WEB-109':'sql','WEB-111':'http','WEB-112':'sql',
  'WEB-114':'sql','WEB-116':'http','WEB-117':'http','WEB-118':'http','WEB-119':'json',
  'WEB-124':'http','WEB-126':'json','WEB-128':'js','WEB-129':'http','WEB-130':'diff',
  'WEB-131':'diff','WEB-134':'json','WEB-139':'http','WEB-140':'js','WEB-141':'http',
  'WEB-138':'http','WEB-142':'http','WEB-143':'json','WEB-144':'json',
  'FS-201':'http','FS-202':'http','FS-203':'http','FS-204':'http','FS-207':'http'
};
const bridgeLanguages = {'WEB-101':'sql','WEB-103':'sql','WEB-109':'sql','WEB-110':'sql','WEB-113':'sql','WEB-114':'csharp'};

function levelBadge(mission) {
  const {level} = missionGuide[mission.id];
  return `<span class="level-badge level-${level}">${levelLabels[level]}</span>`;
}

function missionGuidePanel(mission,step) {
  const guide = missionGuide[mission.id];
  const key = `${mission.id}/${step}`;
  return `<details class="panel mission-guide" data-mission-guide="${key}"${(guideDisclosure.get(key) ?? step === 0) ? ' open' : ''}>
    <summary>${icon('book')} Pré-requisitos e teoria</summary>
    <div class="mission-guide-grid">
      <section aria-label="Conhecimentos necessários"><h3>O que você precisa saber</h3><ul>${guide.prerequisites.map(item => `<li>${escape(item)}</li>`).join('')}</ul></section>
      <section aria-label="Sites com a teoria"><h3>Onde estudar a teoria</h3><ul class="theory-links">${guide.theory.map(source => `<li>${link(source.url,source.label)}<p>${escape(source.description)}</p></li>`).join('')}</ul></section>
    </div>
  </details>`;
}

function codeBlock(source,language = 'text',variant = '') {
  return `<pre class="codeblock${variant ? ' ' + variant : ''}"><code${language === 'text' ? '' : ` data-language="${language}"`}>${escape(source)}</code></pre>`;
}

function evidenceCode(mission) {
  return codeBlock(mission.story.evidence.code,evidenceLanguages[mission.id]);
}

function catalogControls(id,filters,groups,labels,availableMissions) {
  const select = (key,title,options) => `<label class="filter-field">${title}<select id="${id}-${key}" data-catalog="${id}" data-filter="${key}">${selectOptions(options,filters[key])}</select></label>`;
  const present = new Set(availableMissions.map(mission => missionGuide[mission.id].level));
  const levels = levelOptions.filter(([value]) => present.has(value)).map(([value,label]) => [value,label]);
  return `<div class="panel filter-panel catalog-filters" role="search" aria-label="Buscar missões">
    <label class="filter-field search-field">Buscar missão<input type="search" id="${id}-query" data-catalog="${id}" data-filter="query" maxlength="100" placeholder="${escape(labels.placeholder)}" value="${escape(filters.query)}"></label>
    ${select('group',labels.groupTitle,[['',labels.allGroups],...groups])}
    ${select('level','Nível',[['','Todos os níveis'],...levels])}
    ${select('status','Progresso',[['','Todos os estados'],['new','Para começar'],['active','Em andamento'],['done','Concluídas']])}
  </div>`;
}

function matchingMissions(list,filters,groupFor,progressFor,fieldsFor = mission => mission.skills) {
  const {query,group,level,status} = filters;
  const terms = normalizedSearch(query).trim().split(/\s+/);
  return list.filter(mission => {
    const guide = missionGuide[mission.id];
    if (level && level !== guide.level) return false;
    if (group) {
      const groups = groupFor(mission);
      if (Array.isArray(groups) ? !groups.includes(group) : group !== groups) return false;
    }
    if (status && status !== progressFor(mission)) return false;
    if (!query.trim()) return true;
    const searchable = normalizedSearch([mission.id,mission.title,mission.category,mission.description,levelLabels[guide.level],...fieldsFor(mission),...guide.prerequisites].join(' '));
    return terms.every(term => searchable.includes(term));
  });
}

function emptyCatalog(id) {
  return `<section class="panel workspace-panel"><h2>Nenhuma missão encontrada</h2><p>Ajuste a busca ou combine outros filtros.</p><div class="actions"><button class="button secondary" type="button" data-action="catalog-clear" data-catalog="${id}">Limpar filtros</button></div></section>`;
}

function howToPage() {
  const instructions = [
    ['route','Escolha a missão','Busque por assunto ou código. Combine nível, tema e progresso. Ao abrir a missão, confira os conhecimentos necessários e os links de teoria.'],
    ['terminal','Teste, edite e rode de novo','Execute o código inicial para reproduzir a falha. Expanda um teste para comparar a entrada, a saída esperada e a observada. Edite o código e use Executar testes ou Ctrl+Enter (⌘+Enter no Mac).'],
    ['layers','Conecte as camadas no Full Stack','Valide backend e frontend separadamente. Em Integração, rode os cenários padrão e edite a entrada JSON para explorar a resposta HTTP e a prévia da tela.'],
    ['chat','Faça a entrega ao time','Na Trilha Full Stack, assuma o ticket no Jira, responda na thread do Slack e registre a descrição do PR antes de mover o ticket para Em revisão. As ferramentas são simuladas no laboratório.'],
    ['repeat','Retome com as revisões','O XP acompanha etapas validadas. As revisões aparecem em 1, 3 e 7 dias após a entrega. Use a aba Revisão para praticar ou voltar aos itens disponíveis.']
  ];
  return `<div class="page-heading"><p class="kicker">Guia da plataforma</p><h1>Como usar o Sprint Web</h1><p>Escolha o tipo de prática, confira a teoria e acompanhe cada etapa da entrega.</p></div>
    <div class="study-grid help-entry">
      <article class="panel study-card">${tile('route')}<h2>Trilha de produto</h2><p>Pratique um tema do dia a dia em três etapas: investigar, corrigir e testar, entregar.</p><a class="button" href="#trilha">Explorar a trilha de produto ${icon('arrow')}</a></article>
      <article class="panel study-card">${tile('layers','mint')}<h2>Trilha Full Stack</h2><p>Leve o mesmo ticket do Jira à API e à interface. Valide a integração e registre a entrega com o time.</p><a class="button" href="#fullstack">Explorar a trilha Full Stack ${icon('arrow')}</a></article>
    </div>
    <section class="section" aria-labelledby="help-tech-title"><div class="section-heading"><h2 id="help-tech-title">Pratique com projetos e requisições</h2></div>
      <div class="study-grid help-entry">
        <article class="panel study-card">${tile('database')}<h3>Projetos .NET e Angular</h3><p>Em Tecnologias, filtre pela stack, baixe o ZIP e siga o README. Edite o arquivo do chamado, rode a verificação no seu terminal e registre o que observou.</p><a class="button" href="#tecnologias">Ver missões de tecnologia ${icon('arrow')}</a></article>
        <article class="panel study-card">${tile('terminal','mint')}<h3>Cliente HTTP</h3><p>Escolha um exercício, monte a requisição, envie e compare status, cabeçalhos e corpo. Use Exploração livre para repetir o fluxo com outros dados.</p><a class="button" href="#cliente-http">Abrir Cliente HTTP ${icon('arrow')}</a></article>
      </div>
    </section>
    <section class="section" aria-labelledby="help-steps-title"><div class="section-heading"><h2 id="help-steps-title">Da primeira tentativa à revisão</h2></div>
      <ol class="panel help-steps">${instructions.map(([name,title,description]) => `<li>${tile(name)}<div><h3>${title}</h3><p>${description}</p></div></li>`).join('')}</ol>
    </section>
    <section class="section" aria-labelledby="help-level-title"><div class="section-heading"><h2 id="help-level-title">O que significam os níveis</h2></div>
      <div class="card-grid">${levelOptions.map(([value,label,description]) => {
        const example = [...missions,...stackMissions].find(item => missionGuide[item.id].level === value);
        const href = example && (Object.hasOwn(stackById,example.id) ? stackHref(example) : missionHref(example.id));
        return `<article class="panel study-card"><h3><span class="level-badge level-${value}">${label}</span></h3><p>${description}</p>${example ? `<a href="${href}">Exemplo · ${escape(example.title)} ${icon('arrow')}</a>` : ''}</article>`;
      }).join('')}</div>
    </section>
    <section class="section" aria-labelledby="help-save-title"><div class="section-heading"><h2 id="help-save-title">Dúvidas durante a prática</h2></div>
      <div class="panel workspace-panel help-faq">
        <details class="support-details"><summary>Onde meu progresso fica salvo?</summary><p>O navegador guarda XP, rascunhos e entregas. Abra o arquivo no mesmo caminho e no mesmo navegador para continuar. Perfis diferentes e janelas anônimas têm armazenamento próprio.</p></details>
        <details class="support-details"><summary>E se eu travar no código?</summary><p>Abra uma pista e compare a saída esperada com o resultado do teste que falhou. Se precisar, consulte a solução, compare com a sua hipótese e execute de novo. Restaurar código inicial permite começar outra tentativa.</p></details>
        <details class="support-details"><summary>Posso escolher outra missão?</summary><p>Sim. Use as trilhas para abrir qualquer missão ou retomar uma que está em andamento. Dentro da mesma missão, as etapas são liberadas à medida que você valida as anteriores.</p></details>
        <details class="support-details"><summary>Onde ficam as referências?</summary><p>Consulte os pré-requisitos de cada missão e os guias gerais de <a href="#ferramentas">Ferramentas</a> e <a href="#modelo">Modelo de estudo</a>.</p></details>
      </div>
    </section>`;
}
