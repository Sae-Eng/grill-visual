/* grill-visual のまとめの JS。build.mjs が parts.js・figure.js の後に差し込む。モデルは読まない・書かない。
   明暗の切り替え、決定の図の前／後、4章のタスク（tasks.json から進み具合・チェックリスト・依存の図・表）を受け持つ。
   タスクは埋め込んだ #tasks-data で描き、開いたまま tasks.js（build.mjs が書く）を数秒ごとに読み直して、変わっていたら描き直す。 */
(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// ページ内の移動は JS で行う。Claude の内蔵ブラウザは data: の写しで開き、#s4 への移動を止めるため。畳んだ中なら先に開く
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]'),t=a&&document.getElementById(a.getAttribute('href').slice(1));if(!t)return;
  e.preventDefault();const d=t.closest('details');if(d)d.open=true;t.scrollIntoView({block:'start'});},true);
// 明暗の切り替え。押したときだけ html の data-theme を書き換える
document.addEventListener('click',e=>{const b=e.target.closest('[data-theme-set]');if(!b)return;document.documentElement.dataset.theme=b.dataset.themeSet;
  document.querySelectorAll('[data-theme-set]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
// 決定の図の前／後
const ba=(card,v)=>{card.querySelectorAll('.fig .v').forEach(x=>x.classList.toggle('on',x.classList.contains(v)));
  card.querySelectorAll('[data-ba]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.v===v)));};
document.addEventListener('click',e=>{const b=e.target.closest('[data-ba]');if(b)ba(b.closest('.dcard'),b.dataset.v);});
// 確かめ（verify.mjs）用: 0 は後、1 は前をすべての決定に出す。コマは figure.js の GV に任せる
const fg=window.GV;
window.GV={passes:()=>Math.max(document.querySelector('[data-ba]')?2:1,fg?fg.passes():1),
  pass:i=>{fg?.pass(i);document.querySelectorAll('.dcard').forEach(c=>{if(c.querySelector('[data-ba]'))ba(c,i%2?'b':'a');});}};

/* ---------- 4 タスク ---------- */
const root=$('task-rows');if(!root)return;
const R=(x,y,w,h,s='ink',f='surface',sw=1.5,more='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" ${ST(s,f,sw,more)}/>`;
const sdone=t=>t.state==='done'?t.steps.length:Math.min(t.steps_done||0,t.steps.length);
function tasks(data){
  const list=data.tasks,ST_JA=data.states||{};
  const by=Object.fromEntries(list.map(t=>[t.id,t])),errs=[];
  list.forEach(t=>{if(!ST_JA[t.state])errs.push(`${t.id}: 知らない state「${t.state}」`);
    (t.depends_on||[]).forEach(d=>{if(!by[d])errs.push(`${t.id}: depends_on の ${d} が無い`);});});
  const lv={},seen=new Set();
  const L=id=>{if(lv[id]!==undefined)return lv[id];if(seen.has(id)){errs.push(`${id}: 依存が輪になっている`);return 0;}seen.add(id);
    const ds=(by[id]?.depends_on||[]).filter(d=>by[d]);return(lv[id]=ds.length?1+Math.max(...ds.map(L)):0);};
  list.forEach(t=>L(t.id));
  const isDone=id=>by[id]?.state==='done',ready=t=>t.state==='todo'&&(t.depends_on||[]).every(isDone);
  // 数と進み具合（手順の数で数える。done のタスクは全手順。やめたタスクは分母から外す）
  const n=s=>list.filter(t=>t.state===s).length,live=list.filter(t=>t.state!=='dropped');
  const all=live.reduce((a,t)=>a+t.steps.length,0),done=live.reduce((a,t)=>a+sdone(t),0),pct=all?Math.round(done/all*100):0;
  const set=(id,v)=>{const e=$(id);if(e)e.textContent=v;};
  set('n-task',list.length);set('n-prop',list.filter(t=>t.proposal).length);set('n-all',live.length);set('n-done',n('done'));set('n-doing',n('doing'));
  set('n-blocked',n('blocked'));set('n-dropped',n('dropped'));set('n-ready',list.filter(ready).length);set('n-pct',pct);set('p-pct',pct);set('p-steps',`${done} / ${all}`);
  set('t-done',`${n('done')}/${live.length}`);set('lp-pct',pct+'%');set('lp-done',`${n('done')}/${live.length} 完了`);
  ['p-bar','t-bar'].forEach(id=>{const e=$(id);if(e)e.style.width=pct+'%';});
  $('for-agent').innerHTML=(data.for_agent||[]).map(s=>`<li>${esc(s.replace(/^\d+\.\s*/,''))}</li>`).join('');
  $('task-err').hidden=!errs.length;$('task-err').textContent=errs.length?'tasks.json の崩れ：'+errs.join(' / '):'';
  // 並べて動かせる：いま取れて、作業中のタスクとも互いにも files が重ならないもの（フォルダは前方一致で重なりとみる）
  const clash=(a,b)=>(a.files||[]).some(f=>(b.files||[]).some(g=>f===g||f.startsWith(g)||g.startsWith(f)));
  const doing=list.filter(t=>t.state==='doing'),par=[],later=[];
  list.filter(t=>ready(t)&&t.owner!=='持ち主').forEach(t=>([...doing,...par].some(u=>clash(t,u))?later:par).push(t));
  const who=t=>t.id+(t.run_by?`（${esc(t.run_by)}）`:'');
  const pe=$('par');if(pe)pe.innerHTML=`<b>並べて動かせる</b>：${par.length?par.map(t=>t.id).join('・'):'なし'}`
    +(doing.length?` · <b>作業中</b>：${doing.map(who).join('・')}`:'')+(later.length?` · files が重なるので後：${later.map(t=>t.id).join('・')}`:'');
  // チェックリスト（タスクごとのチェック。開くと手順ごとのチェック）
  const ck=(cls,mark)=>`<span class="ck ${cls}" aria-hidden="true">${mark}</span>`;
  $('checklist').innerHTML=list.map(t=>{
    const sd=sdone(t),cls=t.state==='done'?'on':t.state==='blocked'?'ng':t.state==='doing'?'now':t.state==='dropped'?'off':'';
    const mark=t.state==='done'?'✓':t.state==='blocked'?'!':t.state==='dropped'?'−':'';
    const steps=t.steps.map((s,i)=>{const c=i<sd?'on':(i===sd&&t.state==='doing')?'now':'';
      return `<li>${ck(c,i<sd?'✓':'')}<span>${esc(s)}${c==='now'?' <small>← 作業中</small>':''}</span></li>`;}).join('');
    return `<li class="${t.state}${t.proposal?' prop':''}"><details data-k="cl-${t.id}"><summary>${ck(cls,mark)}<span class="cl-id">${t.id}</span>`
      +`<span class="cl-t">${esc(t.short||t.title)}${t.owner&&t.owner!=='エージェント'?` <small>（${esc(t.owner)}）</small>`:''}</span><span class="cl-n">${sd}/${t.steps.length}</span>`
      +`<span class="cl-st">${esc((ST_JA[t.state]||t.state)+(t.state==='doing'&&t.run_by?` · ${t.run_by}`:'')+(ready(t)?'・いま取れる':''))}</span></summary><ol class="cl-steps">${steps}</ol>`
      +(t.note&&(t.state==='blocked'||t.state==='dropped')?`<p class="cl-proof">${t.state==='blocked'?'止まった':'やめた'}理由：${esc(t.note)}</p>`:'')
      +((t.proof||[]).length?`<p class="cl-proof">成果物：${t.proof.map(esc).join('、')}</p>`:'')+'</details></li>';}).join('');
  // 依存の図（上から依存の順）
  const rows=[];list.forEach(t=>(rows[lv[t.id]]||=[]).push(t));
  // 1段に4枚まで。多い段は折り返す
  const W=228,H=42,GY=64,PER=4,pos={};let y=16;
  rows.forEach(r=>{r.forEach((t,j)=>{const per=Math.min(r.length-Math.floor(j/PER)*PER,PER),x0=(1000-(per*(W+16)-16))/2;pos[t.id]=[x0+(j%PER)*(W+16),y+Math.floor(j/PER)*GY];});y+=Math.ceil(r.length/PER)*GY;});
  let lines='',boxes='';
  list.forEach(t=>(t.depends_on||[]).filter(d=>pos[d]).forEach(d=>{const[x1,y1]=pos[d],[x2,y2]=pos[t.id],a=x1+W/2,b=y1+H,c=x2+W/2;
    lines+=`<path d="M${a} ${b}C${a} ${b+22} ${c} ${y2-24} ${c} ${y2-3}" ${ST('stroke','none',1.2)} marker-end="url(#tk-mute)"/>`;}));
  list.forEach(t=>{const[x,yy]=pos[t.id],rd=ready(t);
    const[s,f,w]=t.state==='dropped'?['line','paper',1.2]:t.state==='done'?['ok','ok-soft',1.5]:t.state==='doing'?['accent','accent-soft',1.5]:t.state==='blocked'?['ng','ng-soft',1.5]:rd?['accent','surface',2.5]:['frame','surface',1.2];
    const label=t.id+' · '+(t.state==='dropped'?'やめた':ST_JA[t.state]||t.state)+(t.state==='doing'?` ${sdone(t)}/${t.steps.length}`:'')+(rd?'・いま取れる':'');
    boxes+=`<a class="tnode" href="#t-${t.id.toLowerCase()}">`+R(x,yy,W,H,s,f,w,t.proposal||t.state==='dropped'?'stroke-dasharray:5 4':'')
      +MONO(x+10,yy+17,label,s==='frame'||s==='line'?'mute':s,12)+T(x+10,yy+34,t.short||t.title,'ink',12,700)
      +(t.owner&&t.owner!=='エージェント'?T(x+W-8,yy+17,t.owner,'q',12,700,'end'):'')+'</a>';});
  $('dag').setAttribute('viewBox',`0 0 1000 ${y}`);$('dag').innerHTML=defs('tk')+lines+boxes;
  // 表
  root.innerHTML=list.map(t=>`<tr id="t-${t.id.toLowerCase()}"${t.proposal?' class="prop"':''}><td class="tid">${t.id}</td>`
    +`<td>${t.proposal?'<span class="tag prop">提案</span>':'<span class="tag done">議論で決定</span>'}<br><small>${esc(t.kind)}</small></td>`
    +`<td><b>${esc(t.title)}</b><details data-k="tb-${t.id}"><summary>手順・確かめ方・ファイル</summary><ol>${t.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`
    +`<p>確かめ方：${esc(t.how_to_check)}</p>${(t.files||[]).length?`<p>ファイル：${t.files.map(esc).join('、')}</p>`:''}${t.note?`<p>注：${esc(t.note)}</p>`:''}</details></td>`
    +`<td>${esc(t.owner)}${t.run_by?`<br><small>${esc(t.run_by)}</small>`:''}</td><td>${(t.from||[]).join('・')||'—'}</td><td>${(t.depends_on||[]).join('・')||'—'}</td><td>${esc(t.done_when)}</td>`
    +`<td>${esc(ST_JA[t.state]||t.state)}<br><small>手順 ${sdone(t)}/${t.steps.length}${ready(t)?'・いま取れる':''}</small></td>`
    +`<td>${(t.proof||[]).length?t.proof.map(esc).join('<br>'):'—'}${t.checked?`<br><small>${esc(t.checked)}</small>`:''}</td></tr>`).join('');
}
// 同じ中身なら描き直さない。描き直すときは、開いていた畳みを開き直す
let last='';
function load(d){const s=JSON.stringify(d);if(s===last)return false;
  const open=[...document.querySelectorAll('#s4 details[open][data-k]')].map(e=>e.dataset.k);
  last=s;tasks(d);open.forEach(k=>{const e=document.querySelector(`#s4 details[data-k="${k}"]`);if(e)e.open=true;});return true;}
// 自動の読み直し：script で tasks.js を読む（file:// でも動く）。読めないときは知らせる
const hm=()=>new Date().toLocaleTimeString('ja-JP',{hour12:false});
let changedAt='';
function live(ok,changed){if(changed)changedAt=hm();
  ['live-dot','lp-dot'].forEach(id=>{const e=$(id);if(e)e.className='dot'+(ok?' ok':'');});
  $('live-txt').textContent=ok?`5秒ごとに tasks.js を読み直し中 · 最終確認 ${hm()}${changedAt?` · 最後に変わった ${changedAt}`:''}`
    :'自動で読み直せない（tasks.js を読めない）。file:// か http で開き、組み立てを流してから開き直す';}
function poll(){if(!$('live-on').checked)return;
  const s=document.createElement('script');s.src='tasks.js?t='+Date.now();
  s.onload=()=>{s.remove();live(true,!!window.TASKS_DATA&&load(window.TASKS_DATA));};
  s.onerror=()=>{s.remove();live(false);};document.head.appendChild(s);}
load(JSON.parse($('tasks-data').textContent));
poll();setInterval(poll,5000);$('live-on').addEventListener('change',poll);
})();
