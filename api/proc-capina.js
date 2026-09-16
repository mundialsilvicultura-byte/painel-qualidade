const H = require('./helpers');

const CFG={t1:10,t2:20,t3:30,pV:25,pC:25,pVol:50};
function faixa(d){
  if(d==null)return null;
  d=Math.abs(d);
  if(d<=CFG.t1+1e-6)return 100;
  if(d<=CFG.t2+1e-6)return 80;
  if(d<=CFG.t3+1e-6)return 70;
  return 0;
}

// linhasPrincipal + linhasQual (abas de formulário); linhasDose + linhasCam (parâmetros compartilhados)
function processarCapina(linhasPrincipal, linhasDose, linhasCam, linhasQual){
  const mpd=H.mapaCabecalho(linhasDose,1), mpc=H.mapaCabecalho(linhasCam,1);
  // dose por form (5 linhas x 3 amostras)
  const dosePorForm={};
  for(let r=2;r<linhasDose.length;r++){
    const row=linhasDose[r]; if(!row)continue;
    const fid=H.num(row[mpd['form_id']]); if(fid==null)continue;
    const grupo=['Amostra 1','Amostra 2','Amostra 3'].map(k=>{
      let v=H.num(row[mpd[k]]); if(v!=null&&v>10)v=Math.round(v/1000*10000)/10000; return v;
    });
    (dosePorForm[Math.round(fid)]=dosePorForm[Math.round(fid)]||[]).push(grupo);
  }
  const camPorForm={};
  for(let r=2;r<linhasCam.length;r++){
    const row=linhasCam[r]; if(!row)continue;
    const fid=H.num(row[mpc['form_id']]); if(fid==null)continue;
    (camPorForm[Math.round(fid)]=camPorForm[Math.round(fid)]||[]).push(H.num(row[mpc['Caminhamento']]));
  }
  const CAP=[]; const vistos={};
  const abas=[linhasPrincipal, linhasQual].filter(x=>x && x.length>=3);
  for(const linhasF of abas){
    const mp=H.mapaCabecalho(linhasF,1);
    for(let r=2;r<linhasF.length;r++){
      const row=linhasF[r]; if(!row)continue;
      const fid=H.num(row[mp['form_id']]); if(fid==null)continue;
      const fidI=Math.round(fid); if(vistos[fidI])continue; vistos[fidI]=1;
      const equipe=H.eqOuUser(row[mp['Equipe:']]!=null?row[mp['Equipe:']]:row[mp['Equipe: ']], row[mp['user']]);
      const data=H.dataOuSub(row[mp['Data da Operação']], row[mp['created']]);
      const horto=H.limparHorto(row[mp['Horto Florestal']]);
      const doseR=H.num(row[mp['Dose recomendada']]);
      let volR=H.num(row[mp['Volume de calda recomendado']]);
      let vazaoR=H.num(row[mp['Recomendação de Vazão L/min']]);
      const bico=H.limpa(row[mp['Informe o tipo de bico utilizado']]);
      const parcela=H.num(row[mp['Tamanho da parcela']]);
      let mediaLh=H.num(row[mp['Media de L/h']]);
      const obs=H.limpa(row[mp['Ação corretiva e observações:']]);
      if(vazaoR!=null&&vazaoR>10) vazaoR=vazaoR/1000;
      if(volR!=null&&volR>500) volR=volR/10;
      if(mediaLh!=null){ if(mediaLh>1000)mediaLh=Math.round(mediaLh/10*10000)/10000; else if(mediaLh<10)mediaLh=Math.round(mediaLh*100*10000)/10000; }
      let colabs=(dosePorForm[fidI]||[]).slice();
      while(colabs.length<5)colabs.push([null,null,null]);
      colabs=colabs.slice(0,5);
      const mediasAmostra=[];
      for(let i=0;i<3;i++){
        const vals=[]; for(let b=0;b<5;b++){ if(colabs[b][i]!=null)vals.push(colabs[b][i]); }
        mediasAmostra.push(vals.length?Math.round(H.mean(vals)*10000)/10000:null);
      }
      let caminh=(camPorForm[fidI]||[]).slice(0,5);
      while(caminh.length<5)caminh.push(null);
      const camLha=[];
      if(parcela){
        for(const x of caminh){
          if(x!=null){
            let v=x*10000/parcela; const lim=(volR?volR*3:1000);
            while(v>lim)v=v/10;
            camLha.push(Math.round(v*10)/10);
          }
        }
      }
      let nV=null;
      if(vazaoR&&vazaoR>=0.05&&vazaoR<=3){
        const ns=mediasAmostra.filter(m=>m!=null).map(m=>faixa((m-vazaoR)/vazaoR*100));
        nV=ns.length?H.r1(H.mean(ns)):null;
      }
      let nC=null;
      if(camLha.length&&volR&&volR<=500){
        nC=H.r1(H.mean(camLha.map(x=>faixa((x-volR)/volR*100))));
      }
      let nVol=null;
      if(mediaLh!=null&&volR&&volR<=500){
        const NC=Math.abs(mediaLh-volR)/volR;
        nVol=NC>1?0:H.r1((1-NC)*100);
      }
      let nF=null;
      if(nV!=null&&nC!=null&&nVol!=null){
        nF=H.r1((CFG.pV*nV+CFG.pC*nC+CFG.pVol*nVol)/100);
      }
      CAP.push({row:r,form:fidI,user:H.limpa(row[mp['user']]),equipe,
        regional:row[mp['Regional']]||'',horto,talhao:H.limpa(row[mp['Talhão']]),
        data,bico,doseR,volR,vazaoR,parcela,mediaLh,colabs,caminh,
        mediasAmostra,camLha,nV,nC,nVol,nF,fixes:[],flags:[],talhaoErro:false,obs});
    }
  }
  CAP.sort((a,b)=>a.form-b.form);
  return CAP;
}
module.exports = { processarCapina };
