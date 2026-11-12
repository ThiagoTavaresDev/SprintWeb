window.studyGuide = {
  intro: 'Aprenda web assumindo uma tarefa em um produto que já existe. Em cada missão, você recebe um chamado, investiga com evidências, corrige e testa a mudança e registra a entrega como faria com uma equipe.',
  steps: [
    {
      title: 'Comece pelo chamado',
      description: 'Ao criar uma missão, escolha um problema pequeno do produto. Descreva quem foi afetado, como reproduzir e o que deve acontecer. Defina critérios de aceite que possam ser verificados, incluindo um caso de erro ou de limite.'
    },
    {
      title: 'Investigar',
      description: 'Dê um trecho de código e uma evidência, como uma requisição HTTP ou um log. Peça à pessoa que preveja o resultado, reproduza o problema e aponte qual evidência sustenta sua hipótese.'
    },
    {
      title: 'Corrigir e testar',
      description: 'Comece com um exemplo explicado, passe para uma alteração guiada e proponha uma variação com menos ajuda. Compare o resultado esperado com o observado e ofereça uma pista opcional antes de revelar a solução.'
    },
    {
      title: 'Entregar',
      description: 'Peça um registro que a equipe possa usar. Pode ser um PR com resumo e testes, um chamado do Jira com critérios verificados ou uma atualização no Slack com evidência e próximo passo.'
    },
    {
      title: 'Revisar em outro caso',
      description: 'Depois da entrega, transforme a decisão central da missão em perguntas curtas com cenários novos. Responda de memória antes de abrir a explicação e use o resultado para decidir o que praticar de novo.'
    }
  ],
  research: [
    {
      title: 'Leia e modifique código que já existe',
      description: 'O PRIMM propõe prever, executar, investigar, modificar e criar. Em um estudo quase experimental, alunos de 11 a 14 anos tiveram melhor desempenho no pós-teste que o grupo de comparação. Adaptamos a sequência para tarefas web de adultos.',
      label: 'Sentance, Waite e Kallia (2019)',
      url: 'https://eprints.gla.ac.uk/229013/'
    },
    {
      title: 'Tente lembrar antes de consultar',
      description: 'Em dois experimentos com textos, tentar recuperar a informação de memória melhorou a retenção após dois dias e uma semana. Nas revisões da trilha, faça uma tentativa antes de abrir a explicação.',
      label: 'Roediger e Karpicke (2006)',
      url: 'https://doi.org/10.1111/j.1467-9280.2006.01693.x'
    },
    {
      title: 'Distribua as revisões',
      description: 'Em um estudo de aprendizagem de fatos, o intervalo mais eficaz dependeu de quanto tempo se queria reter o conteúdo. A trilha usa 1, 3 e 7 dias após a missão como calendário de prática.',
      label: 'Cepeda e colegas (2008)',
      url: 'https://digitalcommons.usf.edu/psy_facpub/1766/'
    },
    {
      title: 'Reduza a ajuda aos poucos',
      description: 'Experimentos com problemas de física e matemática encontraram ganhos em casos semelhantes quando partes da solução foram retiradas gradualmente. A trilha passa de exemplos e pistas para decisões mais independentes.',
      label: 'Renkl, Atkinson e Maier (2000)',
      url: 'https://escholarship.org/content/qt81b9j9hs/qt81b9j9hs_noSplash_ef3e30a960524adc5157ece2d6fa3130.pdf'
    },
    {
      title: 'Dê feedback durante a prática',
      description: 'Um estudo controlado em programação introdutória por blocos associou feedback imediato e adaptativo a melhor desempenho e mais tarefas concluídas. Aqui, a devolutiva explica o que conferir na próxima tentativa.',
      label: 'Marwan e colegas (2022)',
      url: 'https://isnap.csc.ncsu.edu/home/public/publication/marwan-2022-aif/'
    }
  ],
  cycle: 'O XP acompanha etapas validadas. As revisões ficam disponíveis 1, 3 e 7 dias após a conclusão de cada missão. O progresso fica salvo neste navegador.'
};

window.toolGuide = [
  {
    title: 'Slack',
    icon: 'slack',
    description: 'Use o canal da equipe para dar visibilidade ao problema e a thread da mensagem para concentrar a investigação. Compartilhe o impacto, a evidência e o próximo passo.',
    example: 'Reproduzi em homologação. A busca retorna HTTP 500 ao filtrar pelo nome. Estou conferindo o log da requisição e atualizo aqui após o teste.',
    label: 'Como usar threads no Slack',
    url: 'https://slack.com/help/articles/115000769927-Use-threads-to-organize-discussions'
  },
  {
    title: 'Jira',
    icon: 'jira',
    description: 'Registre passos para reproduzir, resultado observado, resultado esperado e critérios de aceite. Mova o item de acordo com o fluxo da equipe e vincule o PR.',
    example: 'O critério de aceite exige que a busca por um nome com apóstrofo retorne HTTP 200 e mostre os registros correspondentes. Se não houver resultados, a interface mostra o estado vazio.',
    label: 'Fluxos de trabalho no Jira',
    url: 'https://support.atlassian.com/jira-software-cloud/docs/what-are-jira-workflows/'
  },
  {
    title: 'Git e GitHub',
    icon: 'git',
    description: 'Trabalhe em uma branch, confira o diff antes de gravar o commit e abra um pull request (PR). Conte o que mudou, como testar e qual chamado acompanha a mudança.',
    example: 'Corrige a busca por nome com apóstrofo. Testei um nome comum, um nome com apóstrofo e uma busca sem resultados. Solicito revisão da consulta parametrizada.',
    label: 'Como revisar pull requests',
    url: 'https://docs.github.com/pt/pull-requests/how-tos/review-pull-requests'
  },
  {
    title: 'Chrome DevTools',
    icon: 'terminal',
    description: 'Abra a aba Network, reproduza o fluxo e examine a requisição. Compare método, URL, status, resposta e tempo com o comportamento esperado da tela.',
    example: 'Abra Network e execute a busca. Clique na requisição, confira o status em Headers e leia o corpo em Response. Leve essa evidência para o chamado.',
    label: 'Como inspecionar requisições',
    url: 'https://developer.chrome.com/docs/devtools/network/'
  },
  {
    title: 'SQL Server e Visual FoxPro',
    icon: 'database',
    description: 'Um formulário FoxPro pode usar SQLEXEC() via ODBC e exibir o cursor resultante. No fluxo web da trilha, o navegador envia uma requisição HTTP, a API consulta o SQL Server e devolve JSON.',
    example: 'Na API, passe o nome como valor de @nome no driver e preserve o texto da consulta. O teste com O\'Brien verifica se a entrada com apóstrofo funciona.',
    label: 'Parâmetros do SQL Server com SqlClient',
    url: 'https://learn.microsoft.com/en-us/sql/connect/ado-net/configure-parameters?view=sql-server-ver17'
  },
  {
    title: 'CI com GitHub Actions',
    icon: 'activity',
    description: 'Use a integração contínua (CI) para conferir testes e outras verificações a cada mudança. Em caso de falha, abra a execução e encontre a etapa e o primeiro erro relevante.',
    example: 'O check da API falhou no cenário de busca vazia. Abra o log do teste, compare esperado e observado, reproduza localmente e confira a próxima execução.',
    label: 'Como ler logs do GitHub Actions',
    url: 'https://docs.github.com/pt/actions/how-tos/monitor-workflows/use-workflow-run-logs'
  }
];
