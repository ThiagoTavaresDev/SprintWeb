# Sprint Web

Laboratório de desenvolvimento web com uma trilha principal de hemoterapia. Os chamados fictícios cobrem coleta, estoque, rastreabilidade, fluxo transfusional e hemovigilância. Os exercícios do Portal de Pedidos ficam em **Exercícios diversos**.

A trilha usa dados sintéticos e regras de software para treinamento. A API simulada e os projetos locais de hemoterapia não são sistemas para uso clínico.

Abra **Plantão de incidentes** para investigar paginação, cache de etiquetas, validação de rascunhos e referências de erro para suporte. Cada chamado tem duas ocorrências com o mesmo sintoma. Use o Cliente HTTP, valide a correção e reproduza uma regressão em um PR. Cada chamado tem revisão três dias após a primeira conclusão e um atalho para a prática local em .NET ou Angular.

Reproduza o sintoma na tela de homologação antes de abrir a captura da interface. Em **Chamados com tela**, há dez exercícios em que você executa a operação original, escolhe a correção e repete a mesma sequência na versão corrigida.

## Preparar e abrir a plataforma

Use Python 3.10 ou mais recente na raiz do repositório.

```sh
python scripts/build.py
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Abra `http://127.0.0.1:8000`. A pasta `site/` contém os fontes da plataforma. O comando de build reúne o site e o ZIP dos projetos em `dist/`.

## Publicar

Na hospedagem estática, configure `python scripts/build.py` como comando de build e `dist` como pasta de publicação. Se a hospedagem recebe arquivos diretamente, rode o build localmente e envie o conteúdo de `dist/`. O progresso e os dados de prática ficam no navegador.

## Praticar com .NET e Angular

O [projeto de hemoterapia](projects/hemoterapia/README.md) tem uma API ASP.NET Core no .NET 10 com EF Core e SQLite e uma interface Angular com TypeScript. As 21 missões de projeto local indicam arquivos, critérios e comandos de teste. Cinco delas percorrem as duas camadas e a entrega do chamado. O [Portal de Pedidos](projects/README.md) também está disponível no mesmo ZIP.

## Enviar ao seu Git

Em um remoto vazio, configure `origin` e envie a branch `main`.

```sh
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```
