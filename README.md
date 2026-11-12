# Sprint Web

Laboratório de desenvolvimento web com missões de produto, desafios full stack, projetos em C# e Angular e um Cliente HTTP com dados simulados.

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

Em `projects/` estão a API ASP.NET Core no .NET 10 com EF Core e SQLite, o frontend Angular com TypeScript e uma coleção para importar no Postman. O [guia dos projetos](projects/README.md) explica como instalar as dependências, iniciar os servidores locais e validar os exercícios.

## Enviar ao seu Git

Em um remoto vazio, configure `origin` e envie a branch `main`.

```sh
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```
