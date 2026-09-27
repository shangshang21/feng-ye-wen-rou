(()=>{
'use strict';
const F=window.WIND,DUR=F.DUR,FPS=24,POSTER=26.6;
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
const cv=document.getElementById('film'),box=cv.parentElement;let ctx=null,env=null,scale=0;
function sizeFor(){const w=(box.clientWidth||960)*(window.devicePixelRatio||1);return clamp(Math.round(w/1920*4)/4,.5,1);}
function setup(){const s=sizeFor();if(s===scale&&env)return false;scale=s;env=F.makeEnv(s);cv.width=Math.round(1920*s);cv.height=Math.round(1080*s);ctx=cv.getContext('2d');return true;}
setup();
let started=false,T=0,playing=false,t0perf=0,t0film=0,lastF=-1,wasPlaying=false;
function renderFrame(t){F.drawAt(ctx,Math.min(DUR-.001,t),env);updateCaption(t);}

/* captions and the end card */
const CAPS=[[.3,3.9,'银河系里，有一颗很小很小的星星。'],[4.5,9.8,'那天凌晨，它落在了一个还在写代码的男孩身边。'],[10.5,15.8,'下夜班的路很长，它就一直亮着。'],[16.5,21.8,'一页书，一行代码，一点一点，一起长大。'],[22.7,24.8,'“今夜月色真美。”','he'],[25,27.9,'“风也温柔。”','she'],[28.8,30.8,'“早安。”','she']];
const capEl=document.getElementById('cap'),endEl=document.getElementById('endcard');let curCap=null;
function updateCaption(t){let txt='',who='';if(started)for(const c of CAPS)if(t>=c[0]&&t<c[1]){txt=c[2];who=c[3]||'';}if(txt!==curCap){curCap=txt;if(txt){capEl.textContent=txt;capEl.dataset.who=who;}capEl.classList.toggle('on',!!txt);}endEl.classList.toggle('on',started&&t>=31);}

/* music: the v1 waltz, extended by one bar for the morning */
let AC=null,bus=null,master=null,noiseBuf=null,live=[],muted=false;
const mf=m=>440*Math.pow(2,(m-69)/12),BEAT=2/3;
const C_=[48,[60,64,67]],Am=[45,[57,60,64]],F_=[41,[53,57,60]],G_=[43,[55,59,62]],Em=[40,[55,59,64]];
const CH=[C_,Am,F_,G_,C_,Em,F_,G_,Am,F_,C_,G_,F_,G_,C_,G_,C_];
const MEL=[[0,0,79,2],[0,2,76,1],[1,0,81,1],[1,1,79,1],[1,2,76,1],[2,0,77,2],[2,2,81,1],[3,0,86,1],[3,1,83,1],[3,2,79,1],[4,0,84,2],[4,2,79,1],[5,0,83,2],[5,2,79,1],[6,0,81,1],[6,1,79,1],[6,2,77,1],[7,0,76,1],[7,1,74,2],[8,0,72,1],[8,1,76,1],[8,2,81,1],[9,0,84,1],[9,1,81,1],[9,2,77,1],[10,0,79,1],[10,1,76,1],[10,2,84,1],[11,0,86,2],[11,2,83,1],[12,0,84,1],[12,1,81,1],[12,2,77,1],[13,0,79,2],[13,2,83,1],[14,0,84,3],[15,0,86,1],[15,1,83,1],[15,2,79,1],[16,0,84,3]];
const EVENTS=(()=>{const e=[];
  MEL.forEach(([b,bt,m,d])=>e.push({t:b*2+bt*BEAT,k:'box',m,d:d*BEAT+1.2,v:.16}));
  [[88,0],[91,1],[96,2]].forEach(([m,bt])=>e.push({t:32+bt*BEAT,k:'box',m,d:1.8,v:.06}));
  CH.forEach(([bass,tones],b)=>{e.push({t:b*2,k:'bass',m:bass,d:1.9,v:.12});if(b<16){for(const bt of[1,2])for(const m of tones)e.push({t:b*2+bt*BEAT,k:'box',m,d:.9,v:.032});for(const m of tones)e.push({t:b*2,k:'pad',m,d:2,v:.018});}});
  [[96,6.8],[100,6.86],[103,6.92],[91,26.1],[96,26.16]].forEach(([m,t])=>e.push({t,k:'box',m,d:.8,v:.05}));
  return e;})();
function ensureAudio(){
  if(AC)return;const Ctor=window.AudioContext||window.webkitAudioContext;if(!Ctor)return;
  try{AC=new Ctor();}catch(e){AC=null;return;}
  master=AC.createGain();master.gain.value=muted?0:.9;const comp=AC.createDynamicsCompressor();master.connect(comp);comp.connect(AC.destination);
  bus=AC.createGain();bus.connect(master);
  const len=Math.floor(AC.sampleRate*2.4),ir=AC.createBuffer(2,len,AC.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
  const conv=AC.createConvolver();conv.buffer=ir;const wet=AC.createGain();wet.gain.value=.32;bus.connect(conv);conv.connect(wet);wet.connect(master);
  noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const nd=noiseBuf.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
}
function box_(m,when,dur,vel){const f=mf(m),o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),g2=AC.createGain();o.type='sine';o.frequency.value=f;o2.type='sine';o2.frequency.value=f*3.01;g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vel,when+.006);g.gain.exponentialRampToValueAtTime(.0005,when+dur);g2.gain.setValueAtTime(0,when);g2.gain.linearRampToValueAtTime(vel*.22,when+.004);g2.gain.exponentialRampToValueAtTime(.0003,when+.35);o.connect(g);o2.connect(g2);g.connect(bus);g2.connect(bus);o.start(when);o2.start(when);o.stop(when+dur+.05);o2.stop(when+.4);live.push(o,o2);}
function bass(m,when,dur,vel){const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=mf(m);g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vel,when+.02);g.gain.exponentialRampToValueAtTime(.0005,when+dur);o.connect(g);g.connect(bus);o.start(when);o.stop(when+dur+.05);live.push(o);}
function pad(m,when,dur,vel){const o=AC.createOscillator(),lp=AC.createBiquadFilter(),g=AC.createGain();o.type='triangle';o.frequency.value=mf(m);o.detune.value=(Math.random()-.5)*8;lp.type='lowpass';lp.frequency.value=900;g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vel,when+.6);g.gain.setValueAtTime(vel,when+dur-.3);g.gain.linearRampToValueAtTime(0,when+dur+.5);o.connect(lp);lp.connect(g);g.connect(bus);o.start(when);o.stop(when+dur+.6);live.push(o);}
function rainSound(ft,base){if(ft>16.2)return;const at=v=>base+v,st=Math.max(ft,9.8),gv=x=>x<10?0:x<10.6?(x-10)/.6*.12:x<15.4?.12:x<16.2?(16.2-x)/.8*.12:0;const src=AC.createBufferSource();src.buffer=noiseBuf;src.loop=true;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2200;bp.Q.value=.6;const g=AC.createGain();g.gain.setValueAtTime(gv(st),at(st));if(st<10.6)g.gain.linearRampToValueAtTime(.12,at(10.6));if(st<15.4)g.gain.setValueAtTime(.12,at(15.4));g.gain.linearRampToValueAtTime(0,at(16.2));src.connect(bp);bp.connect(g);g.connect(bus);src.start(at(st));src.stop(at(16.3));live.push(src);}
function startAudio(ft){ensureAudio();if(!AC)return;if(AC.state==='suspended')AC.resume();const base=AC.currentTime+.06-ft;for(const e of EVENTS){if(e.t<ft-.001)continue;const w=base+e.t;if(e.k==='box')box_(e.m,w,e.d,e.v);else if(e.k==='bass')bass(e.m,w,e.d,e.v);else pad(e.m,w,e.d,e.v);}rainSound(ft,base);}
function stopAudio(){for(const n of live){try{n.stop();}catch(e){}}live=[];}

/* player */
const cover=document.getElementById('cover'),hintEl=document.getElementById('hint'),playBtn=document.getElementById('playBtn'),playIcon=document.getElementById('playIcon'),muteBtn=document.getElementById('muteBtn'),scrub=document.getElementById('scrub'),timeEl=document.getElementById('time'),chapEl=document.getElementById('chapters'),ticks=document.getElementById('ticks');
const CHAPS=[[0,'银河'],[4,'凌晨'],[10,'雨夜'],[16,'一起长大'],[22,'月色'],[28,'早安']];
const fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const chapBtns=CHAPS.map(([t,n],i)=>{const li=document.createElement('li'),b=document.createElement('button');b.className='chap';b.type='button';b.innerHTML=`<span class="ts">${fmt(t)}</span><span class="nm">${n}</span>`;b.addEventListener('click',()=>{seek(t+.001);if(!playing)play();});li.appendChild(b);chapEl.appendChild(li);if(i>0){const k=document.createElement('i');k.style.left=`calc(${t/DUR*100}% - 1px)`;ticks.appendChild(k);}return b;});
function ui(){scrub.value=T.toFixed(2);scrub.style.setProperty('--p',`${T/DUR*100}%`);timeEl.textContent=`${fmt(T)} / ${fmt(DUR)}`;playBtn.querySelector('span').textContent=playing?'暂停':'播放';playBtn.setAttribute('aria-label',playing?'暂停':'播放');playIcon.setAttribute('d',playing?'M0 0H3.5V12H0ZM6.5 0H10V12H6.5Z':'M0 0L10 6L0 12Z');const ci=CHAPS.reduce((a,c,i)=>T>=c[0]?i:a,0);chapBtns.forEach((b,i)=>b.setAttribute('aria-current',started&&i===ci?'true':'false'));}
function play(){if(T>=DUR-.05)T=0;started=true;playing=true;cover.hidden=true;t0perf=performance.now();t0film=T;lastF=-1;startAudio(T);ui();requestAnimationFrame(loop);}
function pause(){playing=false;stopAudio();ui();}
function loop(now){
  if(!playing)return;T=Math.max(t0film,t0film+(now-t0perf)/1000);
  if(T>=DUR){T=DUR;renderFrame(DUR-.001);playing=false;live=[];hintEl.textContent='再看一遍';cover.setAttribute('aria-label','再看一遍');cover.hidden=false;ui();return;}
  const f=Math.floor(T*FPS);if(f!==lastF){lastF=f;renderFrame(T);}ui();requestAnimationFrame(loop);
}
function seek(t){T=clamp(t,0,DUR-.001);started=true;cover.hidden=true;lastF=-1;renderFrame(T);if(playing){stopAudio();t0perf=performance.now();t0film=T;startAudio(T);}ui();}
cover.addEventListener('click',play);
playBtn.addEventListener('click',()=>playing?pause():play());
muteBtn.addEventListener('click',()=>{muted=!muted;if(master&&AC)master.gain.setTargetAtTime(muted?0:.9,AC.currentTime,.05);muteBtn.textContent=muted?'声音：关':'声音：开';muteBtn.setAttribute('aria-pressed',String(muted));});
scrub.addEventListener('pointerdown',()=>{wasPlaying=playing;if(playing)pause();});
scrub.addEventListener('input',()=>seek(+scrub.value));
scrub.addEventListener('change',()=>{if(wasPlaying){wasPlaying=false;play();}});
document.addEventListener('keydown',e=>{if(e.code!=='Space')return;const tg=e.target;if(tg&&(tg.tagName==='BUTTON'||tg.tagName==='INPUT'))return;e.preventDefault();playing?pause():play();});
let rz=null;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(setup())renderFrame(started?T:POSTER);},200);});

/* cast sheet */
function drawCast(){const sc=document.getElementById('sheet'),k=clamp(((sc.clientWidth||600)*(window.devicePixelRatio||1))/1200,.5,1.5);sc.width=Math.round(1200*k);sc.height=Math.round(700*k);F.drawCast(sc.getContext('2d'),F.makeEnv(k,1200,700));}

/* boot: the poster is the moon, then again once the fonts have arrived */
renderFrame(POSTER);drawCast();ui();
const fontJobs=document.fonts&&document.fonts.load?Promise.all([document.fonts.load('40px "Long Cang"','风也温柔今夜月色真美早安'),document.fonts.load('40px "Reenie Beanie"','#00263893 SHANG Wife')]):Promise.resolve();
Promise.race([fontJobs,new Promise(r=>setTimeout(r,2500))]).catch(()=>{}).then(()=>{if(!started)renderFrame(POSTER);});
})();
