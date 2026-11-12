/* grill-visual の議論ページの JS。build.mjs が差し込む。回答欄と回答バーの動きは変えない */
(()=>{
const $=id=>document.getElementById(id);
// 明暗の切り替え。押したときだけ html の data-theme を書き換える
document.addEventListener('click',e=>{const b=e.target.closest('[data-theme-set]');if(!b)return;document.documentElement.dataset.theme=b.dataset.themeSet;
  document.querySelectorAll('[data-theme-set]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
const keys=[...document.querySelectorAll('fieldset[data-q]')].map(f=>f.dataset.q);
// 今回の問い（決定・見送りでない問い）。回答バーに、このうちまだ選んでいない問いを出す
const open=keys.filter(k=>!$('st-'+k)?.dataset.decided);
const hold={};
// ページ内の移動は JS で行う。Claude の内蔵ブラウザは data: の写しで開き、#q01 への移動を止めるため。
// 決まった問いは畳んであるので、札・決定・回答バーから飛ぶときは、先に包む details を開く
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]'),t=a&&document.getElementById(a.getAttribute('href').slice(1));if(!t)return;
  e.preventDefault();const d=t.closest('details');if(d)d.open=true;t.scrollIntoView({block:'start'});},true);
// 選択による図の切り替えは質問ごとに足す：onPick.q01=v=>{...}
const onPick={};
function picked(k){return [...document.querySelectorAll(`input[name=${k}]:checked`)].map(i=>`${i.value} (${i.dataset.label})`);}
function sync(){
  const out=[];let n=0;
  for(const k of keys){
    const sel=picked(k),v=hold[k]?'Hold':sel.join(', '),note=document.querySelector(`[data-note=${k}]`).value.trim();
    if(v){n++;out.push(`${k.toUpperCase()}: ${v}`);}
    if(note){if(!v)out.push(`${k.toUpperCase()}: not chosen`);out.push('  Note: '+note.replace(/\n/g,' / '));}
    const st=$('st-'+k);if(st&&!st.dataset.decided){st.textContent=hold[k]?'Held in memo':v?'In memo':'Awaiting answer';st.className='badge'+(hold[k]?' hold':v?' draft':'');}
    const pv=$('pv-'+k),one=document.querySelector(`input[name=${k}]:checked`);if(pv&&one)pv.textContent=`Showing option ${one.value}`;
    document.querySelector(`[data-hold=${k}]`).setAttribute('aria-pressed',String(!!hold[k]));
  }
  const all=$('n-all').value.trim();if(all)out.push('Overall: '+all.replace(/\n/g,' / '));
  $('answer-text').textContent=out.length?out.join('\n'):'Nothing chosen yet.';
  const left=open.filter(k=>!hold[k]&&!picked(k).length),link=k=>Object.assign(document.createElement('a'),{href:'#'+k,textContent:k.toUpperCase()});
  $('dock-n').replaceChildren(...(left.length?['Unanswered ',...left.flatMap((k,i)=>i?[' ',link(k)]:[link(k)])]:[open.length?'All questions this round are in the memo':'No questions this round']));
  $('draft-n').textContent=n;$('copy-status').textContent='';
}
document.addEventListener('change',e=>{const el=e.target;if(!keys.includes(el.name))return;hold[el.name]=false;onPick[el.name]?.(el.value);sync();});
document.addEventListener('input',e=>{if(e.target.matches('textarea'))sync();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-hold]');if(!b)return;const k=b.dataset.hold;hold[k]=!hold[k];
  if(hold[k])document.querySelectorAll(`input[name=${k}]`).forEach(x=>x.checked=false);sync();});
// コピーは押した1回で終える。Claude の内蔵ブラウザはローカルのページを data: の写しで開くので、安全な文脈でなく navigator.clipboard が無い。
// そこで押した直後に同期の execCommand で写し、だめなときだけ clipboard API を使い、両方だめなら文を選んで ⌘C を頼む
function copyNow(text){const ta=Object.assign(document.createElement('textarea'),{value:text,readOnly:true});ta.style.cssText='position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy');}catch{}ta.remove();$('copy').focus({preventScroll:true});return ok;}
$('copy').addEventListener('click',async()=>{const st=$('copy-status'),text=$('answer-text').textContent,done='Copied. Paste it into the chat and send.';
  if(copyNow(text)){st.textContent=done;return;}
  try{if(!navigator.clipboard?.writeText)throw 0;await navigator.clipboard.writeText(text);st.textContent=done;}
  catch{const r=document.createRange();r.selectNodeContents($('answer-text'));const s=getSelection();s.removeAllRanges();s.addRange(r);st.textContent='Selected. Copy with ⌘C.';}});
sync();
})();
