# Painel de Qualidade Mundial Florestal — versão automática (Vercel)

Este projeto publica o painel de qualidade num link que **atualiza sozinho**:
ao abrir, ele busca as planilhas do Google Sheets pelo servidor (sem CORS),
processa as notas e mostra tudo.

## Estrutura
- `index.html` — o painel (chama /api/dados ao abrir)
- `api/dados.js` — função de servidor que busca os CSVs e processa
- `api/config.js` — **onde você cola os links das planilhas**
- `api/*.js` — os processadores (Plantio, Replantio, Capina, etc.)
- `vercel.json` — configuração

## Passo a passo para publicar

### 1. Preencher os links (api/config.js)
Publique cada planilha na web (Arquivo → Compartilhar → Publicar na web → CSV)
e cole em `api/config.js` a BASE e os gids de cada aba. Onde estiver
"COLAR_...", substitua pelo valor real.

### 2. Subir no GitHub
- Crie um repositório novo (ex.: painel-qualidade)
- Suba todos estes arquivos (mantendo a pasta `api/`)

### 3. Conectar no Vercel
- Entre em vercel.com, "Add New → Project"
- Importe o repositório do GitHub
- Clique em Deploy
- Ao terminar, o Vercel dá um link (ex.: painel-qualidade.vercel.app)

Esse link abre em qualquer lugar, sem conta, e atualiza sozinho quando
as planilhas mudam.

## Atualizar depois
Como os dados vêm das planilhas ao vivo, você não precisa fazer nada —
o painel reflete o Google Sheets sozinho. Se mudar a lógica, é só
atualizar os arquivos no GitHub que o Vercel republica automático.
