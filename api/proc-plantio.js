const H = require('./helpers');

const PCFG_PADRAO = {dMin:40,dMax:44,pAnom:50,pDens:40,pParc:10};
const PCFG_CORTICEIRAS = {dMin:50,dMax:54,pAnom:50,pDens:40,pParc:10};

function getCfg(horto){
  if(horto && horto.toUpperCase().indexOf('CORTICEIRA')>=0) return PCFG_CORTICEIRAS;
  return PCFG_PADRAO;
}

function pNotaDens(m, cfg){
  if(m==null)return null;
  if(m>=cfg.dMin&&m<=cfg.dMax)return 100;
  const centro=(cfg.dMin+cfg.dMax)/2, passo=centro*0.05;
  const dist=(m<cfg.dMin)?(cfg.dMin-m):(m-cfg.dMax);
  return Math.max(0,Math.round(100-(dist/passo)*10));
}
const ANOMS=['Coleto afogado (limite 4 cm)','Substrato exposto','Muda solta','Muda Inclinada',
  'Cova sem muda (falha)','Muda quebrada','Sem bacia ou Sulco aberto','Muda fora do sulco de preparo'];
const ANOM_KEY=['coleto','subst','solta','incl','falha','quebr','bacia','sulco'];
const DENS_COLS=['Densidade Parcela 1','Densidade Parcela 2','Densidade Parcela 3','Densidade Parcela 4','Densidade Parcela 5'];

function processarPlantio(linhasPrincipal, linhasParam, linhasQual){
  const mpar=H.mapaCabecalho(linhasParam,1);
  const parPorForm={};
  for(let r=2;r<linhasParam.length;r++){
    const row=linhasParam[r]; if(!row)continue;
    const fid=H.num(row[mpar['form_id']]); if(fid==null)continue;
    const linha={}; ANOMS.forEach((nome,i)=>{ const v=H.num(row[mpar[nome]]); linha[ANOM_KEY[i]]=v?Math.round(v):0; });
    (parPorForm[Math.round(fid)]=parPorForm[Math.round(fid)]||[]).push(linha);
  }
  const PLT=[]; const vistos={};
  const abas=[linhasPrincipal, linhasQual].filter(x=>x && x.length>=3);
  for(const linhasF of abas){
    const mp=H.mapaCabecalho(linhasF,1);
    for(let r=2;r<linhasF.length;r++){
      const row=linhasF[r]; if(!row)continue;
      const fid=H.num(row[mp['form_id']]); if(fid==null)continue;
      const fidI=Math.round(fid); if(vistos[fidI])continue; vistos[fidI]=1;
      const equipe=H.eqOuUser(row[mp['Equipe:']], row[mp['user']]);
      const data=H.dataOuSub(row[mp['Data da operação:']], row[mp['created']]);
      const horto=H.limparHorto(row[mp['Horto Florestal ']]!=null?row[mp['Horto Florestal ']]:row[mp['Horto Florestal']]);
      const densRec=H.num(row[mp['Densidade recomendada']])||42;
      const obs=H.limpa(row[mp['Ação corretiva e observações:']]);
      const cfg=getCfg(horto);
      let densSuspeita=false; const densList=[];
      DENS_COLS.forEach(c=>{ let d=H.num(row[mp[c]]); if(d!=null&&!(d>=20&&d<=70)){densSuspeita=true;d=null;} densList.push(d); });
      const validas=densList.filter(d=>d!=null);
      const densMedia=validas.length?Math.round(validas.reduce((a,b)=>a+b,0)/validas.length*10)/10:0;
      const parcConf=validas.filter(d=>d>=cfg.dMin&&d<=cfg.dMax).length;
      const nParc=validas.length;
      const pctConf=nParc?Math.round(parcConf/nParc*100):0;
      const linhas=parPorForm[fidI]||[];
      const ncTotals={}; ANOM_KEY.forEach(k=>ncTotals[k]=linhas.reduce((s,l)=>s+(l[k]||0),0));
      const somaDens=validas.reduce((a,b)=>a+b,0);
      let somaPct=0; const ncPcts={};
      ANOM_KEY.forEach(k=>{ const pct=somaDens?(ncTotals[k]/somaDens*100):0; ncPcts[k]=Math.round(pct*100)/100; somaPct+=pct; });
      const nAnom=Math.max(0,H.roundPy(100-somaPct,1));
      const nDens=validas.length?pNotaDens(densMedia, cfg):null;
      let nFinal=null;
      if(nDens!=null){ const tp=cfg.pAnom+cfg.pDens+cfg.pParc;
        nFinal=H.roundPy((cfg.pAnom*nAnom+cfg.pDens*nDens+cfg.pParc*pctConf)/tp,1); }
      const parcelas=[];
      for(let i=0;i<densList.length;i++){
        const ap=linhas[i]||{}; const anoms={};
        ANOM_KEY.forEach(k=>anoms[k]=Math.round(ap[k]||0));
        parcelas.push({idx:i+1,dens:densList[i],anoms});
      }
      const mediaNC=somaPct?Math.round(somaPct/8*100)/100:0;
      const densHa=densMedia?Math.round(densMedia*1000/50*10)/10:0;
      PLT.push({row:r,form:fidI,user:H.limpa(row[mp['user']]),equipe,
        regional:H.limpa(row[mp['Regional']]),horto,talhao:H.limpa(row[mp['Talhão']]),
        data,genetico:H.limpa(row[mp['Material Genético Muda']]),densRec:Math.round(densRec),
        densMediaForm:H.num(row[mp['Densidade média']]),obs,
        parcelas,somaDens,ncPcts,ncTotals,mediaNC,densMedia,densHa,parcConf,
        pctConf,nAnom,nDens,nFinal,talhaoErro:false,densSuspeita});
    }
  }
  PLT.sort((a,b)=>b.form-a.form);
  return PLT;
}

module.exports = { processarPlantio };
