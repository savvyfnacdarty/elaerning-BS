/* ===== Utilitaires ===== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const KEY='fd-hab-elec-v1';
let ST={seen:{},done:{},best:null};
let cur=-1,scr=0;
/* ===== SCORM 1.2 ===== */
const SC=(function(){
 let api=null,passed=false,closed=false;const t0=Date.now();
 const find=w=>{let n=0;try{while(w){if(w.API)return w.API;if(w.parent&&w.parent!==w&&n++<20)w=w.parent;else break}}catch(e){}return null};
 try{api=find(window)||(window.opener?find(window.opener):null)}catch(e){}
 const g=k=>{try{return String(api.LMSGetValue(k))}catch(e){return ''}};
 const st=(k,v)=>{try{api.LMSSetValue(k,String(v))}catch(e){}};
 const cm=()=>{try{api.LMSCommit('')}catch(e){}};
 const p2=n=>('0'+n).slice(-2);
 const fmt=ms=>{const t=Math.round(ms/1000);return ('000'+Math.floor(t/3600)).slice(-4)+':'+p2(Math.floor(t%3600/60))+':'+p2(t%60)};
 return{
  active:()=>!!api,
  init(){if(!api)return null;
   try{api.LMSInitialize('')}catch(e){api=null;return null}
   const s=g('cmi.core.lesson_status');
   if(s==='not attempted'||s==='')st('cmi.core.lesson_status','incomplete');
   passed=(s==='passed'||s==='completed');
   let sd=null;try{sd=JSON.parse(g('cmi.suspend_data')||'null')}catch(e){}
   cm();return sd},
  sync(){if(!api)return;st('cmi.suspend_data',JSON.stringify({d:ST.done,b:ST.best,l:[cur,scr]}));st('cmi.core.lesson_location',cur+'.'+scr);cm()},
  result(score,ok){if(!api)return;
   st('cmi.core.score.min',0);st('cmi.core.score.max',100);st('cmi.core.score.raw',score*10);
   if(ok){passed=true;st('cmi.core.lesson_status','passed')}else if(!passed){st('cmi.core.lesson_status','failed')}
   this.sync()},
  end(){if(!api||closed)return;closed=true;
   st('cmi.core.session_time',fmt(Date.now()-t0));st('cmi.core.exit',passed?'':'suspend');cm();try{api.LMSFinish('')}catch(e){}}
 }})();
if(!SC.active()){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x)ST=Object.assign(ST,x)}catch(e){}}
const save=()=>{if(SC.active())SC.sync();else{try{localStorage.setItem(KEY,JSON.stringify(ST))}catch(e){}}};
window.addEventListener('pagehide',()=>SC.end());window.addEventListener('beforeunload',()=>SC.end());window.addEventListener('unload',()=>SC.end());
/* ===== Voix off ===== */
let voiceOn=true;try{voiceOn=localStorage.getItem('fd-voice')!=='0'}catch(e){}
const AUD=new Audio();AUD.preload='auto';
function updV(){const pl=$('#vplay'),mu=$('#vmute');if(!pl)return;pl.textContent=AUD.paused?'▶ Écouter':'⏸ Pause';mu.textContent=voiceOn?'🔊 Voix off activée':'🔇 Voix off coupée';mu.setAttribute('aria-pressed',voiceOn)}
function voice(key){
 AUD.pause();const t=$('#vtxt');if(t)t.textContent=NARR[key]||'';
 AUD.src='audio/'+key+'.mp3';
 if(voiceOn){const p=AUD.play();if(p&&p.catch)p.catch(()=>{})}
 updV();
}
['play','pause','ended'].forEach(e=>AUD.addEventListener(e,updV));
const L=['A','B','C','D'];

/* QCM générique : opts=[texte], ok=index, why=explication */
function mcq(root,{opts,ok,why,okMsg='Bonne réponse !',koMsg='Pas tout à fait.',onDone}){
  const box=document.createElement('div');
  box.innerHTML=`<div class="opts">${opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="k">${L[i]}</span><span>${o}</span></button>`).join('')}</div><div class="fb" role="status" aria-live="polite"></div>`;
  root.appendChild(box);
  const fb=$('.fb',box);
  $$('.opt',box).forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.i;const good=i===ok;
    $$('.opt',box).forEach(x=>{x.disabled=true});
    b.classList.add(good?'right':'wrong');
    if(!good)$$('.opt',box)[ok].classList.add('right');
    fb.className='fb show '+(good?'ok':'ko');
    fb.innerHTML=`<b>${good?okMsg:koMsg}</b> ${why}`;
    onDone&&onDone(good,i);
  }));
}
const img=(k,cap='',alt='')=>`<div class="imgc"><img src="${IMG[k]}" alt="${alt||cap}">${cap?`<div class="cap">${cap}</div>`:''}</div>`;

/* ===== Schéma de mesures VAT ===== */
function sockSVG(v){
  const c=s=>s?'#0B8A43':'#C10F1E';
  const line=(x1,y1,x2,y2,ok)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c(ok)}" stroke-width="5" stroke-linecap="round"/>`;
  const lab=(x,y,t,ok)=>`<g><rect x="${x-44}" y="${y-18}" width="88" height="34" rx="9" fill="#fff" stroke="${c(ok)}" stroke-width="3"/><text x="${x}" y="${y+6}" text-anchor="middle" font-size="20" font-weight="800" fill="${c(ok)}">${t}</text></g>`;
  const node=(x,y,col,t,tc='#fff')=>`<g><circle cx="${x}" cy="${y}" r="24" fill="${col}"/><text x="${x}" y="${y+6}" text-anchor="middle" font-size="18" font-weight="800" fill="${tc}">${t}</text></g>`;
  return `<svg class="sock" viewBox="0 0 360 270" width="100%" role="img" aria-label="Mesures phase, neutre, terre">
  ${line(64,56,296,56,v.pn.ok)}${line(64,56,180,222,v.pt.ok)}${line(296,56,180,222,v.nt.ok)}
  ${lab(180,56,v.pn.v+' V',v.pn.ok)}${lab(104,142,v.pt.v+' V',v.pt.ok)}${lab(256,142,v.nt.v+' V',v.nt.ok)}
  ${node(64,56,'#8a4b1f','P')}${node(296,56,'#1b5fc1','N')}${node(180,222,'#e0b400','T','#111')}
  <text x="64" y="100" text-anchor="middle" font-size="13" fill="#555">Phase</text>
  <text x="296" y="100" text-anchor="middle" font-size="13" fill="#555">Neutre</text>
  <text x="180" y="262" text-anchor="middle" font-size="13" fill="#555">Terre</text></svg>`;
}
const CASES={
 conf:{n:'Prise conforme',pn:{v:230,ok:1},pt:{v:230,ok:1},nt:{v:0,ok:1},go:1,txt:'Tensions attendues : Phase↔Neutre ≈ 230 V, Phase↔Terre ≈ 230 V, Neutre↔Terre ≈ 0 V.',act:'Branchement autorisé (sous réserve des autres contrôles).'},
 mt:{n:'Mauvaise terre',pn:{v:230,ok:1},pt:{v:200,ok:0},nt:{v:30,ok:0},go:0,txt:'Plus de 5 V entre Neutre et Terre : la terre est de mauvaise qualité.',act:'Je ne branche pas. Je préviens le client : il doit faire appel à un électricien.'},
 st:{n:'Absence de terre',pn:{v:230,ok:1},pt:{v:0,ok:0},nt:{v:0,ok:1},go:0,txt:'Aucune tension entre Phase et Terre : la prise n’a pas de terre.',act:'Aucun matériel GEM de classe I sur une prise sans terre. Je refuse le raccordement, je trace, électricien.'},
 nc:{n:'Neutre coupé',pn:{v:0,ok:0},pt:{v:0,ok:0},nt:{v:0,ok:1},go:0,txt:'0 V partout mais les voyants du VAT clignotent : le neutre est coupé.',act:'Je ne branche pas. Électricien obligatoire.'}
};

/* ===== Contenu des items ===== */
const MODS=[
{id:1,title:'Cadre et contrôle de la prise',short:'Cadre & prise',min:5,screens:[
 {t:'Chez le client',html:()=>`
  <p class="kicker">Item 1 · Cadre et contrôle de la prise</p><h2>Vous arrivez chez le client…</h2>
  <div class="grid2"><div>
   <p class="lead">Un lave-linge à installer, une prise « qui a l’air normale », un client pressé. <b>Qu’avez-vous le droit de faire ? Que devez-vous refuser ?</b></p>
   <div class="box key"><h3>À la fin de ce module vous saurez</h3><ul class="l"><li>Distinguer ce que vous <b>pouvez contrôler</b> de ce qui relève d’un électricien</li><li>Vérifier la prise et le circuit avant de brancher</li><li>Décider : <b>j’installe, je m’arrête, je trace</b></li></ul></div>
  </div>${img('s37_58','Le doute, c’est normal : la règle vous dit quoi faire.')}</div>
  <div class="callout"><b>Durée :</b> environ 18 min · 3 items + 1 quiz de 10 questions (80 % pour valider).</div>`},
 {t:'Votre cadre d’intervention',html:()=>`
  <p class="kicker">Item 1 · Le cadre</p><h2>Vous contrôlez. Vous ne modifiez pas.</h2>
  <div class="grid2">
   <div class="box ok"><h3><span class="ico ok">✓</span>Je peux</h3><ul class="l ok"><li>Identifier visuellement l’installation</li><li>Contrôler la prise avec un VAT</li><li>Lire le repérage au tableau électrique</li><li>Constater et signaler une anomalie</li><li>Refuser le raccordement en cas de doute</li></ul></div>
   <div class="box ko"><h3><span class="ico ko">✕</span>Je ne fais pas</h3><ul class="l ko"><li>Modifier ou remettre en conformité l’installation</li><li>Changer un disjoncteur ou la protection du circuit</li><li>Modifier la section des conducteurs ou le câblage</li><li>Réparer un pot d’encastrement ou le placo</li><li>Bricoler une adaptation pour « dépanner »</li></ul></div>
  </div>
  <div class="callout"><b>À retenir :</b> être habilité BS, c’est savoir <b>travailler en sécurité</b>. Ce n’est pas devenir électricien : l’habilitation ne remplace pas votre formation métier (reconnaître une section, repérer une installation conforme, connaître vos limites).</div>
  <div class="callout red"><b>Règle d’or :</b> en cas de doute → <b>aucun branchement</b>, le client fait appel à un électricien.</div>`},
 {t:'Le bon outil : le VAT',html:()=>`
  <p class="kicker">Item 1 · Contrôle de la prise</p><h2>Un seul outil est réglementaire : le VAT</h2>
  <p>Le <b>Vérificateur d’Absence de Tension</b> est le seul appareil autorisé. À contrôler <b>avant chaque branchement</b> d’un appareil GEM.</p>
  <div class="grid3">
   <div class="box ok">${img('s02_04')}<h3 style="margin-top:8px"><span class="ico ok">✓</span>VAT</h3><p>L’appareil réglementaire.</p></div>
   <div class="box ko">${img('s01_01')}<h3 style="margin-top:8px"><span class="ico ko">✕</span>Tournevis testeur</h3><p>Ne remplace pas le VAT.</p></div>
   <div class="box ko">${img('s01_02')}<h3 style="margin-top:8px"><span class="ico ko">✕</span>Multimètre</h3><p>Ne remplace pas le VAT.</p></div>
  </div>
  <h3 style="margin-top:18px">Avant de s’en servir : vérifier le VAT lui‑même</h3>
  <div class="steps5" style="grid-template-columns:repeat(4,1fr)">
   <div class="st"><b>1</b>Contrôle visuel : boîtier, cordons, pointes</div>
   <div class="st"><b>2</b>Connecter les pointes sur le dispositif de test</div>
   <div class="st"><b>3</b>Vérifier la réaction : voyants, affichage ou signal sonore</div>
   <div class="st"><b>4</b>Pas de réaction ? Changer les piles, sinon VAT hors service</div>
  </div>
  <p class="cap" style="margin-top:10px">Bonne pratique : tester le VAT avant et après la mesure.</p>`},
 {t:'Lire les mesures',html:()=>`
  <p class="kicker">Item 1 · Contrôle de la prise</p><h2>Lire les mesures : 4 cas à reconnaître</h2>
  <p>Mesurez Phase↔Neutre, Phase↔Terre, puis Neutre↔Terre. <b>Touchez un cas</b> pour voir le résultat.</p>
  <div class="tabs" id="ct">${Object.entries(CASES).map(([k,c],i)=>`<button class="tab${i?'':' on'}" data-k="${k}">${c.n}</button>`).join('')}</div>
  <div class="grid2" id="cv" style="align-items:center"></div>`,
  init:r=>{
   const draw=k=>{const c=CASES[k];
    $('#cv',r).innerHTML=`<div>${sockSVG(c)}</div><div><span class="pill ${c.go?'ok':'ko'}">${c.go?'Je branche':'Je ne branche pas'}</span><h3 style="margin-top:8px">${c.n}</h3><p>${c.txt}</p><div class="callout ${c.go?'green':'red'}">${c.act}</div>${k==='conf'?img('s03_05','Prise avec terre (broche centrale)'):k==='st'?img('s03_06','Prise sans terre : pas de broche'):''}</div>`};
   $$('.tab',r).forEach(b=>b.addEventListener('click',()=>{$$('.tab',r).forEach(x=>x.classList.remove('on'));b.classList.add('on');draw(b.dataset.k)}));
   draw('conf');}},
 {t:'À vous de décider',html:()=>`
  <p class="kicker">Item 1 · Mise en pratique</p><h2>Vous avez fait la mesure. Vous branchez ?</h2><div id="dq"></div>`,
  init:r=>{
   const Q=[
    {m:'Phase↔Neutre : 230 V · Phase↔Terre : 230 V · Neutre↔Terre : 0 V',ok:0,why:'Valeurs attendues sur une prise 230 V conforme.'},
    {m:'Phase↔Neutre : 230 V · Phase↔Terre : 200 V · Neutre↔Terre : 30 V',ok:1,why:'Plus de 5 V entre Neutre et Terre : mauvaise terre. Électricien.'},
    {m:'Phase↔Neutre : 0 V · Phase↔Terre : 0 V · voyants du VAT qui clignotent',ok:1,why:'Neutre coupé : on ne branche pas, électricien.'}];
   let i=0,sc=0;const host=$('#dq',r);
   const next=()=>{ if(i>=Q.length){host.innerHTML=`<div class="callout green"><b>Bravo : ${sc}/${Q.length}.</b> Retenez le réflexe : on mesure, on interprète, et au moindre écart on ne branche pas.</div>`;return}
    const q=Q[i];host.innerHTML=`<div class="box key"><b>Cas ${i+1}/${Q.length}</b><br>${q.m}</div>`;
    mcq(host,{opts:['Je branche','Je ne branche pas, j’oriente le client vers un électricien'],ok:q.ok,why:q.why,onDone:g=>{if(g)sc++;const b=document.createElement('button');b.className='btn y';b.textContent=i+1<Q.length?'Cas suivant ›':'Terminer';b.onclick=()=>{i++;next()};host.appendChild(b)}})};
   next();}},
 {t:'À retenir',html:()=>`
  <p class="kicker">Item 1 · Synthèse</p><h2>À retenir</h2>
  <div class="grid2"><ul class="l"><li>Je <b>contrôle</b>, je ne modifie pas l’installation</li><li>Seul le <b>VAT</b> est réglementaire (pas de multimètre, pas de tournevis testeur)</li><li>Je teste le VAT <b>avant et après</b></li></ul>
  <ul class="l"><li>Contrôle de la prise <b>avant chaque branchement</b> GEM</li><li>Neutre↔Terre &gt; 5 V, pas de terre ou neutre coupé = <b>je ne branche pas</b></li><li>Dans le doute : <b>je refuse et je trace</b></li></ul></div>
  <div class="callout">Prochain item : <b>le circuit au tableau électrique</b> (différentiel, disjoncteur, prise dédiée, section des fils).</div>`}
]},
{id:2,title:'Circuit, protections et section des fils',short:'Circuit & protections',min:5,screens:[
 {t:'Le circuit spécialisé',html:()=>`
  <p class="kicker">Item 2 · Le circuit</p><h2>Les gros appareils ont leur propre circuit</h2>
  <p>Un <b>circuit spécialisé</b> alimente un seul appareil (lave-linge, lave-vaisselle, sèche-linge, four, plaque de cuisson) : il part du tableau avec sa <b>propre protection</b>. La NF C 15-100 le prévoit.</p>
  <div class="grid2"><div class="box key"><h3>Exemple : lave-linge</h3><ul class="l"><li>1 circuit dédié, 1 seule prise</li><li>Différentiel <b>30 mA type A</b></li><li>Disjoncteur <b>20 A</b> maximum</li><li>Conducteurs <b>2,5 mm²</b> minimum</li><li><b>Terre</b> obligatoire</li></ul></div>${img('s09_13','Circuit lave-linge : fils 2,5 mm²')}</div>
  <h3 style="margin-top:16px">Repères par appareil</h3>
  <table class="t"><tr><th>Appareil</th><th>Section</th><th>Disjoncteur</th><th>Différentiel mini</th></tr>
  <tr><td>Plaque de cuisson / cuisinière (monophasé)</td><td>6 mm²</td><td>32 A</td><td>Type A</td></tr>
  <tr><td>Plaque de cuisson (triphasé)</td><td>2,5 mm²</td><td>20 A</td><td>Type A</td></tr>
  <tr><td>Four · lave-vaisselle · sèche-linge</td><td>2,5 mm²</td><td>20 A</td><td>Type AC</td></tr>
  <tr><td>Lave-linge</td><td>2,5 mm²</td><td>20 A</td><td>Type A</td></tr></table>`},
 {t:'Différentiel et disjoncteur',html:()=>`
  <p class="kicker">Item 2 · Au tableau</p><h2>Deux protections à repérer</h2>
  <div class="grid2">
   <div class="box"><h3>① Le différentiel 30 mA</h3>${img('s14_20')}<ul class="l"><li>Bouton <b>TEST</b> (« T »)</li><li>Sensibilité <b>30 mA</b> (protège les personnes) ; 300/500 mA = protection générale</li><li>Souvent <b>en tête de rangée</b></li></ul><p class="cap">« Un bouton TEST + une valeur en mA = un différentiel. »</p></div>
   <div class="box"><h3>② Le disjoncteur adapté</h3>${img('s15_23')}<ul class="l"><li>Lave-linge : <b>C20 A</b> dédié</li><li>Section <b>2,5 mm²</b></li><li>« 20 » inscrit sur le levier</li></ul><p class="cap">Adapté à la puissance de l’appareil livré (2 000 à 3 000 W pour un lave-linge).</p></div>
  </div>`},
 {t:'Retrouver le bon circuit',html:()=>`
  <p class="kicker">Item 2 · Au tableau</p><h2>Quel disjoncteur alimente mon appareil ?</h2>
  <div class="tabs" id="mt"><button class="tab on" data-i="0">Méthode 1 · Étiquette</button><button class="tab" data-i="1">Méthode 2 · Coupures</button><button class="tab" data-i="2">Méthode 3 · VAT</button></div>
  <div id="mv"></div>`,
  init:r=>{
   const M=[
    `<div class="grid2"><div><h3>Lecture du tableau</h3><ul class="l"><li>J’ouvre le tableau électrique</li><li>Je cherche une étiquette : <b>LL, Lave-linge, Buanderie, Prise spécialisée</b></li><li>Le disjoncteur associé est généralement un <b>20 A</b></li></ul></div>${img('s21_33','Tableau repéré : protection 30 mA type A, lave-linge, plaque cuisson…')}</div>`,
    `<div class="grid2"><div><h3>Si le tableau n’est pas identifié</h3><ul class="l"><li>Je mets le lave-linge en marche</li><li>Une autre personne vérifie qu’il fonctionne</li><li>J’abaisse <b>un disjoncteur à la fois</b></li><li>Quand l’appareil s’arrête : circuit trouvé</li><li><b>Je réenclenche</b> avant de poursuivre</li></ul></div>${img('s16_24','Tableau avec repérage des circuits')}</div>`,
    `<div class="grid2"><div><h3>Avec le VAT (si habilité et formé)</h3><ul class="l"><li>Je branche le VAT sur la prise du lave-linge (phase/neutre)</li><li>Je coupe les disjoncteurs <b>un par un</b></li><li>Quand le VAT indique l’absence de tension : j’ai trouvé le disjoncteur</li></ul></div>${img('s17_26','Contrôle d’une prise')}</div>`];
   const show=i=>{$('#mv',r).innerHTML=M[i]};
   $$('.tab',r).forEach(b=>b.addEventListener('click',()=>{$$('.tab',r).forEach(x=>x.classList.remove('on'));b.classList.add('on');show(+b.dataset.i)}));show(0);}},
 {t:'Prise dédiée ou prise confort ?',html:()=>`
  <p class="kicker">Item 2 · Identifier la prise</p><h2>Dédiée ou confort : ne concluez pas sur l’apparence</h2>
  <div class="grid3">
   <div class="box"><h3>① Observer</h3><p>Prise derrière ou à côté de l’appareil, près des arrivées d’eau… <b>Ce n’est qu’un indice, pas une preuve.</b></p></div>
   <div class="box"><h3>② Regarder le tableau</h3><p>Disjoncteur repéré <b>LL, LV, SL</b>… avec le bon calibre.</p></div>
   <div class="box"><h3>③ Vérifier l’usage</h3><p>Plusieurs prises sur la ligne ? Multiprise ? Autres appareils branchés ? → <b>suspicion de prise confort</b>.</p></div>
  </div>
  <div class="grid2" style="margin-top:16px;align-items:center">${img('s13_19','Sèche-linge branché sur une prise murale simple')}<div><div class="box key"><b>Mini-défi.</b> D’après la photo, la prise du sèche-linge est-elle dédiée ?</div><div id="dc"></div></div></div>`,
  init:r=>mcq($('#dc',r),{opts:['Oui, elle est forcément dédiée','Non, c’est forcément une prise confort','Impossible de conclure : je vérifie le tableau et les usages sur le circuit'],ok:2,why:'Seuls le repérage au tableau, le disjoncteur dédié et l’absence d’autres usages permettent de confirmer. En cas de doute : je refuse le raccordement.'})},
 {t:'La section des fils',html:()=>`
  <p class="kicker">Item 2 · Section des conducteurs</p><h2>Section des fils : 3 étapes, jamais « à l’œil » seulement</h2>
  <div class="steps5" style="grid-template-columns:repeat(3,1fr)"><div class="st"><b>1</b><b style="background:none;width:auto;height:auto;display:block">Lire le marquage</b>sur la gaine du câble</div><div class="st"><b>2</b><b style="background:none;width:auto;height:auto;display:block">Comparer</b>avec les repères de la pince</div><div class="st"><b>3</b><b style="background:none;width:auto;height:auto;display:block">Vérifier le disjoncteur</b>au tableau</div></div>
  <div class="grid3" style="margin-top:16px">${img('s35_56','Identification visuelle des sections')}${img('s31_42','6 mm² : circuit cuisson, 32 A')}${img('s31_43','2,5 mm² triphasé')}</div>
  <div class="grid2" style="margin-top:14px"><div class="box ko"><h3><span class="ico ko">✕</span>Ce que je ne fais pas</h3><ul class="l ko"><li>Démonter l’installation pour mesurer</li><li>Couper le câble pour vérifier</li><li>Réduire la section ou couper des brins</li></ul></div><div class="callout red"><b>Section différente, disjoncteur incompatible, conducteur non identifiable ?</b> J’arrête l’intervention et j’applique la procédure.</div></div>`},
 {t:'Vérifiez vos repères',html:()=>`
  <p class="kicker">Item 2 · Mise en pratique</p><h2>Associez chaque appareil à son circuit</h2><div id="mm"></div>`,
  init:r=>{
   const rows=[['Lave-linge',0],['Plaque de cuisson monophasée',1],['Four',0]];
   const opts=['2,5 mm² · disjoncteur 20 A','6 mm² · disjoncteur 32 A','1,5 mm² · disjoncteur 10 A'];
   const h=$('#mm',r);
   h.innerHTML=rows.map((x,i)=>`<div class="mrow"><b>${x[0]}</b><select class="sel" data-i="${i}"><option value="">— choisir —</option>${opts.map((o,j)=>`<option value="${j}">${o}</option>`).join('')}</select></div>`).join('')+`<button class="btn y" id="mck">Vérifier</button><div class="fb" id="mfb"></div>`;
   $('#mck',r).onclick=()=>{let ok=0;$$('.sel',h).forEach(s=>{const g=s.value!==''&&+s.value===rows[+s.dataset.i][1];s.classList.remove('right','wrong');s.classList.add(g?'right':'wrong');if(g)ok++});
    const f=$('#mfb',r);f.className='fb show '+(ok===3?'ok':'ko');f.innerHTML=ok===3?'<b>Parfait.</b> Lave-linge et four : 2,5 mm² / 20 A ; plaque monophasée : 6 mm² / 32 A.':`<b>${ok}/3.</b> Corrigez les champs en rouge. Repère : 2,5 mm² ↔ 20 A, 6 mm² ↔ 32 A (cuisson monophasée).`};}},
 {t:'À retenir',html:()=>`
  <p class="kicker">Item 2 · Synthèse</p><h2>À retenir</h2>
  <div class="grid2"><ul class="l"><li>Gros appareil = <b>circuit spécialisé</b> avec sa protection</li><li>Lave-linge : <b>30 mA type A · C20 · 2,5 mm² · terre</b></li><li>Différentiel : bouton <b>TEST</b> + valeur en mA</li></ul>
  <ul class="l"><li>Prise dédiée ? <b>Indice ≠ preuve</b> : tableau + usages</li><li>Section : <b>marquage → comparaison → disjoncteur</b></li><li>Doute sur la section : <b>j’arrête</b>, je ne coupe rien</li></ul></div>
  <div class="callout">Prochain item : <b>les interdits, les cas terrain et la procédure</b> quand je dois m’arrêter.</div>`}
]},
{id:3,title:'Interdits, cas terrain et décisions',short:'Interdits & décisions',min:6,screens:[
 {t:'Les interdits formels',html:()=>`
  <p class="kicker">Item 3 · Interdictions (GEM classe I, NF C 15-100)</p><h2>Ce qui est formellement interdit</h2>
  <div class="grid4">
   ${[['s45_66','Brancher sur une multiprise, une triplette ou une rallonge'],['s30_40','Couper une prise moulée'],['s30_39','Raccorder une prise 16 A sur un cordon qui n’en est pas équipé d’usine'],['s34_54','Installer un socle 16 A sur un boîtier à dominos ou connecteurs rapides'],['s03_06','Brancher sans raccordement à la terre'],['s46_75','Brancher à moins de 60 cm d’une douche ou d’une baignoire'],['s46_78','Retirer le top d’un appareil pose‑libre hors recommandations constructeur'],['s45_65','Installer 2 produits sur un même boîtier de raccordement (dominos / Wago)']].map(x=>`<div class="box ko" style="padding:10px;text-align:center"><div class="imgc"><img src="${IMG[x[0]]}" alt="" style="max-height:88px"></div><p style="margin:8px 0 0;font-size:15.5px"><span class="ico ko" style="width:20px;height:20px;font-size:12px">✕</span> ${x[1]}</p></div>`).join('')}
  </div>
  <div class="callout red"><b>Une prise moulée se branche.</b> Elle ne se coupe pas, ne se démonte pas, ne se modifie pas.</div>`},
 {t:'Cas terrain',html:()=>`
  <p class="kicker">Item 3 · Cas terrain</p><h2>6 situations, une décision</h2>
  <div class="tabs" id="kt"></div><div id="kv"></div>`,
  init:r=>{
   const K=[
    {n:'Pot absent / cassé',im:'s32_47',q:'Je peux poser ou reposer la prise ?',a:'NON',w:'Sans pot d’encastrement (ou avec un placo dégradé), la prise n’est plus fixée correctement et les conducteurs peuvent être exposés. Je ne remets pas en conformité le mur ni l’installation.',d:'J’arrête le raccordement · photo · compte rendu · appareil laissé débranché si nécessaire.'},
    {n:'Prise 16 A sur ligne 6 mm² / 32 A',im:'s37_58',q:'Je pose une prise femelle 16 A sur un circuit 6 mm² protégé en 32 A ?',a:'NON',w:'Le problème n’est pas la section (6 mm² est largement suffisant) mais la <b>protection 32 A</b> : elle ne protège pas correctement une prise 16 A. Je ne modifie pas la protection du circuit.',d:'Le client fait remplacer et adapter le disjoncteur magnétothermique par un électricien, puis le raccordement est possible.'},
    {n:'6 mm² mono sur 2,5 mm² tri',im:'s31_43',q:'J’adapte un appareil prévu en 6 mm² monophasé sur une installation triphasée 2,5 mm² ?',a:'NON',w:'Je ne modifie ni la répartition des phases, ni la section, ni le couplage de l’appareil, et je ne coupe pas de brins.',d:'Je constate l’incompatibilité · j’informe le client · je trace l’anomalie · j’applique la procédure.'},
    {n:'Fils avec bagues (ferrules)',im:'s41_63',q:'Les bagues ne passent pas dans le bornier de la prise : je les coupe ?',a:'NON',w:'Il est interdit de couper ou retirer la bague, de diminuer la section du conducteur ou de forcer le raccordement.',d:'J’utilise du matériel compatible, sinon je signale la non‑conformité.'},
    {n:'Fiche mâle sur le câble',im:'s30_39',q:'L’appareil est livré sans fiche : j’en ajoute une ?',a:'NON',w:'Risques d’électrocution, d’échauffement et perte de conformité du produit. Seule une pièce d’origine ou validée par le constructeur est possible.',d:'Je respecte les préconisations du fabricant ; en cas de doute je ne modifie pas l’appareil et je signale.'},
    {n:'Domino ou Wago ?',im:'s41_61',q:'Domino ou Wago pour raccorder ?',a:'Cela dépend',w:'Les dominos sont <b>tolérés</b> s’ils sont adaptés à la section, bien serrés et accessibles ; les épissures (fils torsadés + ruban) sont interdites. Les <b>connecteurs Wago d’origine sont fortement préconisés</b>. Un Wago 221 va jusqu’à 4 mm² : pas adapté à du 6 mm².',d:'Je lis la section et les indications du fabricant ; jamais de conducteur forcé dans une borne non adaptée.'}];
   const t=$('#kt',r);t.innerHTML=K.map((k,i)=>`<button class="tab${i?'':' on'}" data-i="${i}">${k.n}</button>`).join('');
   const show=i=>{const k=K[i];$('#kv',r).innerHTML=`<div class="grid2" style="align-items:center">${img(k.im)}<div><div class="box key"><b>${k.q}</b></div><p style="margin-top:10px"><span class="pill ${k.a==='NON'?'ko':'w'}">${k.a}</span></p><p>${k.w}</p><div class="callout green"><b>Ce que je fais :</b> ${k.d}</div></div></div>`};
   $$('.tab',t).forEach(b=>b.addEventListener('click',()=>{$$('.tab',t).forEach(x=>x.classList.remove('on'));b.classList.add('on');show(+b.dataset.i)}));show(0);}},
 {t:'Je peux / je m’arrête',html:()=>`
  <p class="kicker">Item 3 · Mise en pratique</p><h2>Je peux… ou je m’arrête ?</h2><div id="tri"></div>`,
  init:r=>{
   const A=[
    ['Contrôler la prise au VAT avant de brancher',1,'Le contrôle de la prise fait partie de votre rôle.'],
    ['Lire l’étiquette du tableau pour repérer le disjoncteur du lave-linge',1,'Lecture visuelle du repérage : autorisé.'],
    ['Photographier une anomalie et la noter au compte rendu',1,'La traçabilité est attendue.'],
    ['Brancher un lave-linge sur une multiprise « juste pour aujourd’hui »',0,'Multiprise, triplette et rallonge sont interdites pour un GEM classe I.'],
    ['Couper la prise moulée pour passer sur un domino',0,'Une prise moulée ne se coupe jamais.'],
    ['Remplacer le disjoncteur 32 A par un 16 A',0,'Vous ne modifiez pas la protection du circuit : c’est le travail d’un électricien.'],
    ['Poser une prise femelle alors qu’il n’y a pas de pot d’encastrement',0,'Pas de support adapté : arrêt du raccordement, photo, compte rendu.'],
    ['Brancher sur une prise dont Neutre↔Terre = 30 V',0,'Plus de 5 V : mauvaise terre. Je ne branche pas.']];
   let i=0,sc=0;const h=$('#tri',r);
   const nx=()=>{ if(i>=A.length){h.innerHTML=`<div class="callout ${sc>=7?'green':''}"><b>Résultat : ${sc}/${A.length}.</b> ${sc>=7?'Vous maîtrisez les limites de votre intervention.':'Relisez les cas terrain avant de passer au quiz.'}</div>`;return}
    const a=A[i];h.innerHTML=`<div class="qbar"><i style="width:${i/A.length*100}%"></i></div><div class="box key" style="font-size:20px"><b>${i+1}/${A.length}</b> · ${a[0]}</div>`;
    mcq(h,{opts:['Je peux le faire','Je m’arrête (interdit ou hors périmètre)'],ok:a[1]?0:1,why:a[2],onDone:g=>{if(g)sc++;const b=document.createElement('button');b.className='btn y';b.textContent=i+1<A.length?'Suivant ›':'Voir mon résultat';b.onclick=()=>{i++;nx()};h.appendChild(b)}})};
   nx();}},
 {t:'Je m’arrête : la procédure',html:()=>`
  <p class="kicker">Item 3 · Procédure</p><h2>Quand je ne peux pas brancher</h2>
  <div class="steps5">
   <div class="st"><b>1</b><strong>Je m’arrête</strong><br>Pas d’adaptation improvisée</div>
   <div class="st"><b>2</b><strong>J’informe le client</strong><br>Il fait appel à un électricien</div>
   <div class="st"><b>3</b><strong>Je photographie</strong><br>L’anomalie constatée</div>
   <div class="st"><b>4</b><strong>Appareil débranché</strong><br>Laissé en sécurité</div>
   <div class="st last"><b>5</b><strong>Je trace dans Nomad</strong><br>Tout branchement non effectué est mentionné au dossier</div>
  </div>
  <div class="callout"><b>Pourquoi tracer ?</b> Votre compte rendu protège le client, vous et l’entreprise : il prouve que l’anomalie a été constatée et que l’appareil a été laissé débranché volontairement.</div>`},
 {t:'Mise en situation',html:()=>`
  <p class="kicker">Item 3 · Mise en situation</p><h2>« Branchez quand même, mon beau‑frère réparera »</h2>
  <div class="grid2" style="align-items:center">${img('s34_55','Prise qui sort du mur, pot cassé, placo abîmé')}<div><div class="box key">Vous installez un lave-linge. La prise murale est cassée : pot desserré, placo effrité. Le client insiste : <i>« Branchez, c’est urgent, mon beau‑frère s’en occupera »</i>.</div></div></div><div id="ms"></div>`,
  init:r=>mcq($('#ms',r),{opts:['Je rebouche et je rebranche vite fait : le client est d’accord','Je laisse l’appareil débranché, je photographie, j’explique la situation au client et je trace dans Nomad','Je branche sur une multiprise posée au sol'],ok:1,why:'Pot cassé ou placo dégradé = arrêt du raccordement : vous ne remettez pas l’installation en conformité, et la multiprise est interdite. Le client est orienté vers un électricien.'})},
 {t:'À retenir',html:()=>`
  <p class="kicker">Item 3 · Synthèse</p><h2>À retenir</h2>
  <div class="grid2"><ul class="l ko"><li>Jamais de multiprise, triplette ou rallonge</li><li>Une prise moulée ne se coupe pas</li><li>Pas de terre = <b>pas de branchement</b></li><li>Pas de modification de protection, section ou câblage</li></ul>
  <ul class="l ok"><li>Pot absent ou abîmé : <b>j’arrête</b></li><li>Dominos tolérés, <b>Wago d’origine préconisés</b> (selon la section)</li><li>Je <b>photographie</b>, je laisse l’appareil <b>débranché</b></li><li>Je <b>trace dans Nomad</b></li></ul></div>
  <div class="callout">Vous êtes prêt pour le <b>quiz final</b> : 10 questions, 80 % pour valider.</div>`}
]},
{id:4,title:'Quiz final',short:'Quiz · 10 questions',min:4,quiz:true}
];

const QUIZ=[
 {q:'Quel appareil est le seul réglementaire pour vérifier l’absence de tension sur une prise ?',o:['Un multimètre','Un tournevis testeur','Un VAT (Vérificateur d’Absence de Tension)','Un détecteur de tension sans contact'],ok:2,w:'Seul le VAT est l’appareil réglementaire ; ni le multimètre ni le tournevis testeur ne le remplacent.'},
 {q:'Vous mesurez : Phase↔Neutre 230 V, Phase↔Terre 200 V, Neutre↔Terre 30 V. Que faites-vous ?',o:['Je branche, la tension est présente','Je ne branche pas : mauvaise terre, le client appelle un électricien','Je branche en laissant l’appareil éteint','Je change la prise'],ok:1,w:'Au‑delà de 5 V entre Neutre et Terre, la terre est mauvaise : on ne branche pas.'},
 {q:'La prise du lave-linge n’a pas de terre. Votre décision ?',o:['Je branche, le lave-linge a une double isolation','Je refuse le raccordement, je trace et j’oriente le client vers un électricien','Je relie la terre sur le neutre','Je branche sur une rallonge avec terre'],ok:1,w:'Aucun appareil de classe I ne se branche sur une prise sans terre.'},
 {q:'Que signifie être habilité BS pour un livreur-installateur ?',o:['Pouvoir modifier le tableau du client','Savoir travailler en sécurité face au risque électrique, sans remplacer la formation métier','Pouvoir remettre une installation en conformité','Pouvoir remplacer un disjoncteur'],ok:1,w:'L’habilitation vise la sécurité de l’intervenant ; elle ne fait pas de vous un électricien.'},
 {q:'Quel ensemble correspond à un circuit spécialisé pour lave-linge ?',o:['Disjoncteur 32 A · 6 mm² · différentiel 30 mA','Disjoncteur 20 A · 2,5 mm² · différentiel 30 mA type A · terre','Disjoncteur 20 A · 1,5 mm² · sans différentiel','Disjoncteur 16 A · 2,5 mm² · différentiel 300 mA'],ok:1,w:'Lave-linge : circuit dédié, DDR 30 mA type A, disjoncteur 20 A max, 2,5 mm² mini, terre.'},
 {q:'Une seconde prise est visible à côté de celle du lave-linge. Peut-on affirmer que la prise n’est pas dédiée ?',o:['Oui, deux prises = prise confort','Non, c’est un indice : je vérifie le tableau et les autres usages sur le circuit','Oui, sauf si elle est blanche','Non, une prise est toujours dédiée'],ok:1,w:'Un indice n’est pas une preuve : seuls le repérage au tableau et l’absence d’autres usages permettent de conclure.'},
 {q:'Câble 6 mm² protégé en 32 A, appareil avec fiche 16 A. Pouvez-vous poser directement une prise femelle 16 A ?',o:['Oui, 6 mm² est largement suffisant','Oui, si je réduis la section des fils','Non : la protection 32 A est inadaptée, le client doit faire adapter le disjoncteur par un électricien','Oui, avec un domino'],ok:2,w:'Le problème n’est pas la section mais la protection 32 A, que vous ne modifiez pas.'},
 {q:'Le pot d’encastrement est cassé et le placo abîmé. Quelle est la bonne réaction ?',o:['Je répare avec du plâtre et je branche','J’arrête le raccordement, je photographie, je laisse l’appareil débranché et je trace dans Nomad','Je branche sur une rallonge','Je fixe la prise avec du ruban adhésif'],ok:1,w:'Pot absent ou abîmé = arrêt du raccordement, photo, compte rendu, appareil débranché.'},
 {q:'Quelle affirmation sur dominos et connecteurs Wago est exacte ?',o:['Les dominos sont interdits, seuls les Wago sont autorisés','Les épissures au ruban sont autorisées','Dominos tolérés s’ils sont adaptés à la section ; Wago d’origine préconisés ; un Wago 221 n’est pas adapté au 6 mm²','Un Wago convient pour toutes les sections'],ok:2,w:'Toujours vérifier la section et les indications du fabricant.'},
 {q:'Quand un branchement n’a pas pu être réalisé, que faut-il faire ?',o:['Rien, le client gérera','Le mentionner dans le dossier Nomad : appareil laissé débranché','Le dire oralement au client suffit','Brancher quand même après accord oral du client'],ok:1,w:'Tout branchement non effectué doit être tracé dans Nomad.'}
];

/* ===== Application ===== */
const app=$('#app');
const total=MODS.length;
function updTop(){
 const d=Object.keys(ST.done).length;
 $('.bar i').style.width=(d/total*100)+'%';
 $('#pg').textContent=d+'/'+total+' items terminés';
 $$('nav.steps button').forEach((b,i)=>{b.classList.toggle('on',i-1===cur);const m=MODS[i-1];b.classList.toggle('done',!!(m&&ST.done[m.id]))});
}
function buildNav(){
 $('nav.steps .in').innerHTML=`<button data-m="-1"><span class="n">⌂</span><span class="l">Accueil<small>Présentation</small></span></button>`+MODS.map((m,i)=>`<button data-m="${i}"><span class="n">${m.id}</span><span class="l">${m.short}<small>≈ ${m.min} min</small></span></button>`).join('');
 $$('nav.steps button').forEach(b=>b.addEventListener('click',()=>go(+b.dataset.m,0)));
}
function go(m,s){cur=m;scr=s;render();window.scrollTo({top:0,behavior:'smooth'})}
function home(){
 app.innerHTML=`<div class="hero"><img src="${IMG.logo}" alt="Académie Fnac Darty"><div style="position:relative;z-index:1;padding-right:70px"><p class="kicker" style="color:var(--yellow)">E‑learning · Livraison & installation</p><h2>Installation électrique : ce que je peux faire… et ce que je refuse</h2><p class="lead">Gros électroménager et TV : vos limites d’intervention, les contrôles autorisés avant la mise en service, et les cas où l’on s’arrête.</p></div></div>
 <div class="path">${MODS.map((m,i)=>`<button data-m="${i}"><div class="num">${m.id}</div><b>${m.quiz?'Quiz final':m.title}</b><div class="mn">≈ ${m.min} min${m.quiz?' · 10 questions':''}${ST.done[m.id]?' · ✓ terminé':''}</div></button>`).join('')}</div>
 <div class="callout" style="margin-top:18px"><b>Durée totale : environ 18 minutes.</b> Suivez les items dans l’ordre puis validez avec le quiz (8 bonnes réponses sur 10).${ST.best!=null?` Votre meilleur score : <b>${ST.best}/10</b>.`:''}</div>
 <div class="foot"><span></span><button class="btn y" id="start">Commencer l’item 1 ›</button></div>`;
 $$('.path button',app).forEach(b=>b.onclick=()=>go(+b.dataset.m,0));$('#start').onclick=()=>go(0,0);
}
function render(){
 updTop();
 if(cur<0){home();voice('home');return}
 const m=MODS[cur];
 if(m.quiz){quiz();return}
 const S=m.screens,s=S[scr];
 app.innerHTML=`<section class="screen" id="sc">${s.html()}</section><div class="foot"><button class="btn ghost" id="pv" ${scr===0&&cur===0?'disabled':''}>‹ Précédent</button><div class="dots">${S.map((_,i)=>`<i class="${i===scr?'on':i<scr?'past':''}"></i>`).join('')}</div><button class="btn y" id="nx">${scr===S.length-1?(cur<total-1?(MODS[cur+1].quiz?'Passer au quiz ›':'Item suivant ›'):'Terminer'):'Suivant ›'}</button></div>`;
 s.init&&s.init($('#sc'));
 voice('m'+m.id+'_s'+(scr+1));
 $('#pv').onclick=()=>{if(scr>0)go(cur,scr-1);else if(cur>0)go(cur-1,MODS[cur-1].screens?MODS[cur-1].screens.length-1:0);else go(-1,0)};
 $('#nx').onclick=()=>{
  if(scr<S.length-1)go(cur,scr+1);
  else{ST.done[m.id]=1;save();go(cur+1,0)}
 };
 if(scr===S.length-1){ST.done[m.id]=1;updTop()}
 save();
}
function quiz(){
 let i=0,sc=0;const miss=[];
 const draw=()=>{
  if(i>=QUIZ.length)return result();
  const q=QUIZ[i];voice('q'+(i+1));
  app.innerHTML=`<section class="screen"><p class="kicker">Quiz final · Question ${i+1}/${QUIZ.length}</p><div class="qbar"><i style="width:${i/QUIZ.length*100}%"></i></div><h2 style="font-size:24px">${q.q}</h2><div id="qq"></div></section>`;
  mcq($('#qq'),{opts:q.o,ok:q.ok,why:q.w,onDone:g=>{if(g)sc++;else miss.push(i);const b=document.createElement('button');b.className='btn y';b.style.marginTop='14px';b.textContent=i+1<QUIZ.length?'Question suivante ›':'Voir mon résultat';b.onclick=()=>{i++;draw()};$('#qq').appendChild(b);b.focus()}});
 };
 const result=()=>{
  const pass=sc>=8;if(ST.best==null||sc>ST.best)ST.best=sc;if(pass)ST.done[4]=1;save();SC.result(sc,pass);updTop();voice(pass?'res_ok':'res_ko');
  app.innerHTML=`<section class="screen" style="text-align:center"><p class="kicker">Résultat du quiz</p><div class="score" style="color:${pass?'var(--green)':'var(--red)'}">${sc}/10</div><h2 style="margin-top:10px">${pass?'Module validé, bravo !':'Pas encore validé (8/10 requis)'}</h2><p class="lead">${pass?'Vous connaissez les limites de votre intervention. En cas de doute sur le terrain : je ne branche pas, je préviens, je trace.':'Revoyez les items concernés puis retentez le quiz.'}</p>
  ${miss.length?`<div class="box" style="text-align:left;margin:16px 0"><h3>Questions à revoir</h3><ul class="l">${miss.map(k=>`<li><b>${QUIZ[k].q}</b><br><span style="color:var(--green)">✓ ${QUIZ[k].o[QUIZ[k].ok]}</span></li>`).join('')}</ul></div>`:''}
  <div class="foot" style="justify-content:center"><button class="btn ghost" id="rv">Revoir les items</button><button class="btn y" id="rt">Refaire le quiz</button></div></section>`;
  $('#rv').onclick=()=>go(-1,0);$('#rt').onclick=()=>go(3,0);
 };
 draw();
}
$('#vplay').onclick=()=>{if(AUD.paused){if(!AUD.src)voice(vk());else AUD.play().catch(()=>{})}else AUD.pause()};
$('#vmute').onclick=()=>{voiceOn=!voiceOn;try{localStorage.setItem('fd-voice',voiceOn?'1':'0')}catch(e){}if(!voiceOn)AUD.pause();else AUD.play().catch(()=>{});updV()};
const vk=()=>cur<0?'home':'m'+MODS[cur].id+'_s'+(scr+1);
const sd=SC.init();
if(sd){ST.done=Object.assign(ST.done,sd.d||{});if(sd.b!=null)ST.best=sd.b;if(sd.l&&sd.l[0]>=0&&sd.l[0]<3){cur=sd.l[0];scr=sd.l[1]||0}}
buildNav();render();updV();
