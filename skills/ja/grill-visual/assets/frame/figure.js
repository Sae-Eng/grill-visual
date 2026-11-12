/* grill-visual の図の操作。build.mjs が page.js の後に差し込む。
   層: <svg data-view="A"> の値を変えると、CSS が <g data-layer> を出し入れする。案を見るボタンと、回答の選択で変わる。
   コマ: <svg data-at="2"> の値を変えると、CSS が <g data-frame>（そのコマだけ）と <g data-step>（そのコマまで）を出す。 */
(()=>{
const $=id=>document.getElementById(id);
const svgOf=q=>$('svg-'+q);
function setView(q,keys,fromButton){
  const s=svgOf(q);if(!s||!s.hasAttribute('data-view')||!keys.length)return;
  s.setAttribute('data-view',keys.join(' '));
  document.querySelectorAll(`[data-views="${q}"] button`).forEach(b=>b.setAttribute('aria-pressed',String(keys.includes(b.dataset.v))));
  const pv=$('pv-'+q),picked=document.querySelector(`input[name="${q}"]:checked`);
  if(pv&&fromButton)pv.textContent=`${keys.join('・')}案を表示`+(picked?'':pv.dataset.sfx||'');
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-views] button');if(b)setView(b.closest('[data-views]').dataset.views,[b.dataset.v],true);});
document.addEventListener('change',e=>{const el=e.target,q=el.name;if(!q||!svgOf(q))return;
  const keys=[...document.querySelectorAll(`input[name="${q}"]:checked`)].map(i=>i.value);if(keys.length)setView(q,keys,false);});
// ステップ再生: 押したときだけ進み、「再生」のときだけ自動で送る。最後のコマで止まる
const players=[...document.querySelectorAll('[data-player]')].map(p=>{
  const q=p.dataset.player,s=svgOf(q),n=Number(s?.dataset.frames||1),caps=JSON.parse(p.dataset.caps||'[]'),cap=document.querySelector(`[data-cap="${q}"]`);
  let at=1,t=null;
  const go=k=>{at=Math.max(1,Math.min(n,k));s.setAttribute('data-at',at);p.querySelector('[data-n]').textContent=`${at} / ${n}`;if(cap&&caps.length)cap.textContent=caps[at-1]||'';};
  const stop=()=>{clearInterval(t);t=null;p.querySelector('[data-play]').textContent='再生';};
  p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-play')){if(t){stop();return;}if(at>=n)go(1);b.textContent='停止';t=setInterval(()=>{go(at+1);if(at>=n)stop();},1600);}
    else{stop();go(at+Number(b.dataset.st));}});
  return{q,n,go};
});
// 確かめ（verify.mjs）用: i 番目の案と i+1 番目のコマを、すべての図に一度に出す
window.GV={
  passes:()=>Math.max(1,...[...document.querySelectorAll('svg[data-keys]')].map(s=>s.dataset.keys.split(' ').length),...players.map(p=>p.n)),
  pass:i=>{document.querySelectorAll('svg[data-keys]').forEach(s=>{const ks=s.dataset.keys.split(' ');s.setAttribute('data-view',ks[Math.min(i,ks.length-1)]);});
    players.forEach(p=>p.go(i+1));document.querySelectorAll('svg[data-frames]').forEach(s=>{if(!document.querySelector(`[data-player="${s.id.replace('svg-','')}"]`))s.setAttribute('data-at',Math.min(i+1,Number(s.dataset.frames)));});}
};
})();
