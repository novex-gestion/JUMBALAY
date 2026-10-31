/* Casa Natural privacy v1. Necessary shopping functions never depend on measurement consent. */
(()=>{'use strict';
if(window.CasaPrivacy)return;
const script=document.currentScript, measure=script?.dataset.measure!=='0', ga='G-0KWGE3QME7', ads='', pixel='1551619602829857';
const endpoint='https://panel.tucasaesnatural.com/api/privacy-consent.php', signal='casa_privacy_changed_v1';
let state={chosen:false,analytics:false,marketing:false}, ready=false, pending=false, box, status, opener;
let googleLoaded=false, gaConfigured=false, adsConfigured=false, metaLoaded=false;
let resolveReady;const readyPromise=new Promise(r=>resolveReady=r);
const allowed=category=>ready&&measure&&(category!=='marketing'||script?.dataset.marketing!=='0')&&state[category]===true;
window.dataLayer=window.dataLayer||[];
const rawGtag=function(){window.dataLayer.push(arguments);};
rawGtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
window['ga-disable-'+ga]=true;
window.gtag=function(){
 const args=Array.from(arguments), cmd=args[0], target=cmd==='get'||cmd==='config'?args[1]:args[2]?.send_to||ga;
 if(cmd==='consent')return; // Only this module owns consent transitions.
 const category=String(target).startsWith('AW-')?'marketing':'analytics';
 if(!allowed(category))return;
 rawGtag.apply(null,args);
};
// Meta's standard queue, with an explicit gate retained after the SDK loads.
const fb=function(){if(!allowed('marketing'))return;if(fb.callMethod)fb.callMethod.apply(fb,arguments);else fb.queue.push(arguments);};
fb.push=fb;fb.loaded=true;fb.version='2.0';fb.queue=[];window.fbq=window._fbq=fb;
function clearCookies(){
 const names=document.cookie.split(';').map(c=>c.trim().split('=')[0]);
 for(const name of names){if((!state.analytics&&/^_ga(?:_|$)|^_gid$|^_gat/.test(name))||(!state.marketing&&/^_fb[pc]$|^_gcl_/.test(name))){
  for(const domain of ['',location.hostname,'.tucasaesnatural.com','tucasaesnatural.com'])document.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax'+(domain?'; Domain='+domain:'')+'; Secure';
 }}
}
function load(src){const s=document.createElement('script');s.async=true;s.src=src;document.head.append(s);}
function update(next){
 state={chosen:next.chosen===true,analytics:next.analytics===true,marketing:next.marketing===true,expires:Number(next.expires)||0};ready=true;
 window['ga-disable-'+ga]=!allowed('analytics');
 rawGtag('consent','update',{analytics_storage:allowed('analytics')?'granted':'denied',ad_storage:allowed('marketing')?'granted':'denied',ad_user_data:allowed('marketing')?'granted':'denied',ad_personalization:allowed('marketing')?'granted':'denied'});
 clearCookies();
 if(measure&&state.analytics){
  if(!googleLoaded){googleLoaded=true;rawGtag('js',new Date());load('https://www.googletagmanager.com/gtag/js?id='+(state.analytics?ga:ads));}
  // No query strings: account, checkout and private order links must never leak tokens.
  const clean={page_location:location.origin+location.pathname,page_referrer:'',allow_google_signals:state.marketing,allow_ad_personalization_signals:state.marketing};
  if(state.analytics&&!gaConfigured){gaConfigured=true;rawGtag('config',ga,clean);}
  if(ads&&state.marketing&&!adsConfigured){adsConfigured=true;rawGtag('config',ads,clean);}
 }
 if(allowed('marketing')&&!metaLoaded&&new URLSearchParams(location.search).get('meta_debug')!=='1'){
  metaLoaded=true;fb('consent','grant');fb('init',pixel);fb('trackSingle',pixel,'PageView');load('https://connect.facebook.net/en_US/fbevents.js');
 }else if(metaLoaded){if(state.marketing)fb('consent','grant');else{fb.queue=[];if(fb.callMethod)fb.callMethod('consent','revoke');}}
 if(box){box.querySelector('[name="analytics"]').checked=state.analytics;box.querySelector('[name="marketing"]').checked=state.marketing;}
 document.dispatchEvent(new CustomEvent('casa:privacy-change',{detail:{analytics:state.analytics,marketing:state.marketing}}));
}
async function request(method,body){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
 try{const r=await fetch(endpoint,{method,credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});if(!r.ok)throw Error('save');const j=await r.json();if(typeof j.chosen!=='boolean'||typeof j.analytics!=='boolean'||typeof j.marketing!=='boolean')throw Error('data');return j;}finally{clearTimeout(timer);}
}
async function sync(){try{update(await request('GET'));}catch{update({});}finally{resolveReady();if(box&&!state.chosen)box.hidden=false;}}
async function choose(analytics,marketing){
 if(pending)return;pending=true;box.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent='Guardando tu elección…';
 // A withdrawal takes effect in this tab immediately, even if the server is unavailable.
 const old={...state};if(!analytics||!marketing)update({...state,analytics:state.analytics&&analytics,marketing:state.marketing&&marketing});
 try{const next=await request('POST',{analytics,marketing});update(next);box.hidden=true;status.textContent='';try{localStorage.setItem(signal,String(Date.now()));}catch{}opener.focus();}
 catch{status.textContent='No pudimos guardar la elección. La medición quedó desactivada en esta página. Reintentá para actualizar también el servidor.';update({});box.hidden=false;}
 finally{pending=false;box.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
function build(){
 const css=document.createElement('link');css.rel='stylesheet';css.href='https://tucasaesnatural.com/privacy-consent.css?v=20261031-1';document.head.append(css);
 box=document.createElement('section');box.id='casa-privacy';box.setAttribute('aria-labelledby','np-title');box.hidden=true;
 box.innerHTML='<h2 id="np-title">Tu privacidad, a tu manera</h2><p>Usamos funciones necesarias para el carrito, tu cuenta y la compra. Con tu permiso, usamos cookies para entender cómo se usa la web y medir nuestra publicidad.</p><p>Podés comprar aunque rechaces las opcionales. <a href="https://tucasaesnatural.com/cookies.html">Ver información de cookies</a>.</p><div id="np-settings" hidden><label><input type="checkbox" checked disabled><span>Necesarias <small>Seguridad, cuenta, carrito y tu elección de privacidad. Siempre activas.</small></span></label><label><input type="checkbox" name="analytics"><span>Analítica <small>Google Analytics: visitas, uso de la tienda y medición de compras.</small></span></label><label><input type="checkbox" name="marketing"><span>Publicidad <small>Meta: rendimiento publicitario y personalización.</small></span></label></div><div class="np-actions"><button type="button" data-choice="all">Aceptar todas</button><button type="button" data-choice="necessary">Solo necesarias</button><button type="button" data-choice="configure">Configurar</button><button type="button" data-choice="save" hidden>Guardar elección</button><button type="button" data-choice="close" hidden>Cerrar</button></div><p id="casa-privacy-status" role="status" aria-live="polite"></p>';
 opener=document.createElement('button');opener.id='casa-privacy-open';opener.type='button';opener.textContent='Cookies';opener.setAttribute('aria-controls',box.id);
 opener.onclick=()=>{box.hidden=false;configure();box.querySelector('[name="analytics"]').focus();};
 function configure(){box.querySelector('#np-settings').hidden=false;box.querySelector('[data-choice="configure"]').hidden=true;box.querySelector('[data-choice="save"]').hidden=false;box.querySelector('[data-choice="close"]').hidden=false;}
 box.addEventListener('click',e=>{const choice=e.target.closest('[data-choice]')?.dataset.choice;if(choice==='all')choose(true,true);if(choice==='necessary')choose(false,false);if(choice==='configure')configure();if(choice==='save')choose(box.querySelector('[name="analytics"]').checked,box.querySelector('[name="marketing"]').checked);if(choice==='close'){box.hidden=true;opener.focus();}});
 box.addEventListener('keydown',e=>{if(e.key==='Escape'){box.hidden=true;opener.focus();}});
 document.body.append(box,opener);status=box.querySelector('#casa-privacy-status');box.querySelector('[name="analytics"]').checked=state.analytics;box.querySelector('[name="marketing"]').checked=state.marketing;if(ready&&!state.chosen)box.hidden=false;
}
window.CasaPrivacy={allowed,ready:readyPromise,open:()=>opener?.click()};
window.addEventListener('storage',e=>{if(e.key===signal){update({});sync();}});
window.addEventListener('pageshow',e=>{if(e.persisted){update({});sync();}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
sync();
})();
