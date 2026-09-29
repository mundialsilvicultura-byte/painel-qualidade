const H = require('./helpers');

const CMCFG = {pDose:35, pVazao:35, pVol:30, tolNC:10, fatorNC:0.042};

function processarCapinaMec(linhasPrincipal, linhasDose, linhasQual){
  const mpd=H.mapaCabecalho(linhasDose,1);
  // bicos por form_id
  const bicosPorForm={};
  for(let r=2;r<linhasDose.length;r++){
    const row=linhasDose[r]; if(!row)continue;
    const fid=H.num(row[mpd['form_id']]); if(fid==null)continue;
    const vazao=H.num(row[mpd['Media Vazão L/min']]);
    const desv=H.num(row[mpd['% desvio do bico']]);
    (bicosPorForm[Math.round(fid)]=bicosPorForm[Math.round(fid)]||[]).push({vazao,desv});
  }
  const CM=[]; const vistos={};
  const abas=[linhasPrincipal, linhasQual].filter(x=>x && x.length>=3);
  for(const linhasF of abas){
    const mp=H.mapaCabecalho(linhasF,1);
    for(let r=2;r<linhasF.length;r++){
      const row=linhasF[r]; if(!row)continue;
      const fid=H.num(row[mp['form_id']]); if(fid==null)continue;
      const fidI=Math.round(fid); if(vistos[fidI])continue; vistos[fidI]=1;
      const equipe=H.eqOuUser(row[mp['Equipe:']], row[mp['user']]);
      const data=H.dataOuSub(row[mp['Data da Operação']], row[mp['created']]);
      const horto=H.limparHorto(row[mp['Horto Florestal']]);
      const opCode=String(H.num(row[mp['Operação:']])||row[mp['Operação:']]||'').replace(/\.0$/,'');
      const vento=H.limpa(row[mp['Condição do tempo (vento)']]);
      const chuva=H.limpa(row[mp['Condição do tempo (chuva)']]);
      const condOK=vento.startsWith('A')||vento.startsWith('B') ? (chuva.startsWith('1')?true:false) : false;
      const doseRec=H.num(row[mp['Dose recomendada']]);
      const volRec=H.num(row[mp['Volume de calda recomendado']]);
      const maq=H.limpa(row[mp['Maquina Avaliados']]);
      let velMedia=H.num(row[mp['Media de Velocidade']]);
      const volMed=H.num(row[mp['Volume de calda médio/ha']]);
      let desvVol=H.num(row[mp['Desvio de Volume de Calda']]);
      let areaTratRaw=row[mp['Percentual de Area Tratada']];
      let areaTrat=H.num(typeof areaTratRaw==='string'?areaTratRaw.replace('%',''):areaTratRaw);
      // bicos
      const bicos=bicosPorForm[fidI]||[];
      const nBicos=bicos.length;
      let ncBicoPct=null, notaDoseBico=null;
      if(nBicos>0){
        // % de bicos com desvio > tolerância
        const ncCount=bicos.filter(b=>b.desv!=null&&Math.abs(b.desv)>CMCFG.tolNC).length;
        ncBicoPct=H.roundPy(ncCount/nBicos*100,1);
        notaDoseBico=Math.max(0,H.roundPy(100-ncBicoPct*CMCFG.fatorNC,1));
      }
      // nota volume
      let notaVol=null;
      if(desvVol!=null && volRec){
        // desvVol já é o desvio percentual
        if(desvVol>100) desvVol=H.roundPy(desvVol/volRec*100,1); // normalizar se veio absoluto
        notaVol=Math.max(0,H.roundPy(100-Math.abs(desvVol),1));
      }
      // nota final
      const comps=[];
      if(notaDoseBico!=null){ comps.push([CMCFG.pDose,notaDoseBico]); comps.push([CMCFG.pVazao,notaDoseBico]); }
      if(notaVol!=null) comps.push([CMCFG.pVol,notaVol]);
      const tot=comps.reduce((s,c)=>s+c[0],0);
      const notaFinal=tot?H.roundPy(comps.reduce((s,c)=>s+c[0]*c[1],0)/tot,1):null;
      CM.push({form:fidI,data:data.slice(0,10),opCode,enc:H.limpa(row[mp['Encarregado']]),
        regional:row[mp['Regional']]||'',equipe,horto,talhao:H.limpa(row[mp['Talhão']]),talhaoErro:false,
        vento:vento.slice(0,30),chuva:chuva.slice(0,30),condOK,
        doseRec,volRec,maq,velMedia,nBicos,ncBicoPct,notaDoseBico,
        volMed,desvVol,notaVol,areaTrat,notaFinal,
        obs:H.limpa(row[mp['Ação corretiva e observações:']])});
    }
  }
  CM.sort((a,b)=>a.form-b.form);
  return CM;
}
module.exports = { processarCapinaMec };
