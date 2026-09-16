// api/dados.js — função de servidor do Vercel.
// Busca todos os CSVs das planilhas (do lado do servidor, sem CORS),
// processa as notas de todas as atividades e devolve um JSON pronto.

const CONFIG = require('./config');
const H = require('./helpers');
const { processarPlantio }    = require('./proc-plantio');
const { processarReplantio }  = require('./proc-replantio');
const { processarCapina }     = require('./proc-capina');
const { processarAdubacao }   = require('./proc-adubacao');
const { processarFormiga }    = require('./proc-formiga');
const { processarSubsolagem } = require('./proc-subsolagem');
const { processarProducao }   = require('./proc-producao');

function url(base, gid){ return base + '&gid=' + gid; }

// busca um conjunto de abas (retorna {} -> linhas por chave)
async function buscarAbas(cfg){
  if(!cfg || !cfg.base || cfg.base.startsWith('COLAR')) return null; // não configurado ainda
  const out={};
  for(const [nome, gid] of Object.entries(cfg.abas)){
    if(!gid || gid.startsWith('COLAR')) continue;
    out[nome] = await H.fetchCSV(url(cfg.base, gid));
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  const resultado = {};
  const erros = {};

  // helper: tenta processar uma atividade, guarda erro sem derrubar as outras
  async function tenta(nome, fn){
    try{ const v = await fn(); if(v!==undefined) resultado[nome]=v; }
    catch(e){ erros[nome]=String(e.message||e); }
  }

  await tenta('plantio', async () => {
    const a = await buscarAbas(CONFIG.plantio); if(!a) return;
    return processarPlantio(a.principal, a.parametros, a.qual);
  });
  await tenta('replantio', async () => {
    const a = await buscarAbas(CONFIG.replantio); if(!a) return;
    return processarReplantio(a.principal, a.parametros);
  });
  await tenta('capina', async () => {
    const a = await buscarAbas(CONFIG.capina); if(!a) return;
    return processarCapina(a.principal, a.dose, a.caminhamento, a.qual);
  });
  await tenta('adubacao', async () => {
    const a = await buscarAbas(CONFIG.adubacao); if(!a) return;
    return processarAdubacao(a.principal, a.dados, a.qual);
  });
  await tenta('formiga', async () => {
    const a = await buscarAbas(CONFIG.formiga); if(!a) return;
    return processarFormiga(a.principal, a.qual);
  });
  await tenta('subsolagem', async () => {
    const a = await buscarAbas(CONFIG.subsolagem); if(!a) return;
    const {SUB, ADM} = processarSubsolagem(a.principal, a.conformacao, a.qual);
    resultado.subsolagem = SUB;
    resultado.adubmec = ADM;
    return undefined;
  });
  await tenta('producao', async () => {
    const a = await buscarAbas(CONFIG.producao); if(!a) return;
    return processarProducao(a.manual, a.mecanizada, a.geral);
  });

  resultado._atualizado = new Date().toISOString();
  if(Object.keys(erros).length) resultado._erros = erros;
  res.status(200).json(resultado);
};
