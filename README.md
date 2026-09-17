# lino_public

Site público estático do projeto LINO, preparado para publicação no GitHub Pages com domínio customizado preservado em `/CNAME`.

## Executar localmente

```bash
python3 -m http.server 4321
```

Depois abra `http://localhost:4321`.

## Instalar dependências

```bash
npm ci
```

## Gerar a build

```bash
npm run build
```

Os arquivos publicáveis são gerados em `/dist`, incluindo o `CNAME`.

## Publicação

O workflow em `.github/workflows/deploy-pages.yml`:

1. instala as dependências com `npm ci`;
2. gera a build com `npm run build`;
3. publica o conteúdo de `dist/` no GitHub Pages com as actions oficiais.

Configuração manual ainda necessária no repositório:

- GitHub Pages configurado para usar **GitHub Actions** como source;
- domínio customizado compatível com o `CNAME` existente (`lino.inspira.dev.br`).

## Limitação desta migração

Durante esta execução, o repositório privado `coletivo-inspira/lino` não estava acessível no ambiente do agente, então não foi possível importar automaticamente uma possível aplicação Astro/TypeScript privada. Este repositório foi preparado para publicar com segurança o site público atualmente disponível aqui, sem copiar segredos ou arquivos privados.
