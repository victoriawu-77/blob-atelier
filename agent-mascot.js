/* agent-mascot v1 · Blob Atelier · made with Happycapy · MIT */
(function(){
'use strict';
if (typeof window === 'undefined' || !window.customElements || customElements.get('agent-mascot')) return;
var N = 72, TAU = Math.PI*2, S = 100;
var PALETTE = {
  milk:'#F2ECE4', peach:'#FFB49C', butter:'#FFD873', matcha:'#B3D69A', mint:'#97E2CF',
  sky:'#9CCBFF', lilac:'#C6B4FF', bubblegum:'#FFA3C8', tangerine:'#FF9159', cocoa:'#9A6A52', ink:'#232228'
};
var STATES = ['idle','listening','thinking','talking','working','happy','done','error'];
var MATERIALS = ['matte','soft','jelly','glass','clay','velvet'];
var SHAPES = ['mochi','bean','pebble','squircle','pill','drop','bun','cloud'];
function clamp(x,a,b){ return x<a?a:x>b?b:x; }
function lerp(a,b,t){ return a+(b-a)*t; }
function rng(seed){ var s=(seed>>>0)||1; return function(){ s=s+0x6D2B79F5|0; var t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hex2rgb(h){ h=String(h).replace('#',''); if(h.length===3) h=h.split('').map(function(c){return c+c;}).join(''); var n=parseInt(h,16); return [n>>16&255,n>>8&255,n&255]; }
function rgb2hex(c){ return '#'+c.map(function(v){ return Math.round(clamp(v,0,255)).toString(16).padStart(2,'0'); }).join(''); }
function mixc(a,b,t){ return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]; }
function lum(c){ function f(v){ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); } return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); }
function rgb2hsl(c){ var r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0,s=0,l=(mx+mn)/2;
  if(mx!==mn){ var d=mx-mn; s=l>0.5?d/(2-mx-mn):d/(mx+mn); h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4; h/=6; } return [h,s,l]; }
function hsl2rgb(h,s,l){ function f(p,q,t){ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; }
  if(s===0) return [l*255,l*255,l*255]; var q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q; return [f(p,q,h+1/3)*255,f(p,q,h)*255,f(p,q,h-1/3)*255]; }
function hueShift(c,deg,ds,dl){ var h=rgb2hsl(c); return hsl2rgb((h[0]+deg/360+1)%1, clamp(h[1]+(ds||0),0,1), clamp(h[2]+(dl||0),0,1)); }
function resolveColor(v){ if(!v) return PALETTE.peach; if(PALETTE[v]) return PALETTE[v]; if(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v.charAt(0)==='#'?v:'#'+v; return PALETTE.peach; }

/* ---------- shapes: closed curves sampled at N matching params, so any two morph cleanly ---------- */
function sp(v,p){ return Math.sign(v)*Math.pow(Math.abs(v),p); }
function se(t,a,b,n){ return [a*sp(Math.cos(t),2/n), b*sp(Math.sin(t),2/n)]; }
var SHAPE_FN = {
  mochi: function(t){ var top=Math.sin(t)<0; var p=se(t,1.0, top?1.0:0.52, top?2.3:3.6); p[0]*=1+0.1*p[1]; return p; },
  bean: function(t){ var p=se(t,0.8,1.0,2.2); p[0]+=0.15*(p[1]*p[1]-0.42); return p; },
  pebble: function(t){ var p=se(t,1.1,0.8,2.15); var r=1+0.035*Math.cos(2*t+0.7)+0.022*Math.cos(3*t+2.1); p[0]*=r; p[1]*=r; if(p[1]>0) p[1]*=0.9; return p; },
  squircle: function(t){ return se(t,0.95,0.9,4.2); },
  pill: function(t){ var c=Math.cos(t), s=Math.sin(t); return [0.66*c, 0.66*s+0.36*Math.tanh(s*4.5)]; },
  drop: function(t){ var c=Math.cos(t), s=Math.sin(t), k=Math.max(0,-s); return [0.95*c*(1-0.42*Math.pow(k,2.4)), (s>0?0.84:0.95)*s-0.5*Math.pow(k,4)]; },
  bun: function(t){ var s=Math.sin(t), top=s<0; var p=se(t,1.04, top?0.8:0.5, top?2.1:3.8); var d1=t-(1.5*Math.PI-0.62), d2=t-(1.5*Math.PI+0.62);
    var e=Math.exp(-d1*d1/0.03)+Math.exp(-d2*d2/0.03); p[1]-=0.2*e; p[0]*=1-0.06*e; return p; },
  cloud: function(t){ var s=Math.sin(t), c=Math.cos(t), top=s<0; var p=se(t,1.08, top?0.98:0.5, top?2.1:4.0);
    var phi=Math.atan2(c,-s), w=clamp((-s+0.3)/0.55,0,1); var b=1+0.11*(Math.abs(Math.cos(2.5*phi))-0.62)*w; return [p[0]*b,p[1]*b]; }
};
var FACE = { mochi:[0.53,0.34], bean:[0.44,0.37], pebble:[0.5,0.33], squircle:[0.5,0.34], pill:[0.4,0.42], drop:[0.6,0.36], bun:[0.58,0.32], cloud:[0.54,0.32] };
var GEO = {};
SHAPES.forEach(function(name){
  var fn=SHAPE_FN[name], p=new Float64Array(N*2), i, A=0, cx=0;
  for(i=0;i<N;i++){ var q=fn(i/N*TAU); p[2*i]=q[0]; p[2*i+1]=q[1]; }
  for(i=0;i<N;i++){ var j=(i+1)%N, cr=p[2*i]*p[2*j+1]-p[2*j]*p[2*i+1]; A+=cr; cx+=(p[2*i]+p[2*j])*cr; }
  A/=2; cx/=(6*A); var sc=Math.sqrt(Math.PI*0.9*0.9/Math.abs(A)), maxY=-9, minY=9, hw=0;
  for(i=0;i<N;i++){ p[2*i]=(p[2*i]-cx)*sc; p[2*i+1]*=sc; maxY=Math.max(maxY,p[2*i+1]); }
  for(i=0;i<N;i++){ p[2*i+1]+=0.9-maxY; minY=Math.min(minY,p[2*i+1]); hw=Math.max(hw,Math.abs(p[2*i])); }
  for(i=0;i<2*N;i++) p[i]*=S;
  var f=FACE[name]; GEO[name]={ p:p, top:minY*S, bot:0.9*S, hw:hw*S, fy:(minY+(0.9-minY)*f[0])*S, sp:hw*S*f[1] };
});
function pathD(p){
  var d='', i, r=function(v){ return Math.round(v*100)/100; };
  for(i=0;i<N;i++){
    var a=(i-1+N)%N, b=i, c=(i+1)%N, e=(i+2)%N;
    var x1=p[2*b],y1=p[2*b+1],x2=p[2*c],y2=p[2*c+1];
    var c1x=x1+(x2-p[2*a])/6, c1y=y1+(y2-p[2*a+1])/6, c2x=x2-(p[2*e]-x1)/6, c2y=y2-(p[2*e+1]-y1)/6;
    if(i===0) d+='M'+r(x1)+','+r(y1);
    d+='C'+r(c1x)+','+r(c1y)+' '+r(c2x)+','+r(c2y)+' '+r(x2)+','+r(y2);
  }
  return d+'Z';
}
var STAR='M0,-1C0.12,-0.12 0.12,-0.12 1,0C0.12,0.12 0.12,0.12 0,1C-0.12,0.12 -0.12,0.12 -1,0C-0.12,-0.12 -0.12,-0.12 0,-1Z';

/* ---------- shared clock + pointer ---------- */
var live = new Set(), last = 0, ptr = { x:0, y:0, t:-1e9 };
function now(){ return performance.now()/1000; }
window.addEventListener('pointermove', function(e){ ptr.x=e.clientX; ptr.y=e.clientY; ptr.t=now(); }, { passive:true });
function loop(ts){ requestAnimationFrame(loop); var t=ts/1000; var dt=last?Math.min(0.05,t-last):0; last=t; if(AgentMascot.manual) return; live.forEach(function(m){ m.step(dt); }); }
requestAnimationFrame(loop);

var uidN = 0;
function el(tag, attrs, parent){ var e=document.createElementNS('http://www.w3.org/2000/svg',tag); for(var k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; }

class AgentMascot extends HTMLElement {
  static get observedAttributes(){ return ['shape','color','material','state','eyes','cheeks','still','seed']; }
  constructor(){
    super();
    this.uid = 'am'+(++uidN)+Math.random().toString(36).slice(2,6);
    var root = this.attachShadow({mode:'open'});
    root.innerHTML = '<style>:host{display:inline-block;width:240px;height:240px;position:relative;-webkit-tap-highlight-color:transparent}svg{width:100%;height:100%;display:block;overflow:visible;touch-action:none;cursor:grab;user-select:none}svg:active{cursor:grabbing}</style>';
    this.cfg = { shape:'mochi', color:PALETTE.peach, material:'jelly', state:'idle', eyes:'dot', cheeks:true };
    this.t = 0; this.rand = rng(7);
    var g = GEO.mochi; this.from = Float64Array.from(g.p); this.to = Float64Array.from(g.p); this.cur = Float64Array.from(g.p);
    this.fg = { top:g.top, hw:g.hw, fy:g.fy, sp:g.sp }; this.tg = Object.assign({}, this.fg);
    this.k = { morph:1, morphV:0, s:0, sV:0, ox:0, oy:0, oxV:0, oyV:0, gx:0, gy:0, gxV:0, gyV:0, bx:0, by:0, bxV:0, byV:0,
      eye:1, eyeV:0, lidS:1, expr:0, exprV:0, badge:0, badgeV:0, tilt:0, tiltV:0 };
    this.col = hex2rgb(this.cfg.color); this.colFrom = this.col.slice(); this.colTo = this.col.slice(); this.colT = 1;
    this.blink = { next:1.4, t:-1 }; this.drift = { next:0.6, x:0, y:0 };
    this.st = { t:0, prev:'idle', shakeT:-9, hopT:0, landed:true, exprMode:'happy', exprUntil:0 };
    this.sparks = []; this.look = null; this.drag = null;
    this._build();
  }
  connectedCallback(){ this._apply(); if(!this.hasAttribute('still')) live.add(this); this.step(0); }
  disconnectedCallback(){ live.delete(this); }
  attributeChangedCallback(n,o,v){
    if(n==='still'){ if(v!==null) live.delete(this); else if(this.isConnected) live.add(this); return; }
    if(n==='seed'){ this.rand = rng(parseInt(v,10)||7); return; }
    if(this._building) return; this._apply();
  }
  _apply(){
    var a = {};
    ['shape','color','material','state','eyes'].forEach(function(k){ if(this.hasAttribute(k)) a[k]=this.getAttribute(k); }, this);
    if(this.hasAttribute('cheeks')) a.cheeks = this.getAttribute('cheeks')!=='false';
    this.setConfig(a, true);
  }
  get config(){ return Object.assign({}, this.cfg); }
  get state(){ return this.cfg.state; }
  setState(s){ this.setConfig({state:s}); return this; }
  setConfig(c, fromAttr){
    var C = this.cfg, still = this.hasAttribute('still');
    if(c.shape && GEO[c.shape] && c.shape!==C.shape){ C.shape=c.shape; this.from=Float64Array.from(this.cur); this.to=GEO[c.shape].p;
      this.fgFrom=Object.assign({}, this.fg); var g=GEO[c.shape]; this.tg={top:g.top,hw:g.hw,fy:g.fy,sp:g.sp};
      this.k.morph=0; this.k.morphV=0; if(still){ this.k.morph=1; } else this.k.sV-=1.4; }
    if(c.color){ var hx=resolveColor(c.color); if(hx.toLowerCase()!==C.color.toLowerCase()){ C.color=hx; this.colFrom=this.col.slice(); this.colTo=hex2rgb(hx); this.colT=still?1:0; } }
    if(c.material && MATERIALS.indexOf(c.material)>=0 && c.material!==C.material){ C.material=c.material; this._buildMaterial(); if(!still) this.k.sV-=1.8; }
    if(c.eyes && (c.eyes==='dot'||c.eyes==='capsule')) C.eyes=c.eyes;
    if(c.cheeks!==undefined) C.cheeks=!!c.cheeks;
    if(c.state && STATES.indexOf(c.state)>=0 && c.state!==C.state){ this.st.prev=C.state; C.state=c.state; this._enterState(); }
    if(!fromAttr){ this._building=true; ['shape','material','state','eyes'].forEach(function(k){ this.setAttribute(k,C[k]); },this);
      var nm=null; for(var p in PALETTE) if(PALETTE[p].toLowerCase()===C.color.toLowerCase()) nm=p; this.setAttribute('color', nm||C.color);
      this.setAttribute('cheeks', C.cheeks?'true':'false'); this._building=false; }
    if(still || !live.has(this)) this.step(0);
    this.dispatchEvent(new CustomEvent('change',{detail:this.config}));
    return this;
  }
  poke(){ this.k.sV -= 3.2; this.k.tiltV += (this.rand()-0.5)*40; return this; }
  lookAt(gx,gy){ this.look = (gx==null)?null:[gx,gy]; return this; }
  _enterState(){
    var s=this.cfg.state, st=this.st; st.t=0;
    if(s==='done'){ this.k.sV-=3.4; st.exprUntil=1.5; this._burst(6); }
    if(s==='error'){ st.shakeT=0; this.k.sV-=2; }
    if(s==='happy'){ st.hopT=0; }
    if(s==='listening'){ this.k.sV+=1.6; }
    if(s==='thinking'||s==='working'){ this.k.sV-=1; }
  }
  _burst(n){ for(var i=0;i<n;i++){ var a=-Math.PI/2+(i/(n-1)-0.5)*2.4+(this.rand()-0.5)*0.3; this.sparks.push({a:a, d:this.fg.hw*1.05+this.rand()*16, t:-i*0.04, s:5+this.rand()*5}); } }

  /* ---------- DOM ---------- */
  _build(){
    var U=this.uid, svg=el('svg',{viewBox:'-160 -165 320 320', xmlns:'http://www.w3.org/2000/svg'}); this.svg=svg;
    var defs=el('defs',{},svg);
    var clip=el('clipPath',{id:U+'-clip'},defs); el('path',{'class':'bp'},clip);
    function grad(type,id,attrs,n){ var g=el(type,Object.assign({id:U+'-'+id},attrs),defs); for(var i=0;i<n;i++) el('stop',{},g); return g; }
    this.gSoft=grad('radialGradient','soft',{cx:'.36',cy:'.28',r:'.92'},3);
    this.gJelly=grad('linearGradient','jelly',{x1:'0',y1:'0',x2:'.25',y2:'1'},3);
    this.gVel=grad('radialGradient','velvet',{cx:'.45',cy:'.42',r:'.7'},3);
    this.gClay=grad('radialGradient','clay',{cx:'.4',cy:'.3',r:'.95'},2);
    var sh=grad('radialGradient','shadow',{},2); sh.children[0].setAttribute('offset','0'); sh.children[0].setAttribute('stop-color','#2a2140'); sh.children[0].setAttribute('stop-opacity','.2');
    sh.children[1].setAttribute('offset','1'); sh.children[1].setAttribute('stop-color','#2a2140'); sh.children[1].setAttribute('stop-opacity','0');
    [2,4,8,13,20].forEach(function(b){ var f=el('filter',{id:U+'-b'+b,x:'-60%',y:'-60%',width:'220%',height:'220%'},defs); el('feGaussianBlur',{stdDeviation:b*0.5},f); });
    var fz=el('filter',{id:U+'-fuzz',x:'-15%',y:'-15%',width:'130%',height:'130%'},defs);
    el('feTurbulence',{type:'fractalNoise',baseFrequency:'.9',numOctaves:'2',seed:'4',result:'n'},fz);
    el('feDisplacementMap',{'in':'SourceGraphic',in2:'n',scale:'5',xChannelSelector:'R',yChannelSelector:'G'},fz);
    var gr=el('filter',{id:U+'-grain',x:'0',y:'0',width:'100%',height:'100%'},defs);
    el('feTurbulence',{type:'fractalNoise',baseFrequency:'1.2',numOctaves:'3',seed:'9',stitchTiles:'stitch'},gr);
    el('feColorMatrix',{type:'matrix',values:'0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1'},gr);
    var root=el('g',{},svg); this.gRoot=root;
    this.shadow=el('ellipse',{fill:'url(#'+U+'-shadow)'},root);
    this.orbsBack=el('g',{},root);
    this.satB=el('circle',{r:'6',opacity:'0'},root);
    var body=el('g',{},root); this.gBody=body;
    this.rings=[0,1].map(function(){ return el('path',{'class':'bp',fill:'none','stroke-width':'3',opacity:'0',filter:'url(#'+U+'-b2)'},body); });
    this.gSkin=el('g',{},body);
    this.base=el('path',{'class':'bp'},this.gSkin);
    this.gMat=el('g',{'clip-path':'url(#'+U+'-clip)'},this.gSkin);
    this.rim=el('path',{'class':'bp',fill:'none',opacity:'0'},this.gSkin);
    var face=el('g',{},body); this.gFace=face;
    this.cheeks=[el('ellipse',{fill:'#FF6F91',filter:'url(#'+U+'-b8)'},face), el('ellipse',{fill:'#FF6F91',filter:'url(#'+U+'-b8)'},face)];
    this.eyes=[0,1].map(function(){ var g=el('g',{},face); return { g:g, r:el('rect',{},g), gl:el('circle',{fill:'#fff'},g) }; });
    this.xeyes=[el('path',{fill:'none','stroke-linecap':'round','stroke-linejoin':'round',opacity:'0'},face), el('path',{fill:'none','stroke-linecap':'round','stroke-linejoin':'round',opacity:'0'},face)];
    this.satF=el('circle',{r:'6',opacity:'0'},root);
    var acc=el('g',{},root); this.gAcc=acc;
    this.dots=[0,1,2].map(function(i){ return el('circle',{r:String(4.5+i*2),opacity:'0'},acc); });
    this.badge=el('g',{opacity:'0'},acc); this.badgeC=el('circle',{r:'15'},this.badge);
    this.badgeP=el('path',{fill:'none',stroke:'#fff','stroke-width':'3.6','stroke-linecap':'round','stroke-linejoin':'round'},this.badge);
    this.badgeDot=el('circle',{r:'2.1',fill:'#fff'},this.badge);
    this.sparkEls=[0,1,2,3,4,5,6,7].map(function(){ return el('path',{d:STAR,opacity:'0'},acc); });
    this.bps=[];
    this.shadowRoot.appendChild(svg);
    this._buildMaterial();
    var self=this;
    svg.addEventListener('pointerdown', function(e){ if(self.hasAttribute('still')) return; svg.setPointerCapture(e.pointerId); self.drag={x:e.clientX,y:e.clientY,moved:false,dx:0,dy:0}; });
    svg.addEventListener('pointermove', function(e){ var d=self.drag; if(!d) return; var r=svg.getBoundingClientRect(), sc=320/r.width; d.dx=(e.clientX-d.x)*sc; d.dy=(e.clientY-d.y)*sc; if(Math.hypot(d.dx,d.dy)>6) d.moved=true; });
    var up=function(){ var d=self.drag; if(!d) return; self.drag=null; if(!d.moved) self.poke(); };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  }
  _buildMaterial(){
    var U=this.uid, m=this.cfg.material, g=this.gMat, ob=this.orbsBack; g.textContent=''; ob.textContent='';
    var B=function(b){ return 'url(#'+U+'-b'+b+')'; }, mk=function(tag,a,p){ return el(tag,a,p||g); };
    this.matEls={}; var M=this.matEls;
    this.gSkin.removeAttribute('filter'); this.rim.setAttribute('opacity','0');
    if(m==='soft'){ M.hl=mk('ellipse',{fill:'#fff',opacity:'.28',filter:B(20)}); }
    if(m==='jelly'){
      M.glow=mk('ellipse',{opacity:'.5',filter:B(20)});
      M.inner=mk('path',{'class':'bp',fill:'none','stroke-width':'18',opacity:'.35',filter:B(13)});
      M.edge=mk('path',{'class':'bp',fill:'none',stroke:'#fff','stroke-width':'4',opacity:'.4',filter:B(4)});
      M.hl=mk('ellipse',{fill:'#fff',opacity:'.92',filter:B(4)});
      M.hl2=mk('circle',{fill:'#fff',opacity:'.95',r:'4.5'});
    }
    if(m==='glass'){
      M.orbs=[]; M.orbsIn=[];
      for(var i=0;i<3;i++){ M.orbs.push(el('circle',{opacity:'0'},ob)); }
      for(i=0;i<3;i++){ M.orbsIn.push(mk('circle',{filter:B(20),opacity:'.85'})); }
      M.frost=mk('rect',{x:'-160',y:'-165',width:'320',height:'320',fill:'#fff',opacity:'.2'});
      M.grain=mk('rect',{x:'-160',y:'-165',width:'320',height:'320',filter:'url(#'+U+'-grain)',opacity:'.22',style:'mix-blend-mode:soft-light'});
      M.edge=mk('path',{'class':'bp',fill:'none',stroke:'#fff','stroke-width':'10',opacity:'.55',filter:B(8)});
      M.hl=mk('ellipse',{fill:'#fff',opacity:'.55',filter:B(8)});
      this.rim.setAttribute('opacity','.9'); this.rim.setAttribute('stroke','#fff'); this.rim.setAttribute('stroke-width','1.4');
    }
    if(m==='clay'){
      M.lt=mk('path',{'class':'bp',fill:'none',stroke:'#fff','stroke-width':'30',opacity:'.62',filter:B(13),transform:'translate(-9 -11)'});
      M.dk=mk('path',{'class':'bp',fill:'none','stroke-width':'34',opacity:'.3',filter:B(13),transform:'translate(10 13)'});
      M.grain=mk('rect',{x:'-160',y:'-165',width:'320',height:'320',filter:'url(#'+U+'-grain)',opacity:'.16',style:'mix-blend-mode:soft-light'});
    }
    if(m==='velvet'){
      M.sheen=mk('path',{'class':'bp',fill:'none','stroke-width':'26',opacity:'.75',filter:B(13)});
      M.sheen2=mk('path',{'class':'bp',fill:'none',stroke:'#fff','stroke-width':'6',opacity:'.28',filter:B(4)});
      M.grain=mk('rect',{x:'-160',y:'-165',width:'320',height:'320',filter:'url(#'+U+'-grain)',opacity:'.32',style:'mix-blend-mode:soft-light'});
      this.gSkin.setAttribute('filter','url(#'+U+'-fuzz)');
    }
    this.bps=Array.prototype.slice.call(this.svg.querySelectorAll('.bp'));
    this._paint(true);
  }
  _paint(){
    var c=this.col, m=this.cfg.material, ink=[38,26,66];
    var L=lum(c), light=rgb2hex(mixc(c,[255,255,255],0.5)), shade=rgb2hex(mixc(c,ink,0.3)), deep=rgb2hex(mixc(c,ink,0.5)), base=rgb2hex(c);
    var dark=L<0.18;
    this.eyeCol = dark ? '#FFFFFF' : '#1E1C24'; this.dark=dark; this.roles={light:light,shade:shade,deep:deep,base:base};
    var st=function(g,cols){ for(var i=0;i<cols.length;i++){ g.children[i].setAttribute('offset',cols[i][0]); g.children[i].setAttribute('stop-color',cols[i][1]); if(cols[i][2]!=null) g.children[i].setAttribute('stop-opacity',cols[i][2]); } };
    st(this.gSoft,[[0,rgb2hex(mixc(c,[255,255,255],dark?0.22:0.42))],[0.55,base],[1,rgb2hex(mixc(c,ink,dark?0.1:0.2))]]);
    var sat=hueShift(c,0,0.12,0);
    st(this.gJelly,[[0,rgb2hex(mixc(sat,[255,255,255],0.3))],[0.5,rgb2hex(sat)],[1,rgb2hex(mixc(hueShift(c,-6,0.18,0),ink,0.24))]]);
    st(this.gVel,[[0,rgb2hex(mixc(c,ink,dark?0:0.16))],[0.7,base],[1,rgb2hex(mixc(c,[255,255,255],0.18))]]);
    st(this.gClay,[[0,rgb2hex(mixc(c,[255,255,255],0.12))],[1,base]]);
    var fill = m==='soft'?'url(#'+this.uid+'-soft)': m==='jelly'?'url(#'+this.uid+'-jelly)': m==='velvet'?'url(#'+this.uid+'-velvet)': m==='clay'?'url(#'+this.uid+'-clay)': m==='glass'?rgb2hex(mixc(c,[255,255,255],0.45)):base;
    this.base.setAttribute('fill',fill); this.base.setAttribute('fill-opacity', m==='glass'?'.78':'1');
    var M=this.matEls||{};
    if(M.glow) M.glow.setAttribute('fill', rgb2hex(mixc(hueShift(c,8,0.15,0.05),[255,255,255],0.35)));
    if(M.inner) M.inner.setAttribute('stroke', deep);
    if(M.dk) M.dk.setAttribute('stroke', rgb2hex(mixc(c,[150,80,60],0.4)));
    if(M.sheen) M.sheen.setAttribute('stroke', rgb2hex(mixc(c,[255,255,255],dark?0.25:0.45)));
    if(M.orbs){ var oc=[hueShift(c,0,0.15,-0.06), hueShift(c,40,0.2,-0.02), hueShift(c,-45,0.15,0)]; for(var i=0;i<3;i++){ M.orbs[i].setAttribute('fill',rgb2hex(oc[i])); M.orbsIn[i].setAttribute('fill',rgb2hex(oc[i])); } this.eyeCol='#1E1C24'; }
    var rc = dark?light:(L>0.75?rgb2hex(mixc(c,ink,0.25)):rgb2hex(hueShift(c,0,0.15,-0.04))); this.rings.forEach(function(r){ r.setAttribute('stroke', rc); });
    var dc = dark?rgb2hex(mixc(c,[255,255,255],0.55)):rgb2hex(mixc(c,ink,0.38)); this.dots.forEach(function(d){ d.setAttribute('fill',dc); });
    this.satB.setAttribute('fill',dc); this.satF.setAttribute('fill',dc);
    var h=rgb2hsl(c)[0]*360, sc=(h>25&&h<75)?'#FF8FB3':'#FFC53D'; this.sparkEls.forEach(function(s){ s.setAttribute('fill',sc); });
    var ec=this.eyeCol; this.eyes.forEach(function(e){ e.r.setAttribute('fill',ec); }); this.xeyes.forEach(function(x){ x.setAttribute('stroke',ec); });
    var glint = (ec!=='#FFFFFF'); this.eyes.forEach(function(e){ e.gl.setAttribute('opacity', glint?'.9':'0'); });
    this.cheeks.forEach(function(ch){ ch.setAttribute('fill', dark?'#FF7EA6':(h>300||h<20)?'#FF5E86':'#FF7A93'); ch.setAttribute('opacity', dark?'.32':'.26'); });
    this.shadow.setAttribute('opacity', m==='clay'?'1.35':m==='glass'?'.6':'1');
  }

  /* ---------- simulation ---------- */
  step(dt){
    var k=this.k, C=this.cfg, st=this.st, still=this.hasAttribute('still');
    if(still){ dt=0; }
    this.t+=dt; st.t+=dt; var t=this.t, s=C.state;
    // color tween
    if(this.colT<1){ this.colT=Math.min(1,this.colT+dt/0.35); var e=1-Math.pow(1-this.colT,3); this.col=mixc(this.colFrom,this.colTo,e); this._paint(); }
    else if(still){ this.col=this.colTo.slice(); this._paint(); }
    // targets
    var sT=0, eyeT=1, tiltT=0, lid=1, exprT=0, mode='happy', badgeT=0, hop=0, shakeX=0, bob=0, pulse=0;
    var gx=0, gy=0, pointerLive=false;
    if(this.look){ gx=this.look[0]; gy=this.look[1]; pointerLive=true; }
    else if(!still && now()-ptr.t<2.5){ var r=this.getBoundingClientRect(); if(r.width){ var cx=r.left+r.width/2, cy=r.top+r.height*0.5; gx=Math.tanh((ptr.x-cx)/(r.width*0.55)); gy=Math.tanh((ptr.y-cy)/(r.height*0.55)); pointerLive=true; } }
    if(!pointerLive){ if(t>this.drift.next){ var rr=this.rand(); this.drift.x = rr<0.3?0:(this.rand()-0.5)*0.9; this.drift.y=rr<0.3?0:(this.rand()-0.5)*0.5; this.drift.next=t+1.1+this.rand()*2.4; } gx=this.drift.x; gy=this.drift.y; }
    var blinkRate=1;
    if(s==='listening'){ eyeT=1.14; tiltT=5+gx*4; sT=0.02; var u=(st.t%1.8)/1.8; if(u<dt/1.8 && st.t>0.5) k.sV-=0.9; blinkRate=0.6; }
    if(s==='thinking'){ gx=0.55+0.12*Math.cos(t*1.3); gy=-0.62+0.1*Math.sin(t*1.3); lid=0.82; tiltT=-4+3*Math.sin(t*0.9); blinkRate=0.5; }
    if(s==='talking'){ var ph=(t*1.0)%3.1, on=ph<2.3?1:0; var syl=Math.max(0,Math.sin(t*TAU*4.6+Math.sin(t*3.1)*2)); var amp=0.55+0.45*Math.sin(t*2.7+1)*Math.sin(t*1.3); pulse=on*syl*syl*(0.6+0.4*amp); lid=1-0.14*pulse; }
    if(s==='working'){ var sc2=(t*0.75)%1; gx=-0.55+sc2*1.1; gy=0.32; lid=0.86; bob=-2.6*Math.abs(Math.sin(t*TAU*2.2)); sT=0.012*Math.sin(t*TAU*2.2); blinkRate=0.5; }
    if(s==='happy'){ exprT=1; mode='happy'; var per=0.92, air=0.44; st.hopT+=dt; var hp=st.hopT%per;
      if(hp<air){ var u2=hp/air; hop=26*4*u2*(1-u2); sT=0.05; if(st.landed){ st.landed=false; k.sV+=2.4; } }
      else { if(!st.landed){ st.landed=true; k.sV-=3.6; if(this.rand()<0.7) this._burst(2); } } gy=-0.15; }
    if(s==='done'){ badgeT=1; if(st.t<st.exprUntil){ exprT=1; mode='happy'; } gy=-0.1; }
    if(s==='error'){ badgeT=1; exprT=1; mode='chev'; sT=-0.045; tiltT=-3; gy=0.15; gx*=0.3;
      if(st.t-st.shakeT>2.8) { st.shakeT=st.t; }
      var su=st.t-st.shakeT; shakeX=11*Math.exp(-5*su)*Math.sin(su*TAU*6.5); }
    // springs (substepped)
    var n=Math.max(1,Math.ceil(dt/(1/240))), h=dt/n;
    var dragTX=0, dragTY=0, dk=180, dd=7;
    if(this.drag){ var dl=Math.hypot(this.drag.dx,this.drag.dy), lim=34, f=dl>0?lim*Math.tanh(dl*0.45/lim)/dl:0; dragTX=this.drag.dx*f; dragTY=this.drag.dy*f; dk=500; dd=34; }
    for(var i=0;i<n;i++){
      k.morphV+=(200*(1-k.morph)-17*k.morphV)*h; k.morph+=k.morphV*h;
      k.sV+=(260*(sT-k.s)-10*k.sV)*h; k.s+=k.sV*h;
      k.oxV+=(dk*(dragTX-k.ox)-dd*k.oxV)*h; k.ox+=k.oxV*h; k.oyV+=(dk*(dragTY-k.oy)-dd*k.oyV)*h; k.oy+=k.oyV*h;
      k.gxV+=(260*(gx-k.gx)-30*k.gxV)*h; k.gx+=k.gxV*h; k.gyV+=(260*(gy-k.gy)-30*k.gyV)*h; k.gy+=k.gyV*h;
      k.bxV+=(40*(k.gx-k.bx)-12*k.bxV)*h; k.bx+=k.bxV*h; k.byV+=(40*(k.gy-k.by)-12*k.byV)*h; k.by+=k.byV*h;
      k.eyeV+=(300*(eyeT-k.eye)-20*k.eyeV)*h; k.eye+=k.eyeV*h;
      k.exprV+=(320*(exprT-k.expr)-30*k.exprV)*h; k.expr+=k.exprV*h;
      k.badgeV+=(320*(badgeT-k.badge)-16*k.badgeV)*h; k.badge+=k.badgeV*h;
      k.tiltV+=(120*(tiltT-k.tilt)-12*k.tiltV)*h; k.tilt+=k.tiltV*h;
    }
    if(still){ k.morph=1; k.s=sT; k.gx=gx; k.gy=gy; k.bx=gx; k.by=gy; k.eye=eyeT; k.expr=exprT; k.badge=badgeT; k.tilt=tiltT; k.ox=k.oy=0; }
    if(mode!==st.exprMode && k.expr<0.05) st.exprMode=mode; if(exprT>0) st.exprMode=mode;
    // blink
    var B=this.blink, lidB=1;
    if(!still){ if(B.t<0 && t>B.next && k.expr<0.3){ B.t=0; var dbl=this.rand()<0.16; B.next=t+(dbl?0.32:(2.0+this.rand()*3.6)/blinkRate); }
      if(B.t>=0){ B.t+=dt; var bt=B.t; lidB = bt<0.075? 1-bt/0.075*0.94 : bt<0.1? 0.06 : bt<0.24? 0.06+0.94*(1-Math.pow(1-(bt-0.1)/0.14,3)) : 1; if(bt>0.24) B.t=-1; } }
    k.lidS = lid*lidB;
    // shape morph
    var m=k.morph, p=this.cur, A=this.from, Z=this.to;
    for(i=0;i<2*N;i++) p[i]=A[i]+(Z[i]-A[i])*m;
    if(this.fgFrom){ var F=this.fgFrom, T=this.tg; this.fg={top:lerp(F.top,T.top,m), hw:lerp(F.hw,T.hw,m), fy:lerp(F.fy,T.fy,m), sp:lerp(F.sp,T.sp,m)}; if(m>0.999 && Math.abs(k.morphV)<0.01) this.fgFrom=null; }
    this._render({hop:hop, shakeX:shakeX, bob:bob, pulse:pulse, breath: still?0:Math.sin(t*TAU/(s==='listening'?2.6:3.8))*0.012, still:still});
  }
  _render(o){
    var k=this.k, C=this.cfg, fg=this.fg, t=this.t, U=this.uid, i;
    var d=pathD(this.cur); for(i=0;i<this.bps.length;i++) this.bps[i].setAttribute('d',d);
    this.svg.querySelector('clipPath path').setAttribute('d',d);
    var sq=k.s+o.breath+o.pulse*0.05, sy=1+sq, sx=1-sq*0.62;
    var dl=Math.hypot(k.ox,k.oy), ang=Math.atan2(k.oy,k.ox)*180/Math.PI, ex=dl*0.0055;
    var bx=k.ox*0.55+o.shakeX+k.bx*3, by=k.oy*0.55-o.hop+o.bob;
    var tilt=k.tilt+k.bx*2.5;
    var tr='translate('+bx.toFixed(2)+' '+by.toFixed(2)+') translate(0 90) rotate('+tilt.toFixed(2)+') scale('+sx.toFixed(4)+' '+sy.toFixed(4)+') translate(0 -90)';
    if(dl>0.3) tr+=' rotate('+ang.toFixed(2)+' 0 0) scale('+(1+ex).toFixed(4)+' '+(1/(1+ex)).toFixed(4)+') rotate('+(-ang).toFixed(2)+' 0 0)';
    this.gBody.setAttribute('transform',tr);
    // shadow
    var lift=Math.max(0,o.hop-o.bob+Math.max(0,-k.oy*0.5));
    this.shadow.setAttribute('cx',(bx*0.6).toFixed(2)); this.shadow.setAttribute('cy','95');
    this.shadow.setAttribute('rx',(fg.hw*0.9*sx*(1-lift/90)).toFixed(2)); this.shadow.setAttribute('ry',(12*(1-lift/110)).toFixed(2));
    this.shadow.style.opacity=String(clamp(1-lift/70,0.3,1));
    // material dynamic bits
    var M=this.matEls, top=fg.top, hw=fg.hw, hx=-k.bx*7, hy=-k.by*5, H=90-top;
    if(M.hl && C.material==='jelly'){ M.hl.setAttribute('cx',(-hw*0.42+hx).toFixed(1)); M.hl.setAttribute('cy',(top+H*0.24+hy).toFixed(1)); M.hl.setAttribute('rx',(hw*0.26).toFixed(1)); M.hl.setAttribute('ry',(H*0.11).toFixed(1));
      M.hl.setAttribute('transform','rotate(-32 '+(-hw*0.42+hx).toFixed(1)+' '+(top+H*0.24+hy).toFixed(1)+')');
      M.hl2.setAttribute('cx',(-hw*0.14+hx*1.2).toFixed(1)); M.hl2.setAttribute('cy',(top+H*0.13+hy).toFixed(1));
      M.glow.setAttribute('cx',(hw*0.08).toFixed(1)); M.glow.setAttribute('cy',(90-H*0.12).toFixed(1)); M.glow.setAttribute('rx',(hw*0.75).toFixed(1)); M.glow.setAttribute('ry',(H*0.2).toFixed(1)); }
    if(M.hl && C.material==='soft'){ M.hl.setAttribute('cx',(-hw*0.3+hx).toFixed(1)); M.hl.setAttribute('cy',(top+H*0.25+hy).toFixed(1)); M.hl.setAttribute('rx',(hw*0.55).toFixed(1)); M.hl.setAttribute('ry',(H*0.2).toFixed(1)); }
    if(M.orbs){ var pos=[[-hw*0.75,top+H*0.3,hw*0.55],[hw*0.72,top+H*0.62,hw*0.5],[-hw*0.05,90-H*0.02,hw*0.4]];
      for(i=0;i<3;i++){ var px=pos[i][0]+Math.sin(t*0.5+i*2)*7, py=pos[i][1]+Math.cos(t*0.4+i)*6;
        M.orbs[i].setAttribute('cx',px.toFixed(1)); M.orbs[i].setAttribute('cy',py.toFixed(1)); M.orbs[i].setAttribute('r',pos[i][2].toFixed(1));
        M.orbsIn[i].setAttribute('cx',(px*0.92-bx).toFixed(1)); M.orbsIn[i].setAttribute('cy',(py-by*0.9).toFixed(1)); M.orbsIn[i].setAttribute('r',(pos[i][2]*1.15).toFixed(1)); }
      M.hl.setAttribute('cx',(-hw*0.3+hx).toFixed(1)); M.hl.setAttribute('cy',(top+H*0.16+hy).toFixed(1)); M.hl.setAttribute('rx',(hw*0.45).toFixed(1)); M.hl.setAttribute('ry',(H*0.08).toFixed(1)); }
    // face (pseudo-3D: eyes ride a sphere that turns toward gaze)
    var cap=C.eyes==='capsule', ew=cap?15:21, eh=cap?30:21;
    ew*=k.eye; eh*=k.eye;
    var Rs=hw*1.05, yaw=k.gx*0.5, pit=k.gy*0.38, fy=fg.fy, cy=fy-(top+90)/2;
    var lidS=clamp(k.lidS,0.04,1.2), xe=k.expr, mode=this.st.exprMode;
    for(i=0;i<2;i++){
      var side=i?1:-1, a=Math.asin(clamp(fg.sp/Rs,-0.95,0.95))*side, b=Math.asin(clamp(cy/Rs,-0.9,0.9));
      var vx=Math.sin(a)*Math.cos(b), vy=Math.sin(b), vz=Math.cos(a)*Math.cos(b);
      var x1=vx*Math.cos(yaw)+vz*Math.sin(yaw), z1=-vx*Math.sin(yaw)+vz*Math.cos(yaw);
      var y2=vy*Math.cos(pit)+z1*Math.sin(pit), z2=-vy*Math.sin(pit)+z1*Math.cos(pit);
      var X=x1*Rs, Y=(top+90)/2+y2*Rs, fs=0.5+0.5*clamp(z2,0,1), w=ew*fs, hh=eh*lidS;
      var E=this.eyes[i]; E.g.setAttribute('transform','translate('+X.toFixed(2)+' '+Y.toFixed(2)+')');
      E.r.setAttribute('x',(-w/2).toFixed(2)); E.r.setAttribute('y',(-hh/2).toFixed(2)); E.r.setAttribute('width',w.toFixed(2)); E.r.setAttribute('height',hh.toFixed(2));
      E.r.setAttribute('rx',(Math.min(w,hh)/2).toFixed(2)); E.g.setAttribute('opacity',(1-clamp(xe,0,1)).toFixed(3));
      E.gl.setAttribute('cx',(-w*0.2).toFixed(2)); E.gl.setAttribute('cy',(-hh*0.24).toFixed(2)); E.gl.setAttribute('r',(Math.min(w,hh)*0.16).toFixed(2));
      E.gl.style.display = lidS<0.5?'none':'';
      var xw=(cap?11:12.5)*fs*k.eye, xh=(cap?9:8)*k.eye, sw=(cap?7:6.2)*k.eye, X2=this.xeyes[i];
      var dpath = mode==='chev' ? 'M'+(X-side*xw*0.55).toFixed(2)+','+(Y-xh*0.75).toFixed(2)+'L'+(X+side*xw*0.45).toFixed(2)+','+Y.toFixed(2)+'L'+(X-side*xw*0.55).toFixed(2)+','+(Y+xh*0.75).toFixed(2)
        : 'M'+(X-xw*0.7).toFixed(2)+','+(Y+xh*0.35).toFixed(2)+'Q'+X.toFixed(2)+','+(Y-xh*1.25).toFixed(2)+' '+(X+xw*0.7).toFixed(2)+','+(Y+xh*0.35).toFixed(2);
      X2.setAttribute('d',dpath); X2.setAttribute('stroke-width',sw.toFixed(2)); X2.setAttribute('opacity',clamp(xe,0,1).toFixed(3));
      var ps=0.85+0.15*clamp(xe,0,1); X2.setAttribute('transform','translate('+X.toFixed(2)+' '+Y.toFixed(2)+') scale('+ps.toFixed(3)+') translate('+(-X).toFixed(2)+' '+(-Y).toFixed(2)+')');
      var ch=this.cheeks[i]; ch.setAttribute('cx',(X+side*ew*0.55).toFixed(2)); ch.setAttribute('cy',(Y+(cap?eh*0.5:eh*0.62)+7).toFixed(2));
      ch.setAttribute('rx',(12*fs).toFixed(2)); ch.setAttribute('ry','6.5'); ch.style.display=C.cheeks?'':'none';
    }
    // rings (listening)
    var s=C.state, cyB=(top+90)/2;
    for(i=0;i<2;i++){ var R=this.rings[i]; if(s==='listening'){ var u=((t*0.65+i*0.5)%1), sc=1.34-0.24*u; R.setAttribute('transform','translate(0 '+cyB.toFixed(1)+') scale('+sc.toFixed(3)+') translate(0 '+(-cyB).toFixed(1)+')'); R.setAttribute('opacity',(Math.pow(Math.sin(Math.PI*u),1.5)*0.55).toFixed(3)); R.setAttribute('stroke-width',(3.2/sc).toFixed(2)); } else R.setAttribute('opacity','0'); }
    // thought dots
    for(i=0;i<3;i++){ var D=this.dots[i]; if(s==='thinking'){ var dx=hw*0.62+i*15+bx, dy=top-6-i*15+by+Math.sin(t*3.2-i*0.8)*2.5; D.setAttribute('cx',dx.toFixed(1)); D.setAttribute('cy',dy.toFixed(1)); D.setAttribute('opacity',(clamp(this.st.t*3-i*0.6,0,1)*(0.45+0.55*(0.5+0.5*Math.sin(t*3.2-i*0.9)))).toFixed(3)); } else D.setAttribute('opacity','0'); }
    // orbit (working)
    if(s==='working'){ var an=t*3.4, ox=Math.cos(an)*(hw+22), oy=Math.sin(an)*20, rot=-14*Math.PI/180, zx=ox*Math.cos(rot)-oy*Math.sin(rot)+bx, zy=ox*Math.sin(rot)+oy*Math.cos(rot)+cyB+by+8, front=Math.sin(an)>0;
      var sz=5+1.8*Math.sin(an); [this.satF,this.satB].forEach(function(c){ c.setAttribute('cx',zx.toFixed(1)); c.setAttribute('cy',zy.toFixed(1)); c.setAttribute('r',sz.toFixed(2)); });
      this.satF.setAttribute('opacity',front?'1':'0'); this.satB.setAttribute('opacity',front?'0':'1'); }
    else { this.satF.setAttribute('opacity','0'); this.satB.setAttribute('opacity','0'); }
    // badge
    var bs=Math.max(0,k.badge); this.badge.setAttribute('opacity',clamp(bs*1.4,0,1).toFixed(3));
    var bxp=hw*0.68+bx, byp=top+8+by;
    this.badge.setAttribute('transform','translate('+bxp.toFixed(1)+' '+byp.toFixed(1)+') scale('+bs.toFixed(3)+')');
    if(s==='error'){ this.badgeC.setAttribute('fill','#FF5A4E'); this.badgeP.setAttribute('d','M0,-7.5L0,1.5'); this.badgeDot.style.display=''; this.badgeDot.setAttribute('cy','6.6'); }
    else { this.badgeC.setAttribute('fill','#30C77B'); this.badgeP.setAttribute('d','M-6,0.5L-1.8,4.6L6.2,-4.2'); this.badgeDot.style.display='none'; }
    // sparkles
    var sp=this.sparks, dt0=0;
    for(i=0;i<this.sparkEls.length;i++){ var S2=this.sparkEls[i], q=sp[i]; if(!q){ S2.setAttribute('opacity','0'); continue; }
      var life=clamp(q.t/0.8,0,1), sc2=Math.sin(Math.PI*life)*q.s, rad=q.d+life*14;
      var X3=Math.cos(q.a)*rad+bx, Y3=cyB+Math.sin(q.a)*rad*0.95+by;
      S2.setAttribute('transform','translate('+X3.toFixed(1)+' '+Y3.toFixed(1)+') rotate('+(life*90).toFixed(1)+') scale('+Math.max(0.01,sc2).toFixed(3)+')'); S2.setAttribute('opacity',q.t<0?'0':'1'); }
    if(!o.still){ this._sparkClock(); }
  }
  _sparkClock(){ var now2=this.t; if(this._lastSparkT==null) this._lastSparkT=now2; var dt=now2-this._lastSparkT; this._lastSparkT=now2;
    this.sparks.forEach(function(q){ q.t+=dt; }); this.sparks=this.sparks.filter(function(q){ return q.t<0.8; }).slice(-8); }

  /* ---------- export helpers ---------- */
  toSVGString(size, bg){
    var c=this.svg.cloneNode(true); size=size||512;
    c.setAttribute('width',size); c.setAttribute('height',size); c.setAttribute('xmlns','http://www.w3.org/2000/svg');
    if(bg){ var r=document.createElementNS('http://www.w3.org/2000/svg','rect'); r.setAttribute('x','-160'); r.setAttribute('y','-165'); r.setAttribute('width','320'); r.setAttribute('height','320'); r.setAttribute('fill',bg); c.insertBefore(r,c.firstChild.nextSibling); }
    return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(c);
  }
}
AgentMascot.manual = false;
AgentMascot.tick = function(dt){ live.forEach(function(m){ m.step(dt); }); };
AgentMascot.PALETTE = PALETTE; AgentMascot.STATES = STATES; AgentMascot.MATERIALS = MATERIALS; AgentMascot.SHAPES = SHAPES;
window.AgentMascot = AgentMascot;
customElements.define('agent-mascot', AgentMascot);
})();
