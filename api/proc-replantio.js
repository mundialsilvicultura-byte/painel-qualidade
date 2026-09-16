const H = require('./helpers');

const ANOMS=[['substExp','Cópia Substrato exposto'],['naoFirme','Cópia Muda não firme'],
  ['inclinada','Cópia Muda Inclinada'],['covaSem','Cópia Cova sem muda (falha)'],
  ['quebrada','Cópia Muda quebrada'],['semBacia','Cópia Sem bacia ou Sulco aberto'],
  ['foraSulco','Cópia Muda fora do sulco de preparo']];

function processarReplantio(linhasPrincipal, linhasParam){
  const mr=H.mapaCabecalho(linhasPrincipal,1), mpar=H.mapaCabecalho(linhasParam,1);
  const parPorForm={};
  for(let r=2;r<linhasParam.length;r++){
    const row=linhasParam[r]; if(!row)continue;
    const fid=H.num(row[mpar['form_id']]); if(fid==null)continue;
    const linha={};
    ANOMS.forEach(([key,nome])=>{ const v=H.num(row[mpar[nome]]); linha[key]=v?Math.round(v):0; });
    linha.morta=Math.round(H.num(row[mpar['Muda Morta']])||0);
    linha.seca=Math.round(H.num(row[mpar['Muda Parcialmente Seca']])||0);
    linha.totAval=H.num(row[mpar['Cópia Total de mudas avaliadas']])||0;
    linha.pctDesvio=H.num(row[mpar['Cópia % de Desvio']]);
    (parPorForm[Math.round(fid)]=parPorForm[Math.round(fid)]||[]).push(linha);
  }
  const RPL=[];
  for(let r=2;r<linhasPrincipal.length;r++){
    const row=linhasPrincipal[r]; if(!row)continue;
    const fid=H.num(row[mr['form_id']]); if(fid==null)continue;
    const fidI=Math.round(fid);
    const equipe=H.eqOuUser(row[mr['Equipe:']], row[mr['user']]);
    const data=H.dataOuSub(row[mr['Data da operação:']], row[mr['created']]);
    const horto=H.limparHorto(row[mr['Horto Florestal ']]!=null?row[mr['Horto Florestal ']]:row[mr['Horto Florestal']]);
    const linhas=parPorForm[fidI]||[];
    const total_m=Math.round(linhas.reduce((s,l)=>s+l.totAval,0));
    const anomDet={}; ANOMS.forEach(([key])=>anomDet[key]=linhas.reduce((s,l)=>s+l[key],0));
    const nc_anom_n=Object.values(anomDet).reduce((a,b)=>a+b,0);
    const nc_anom_pct=total_m?H.roundPy(nc_anom_n/total_m*100,1):0;
    const mortas_n=linhas.reduce((s,l)=>s+l.morta+l.seca,0);
    const nc_cob_pct=total_m?H.roundPy(mortas_n/total_m*100,1):0;
    const dvs=linhas.map(l=>l.pctDesvio).filter(x=>x!=null).map(x=>x>=99?0:Math.abs(x));
    const nc_mortas_pct=dvs.length?H.roundPy(dvs.reduce((a,b)=>a+b,0)/dvs.length,1):0;
    const nota_anom=Math.max(0,H.roundPy(100-nc_anom_pct,1));
    const nota_cob=Math.max(0,H.roundPy(100-nc_cob_pct,1));
    const nota_mortas=Math.max(0,H.roundPy(100-nc_mortas_pct,1));
    const nota_final=total_m>0?H.roundPy((30*nota_anom+60*nota_cob+10*nota_mortas)/100,1):null;
    RPL.push({form:fidI,data:data.slice(0,10),encarregado:H.limpa(row[mr['Encarregado']]),
      regional:row[mr['Regional']]||'',equipe,horto,talhao:H.limpa(row[mr['Talhão']]),talhaoErro:false,
      matGen:H.limpa(row[mr['Material Genético Muda']]),
      totalMudas:total_m,ncAnomPct:nc_anom_pct,notaAnom:nota_anom,
      ncCobPct:nc_cob_pct,notaCob:nota_cob,ncMortasPct:nc_mortas_pct,notaMortas:nota_mortas,
      notaFinal:nota_final,mortasN:mortas_n,ncAnomN:nc_anom_n,anomDet,
      densRec:H.num(row[mr['Densidade recomendada']]),densMed:H.num(row[mr['Densidade média']]),
      totalRepl:H.num(row[mr['Total de mudas Replantadas']]),obs:H.limpa(row[mr['Ação corretiva e observações:']])});
  }
  RPL.sort((a,b)=>a.form-b.form);
  return RPL;
}
module.exports = { processarReplantio };
