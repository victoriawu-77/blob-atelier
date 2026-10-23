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
var FABRICS = ['fluffy','knit','felt'];
var ACCESSORIES = ['none','beret','glasses','sunglasses']; // 3D animals only
// accessory colours: ink is each accessory's original near-black look (the default); a #hex also works
var ACC_COLORS = { ink:'#1C1B21', cream:'#F3EBDD', tomato:'#E5534B', blush:'#F5A3B7', mustard:'#E8B23A', sage:'#8DB38B', sky:'#6FA8E8', lilac:'#AD94E6' };
function accColorName(v){ if(!v) return null; v=String(v).trim(); var l=v.toLowerCase(); if(ACC_COLORS[l]) return l; if(/^#?[0-9a-f]{6}$/i.test(v)) return (v[0]==='#'?v:'#'+v).toUpperCase(); return null; }
var ALL_MATERIALS = MATERIALS.concat(FABRICS);
var ALIAS = { bun:'kitty', rabbit:'bunny', kitten:'cat', puppy:'dog', toad:'frog', teddy:'bear', chicken:'chick', fur:'fluffy', wool:'knit', yarn:'knit', plush:'knit', velour:'knit', fuzzy:'fluffy' };
var SHAPES = ['mochi','bean','pebble','squircle','pill','drop','kitty','cloud'];
var ANIMALS = ['bunny','cat','dog','frog','hamster','bear','panda','chick'];
var SERIES = { blobs:{ shapes:SHAPES, materials:MATERIALS }, animals:{ shapes:ANIMALS, materials:FABRICS } };
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
  kitty: function(t){ var s=Math.sin(t), top=s<0; var p=se(t,1.04, top?0.8:0.5, top?2.1:3.8); var d1=t-(1.5*Math.PI-0.62), d2=t-(1.5*Math.PI+0.62);
    var e=Math.exp(-d1*d1/0.03)+Math.exp(-d2*d2/0.03); p[1]-=0.2*e; p[0]*=1-0.06*e; return p; },
  cloud: function(t){ var s=Math.sin(t), c=Math.cos(t), top=s<0; var p=se(t,1.08, top?0.98:0.5, top?2.1:4.0);
    var phi=Math.atan2(c,-s), w=clamp((-s+0.3)/0.55,0,1); var b=1+0.11*(Math.abs(Math.cos(2.5*phi))-0.62)*w; return [p[0]*b,p[1]*b]; },
  /* animal bodies: same chubby family, the ears/snouts/tails are separate parts (see PARTS) */
  bunny: function(t){ var top=Math.sin(t)<0; var p=se(t,0.92, top?1.0:0.6, top?2.1:3.1); p[0]*=1+0.07*p[1]; return p; },
  cat: function(t){ var top=Math.sin(t)<0; return se(t,1.02, top?0.9:0.56, top?2.35:3.3); },
  dog: function(t){ var top=Math.sin(t)<0; var p=se(t,1.0, top?0.94:0.58, top?2.2:3.2); p[0]*=1+0.05*p[1]; return p; },
  frog: function(t){ var top=Math.sin(t)<0; return se(t,1.18, top?0.72:0.52, top?2.3:3.5); },
  hamster: function(t){ var top=Math.sin(t)<0; var p=se(t,0.94, top?0.94:0.64, top?2.05:3.0); p[0]*=1+0.11*Math.exp(-Math.pow(p[1]-0.12,2)/0.07); return p; },
  bear: function(t){ var top=Math.sin(t)<0; return se(t,1.0, top?0.95:0.58, top?2.2:3.3); },
  panda: function(t){ var top=Math.sin(t)<0; return se(t,1.04, top?0.92:0.58, top?2.25:3.3); },
  chick: function(t){ var top=Math.sin(t)<0; var p=se(t,0.92, top?1.06:0.62, top?2.05:2.8); p[0]*=1-0.1*Math.max(0,-p[1]); return p; }
};
var FACE = { mochi:[0.53,0.34], bean:[0.44,0.37], pebble:[0.5,0.33], squircle:[0.5,0.34], pill:[0.4,0.42], drop:[0.6,0.36], kitty:[0.58,0.32], cloud:[0.54,0.32],
  bunny:[0.52,0.33], cat:[0.52,0.34], dog:[0.47,0.33], frog:[-0.06,0.42], hamster:[0.45,0.31], bear:[0.48,0.33], panda:[0.48,0.36], chick:[0.5,0.3] };
var AREA = { bunny:0.84, cat:0.94, dog:0.92, frog:0.9, hamster:0.98, bear:0.9, panda:0.92, chick:0.9 };
/* ---------- animal parts: drawn in body space, origin at the attachment point, pointing up ----------
   L: back (behind the body) | patch (on the body, clipped) | front (over the body edge)
   at: offset in curve param from the top of the head (left side, mirrored for the right)
   face: rides the face sphere like the eyes (dy below the eye line); eye: follows each eye */
var EAR_BUNNY='M-15,6C-22,-30 -23,-80 -3,-103C0,-106 4,-106 7,-102C23,-78 21,-30 15,6Z',
    EAR_BUNNY_IN='M-7,-4C-12,-30 -12,-70 -1,-88C1,-90 3,-90 4,-87C11,-68 11,-30 7,-4Z',
    EAR_CAT='M-27,10C-25,-12 -16,-36 -5,-46C-2,-49 2,-49 5,-46C16,-36 25,-12 27,10Z',
    EAR_CAT_IN='M-15,4C-14,-12 -8,-28 -2,-34C0,-36 1,-36 3,-34C9,-28 14,-12 15,4Z',
    EAR_DOG='M-10,-8C-26,-6 -36,16 -34,42C-33,60 -24,72 -12,72C0,72 6,60 8,44C10,24 8,2 4,-8Z',
    EAR_ROUND='M-25,10C-27,-9 -15,-27 0,-27C15,-27 27,-9 25,10Z',
    EAR_ROUND_IN='M-13,8C-14,-4 -8,-15 0,-15C8,-15 14,-4 13,8Z',
    EAR_HAM='M-19,9C-21,-6 -11,-21 0,-21C11,-21 21,-6 19,9Z',
    EAR_HAM_IN='M-10,7C-11,-2 -6,-11 0,-11C6,-11 11,-2 10,7Z',
    TUFT='M-2,8C-12,-4 -14,-20 -6,-30C-2,-20 0,-10 1,0C3,-12 8,-24 16,-28C18,-16 12,-2 4,8Z',
    WING='M2,-14C-12,-12 -22,4 -24,20C-25,30 -20,34 -12,30C-2,24 6,10 8,-4C9,-11 6,-14 2,-14Z',
    TAIL='M-6,6C4,4 22,-2 30,-20C36,-34 34,-52 26,-62C22,-67 15,-64 16,-58C20,-46 20,-32 12,-20C6,-12 -2,-8 -8,-8Z',
    NOSE='M-1,-0.62C-0.6,-0.78 0.6,-0.78 1,-0.62C0.95,-0.1 0.4,0.5 0,0.55C-0.4,0.5 -0.95,-0.1 -1,-0.62Z',
    BEAK='M-1,0C-0.6,-0.5 -0.2,-0.62 0,-0.62C0.2,-0.62 0.6,-0.5 1,0C0.6,0.5 0.2,0.62 0,0.62C-0.2,0.62 -0.6,0.5 -1,0Z';
var PARTS = {
  bunny:[ {L:'back', d:EAR_BUNNY, inner:EAR_BUNNY_IN, at:-0.34, dy:20, rot:-9, swing:1.5, sway:1.6},
          {L:'patch', kind:'nose', face:1, dy:15, w:7.5, col:'pnose'} ],
  cat:[ {L:'back', d:TAIL, at:1.95, dx:-12, dy:-6, rot:0, single:1, right:1, swing:0.6, sway:6, col:'base'},
        {L:'back', d:EAR_CAT, inner:EAR_CAT_IN, at:-0.6, dy:16, rot:-16, swing:1},
        {L:'patch', kind:'nose', face:1, dy:15, w:7.5, col:'pnose'} ],
  dog:[ {L:'patch', kind:'oval', face:1, dy:25, rx:31, ry:21, col:'light'},
        {L:'patch', kind:'nose', face:1, dy:15, w:12, col:'dnose'},
        {L:'front', d:EAR_DOG, at:-0.9, dx:6, dy:2, rot:8, swing:-1.6, sway:1.2, col:'dark'} ],
  frog:[ {L:'back', kind:'bump', eye:1, r:27, dy:-1, col:'base'},
         {L:'patch', kind:'oval', abs:1, y:0.86, rx:0.62, ry:32, col:'light', op:0.85} ],
  hamster:[ {L:'back', d:EAR_HAM, inner:EAR_HAM_IN, at:-0.74, dy:9, rot:-24, swing:0.8},
            {L:'patch', kind:'oval', face:1, dy:44, rx:0.72, ry:50, rel:1, col:'light'},
            {L:'patch', kind:'nose', face:1, dy:14, w:7, col:'pnose'} ],
  bear:[ {L:'back', d:EAR_ROUND, inner:EAR_ROUND_IN, at:-0.66, dy:10, rot:-28, swing:0.8},
         {L:'patch', kind:'oval', face:1, dy:22, rx:27, ry:19, col:'light'},
         {L:'patch', kind:'nose', face:1, dy:15, w:11, col:'dnose'} ],
  panda:[ {L:'back', d:EAR_ROUND, at:-0.68, dy:10, rot:-28, swing:0.8, col:'dark'},
          {L:'patch', kind:'eyepatch', eye:1, rx:19, ry:24, col:'dark'},
          {L:'patch', kind:'nose', face:1, dy:17, w:10, col:'dnose'} ],
  chick:[ {L:'back', d:TUFT, at:0.0, dy:10, rot:0, single:1, swing:1.4, sway:2},
          {L:'front', d:WING, at:-1.62, dx:4, dy:-6, rot:4, swing:-1.8, col:'base'},
          {L:'patch', kind:'beak', face:1, dy:14, w:9, col:'beak'} ]
};
var GEO = {};
SHAPES.concat(ANIMALS).forEach(function(name){
  var fn=SHAPE_FN[name], p=new Float64Array(N*2), i, A=0, cx=0;
  for(i=0;i<N;i++){ var q=fn(i/N*TAU); p[2*i]=q[0]; p[2*i+1]=q[1]; }
  for(i=0;i<N;i++){ var j=(i+1)%N, cr=p[2*i]*p[2*j+1]-p[2*j]*p[2*i+1]; A+=cr; cx+=(p[2*i]+p[2*j])*cr; }
  A/=2; cx/=(6*A); var sc=Math.sqrt(Math.PI*0.9*0.9*(AREA[name]||1)/Math.abs(A)), maxY=-9, minY=9, hw=0;
  for(i=0;i<N;i++){ p[2*i]=(p[2*i]-cx)*sc; p[2*i+1]*=sc; maxY=Math.max(maxY,p[2*i+1]); }
  for(i=0;i<N;i++){ p[2*i+1]+=0.9-maxY; minY=Math.min(minY,p[2*i+1]); hw=Math.max(hw,Math.abs(p[2*i])); }
  for(i=0;i<2*N;i++) p[i]*=S;
  var f=FACE[name], ear=null;
  if(name==='kitty'){ ear=new Float64Array(N*2); for(i=0;i<N;i++){ var tt=i/N*TAU, d1=tt-(1.5*Math.PI-0.62), d2=tt-(1.5*Math.PI+0.62); ear[2*i]=Math.exp(-d1*d1/0.03); ear[2*i+1]=Math.exp(-d2*d2/0.03); } }
  GEO[name]={ ear:ear, p:p, top:minY*S, bot:0.9*S, hw:hw*S, fy:(minY+(0.9-minY)*f[0])*S, sp:hw*S*f[1] };
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
/* ---------- Animals in 3D (three.js, loaded lazily) ----------
   SDF shapes meshed once with surface nets, shell-textured fur on MeshPhysicalMaterial (sheen),
   one shared offscreen WebGL renderer that blits into each mascot's own 2D canvas. */
function AM3D(THREE){
var V3=THREE.Vector3;
function smin(a,b,k){ var h=Math.max(k-Math.abs(a-b),0)/k; return Math.min(a,b)-h*h*k*0.25; }
function smax(a,b,k){ return -smin(-a,-b,k); }
function ell(x,y,z,rx,ry,rz){ var a=x/rx,b=y/ry,c=z/rz, k0=Math.sqrt(a*a+b*b+c*c), k1=Math.sqrt(a*a/(rx*rx)+b*b/(ry*ry)+c*c/(rz*rz)); return k1>1e-9 ? k0*(k0-1)/k1 : -Math.min(rx,ry,rz); }
function rcone(px,py,pz,ax,ay,az,bx,by,bz,r1,r2){
  var bax=bx-ax,bay=by-ay,baz=bz-az,l2=bax*bax+bay*bay+baz*baz,rr=r1-r2,a2=l2-rr*rr,il2=1/l2;
  var pax=px-ax,pay=py-ay,paz=pz-az,y=pax*bax+pay*bay+paz*baz,z=y-l2;
  var qx=pax*l2-bax*y,qy=pay*l2-bay*y,qz=paz*l2-baz*y,x2=qx*qx+qy*qy+qz*qz,y2=y*y*l2,z2=z*z*l2,k=Math.sign(rr)*rr*rr*x2;
  if(Math.sign(z)*a2*z2>k) return Math.sqrt(x2+z2)*il2-r2;
  if(Math.sign(y)*a2*y2<k) return Math.sqrt(x2+y2)*il2-r1;
  return (Math.sqrt(x2*a2*il2)+y*rr)*il2-r1; }
function rotZ(x,y,cx,cy,a){ var c=Math.cos(a),s=Math.sin(a),dx=x-cx,dy=y-cy; return [cx+dx*c-dy*s, cy+dx*s+dy*c]; }
function floorCut(d,y){ return smax(d,-y,0.07); }
function w(d,soft){ return Math.max(0,Math.min(1,0.5-d/(soft||0.05))); } // paint weight from a region distance
var ZERO=[0,0,0,0];
/* each shape: sdf(x,y,z), paint(x,y,z)->[light,pink,dark,cheek], ear:{x,y,z} pivot (mirrored), eyes:[x,y], extras */
var SH={
  bunny:{ sdf:function(x,y,z){ var ax=Math.abs(x);
      var d=smin(ell(x,y-0.56,z,0.93,0.58,0.84), ell(x,y-0.98,z,0.74,0.64,0.7), 0.42);
      var e=rcone(ax,y,z*1.7, 0.25,1.42,0, 0.34,2.22,-0.06, 0.16,0.13); d=smin(d,e,0.13); return floorCut(d,y); },
    paint:function(x,y,z){ var ax=Math.abs(x); return [0, w(rcone(ax,y,(z-0.075)*1.6, 0.27,1.55,0, 0.34,2.17,-0.06, 0.075,0.06),0.03), 0, w(ell(ax-0.47,y-0.74,z-0.62,0.17,0.11,0.25),0.07)]; },
    ear:[0.25,1.4,0], earAmp:1.2, eyes:[0.29,0.96], nose:{y:0.83,kind:'pink'}, hat:1.55 },
  cat:{ sdf:function(x,y,z){ var ax=Math.abs(x);
      var d=smin(ell(x,y-0.52,z,1.0,0.56,0.86), ell(x,y-0.9,z,0.84,0.6,0.74), 0.42);
      d=smin(d, rcone(ax,y,z*1.55, 0.5,1.18,0, 0.64,1.74,0.02, 0.27,0.045), 0.1);
      var t=smin(rcone(x,y,z, 0.7,0.3,-0.55, 1.02,0.82,-0.68, 0.11,0.095), rcone(x,y,z, 1.02,0.82,-0.68, 0.9,1.24,-0.6, 0.095,0.105), 0.05);
      d=smin(d,t,0.12); return floorCut(d,y); },
    paint:function(x,y,z){ var ax=Math.abs(x); return [0, w(rcone(ax,y,(z-0.1)*1.5, 0.52,1.3,0, 0.62,1.66,0.02, 0.14,0.02),0.03), 0, w(ell(ax-0.5,y-0.68,z-0.66,0.17,0.11,0.25),0.07)]; },
    ear:[0.52,1.2,0], earAmp:0.7, eyes:[0.33,0.9], nose:{y:0.78,kind:'pink'}, hat:1.45 },
  dog:{ sdf:function(x,y,z){ var ax=Math.abs(x);
      var d=smin(ell(x,y-0.55,z,0.98,0.58,0.86), ell(x,y-0.95,z,0.8,0.65,0.74), 0.42);
      d=smin(d, ell(x,y-0.68,z-0.64,0.33,0.23,0.27), 0.2);
      var r=rotZ(ax,y,0.72,1.36,-0.3), e=ell(r[0]-0.86,r[1]-1.0,z-0.02,0.19,0.4,0.13); d=smin(d,e,0.06); return floorCut(d,y); },
    paint:function(x,y,z){ var ax=Math.abs(x), r=rotZ(ax,y,0.72,1.36,-0.3); return [w(ell(x,y-0.68,z-0.7,0.33,0.24,0.28),0.06), 0, w(ell(r[0]-0.86,r[1]-1.0,z-0.02,0.21,0.42,0.16),0.04), w(ell(ax-0.52,y-0.7,z-0.62,0.14,0.1,0.25),0.07)]; },
    earw:function(ax,y,z){ var r=rotZ(ax,y,0.72,1.36,-0.3); return w(ell(r[0]-0.86,r[1]-1.0,z-0.02,0.24,0.46,0.2),0.12); },
    ear:[0.72,1.36,0.05], earAmp:-1.3, eyes:[0.33,1.0], nose:{y:0.84,z:0.0,kind:'black',r:0.085}, hat:1.58 },
  frog:{ sdf:function(x,y,z){ var ax=Math.abs(x);
      var d=smin(ell(x,y-0.47,z,1.12,0.5,0.92), ell(x,y-0.74,z,0.94,0.48,0.8), 0.36);
      d=smin(d, ell(ax-0.46,y-1.08,z-0.18,0.33,0.31,0.31), 0.24); return floorCut(d,y); },
    paint:function(x,y,z){ var ax=Math.abs(x); return [w(ell(x,y-0.3,z-0.78,0.74,0.36,0.4),0.035), 0, 0, w(ell(ax-0.7,y-0.62,z-0.66,0.17,0.1,0.25),0.07)]; },
    googly:{x:0.46,y:1.12,r:0.215}, eyes:null, hat:1.42 },
  hamster:{ sdf:function(x,y,z){ var ax=Math.abs(x);
      var d=smin(ell(x,y-0.6,z,1.0,0.64,0.9), ell(x,y-1.0,z,0.8,0.6,0.76), 0.45);
      d=smin(d, ell(ax-0.6,y-0.6,z-0.4,0.37,0.34,0.36), 0.3);
      d=smin(d, ell(ax-0.5,y-1.45,z+0.05,0.17,0.15,0.08), 0.09); return floorCut(d,y); },
    paint:function(x,y,z){ var ax=Math.abs(x); return [w(ell(x,y-0.48,z-0.72,0.72,0.42,0.42),0.04), w(ell(ax-0.5,y-1.46,z+0.0,0.1,0.09,0.06),0.03), 0, w(ell(ax-0.6,y-0.72,z-0.68,0.16,0.1,0.25),0.07)]; },
    ear:[0.5,1.38,-0.05], earAmp:0.5, eyes:[0.32,1.02], nose:{y:0.9,kind:'pink'}, hat:1.6 },
  bear:{ sdf:function(x,y,z){ var ax=Math.abs(x);
      var d=smin(ell(x,y-0.55,z,0.98,0.58,0.86), ell(x,y-0.95,z,0.8,0.65,0.74), 0.42);
      d=smin(d, ell(x,y-0.74,z-0.68,0.29,0.21,0.23), 0.17);
      d=smin(d, ell(ax-0.55,y-1.45,z+0.04,0.24,0.22,0.12), 0.1); return floorCut(d,y); },
    paint:function(x,y,z){ var ax=Math.abs(x); return [Math.max(w(ell(x,y-0.74,z-0.73,0.29,0.22,0.24),0.05), w(ell(ax-0.55,y-1.45,z-0.06,0.12,0.11,0.06),0.03)*0.9), 0, 0, w(ell(ax-0.56,y-0.72,z-0.62,0.15,0.1,0.25),0.07)]; },
    ear:[0.55,1.38,0], earAmp:0.5, eyes:[0.33,1.02], nose:{y:0.86,kind:'black',r:0.07}, hat:1.6 },
  panda:{ sdf:function(x,y,z){ var ax=Math.abs(x);
      var d=smin(ell(x,y-0.55,z,1.0,0.58,0.86), ell(x,y-0.94,z,0.82,0.64,0.74), 0.42);
      d=smin(d, ell(x,y-0.72,z-0.7,0.24,0.16,0.18), 0.15);
      d=smin(d, ell(ax-0.58,y-1.43,z+0.04,0.23,0.21,0.12), 0.09); return floorCut(d,y); },
    paint:function(x,y,z){ var ax=Math.abs(x), r=rotZ(ax,y,0.34,0.98,-0.5);
      return [0, 0, Math.max(w(ell(ax-0.58,y-1.43,z+0.04,0.26,0.24,0.15),0.03), w(ell(r[0]-0.36,r[1]-0.96,z-0.7,0.15,0.2,0.3),0.03)), w(ell(ax-0.6,y-0.68,z-0.62,0.14,0.09,0.25),0.07)]; },
    ear:[0.58,1.36,0], earAmp:0.5, eyes:[0.35,0.98], nose:{y:0.8,kind:'black',r:0.06}, darkEyes:1, hat:1.58 },
  chick:{ sdf:function(x,y,z){ var ax=Math.abs(x);
      var d=smin(ell(x,y-0.6,z,0.9,0.6,0.82), ell(x,y-1.04,z,0.7,0.62,0.66), 0.45);
      var r=rotZ(ax,y,0.8,0.8,-0.5); d=smin(d, ell(r[0]-0.86,r[1]-0.62,z-0.02,0.12,0.3,0.24), 0.08);
      var t1=rcone(x,y,z, 0,1.56,0, 0.02,1.9,0.02, 0.06,0.035), t2=rcone(ax,y,z, 0.03,1.56,0, 0.15,1.84,-0.02, 0.05,0.03); d=smin(d,smin(t1,t2,0.03),0.07); return floorCut(d,y); },
    paint:function(x,y,z){ var ax=Math.abs(x); return [0,0,0, w(ell(ax-0.48,y-0.82,z-0.58,0.15,0.1,0.25),0.07)]; },
    eyes:[0.3,1.06], beak:{y:0.9}, hat:1.62 }
};
/* ---------- meshing: naive surface nets + projection onto the zero set ---------- */
function mesh(S){
  var f=S.sdf, h=0.034, x0=-1.5,y0=-0.06,z0=-1.15, nx=Math.ceil(3.0/h)+1, ny=Math.ceil(2.5/h)+1, nz=Math.ceil(2.3/h)+1;
  var v=new Float32Array(nx*ny*nz), i,j,k, id=function(i,j,k){ return i+nx*(j+ny*k); };
  for(k=0;k<nz;k++) for(j=0;j<ny;j++) for(i=0;i<nx;i++) v[id(i,j,k)]=f(x0+i*h,y0+j*h,z0+k*h);
  var cell=new Int32Array(nx*ny*nz).fill(-1), P=[], E=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  var co=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]];
  for(k=0;k<nz-1;k++) for(j=0;j<ny-1;j++) for(i=0;i<nx-1;i++){
    var vals=[],m=0; for(var c=0;c<8;c++){ var q=v[id(i+co[c][0],j+co[c][1],k+co[c][2])]; vals.push(q); if(q<0) m|=1<<c; }
    if(m===0||m===255) continue; var sx=0,sy=0,sz=0,n=0;
    for(var e=0;e<12;e++){ var a=E[e][0],b=E[e][1]; if(((m>>a)&1)===((m>>b)&1)) continue; var t=vals[a]/(vals[a]-vals[b]);
      sx+=co[a][0]+(co[b][0]-co[a][0])*t; sy+=co[a][1]+(co[b][1]-co[a][1])*t; sz+=co[a][2]+(co[b][2]-co[a][2])*t; n++; }
    cell[id(i,j,k)]=P.length/3; P.push(x0+(i+sx/n)*h, y0+(j+sy/n)*h, z0+(k+sz/n)*h); }
  var I=[];
  function quad(a,b,c,d,flip){ if(a<0||b<0||c<0||d<0) return; if(flip) I.push(a,c,b,a,d,c); else I.push(a,b,c,a,c,d); }
  for(k=1;k<nz-1;k++) for(j=1;j<ny-1;j++) for(i=1;i<nx-1;i++){
    var s0=v[id(i,j,k)]<0;
    if(i<nx-1 && s0!==(v[id(i+1,j,k)]<0)) quad(cell[id(i,j-1,k-1)],cell[id(i,j,k-1)],cell[id(i,j,k)],cell[id(i,j-1,k)],s0);
    if(j<ny-1 && s0!==(v[id(i,j+1,k)]<0)) quad(cell[id(i-1,j,k-1)],cell[id(i-1,j,k)],cell[id(i,j,k)],cell[id(i,j,k-1)],s0);
    if(k<nz-1 && s0!==(v[id(i,j,k+1)]<0)) quad(cell[id(i-1,j-1,k)],cell[id(i,j-1,k)],cell[id(i,j,k)],cell[id(i-1,j,k)],s0);
  }
  var np=P.length/3, N=new Float32Array(np*3), pos=new Float32Array(P), ep=0.003, paint=new Float32Array(np*4), earW=new Float32Array(np);
  for(i=0;i<np;i++){ var x=pos[3*i],y=pos[3*i+1],z=pos[3*i+2];
    for(var it=0;it<3;it++){ var d=f(x,y,z), gx=f(x+ep,y,z)-f(x-ep,y,z), gy=f(x,y+ep,z)-f(x,y-ep,z), gz=f(x,y,z+ep)-f(x,y,z-ep), g2=(gx*gx+gy*gy+gz*gz)/(4*ep*ep);
      if(g2<1e-8) break; var s=d/g2/(2*ep); x-=gx*s; y-=gy*s; z-=gz*s; }
    gx=f(x+ep,y,z)-f(x-ep,y,z); gy=f(x,y+ep,z)-f(x,y-ep,z); gz=f(x,y,z+ep)-f(x,y,z-ep); var L=Math.hypot(gx,gy,gz)||1;
    pos[3*i]=x; pos[3*i+1]=y; pos[3*i+2]=z; N[3*i]=gx/L; N[3*i+1]=gy/L; N[3*i+2]=gz/L;
    var pp=S.paint?S.paint(x,y,z):ZERO; paint.set(pp,4*i);
    if(S.ear){ var ey=y-S.ear[1]; earW[i]=Math.sign(x)*(S.earw ? S.earw(Math.abs(x),y,z) : (Math.abs(x)>S.ear[0]*0.3 ? Math.min(1,Math.max(0,(ey+0.08)/0.3)) : 0)); }
  }
  var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(N,3));
  g.setAttribute('paint',new THREE.BufferAttribute(paint,4)); g.setAttribute('earW',new THREE.BufferAttribute(earW,1)); g.setIndex(I);
  // fix winding against the SDF normal
  var idx=g.index.array; for(i=0;i<idx.length;i+=3){ var a=idx[i]*3,b=idx[i+1]*3,c=idx[i+2]*3;
    var ux=pos[b]-pos[a],uy=pos[b+1]-pos[a+1],uz=pos[b+2]-pos[a+2],vx=pos[c]-pos[a],vy=pos[c+1]-pos[a+1],vz=pos[c+2]-pos[a+2];
    var cx=uy*vz-uz*vy, cy=uz*vx-ux*vz, cz=ux*vy-uy*vx; if(cx*N[a]+cy*N[a+1]+cz*N[a+2]<0){ var tmp=idx[i+1]; idx[i+1]=idx[i+2]; idx[i+2]=tmp; } }
  g.computeBoundingSphere();
  // surface probes for eyes/nose/hat
  function hitZ(x,y){ var z=1.6; for(var s=0;s<200;s++){ var d=f(x,y,z); if(d<0.0005) break; z-=Math.max(d,0.002); if(z<-1) return null; } return z; }
  function nrm(x,y,z){ var a=f(x+ep,y,z)-f(x-ep,y,z), b=f(x,y+ep,z)-f(x,y-ep,z), c=f(x,y,z+ep)-f(x,y,z-ep), L=Math.hypot(a,b,c)||1; return new V3(a/L,b/L,c/L); }
  function probe(x,y){ var z=hitZ(x,y); return z==null?null:{p:new V3(x,y,z), n:nrm(x,y,z)}; }
  var top=0; for(var yy=2.6;yy>0;yy-=0.005){ if(f(0,yy,0)<0){ top=yy; break; } }
  var foot=0; for(var xx=1.6;xx>0;xx-=0.005){ if(f(xx,0.06,0)<0){ foot=xx; break; } }
  return { geo:g, probe:probe, top:top, foot:foot, f:f };
}
var CACHE={};
/* felt flyaways: thin tapered 3-sided tubes. most arch over the surface and land again (crossed fibres), some lift off
   into the halo. built in body space from the SDF so they follow the surface; paint/earW copied from the root vertex */
function knitField(D,S,kr){
  var g=D.geo, P=g.attributes.position.array, EW=g.attributes.earW.array, I=g.index.array, n=P.length/3, i,j,k;
  var dist=new Float64Array(n).fill(1e9), adj=[]; for(i=0;i<n;i++) adj.push([]);
  function L(a,b){ return Math.hypot(P[3*a]-P[3*b],P[3*a+1]-P[3*b+1],P[3*a+2]-P[3*b+2]); }
  for(i=0;i<I.length;i+=3) for(j=0;j<3;j++){ var a=I[i+j], b=I[i+(j+1)%3]; adj[a].push(b); adj[b].push(a); }
  // crown: the top of the head on the centre line (between the ears)
  var src=0, best=1e9; for(i=0;i<n;i++){ var dd=Math.hypot(P[3*i],P[3*i+1]-D.top,P[3*i+2]); if(dd<best){ best=dd; src=i; } }
  dist[src]=0; var heap=[[0,src]];
  function push(x){ heap.push(x); var c=heap.length-1; while(c>0){ var p=(c-1)>>1; if(heap[p][0]<=heap[c][0]) break; var t=heap[p]; heap[p]=heap[c]; heap[c]=t; c=p; } }
  function pop(){ var top=heap[0], last=heap.pop(); if(heap.length){ heap[0]=last; var c=0; for(;;){ var l=2*c+1, r=l+1, m=c; if(l<heap.length&&heap[l][0]<heap[m][0]) m=l; if(r<heap.length&&heap[r][0]<heap[m][0]) m=r; if(m===c) break; var t=heap[m]; heap[m]=heap[c]; heap[c]=t; c=m; } } return top; }
  while(heap.length){ var it=pop(), u=it[1]; if(it[0]>dist[u]) continue; for(k=0;k<adj[u].length;k++){ var w=adj[u][k], nd=dist[u]+L(u,w); if(nd<dist[w]){ dist[w]=nd; push([nd,w]); } } }
  // refine the edge-graph distances with triangle (unfolded) updates so rows come out round, not polygonal
  function upd(A,B,C){ var a=dist[A], b=dist[B]; if(a>=1e9||b>=1e9) return; var ax=P[3*A],ay=P[3*A+1],az=P[3*A+2], ux=P[3*B]-ax,uy=P[3*B+1]-ay,uz=P[3*B+2]-az, Lb=Math.hypot(ux,uy,uz); ux/=Lb; uy/=Lb; uz/=Lb;
    var cx=P[3*C]-ax,cy=P[3*C+1]-ay,cz=P[3*C+2]-az, px=cx*ux+cy*uy+cz*uz, qy=Math.hypot(cx-px*ux,cy-px*uy,cz-px*uz);
    var sx=(a*a-b*b+Lb*Lb)/(2*Lb), s2=a*a-sx*sx; if(s2<0) return; var sy=-Math.sqrt(s2), xi=sx+(px-sx)*(-sy)/(qy-sy);
    if(xi>=0 && xi<=Lb){ var dc=Math.hypot(px-sx,qy-sy); if(dc<dist[C]) dist[C]=dc; } }
  for(var pass=0;pass<4;pass++) for(i=0;i<I.length;i+=3){ var A=I[i],B=I[i+1],C=I[i+2]; upd(A,B,C); upd(B,C,A); upd(C,A,B); }
  var kv=new Float32Array(n); for(i=0;i<n;i++) kv[i]=dist[i]; g.setAttribute('knitV',new THREE.BufferAttribute(kv,1));
  // ears: knitted as their own pieces. rows run from the pivot toward the ear's tip, columns across its width
  var ear=null; if(S.ear){ var base=new V3(S.ear[0],S.ear[1],S.ear[2]), tip=null, far=0, cnt=0;
    for(i=0;i<n;i++) if(EW[i]>0.5 && P[3*i]>0){ cnt++; var dd2=Math.hypot(P[3*i]-base.x,P[3*i+1]-base.y,P[3*i+2]-base.z); if(dd2>far){ far=dd2; tip=new V3(P[3*i],P[3*i+1],P[3*i+2]); } }
    if(cnt>20){ var ax=tip.clone().sub(base).normalize(), wd=new V3(0,0,1).cross(ax).normalize(); if(wd.x<0) wd.negate();
      var lo=1e9; for(i=0;i<n;i++) if(EW[i]>0.5 && P[3*i]>0) lo=Math.min(lo,(P[3*i]-base.x)*ax.x+(P[3*i+1]-base.y)*ax.y+(P[3*i+2]-base.z)*ax.z);
      ear={ax:ax, wd:wd, base:base, off:lo}; } }
  // circumference of each row = area of the band / row height (body, and the right ear)
  var cb=new Float32Array(64), ce=new Float32Array(24);
  for(i=0;i<I.length;i+=3){ var A=I[i],B=I[i+1],C=I[i+2], ux2=P[3*B]-P[3*A],uy2=P[3*B+1]-P[3*A+1],uz2=P[3*B+2]-P[3*A+2],vx=P[3*C]-P[3*A],vy=P[3*C+1]-P[3*A+1],vz=P[3*C+2]-P[3*A+2];
    var ar=0.5*Math.hypot(uy2*vz-uz2*vy,uz2*vx-ux2*vz,ux2*vy-uy2*vx), ew=(EW[A]+EW[B]+EW[C])/3, cx2=(P[3*A]+P[3*B]+P[3*C])/3, cy2=(P[3*A+1]+P[3*B+1]+P[3*C+1])/3, cz2=(P[3*A+2]+P[3*B+2]+P[3*C+2])/3;
    if(Math.abs(ew)>0.5){ if(ear && cx2>0){ var vv=(cx2-ear.base.x)*ear.ax.x+(cy2-ear.base.y)*ear.ax.y+(cz2-ear.base.z)*ear.ax.z-ear.off; ce[Math.max(0,Math.min(23,Math.floor(vv/kr)))]+=ar/kr; } }
    else cb[Math.max(0,Math.min(63,Math.floor((kv[A]+kv[B]+kv[C])/3/kr)))]+=ar/kr; }
  function smooth(t){ var o=new Float32Array(t.length); for(var q=0;q<t.length;q++){ var s0=0,w0=0; for(var r=-1;r<=1;r++){ var x=t[q+r]; if(x>0){ s0+=x*(r?0.5:1); w0+=(r?0.5:1); } } o[q]=w0?s0/w0:0; } return o; }
  return { cb:smooth(cb), ce:smooth(ce), ear:ear };
}
function flyaways(D,count,seed){
  var g0=D.geo, P=g0.attributes.position.array, Nn=g0.attributes.normal.array, PA=g0.attributes.paint.array, EW=g0.attributes.earW.array, I=g0.index.array, f=D.f;
  var st=seed>>>0||1; function rnd(){ st=(st+0x6D2B79F5)>>>0; var t=st; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }
  var nt=I.length/3, cum=new Float32Array(nt), tot=0, i;
  for(i=0;i<nt;i++){ var a=I[3*i]*3,b=I[3*i+1]*3,c=I[3*i+2]*3, ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
    tot+=0.5*Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx); cum[i]=tot; }
  function proj(p){ for(var k=0;k<3;k++){ var e=0.003, d=f(p.x,p.y,p.z), gx=(f(p.x+e,p.y,p.z)-f(p.x-e,p.y,p.z))/(2*e), gy=(f(p.x,p.y+e,p.z)-f(p.x,p.y-e,p.z))/(2*e), gz=(f(p.x,p.y,p.z+e)-f(p.x,p.y,p.z-e))/(2*e), L2=gx*gx+gy*gy+gz*gz||1; p.x-=gx*d/L2; p.y-=gy*d/L2; p.z-=gz*d/L2; }
    var e2=0.003, nx=f(p.x+e2,p.y,p.z)-f(p.x-e2,p.y,p.z), ny=f(p.x,p.y+e2,p.z)-f(p.x,p.y-e2,p.z), nz=f(p.x,p.y,p.z+e2)-f(p.x,p.y,p.z-e2); return new V3(nx,ny,nz).normalize(); }
  var SEG=8, pos=[], nrm=[], paint=[], ew=[], tint=[], idx=[], made=0, guard=0;
  while(made<count && guard++<count*4){
    var r=rnd()*tot, lo=0, hi=nt-1; while(lo<hi){ var mid=(lo+hi)>>1; if(cum[mid]<r) lo=mid+1; else hi=mid; }
    var v0=I[3*lo], v1=I[3*lo+1], v2=I[3*lo+2], s1=rnd(), s2=rnd(); if(s1+s2>1){ s1=1-s1; s2=1-s2; }
    var p0=new V3(P[3*v0],P[3*v0+1],P[3*v0+2]).multiplyScalar(1-s1-s2).add(new V3(P[3*v1],P[3*v1+1],P[3*v1+2]).multiplyScalar(s1)).add(new V3(P[3*v2],P[3*v2+1],P[3*v2+2]).multiplyScalar(s2));
    if(p0.y<0.16) continue;                                         // nothing under the belly / on the floor
    var n0=new V3(Nn[3*v0],Nn[3*v0+1],Nn[3*v0+2]), t=new V3(rnd()-0.5,rnd()-0.5,rnd()-0.5); t.addScaledVector(n0,-t.dot(n0)); if(t.lengthSq()<1e-4) continue; t.normalize();
    var bn=new V3().crossVectors(n0,t), lift=rnd()<0.3, L=lift?0.05+rnd()*0.07:0.05+rnd()*0.06, H=lift?L*(0.35+rnd()*0.5):0.012+rnd()*0.022, curl=(rnd()-0.5)*0.6, rad=lift?0.0026:0.003, tn=rnd();
    var base=pos.length/3, pts=[];
    for(var k=0;k<=SEG;k++){ var u=k/SEG, q=p0.clone().addScaledVector(t,L*u).addScaledVector(bn,curl*L*u*u), nn=proj(q);
      var hgt = lift ? H*Math.pow(u,1.3)+0.006 : H*Math.sin(Math.PI*u)+0.004; pts.push(q.addScaledVector(nn,hgt)); }
    for(k=0;k<=SEG;k++){ var c=pts[k], dir=pts[Math.min(SEG,k+1)].clone().sub(pts[Math.max(0,k-1)]).normalize(), a1=new V3().crossVectors(dir,n0); if(a1.lengthSq()<1e-6) a1.set(1,0,0); a1.normalize(); var a2=new V3().crossVectors(dir,a1);
      var rr=rad*(lift ? 1-0.75*k/SEG : 0.55+0.45*Math.sin(Math.PI*Math.min(1,0.15+0.85*k/SEG)));
      for(var j=0;j<3;j++){ var ang=j*2.0944, o=a1.clone().multiplyScalar(Math.cos(ang)).addScaledVector(a2,Math.sin(ang)); pos.push(c.x+o.x*rr,c.y+o.y*rr,c.z+o.z*rr); o.addScaledVector(n0,0.6).normalize(); nrm.push(o.x,o.y,o.z);
        paint.push(PA[4*v0],PA[4*v0+1],PA[4*v0+2],PA[4*v0+3]); ew.push(EW[v0]); tint.push(tn); } }
    for(k=0;k<SEG;k++) for(j=0;j<3;j++){ var A=base+k*3+j, B=base+k*3+(j+1)%3, C2=A+3, D2=B+3; idx.push(A,B,D2,A,D2,C2); }
    made++; }
  var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3));
  g.setAttribute('paint',new THREE.Float32BufferAttribute(paint,4)); g.setAttribute('earW',new THREE.Float32BufferAttribute(ew,1)); g.setAttribute('fTint',new THREE.Float32BufferAttribute(tint,1)); g.setIndex(idx); g.computeBoundingSphere();
  return g; }
function shapeData(name){ if(!CACHE[name]) CACHE[name]=mesh(SH[name]); return CACHE[name]; }
/* ---------- fur material: MeshPhysicalMaterial + instanced shells ---------- */
var FIN={
  // knit: a knitted yarn toy. stockinette V stitches in rows that ring the body from the crown down (ears are knitted
  // as their own tubes), stitch relief built from the shells, twisted plies and a light fuzz (stray = fuzz fraction)
  knit:{ shells:20, len:0.056, dens:430, grav:0.0, root:0.42, sheen:0.3, sheenR:0.8, rough:1.0, stray:0.16, lenVar:0.35, mottle:0.0, rad:0.13, knit:1, kw:0.105, kr:0.086 },
  // felt: needle-felted wool. matted crossed fibres lying on the surface (arched loops in the shells), per-fibre
  // colour variation, plus a sparse halo of real thin flyaway fibres (fly = count, tube geometry)
  felt:{ shells:14, len:0.026, dens:360, grav:0.0, root:0.8, sheen:0.35, sheenR:0.6, rough:1.0, stray:0.0, lenVar:0.5, mottle:0.1, rad:0.42, felt:1, fsc:22, fw:0.09, fly:220 },
  fluffy:{ shells:40, len:0.12, dens:105, grav:0.6, root:0.42, sheen:0.8, sheenR:0.45, rough:0.95, stray:0.0, lenVar:0.55, mottle:0.0, clump:1, rad:0.5 }
};
function furMaterial(fin,shareU,fiber){
  var m=new THREE.MeshPhysicalMaterial({ color:0xffffff, roughness:fin.rough, metalness:0, sheen:fin.sheen, sheenRoughness:fin.sheenR, sheenColor:new THREE.Color(1,1,1) });
  var U=shareU||{ uLen:{value:fin.len}, uShells:{value:fin.shells}, uDens:{value:fin.dens}, uGrav:{value:fin.grav}, uRoot:{value:fin.root}, uStray:{value:fin.stray}, uLenVar:{value:fin.lenVar}, uMottle:{value:fin.mottle}, uClump:{value:fin.clump?1:0}, uRad:{value:fin.rad},
    cLight:{value:new THREE.Color()}, cPink:{value:new THREE.Color()}, cDark:{value:new THREE.Color()}, cCheek:{value:new THREE.Color()}, uCheeks:{value:1}, uEar:{value:new THREE.Vector2()}, uEarP:{value:new V3()}, uAO:{value:1},
    uCarveK:{value:0}, uCarveC:{value:[new V3(),new V3(),new V3()]}, uCarveN:{value:[new V3(0,0,1),new V3(0,0,1),new V3(0,0,1)]}, uCarveU:{value:[new V3(0,1,0),new V3(0,1,0),new V3(0,1,0)]}, uCarveR:{value:[new THREE.Vector2(1,1),new THREE.Vector2(1,1),new THREE.Vector2(1,1)]}, uCarveA:{value:[new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4()]},
    uFelt:{value:fin.felt?1:0}, uFSc:{value:fin.fsc||16}, uFW:{value:fin.fw||0.075} };
  if(fiber) m.defines={FIBER:1};
  if(fin.knit && !shareU){ m.defines={KNIT:1}; Object.assign(U,{ uKW:{value:fin.kw}, uKR:{value:fin.kr}, uKC:{value:new Float32Array(64)}, uKEw:{value:new V3(1,0,0)}, uKEa:{value:new V3(0,1,0)}, uKEb:{value:new V3()}, uKEo:{value:0} }); }
  m.userData.U=U;
  m.onBeforeCompile=function(sh){
    Object.assign(sh.uniforms,U);
    sh.vertexShader = (fin.knit?'#define KNIT 1\nattribute float knitV;\nvarying float vKV,vEW;\n':'') + (fiber?'#define FIBER 1\nattribute float fTint;\nvarying float vFT;\n':'') + 'attribute vec4 paint;\nattribute float earW;\nuniform float uLen,uShells,uGrav;\nuniform vec2 uEar;\nuniform vec3 uEarP;\nvarying vec4 vPaint;\nvarying vec3 vObj;\nvarying vec3 vONrm;\nvarying vec3 vDisp;\nvarying float vH;\n'
      + 'vec3 earRot(vec3 p,float a){ float c=cos(a),s=sin(a); vec2 d=p.xy-vec2(sign(p.x)*uEarP.x,uEarP.y); return vec3(vec2(sign(p.x)*uEarP.x,uEarP.y)+vec2(d.x*c-d.y*s,d.x*s+d.y*c),p.z); }\n'
      + sh.vertexShader
      .replace('#include <beginnormal_vertex>','vec3 objectNormal = vec3( normal );\nfloat ea = earW>0.0 ? uEar.y*earW : -uEar.x*earW;\nif(abs(ea)>0.0001){ float c=cos(ea),s=sin(ea); objectNormal.xy=vec2(objectNormal.x*c-objectNormal.y*s,objectNormal.x*s+objectNormal.y*c); }')
      .replace('#include <begin_vertex>','vH = uShells>1.0 ? float(gl_InstanceID)/(uShells-1.0) : 0.0;\nvPaint=paint; vObj=position; vONrm=normal;\nvec3 transformed = abs(ea)>0.0001 ? earRot(position,ea) : position;\nfloat hh=vH*uLen; transformed += objectNormal*hh - vec3(0.0,1.0,0.0)*uGrav*hh*vH;\nvDisp=transformed;\n#ifdef KNIT\nvKV=knitV; vEW=earW;\n#endif\n#ifdef FIBER\nvFT=fTint;\n#endif');
    sh.fragmentShader = (fin.knit?'#define KNIT 1\nvarying float vKV,vEW;\nuniform float uKW,uKR,uKEo; uniform float uKC[64]; uniform vec3 uKEa,uKEb,uKEw;\n':'') + (fiber?'#define FIBER 1\nvarying float vFT;\n':'') + 'uniform float uFelt,uFSc,uFW;\nuniform float uLen,uShells,uDens,uRoot,uStray,uLenVar,uMottle,uClump,uCheeks,uAO,uRad;\nuniform vec3 cLight,cPink,cDark,cCheek;\nuniform float uCarveK;\nuniform vec3 uCarveC[3]; uniform vec3 uCarveN[3]; uniform vec3 uCarveU[3]; uniform vec2 uCarveR[3]; uniform vec4 uCarveA[3];\nvarying vec4 vPaint;\nvarying vec3 vObj;\nvarying vec3 vONrm;\nvarying vec3 vDisp;\nvarying float vH;\n'
      + 'float carve(){ float k=0.0; for(int i=0;i<3;i++){ if(float(i)>=uCarveK) break; vec3 d=vDisp-uCarveC[i], n=uCarveN[i], u=uCarveU[i], r=cross(u,n); if(dot(d,n)<-0.06) continue; vec2 q=vec2(dot(d,r),dot(d,u)); float e; vec4 A=uCarveA[i]; if(A.z>0.0){ q-=A.xy; float dd = q.y>=0.0 ? abs(length(q)-A.z) : min(length(q-vec2(A.z,0.0)),length(q+vec2(A.z,0.0))); e=dd/A.w; } else e=length(q/uCarveR[i]); k=max(k,1.0-smoothstep(0.92,1.3,e)); } return k; }\n'
      + 'uvec3 pcg3(uvec3 v){ v=v*1664525u+1013904223u; v.x+=v.y*v.z; v.y+=v.z*v.x; v.z+=v.x*v.y; v^=v>>16u; v.x+=v.y*v.z; v.y+=v.z*v.x; v.z+=v.x*v.y; return v; }\n'
      + 'vec3 h33(vec3 p){ return vec3(pcg3(uvec3(ivec3(floor(p))+ivec3(65536))))*(1.0/4294967295.0); }\n'
      + 'float vnoise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); float n=mix(mix(mix(h33(i).x,h33(i+vec3(1,0,0)).x,f.x),mix(h33(i+vec3(0,1,0)).x,h33(i+vec3(1,1,0)).x,f.x),f.y),mix(mix(h33(i+vec3(0,0,1)).x,h33(i+vec3(1,0,1)).x,f.x),mix(h33(i+vec3(0,1,1)).x,h33(i+vec3(1,1,1)).x,f.x),f.y),f.z); return n; }\n'
      + 'float strand(vec3 q,vec3 n,float h,out float tip){ vec3 c=floor(q); vec3 r=h33(c); vec3 d=fract(q)-0.5-(r-0.5)*0.42; d-=dot(d,n)*n; float len=1.0-uLenVar*r.z; tip=h/len; if(h>len) return 0.0; float rad=uRad*pow(max(0.0,1.0-h/len),0.55); return 1.0-smoothstep(rad*0.7,rad,length(d)); }\n'
      // felt: one short fibre per cell lying along the surface in a random direction, slightly bent, arching up in the
      // middle. h in [0,1] is the shell height; returns coverage, tint (per fibre) and how high the fibre arches here
      + 'float feltFib(vec3 q,vec3 n,float h,float w,float seed,inout float tint){ vec3 b=floor(q-0.5); float best=0.0; for(int i=0;i<8;i++){ vec3 c=b+vec3(float(i&1),float((i>>1)&1),float((i>>2)&1)); vec3 r=h33(c+seed), r2=h33(c+seed+17.0); vec3 t=r2-0.5; t-=dot(t,n)*n; float tl=length(t); if(tl<0.04) continue; t/=tl; vec3 bn=cross(n,t); vec3 d=q-(c+0.5+(r-0.5)*0.3); d-=dot(d,n)*n; float hl=0.55+0.3*r.z; float s=dot(d,t), u=s/hl; if(abs(u)>1.0) continue; float arch=(1.0-u*u)*(0.25+0.75*r.x*r.x); if(h>arch) continue; float off=dot(d,bn)-(r2.z-0.5)*0.5*(u*u-0.33)*hl; float wd=w*(1.0-0.45*h); float a=1.0-smoothstep(wd*0.55,wd,abs(off)); if(a>best){ best=a; tint=r2.x; } } return best; }\n'
      // knit: (row, column) on the body from the crown distance + azimuth, on ears from their own axis. each row has a
      // whole number of stitches so the pattern closes around. a stitch is a V of two plump twisted yarn legs
      + (fin.knit ? '#ifdef KNIT\nfloat legH(vec2 c,vec2 a,vec2 b,float w,inout float ply,inout vec2 gr){ vec2 ab=b-a; float t=clamp(dot(c-a,ab)/dot(ab,ab),0.0,1.0); vec2 d=c-(a+ab*t); float wt=w*(0.72+0.28*sin(3.1416*t)); float r=length(d)/wt; if(r>=1.0) return 0.0; float h=sqrt(1.0-r*r); float side=sign(d.x*ab.y-d.y*ab.x)*r; ply=sin((t*length(ab)*3.2-side*0.55)*6.2832); gr=-(r/max(h,0.22))*normalize(d+1e-6)/wt; float te=min(t,1.0-t); if(te<0.18){ float k=te/0.18; h*=sqrt(k*(2.0-k)); } return h; }\n'
      + 'float knitH(out float ply,out float st,out vec2 gr,out vec2 kq,out float ks){ vec3 p=vObj; float v,phi,circ,u0=-1e9; gr=vec2(0.0); ks=1.0; ply=0.0; st=0.5; if(abs(vEW)>0.5){ vec3 ax=uKEa, b=uKEb; if(p.x<0.0){ ax.x=-ax.x; b.x=-b.x; } vec3 d=p-b; v=dot(d,ax)-uKEo; vec3 e1=uKEw; if(p.x<0.0) e1.x=-e1.x; phi=0.0; circ=0.0; ks=0.8; v/=ks; u0=dot(d,e1)/(uKW*ks); } else { v=vKV; phi=atan(p.x,p.z); circ=uKC[clamp(int(floor(v/uKR)),0,63)]; }\n'
      + ' float rowf=v/uKR, N=circ<30.0*uKW ? max(5.0,floor(circ/uKW+0.5)) : 6.0*floor(circ/(6.0*uKW)+0.5), u=u0>-1e8?u0:(phi/6.2831853+0.5)*N; kq=vec2(u0>-1e8?u0:phi, rowf); vec2 c=vec2(fract(u),fract(rowf)); st=h33(vec3(floor(u),floor(rowf),abs(vEW)>0.5?7.0:3.0)).x;\n'
      + ' float p1=0.0,p2=0.0; vec2 g1=vec2(0.0),g2=vec2(0.0); float hl=legH(c,vec2(0.06,1.0),vec2(0.47,0.04),0.27,p1,g1), hr=legH(c,vec2(0.94,1.0),vec2(0.53,0.04),0.27,p2,g2); if(hl>=hr){ ply=p1; gr=g1; return hl; } ply=p2; gr=g2; return hr; }\n#endif\n' : '')
      + sh.fragmentShader
      .replace('void main() {','void main() {\nfloat furA=1.0, tipT=vH, fTint=0.5, fGap=1.0;\nmat3 fM=mat3(0.8165,-0.4082,-0.4082, 0.0,0.7071,-0.7071, 0.5774,0.5774,0.5774), fM2=mat3(0.0,0.8,0.6, 0.6,-0.48,0.64, 0.8,0.36,-0.48);\nfloat kH=1.0,kPly=0.0,kSt=0.5,kFz=0.0; vec2 kGr=vec2(0.0), kQ=vec2(0.0); float kS=1.0;\n#ifdef KNIT\nkH=knitH(kPly,kSt,kGr,kQ,kS); vec3 kP1=dFdx(-vViewPosition), kP2=dFdy(-vViewPosition); vec2 kQ1=dFdx(kQ), kQ2=dFdy(kQ); if(abs(kQ1.x)>3.1416) kQ1.x-=sign(kQ1.x)*6.2832; if(abs(kQ2.x)>3.1416) kQ2.x-=sign(kQ2.x)*6.2832;\n#endif\nfloat cv=uCarveK>0.0?carve():0.0;\n// fur is trimmed short around the eyes so shells never cover them\nif(vH>0.0 && vH>(1.0-cv)*1.02-0.02) discard;\n#ifdef KNIT\nif(vH>0.0){ if(kH*0.8<vH){ vec3 n=fM*normalize(vONrm); vec3 q=(fM*vObj+vec3(0.3712,0.1131,0.5377))*uDens; float t1; furA=strand(q,n,vH,t1); if(furA<0.5 || h33(floor(q)+5.0).y>uStray) discard; kFz=1.0; } }\n#else\nif(vH>0.0){ vec3 n=normalize(vONrm); if(uFelt>0.5){ vec3 nf=fM*n, qf=(fM*vObj+vec3(0.3712,0.1131,0.5377))*uFSc; float a1=feltFib(qf,nf,vH,uFW,0.0,fTint); float a2=feltFib(qf*1.31+vec3(5.3,1.7,9.1),fM2*nf,vH,uFW*1.15,41.0,fTint); furA=max(a1,a2); if(furA<0.5) discard; } else { vec3 q=(mat3(0.8165,-0.4082,-0.4082, 0.0,0.7071,-0.7071, 0.5774,0.5774,0.5774)*vObj+vec3(0.3712,0.1131,0.5377))*uDens; n=mat3(0.8165,-0.4082,-0.4082, 0.0,0.7071,-0.7071, 0.5774,0.5774,0.5774)*n; if(uClump>0.5) q+= (vec3(vnoise(vObj*7.0),vnoise(vObj*7.0+7.1),vnoise(vObj*7.0+3.3))-0.5)*vH*9.0; float t1,t2; float a=strand(q,n,vH,t1); float b=strand(q*1.37+vec3(3.1,7.7,1.3),n,vH,t2); furA=max(a,b); tipT=max(t1,t2);\n if(uStray>0.0){ vec3 sc=floor(vObj*uDens*0.12); vec3 sr=h33(sc+11.0); if(sr.x<uStray*25.0){ float tt; furA=max(furA, strand(q*0.12,n,vH*0.22,tt)); } }\n if(furA<0.5) discard; } }\n#endif\n#ifdef FIBER\nfTint=vFT; if(uCarveK>0.0 && carve()>0.02) discard;\n#else\nif(vH==0.0 && uFelt>0.5){ vec3 nf=fM*normalize(vONrm), qf=(fM*vObj+vec3(0.3712,0.1131,0.5377))*uFSc; float t0=0.5; float a1=feltFib(qf,nf,0.0,uFW*1.1,0.0,t0); float a2=feltFib(qf*1.31+vec3(5.3,1.7,9.1),fM2*nf,0.0,uFW*1.25,41.0,t0); float t3=0.5; float a3=feltFib(qf*2.3+vec3(2.2,8.1,4.4),nf,0.0,uFW*1.3,73.0,t3); fGap=max(max(a1,a2),a3*0.7); fTint=max(a1,a2)>0.3?t0:t3; }\n#endif')
      .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n#ifdef KNIT\n// yarn relief: tilt the normal by the analytic slope of the stitch tube, in the surface frame of (column,row) built from screen derivatives\nif(kFz<0.5 && kH>0.0){ vec3 dp2p=cross(kP2,normal), dp1p=cross(normal,kP1); vec3 T=dp2p*kQ1.x+dp1p*kQ2.x, B=dp2p*kQ1.y+dp1p*kQ2.y; if(dot(T,T)>1e-20 && dot(B,B)>1e-20){ T=normalize(T); B=normalize(B); float hw=uLen*0.8; vec2 sl=clamp(vec2(hw*kGr.x/(uKW*kS), hw*kGr.y/(uKR*kS)),-1.7,1.7); normal=normalize(normal-T*sl.x-B*sl.y); } }\n#endif')
      .replace('#include <color_fragment>','#include <color_fragment>\nvec3 col=diffuseColor.rgb; col=mix(col,cLight,vPaint.x); col=mix(col,cPink,vPaint.y); col=mix(col,cDark,vPaint.z); col=mix(col,cCheek,vPaint.w*uCheeks*0.8);\nif(uMottle>0.0) col*=1.0+uMottle*((vnoise(vObj*16.0)-0.5)*1.4+(vnoise(vObj*70.0)-0.5)*1.2);\nif(uFelt>0.5){ col*=1.0+uMottle*1.5*(fTint-0.5); if(fTint>0.93) col*=1.1; col*=mix(0.86,1.0,fGap); }\nfloat ao=mix(0.55,1.0,smoothstep(0.0,0.42,vObj.y))*uAO+(1.0-uAO);\nfloat hh2=max(vH,cv*0.85);\n#ifdef KNIT\nhh2 = kFz>0.5 ? 1.0 : max(vH/0.8, cv*0.85); col*=(0.95+0.1*kSt)*(0.92+0.08*kPly); if(vH==0.0) col*=mix(0.68,1.0,cv);\n#endif\n#ifdef FIBER\nhh2=1.0;\n#endif\ncol*=mix(uRoot,1.0,pow(clamp(hh2,0.0,1.0),0.7))*ao;\ndiffuseColor.rgb=col;');
  };
  m.customProgramCacheKey=function(){ return fiber?'amfur3f':(fin.knit?'amfur3k':'amfur3'); };
  return m;
}
/* ---------- shared renderer + environment ---------- */
var R=null, ENV=null;
function renderer(){
  if(R) return R;
  var cv=document.createElement('canvas');
  R=new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true, preserveDrawingBuffer:true, powerPreference:'high-performance'});
  R.setPixelRatio(1); R.setClearColor(0x000000,0); R.toneMapping=THREE.NeutralToneMapping; R.toneMappingExposure=1.0; R.outputColorSpace=THREE.SRGBColorSpace;
  R.shadowMap.enabled=true; R.shadowMap.type=THREE.VSMShadowMap;
  // a soft studio: big white softboxes around a grey room
  var env=new THREE.Scene(), box=new THREE.BoxGeometry(1,1,1), room=new THREE.Mesh(box,new THREE.MeshBasicMaterial({color:0x8a8a8a,side:THREE.BackSide}));
  room.scale.set(14,10,14); room.position.y=3; env.add(room);
  function panel(x,y,z,sx,sy,sz,i){ var m=new THREE.Mesh(box,new THREE.MeshBasicMaterial({color:new THREE.Color(i,i,i)})); m.position.set(x,y,z); m.scale.set(sx,sy,sz); env.add(m); }
  panel(-3.5,5,3.5, 3,0.1,3, 9); panel(4,3,2, 0.1,3,3, 3.2); panel(0,7.9,0, 5,0.1,5, 4); panel(0,2,-6.9, 6,3,0.1, 2.2); panel(-6.9,2,-1, 0.1,2,4, 1.6); panel(0,-1.9,0, 14,0.1,14, 1.1);
  var pm=new THREE.PMREMGenerator(R); ENV=pm.fromScene(env,0.03).texture; pm.dispose();
  return R;
}
// light mode for phones, see AgentMascot.lite
function LITE(){ return !!(window.AgentMascot && window.AgentMascot.lite); }
function hexToColor(h){ return new THREE.Color(h); }
/* ---------- a mascot view ---------- */
function View(){
  var r=renderer(), sc=new THREE.Scene(); this.scene=sc; sc.environment=ENV; sc.environmentIntensity=0.85;
  var cam=new THREE.PerspectiveCamera(20,1,0.1,50); this.cam=cam;
  var key=new THREE.DirectionalLight(0xffffff,1.5); key.position.set(-0.7,6,1.5); key.castShadow=true; var lt=LITE(); key.shadow.mapSize.set(lt?512:1024,lt?512:1024);
  var s=key.shadow.camera; s.left=-2.2; s.right=2.2; s.top=2.2; s.bottom=-2.2; s.near=1; s.far=12; key.shadow.radius=lt?7:14; key.shadow.blurSamples=lt?8:20; key.shadow.bias=-0.0004; sc.add(key); this.key=key;
  var rim=new THREE.DirectionalLight(0xffffff,0.9); rim.position.set(2.8,2.6,-3.2); sc.add(rim);
  var fill=new THREE.DirectionalLight(0xfff4ea,0.35); fill.position.set(3,1.2,3); sc.add(fill);
  this.root=new THREE.Group(); sc.add(this.root); this.body=new THREE.Group(); this.root.add(this.body);
  // floor: soft directional shadow + an analytic contact shadow, both transparent
  var fl=new THREE.Mesh(new THREE.PlaneGeometry(8,8), new THREE.ShadowMaterial({opacity:0.07})); fl.rotation.x=-Math.PI/2; fl.receiveShadow=true; sc.add(fl); this.floor=fl;
  this.contact=new THREE.Mesh(new THREE.PlaneGeometry(1,1), new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uOp:{value:0.5},uCol:{value:new THREE.Color(0x2a2140)}},
    vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader:'uniform float uOp; uniform vec3 uCol; varying vec2 vUv; void main(){ vec2 p=(vUv-0.5)*2.0; float r=dot(p,p); float a=exp(-r*9.0)*0.55+exp(-r*3.2)*0.45; gl_FragColor=vec4(uCol,a*uOp); }'}));
  this.contact.rotation.x=-Math.PI/2; this.contact.position.y=0.002; sc.add(this.contact);
  this.eyeMat=new THREE.MeshPhysicalMaterial({color:0x0c0b10, roughness:0.16, clearcoat:1, clearcoatRoughness:0.06});
  this.lightEyeMat=new THREE.MeshPhysicalMaterial({color:0xf4f1ea, roughness:0.16, clearcoat:1, clearcoatRoughness:0.06});
  this.whiteMat=new THREE.MeshPhysicalMaterial({color:0xfbfaf6, roughness:0.3, clearcoat:0.6, clearcoatRoughness:0.15});
  this.noseMat=new THREE.MeshPhysicalMaterial({color:0x1a1416, roughness:0.28, clearcoat:0.8, clearcoatRoughness:0.12});
  this.beakMat=new THREE.MeshPhysicalMaterial({color:0xff9a2e, roughness:0.45, sheen:0.4, sheenColor:new THREE.Color(1,0.8,0.5)});
  this.cfg={};
}
View.prototype.set=function(c){
  var C=this.cfg, rebuild=c.shape!==C.shape || c.material!==C.material, reeyes=rebuild || c.eyes!==C.eyes;
  if(rebuild){ var self=this; if(this.mat) this.mat.dispose(); if(this.fibMat){ this.fibMat.dispose(); this.fibMat=null; } this.body.clear(); this.eyesG=null; var D=shapeData(c.shape), S=SH[c.shape], fin=FIN[c.material]||FIN.fluffy;
    this.D=D; this.S=S; this.fin=fin;
    var mat=furMaterial(fin); this.mat=mat;
    if(fin.knit){ if(!D.knit) D.knit=knitField(D,S,fin.kr); var KU=mat.userData.U; KU.uKC.value.set(D.knit.cb); if(D.knit.ear){ KU.uKEa.value.copy(D.knit.ear.ax); KU.uKEw.value.copy(D.knit.ear.wd); KU.uKEb.value.copy(D.knit.ear.base); KU.uKEo.value=D.knit.ear.off; } } var ns=LITE()?Math.max(8,Math.round(fin.shells*0.6)):fin.shells; mat.userData.U.uShells.value=ns; var im=new THREE.InstancedMesh(D.geo,mat,ns); var I=new THREE.Matrix4(); for(var i=0;i<ns;i++) im.setMatrixAt(i,I);
    im.castShadow=false; im.frustumCulled=false; this.body.add(im); this.fur=im;
    if(fin.fly){ var fk='fly:'+fin.fly; if(!D[fk]) D[fk]=flyaways(D,fin.fly,7+c.shape.length*131); this.fibMat=furMaterial(fin,mat.userData.U,true); var fm=new THREE.Mesh(D[fk],this.fibMat); fm.frustumCulled=false; this.body.add(fm); }
    // one cheap caster for the shadow map instead of every shell
    if(!this.casterMat) this.casterMat=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}); var cst=new THREE.Mesh(D.geo,this.casterMat); cst.castShadow=true; cst.renderOrder=-1; this.body.add(cst);
    if(S.ear) mat.userData.U.uEarP.value.set(S.ear[0],S.ear[1],S.ear[2]);
    this.contact.scale.set(D.foot*2.5,D.foot*2.1,1);
    // nose / beak
    this.noseA=null; if(S.nose && S.nose.kind==='black'){ var nr=S.nose.r||0.07, NA=this._anchor(0,S.nose.y,1); NA.p.x=0; var n=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),this.noseMat); var nf=this._pile()+0.03; n.scale.set(nr*1.25,nr*0.85,(nf+0.03)/2+nr*0.2); n.position.copy(NA.p).addScaledVector(NA.n,(nf-0.03)/2); n.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new V3(1,0,0),NA.u,NA.f)); this.body.add(n); this.noseA={A:NA,r:nr}; }
    if(S.beak){ var pb=D.probe(0,S.beak.y), b=new THREE.Mesh(new THREE.ConeGeometry(0.075,0.16,24),this.beakMat); b.position.copy(pb.p).addScaledVector(pb.n,0.05+fin.len*0.6); b.quaternion.setFromUnitVectors(new V3(0,1,0),pb.n); this.body.add(b); }
  }
  if(reeyes) this._eyes(c);
  if(rebuild || (c.acc||'none')!==(C.acc||'none')) this._acc(c.acc||'none');
  if(this._accm) this._accColor(c.accColor);
  this.cfg=Object.assign({},c);
  this._colors(c);
};
/* a symmetric anchor on the face: raycast the right side, mirror it for the left.
   frame: f leans the surface normal toward the viewer so both eyes face forward the same way,
   u is world-up made perpendicular to f (no roll), r = u x f */
View.prototype._anchor=function(x,y,side){
  var pr=this.D.probe(Math.abs(x),y); if(!pr) pr={p:new V3(Math.abs(x),y,0.5),n:new V3(0,0,1)};
  var p=pr.p.clone(), n=pr.n.clone(); p.x*=side; n.x*=side;
  var f=n.clone().add(new V3(0,0,0.7)).normalize(), u=new V3(0,1,0).addScaledVector(f,-f.y).normalize(), r=new V3().crossVectors(u,f);
  return {p:p, n:n, f:f, u:u, r:r, q:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r,u,f))};
};
// height of the fur pile at rest (shell length, a little less where gravity bends it)
View.prototype._pile=function(){ var f=this.fin; return f.len*(1-0.35*f.grav); };
View.prototype._eyes=function(c){
  if(this.eyesG) this.body.remove(this.eyesG); var g=new THREE.Group(); this.eyesG=g; this.body.add(g); this.eyeL=[];
  var S=this.S, D=this.D, self=this, pile=this._pile(), U=this.mat.userData.U, K=0;
  var cap=c.eyes==='capsule', sph=new THREE.SphereGeometry(1,48,28);
  var front=pile+0.032, back=-0.03, ez=(front-back)/2;           // bead spans from inside the body to just above the pile
  var arcR=cap?0.075:0.085, arcT=0.026, arcG=new THREE.TorusGeometry(arcR,arcT,16,48,Math.PI), capG=new THREE.SphereGeometry(1,16,12);
  var chevG=new THREE.CapsuleGeometry(0.028,0.075,8,16);
  var ring=S.darkEyes && !this._darkBody;
  [-1,1].forEach(function(side){
    var e={side:side, g:new THREE.Group()}; g.add(e.g);
    if(S.googly){ var G=S.googly, A=self._anchor(G.x,G.y,side);
      e.g.position.copy(A.p).addScaledVector(A.f,-G.r*0.3+pile*0.5); e.g.quaternion.copy(A.q);
      var wm=new THREE.Mesh(sph,self.whiteMat); wm.scale.setScalar(G.r); e.g.add(wm); e.white=wm;
      var pu=new THREE.Mesh(sph,self.eyeMat); pu.scale.set(G.r*0.56,G.r*0.56,G.r*0.3); pu.position.z=G.r*0.86; e.g.add(pu); e.eye=pu; e.R=G.r; e.googly=true;
      e.top=G.r*1.0; e.carve=[A,G.r*1.05,G.r*1.05]; }
    else { var A=self._anchor(S.eyes[0],S.eyes[1],side); e.g.position.copy(A.p); e.g.quaternion.copy(A.q);
      var rx=cap?0.082:0.118, ry=cap?0.15:0.124;
      var m=new THREE.Mesh(sph,self.eyeMat); m.scale.set(rx,ry,ez); m.position.z=(front+back)/2; e.g.add(m); e.eye=m; e.base=m.scale.clone();
      if(ring){ var wr=new THREE.Mesh(sph,self.whiteMat); wr.scale.set(rx*1.32,ry*1.3,ez*0.92); wr.position.z=(front+back)/2-0.012; e.g.add(wr); e.ring=wr; }
      e.top=front; var k=ring?1.3:1.0; e.carve=[A,rx*k,ry*k]; }
    // happy: a raised glossy arc; error: a chevron pointing outward like the SVG (< >)
    var fm=ring?self.lightEyeMat:self.eyeMat; var arc=new THREE.Group(); arc.add(new THREE.Mesh(arcG,fm)); [-1,1].forEach(function(t){ var cp=new THREE.Mesh(capG,fm); cp.scale.setScalar(arcT); cp.position.x=t*arcR; arc.add(cp); }); arc.position.set(0,-0.035,e.top-arcT*0.35); arc.visible=false; e.g.add(arc); e.arc=arc; e.arcC=[0,arc.position.y,arcR,arcT];
    var ch=new THREE.Group(), L=0.075+0.028*2, phi=0.62, tip=side*0.045;
    [1,-1].forEach(function(sg){ var m=new THREE.Mesh(chevG,fm);
      var hl=L*0.5-0.028; m.position.set(tip - side*Math.cos(phi)*hl, sg*Math.sin(phi)*hl, 0);   // arm runs from the outer tip toward the face centre
      m.rotation.z=Math.atan2(side*Math.cos(phi), sg*Math.sin(phi)); ch.add(m); });
    ch.position.z=e.top-0.028*0.4; ch.visible=false; e.g.add(ch); e.chev=ch;
    var C=e.carve, A2=C[0]; U.uCarveC.value[K].copy(A2.p); U.uCarveN.value[K].copy(A2.f); U.uCarveU.value[K].copy(A2.u); U.uCarveR.value[K].set(C[1],C[2]); e.k=K; K++;
    self.eyeL.push(e);
  });
  if(this.noseA){ var N=this.noseA; U.uCarveC.value[K].copy(N.A.p); U.uCarveN.value[K].copy(N.A.f); U.uCarveU.value[K].copy(N.A.u); U.uCarveR.value[K].set(N.r*1.45,N.r*1.15); K++; }
  U.uCarveK.value=K;
};
/* accessories: a felt beret, round glasses, sunglasses */
// each view owns its accessory materials so every mascot can wear its own accessory colour
function accMats(){
  var beret=furMaterial({shells:12,len:0.018,dens:300,grav:0.0,root:0.82,sheen:0.22,sheenR:0.7,rough:1.0,stray:0.02,lenVar:0.5,mottle:0.08,rad:0.42}); beret.color.set(0x1c1b21); beret.sheenColor.set(0x6b6a78); beret.sheen=0.6; beret.sheenRoughness=0.55;
  var U=beret.userData.U; U.uAO.value=0; U.uRoot.value=0.75;
  return { beret:beret, frame:new THREE.MeshPhysicalMaterial({color:0x111014, roughness:0.22, clearcoat:1, clearcoatRoughness:0.1}),
    lens:new THREE.MeshPhysicalMaterial({color:0x050507, roughness:0.05, metalness:0.2, clearcoat:1, clearcoatRoughness:0.02}) }; }
/* accessory colour: '' / null = the original near-black look; otherwise a hex. beret felt takes the dye with a soft
   lighter sheen, frames take it as glossy acetate, sunglass lenses stay dark with a faint tint of the frame */
View.prototype._accColor=function(hex){
  var M=this._accm; if(!M) return; hex=hex||''; if(M._hex===hex) return; M._hex=hex;
  if(!hex){ M.beret.color.set(0x1c1b21); M.beret.sheenColor.set(0x6b6a78); M.frame.color.set(0x111014); M.lens.color.set(0x050507); return; }
  var c=new THREE.Color(hex), W=new THREE.Color(1,1,1);
  M.beret.color.copy(c).multiplyScalar(0.92); M.beret.sheenColor.copy(c).lerp(W,0.5);
  M.frame.color.copy(c); M.lens.color.set(0x050507).lerp(c,0.025); };
function zeroAttrs(g){ var n=g.attributes.position.count; g.setAttribute('paint',new THREE.BufferAttribute(new Float32Array(n*4),4)); g.setAttribute('earW',new THREE.BufferAttribute(new Float32Array(n),1)); return g; }
View.prototype._acc=function(kind){
  if(this.accG){ this.body.remove(this.accG); this.accG=null; } if(kind==='none' || !this.S) return;
  if(!this._accm) this._accm=accMats(); var g=new THREE.Group(), S=this.S, D=this.D, M=this._accm, fin=this.fin; this.accG=g; this.body.add(g);
  if(kind==='beret'){
    // a puffy felt disc with a soft band and a little stalk, tilted like a painter's beret
    var I=new THREE.Matrix4(), sh=function(geo,n){ var m=new THREE.InstancedMesh(zeroAttrs(geo),M.beret,n); for(var i=0;i<n;i++) m.setMatrixAt(i,I); m.castShadow=true; m.frustumCulled=false; return m; };
    var b=new THREE.Group(), R=S===SH.bunny?0.46:0.6;
    var dome=sh(new THREE.SphereGeometry(1,64,32),12); dome.scale.set(R,R*0.36,R*0.97); dome.position.y=R*0.16; b.add(dome);
    var band=sh(new THREE.TorusGeometry(R*0.8,R*0.075,16,64),12); band.rotation.x=Math.PI/2; band.position.y=R*0.02; b.add(band);
    var nub=sh(new THREE.CapsuleGeometry(0.035,0.06,8,16),12); nub.position.set(0.02,R*0.52+0.03,0); nub.rotation.z=-0.3; b.add(nub);
    var hy=S.hat||D.top; b.position.set(-0.08,Math.min(D.top,hy)-0.02,0.0); b.rotation.set(0.1,0,0.24);
    if(S===SH.frog){ b.position.set(0,D.top-0.02,0.02); b.rotation.set(0.05,0,0.16); }
    if(S===SH.bunny){ b.position.set(0.0,D.top-0.1,0.04); b.rotation.set(0.16,0,0.2); }
    g.add(b); return; }
  // glasses: two rings in front of the eyes, a bridge and short temples
  var ex, ey, er, zc;
  if(S.googly){ ex=S.googly.x; ey=S.googly.y; er=S.googly.r*1.18; zc=D.probe(ex,ey).p.z+S.googly.r*0.75+this._pile()*0.5; }
  else { ex=S.eyes[0]; ey=S.eyes[1]; er=0.17; var pr=D.probe(ex,ey); zc=pr.p.z+this._pile()+0.1; }
  var ring=new THREE.TorusGeometry(er,0.024,16,64);
  [-1,1].forEach(function(sd){ var m=new THREE.Mesh(ring,M.frame); m.position.set(sd*ex,ey,zc); m.castShadow=true; g.add(m);
    if(kind==='sunglasses'){ var l=new THREE.Mesh(new THREE.SphereGeometry(er*0.97,40,20),M.lens); l.scale.z=0.16; l.position.set(sd*ex,ey,zc+0.004); g.add(l); }
    // temple arm back to the head surface
    var hx=sd*(ex+er), hp=D.probe(hx*0.98,ey); var zb=hp?hp.p.z:zc-0.3; var arm=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,Math.max(0.05,zc-zb),10),M.frame); arm.rotation.x=Math.PI/2; arm.position.set(hx,ey+0.02,(zc+zb)/2); g.add(arm); });
  var gap=ex*2-er*2, br=new THREE.Mesh(new THREE.TorusGeometry(Math.max(0.03,gap/2),0.02,10,24,Math.PI),M.frame); br.position.set(0,ey+0.01,zc); g.add(br);
};
View.prototype._colors=function(c){
  var U=this.mat.userData.U, base=hexToColor(c.color), hsl={}; base.getHSL(hsl);
  // a touch more saturation than the 2D palette, closer to dyed plush
  var b2=new THREE.Color().setHSL(hsl.h, Math.min(1,hsl.s*1.25+0.06), hsl.l*0.93);
  this.mat.color.copy(b2); var L=hsl.l, dark=L<0.2; if(this._darkBody!==dark && this.S && this.S.darkEyes){ this._darkBody=dark; this._eyes(c); } this._darkBody=dark;
  this.mat.sheenColor.copy(b2).lerp(new THREE.Color(1,1,1),0.55);
  if(this.fibMat){ this.fibMat.color.copy(b2); this.fibMat.sheenColor.copy(this.mat.sheenColor); }
  U.cLight.value.copy(b2).lerp(new THREE.Color(1,0.98,0.94), dark?0.35:0.68);
  U.cPink.value.copy(b2).lerp(new THREE.Color(1,0.5,0.62),0.7);
  U.cDark.value.copy(this.S===SH.panda ? new THREE.Color(dark?0xe9e4dc:0x1d1b22) : new THREE.Color(b2).lerp(new THREE.Color(0x5a3626),0.38));
  U.cCheek.value.copy(b2).lerp(new THREE.Color(1,0.42,0.55),0.42);
  U.uCheeks.value=c.cheeks?1:0;
  var em = (dark && this.S!==SH.panda) ? 0xf4f1ea : 0x0c0b10; this.eyeMat.color.set(em);
  this.contact.material.uniforms.uOp.value=c.shadowOp!=null?c.shadowOp:0.5;
};
/* pose: sx,sy,tilt(rad),tx,ty (world), yaw,pitch, lid, eye, expr, mode, earL, earR, gx, gy */
View.prototype.pose=function(p){
  var b=this.root; b.position.set(p.tx,p.ty,0); b.rotation.set(0,0,p.tilt); b.scale.set(p.sx,p.sy,p.sx);
  this.body.rotation.set(p.pitch,p.yaw,0);
  var U=this.mat.userData.U, amp=this.S.earAmp||0; U.uEar.value.set(p.earL*amp, -p.earR*amp);
  var self=this; this.eyeL.forEach(function(e){
    var xe=Math.max(0,Math.min(1,p.expr));
    if(e.googly){ e.eye.position.set(p.gx*e.R*0.35, -p.gy*e.R*0.3, e.R*0.86); e.eye.scale.set(e.R*0.56*p.eye, e.R*0.56*p.eye*Math.max(0.08,p.lid), e.R*0.3); e.white.scale.set(e.R,e.R*(0.7+0.3*Math.max(0.1,p.lid)),e.R); }
    else { e.eye.scale.set(e.base.x*p.eye, e.base.y*p.eye*Math.max(0.06,p.lid), e.base.z); }
    e.eye.visible = xe<0.5; if(e.white) e.white.visible=true; if(e.ring){ e.ring.visible = xe<0.5; e.ring.scale.y=e.base.y*1.3*p.eye*Math.max(0.06,p.lid); }
    e.arc.visible = xe>=0.5 && p.mode==='happy'; e.chev.visible = xe>=0.5 && p.mode==='chev';
    var sc=0.8+0.2*xe; e.arc.scale.setScalar(sc); e.chev.scale.setScalar(sc);
    // fur trim follows what is showing: the bead's footprint, the arc's band, or a small patch under the chevrons
    var cr=U.uCarveR.value[e.k], ca=U.uCarveA.value[e.k];
    if(e.googly){ ca.set(0,0,0,0); }
    else if(xe>=0.5 && p.mode==='happy'){ ca.set(0, e.arcC[1], e.arcC[2]*sc, e.arcC[3]*sc*1.6); }
    else if(xe>=0.5){ ca.set(0,0,0,0); cr.set(0.075*sc,0.07*sc); }
    else { ca.set(0,0,0,0); var bl=Math.max(0.06,p.lid)*p.eye; cr.set(e.carve[1]*p.eye, Math.max(0.02,e.carve[2]*bl)); }
  });
  var lift=Math.max(0,p.ty); this.contact.material.uniforms.uOp.value=(this.cfg.shadowOp!=null?this.cfg.shadowOp:0.5)*Math.max(0.3,1-lift*1.4);
  this.contact.position.x=p.tx*0.6;
};
View.prototype.render=function(ctx,w,h){
  var r=renderer(), cs=r.getSize(new THREE.Vector2());
  if(cs.x<w || cs.y<h) r.setSize(Math.max(cs.x,w),Math.max(cs.y,h),false);
  cs=r.getSize(new THREE.Vector2());
  var cam=this.cam; cam.aspect=w/h; var d=9.2, el=0.12, cy=0.95, half=cam.aspect>=1?1.6:1.6/cam.aspect; cam.position.set(0, cy+Math.sin(el)*d, Math.cos(el)*d); cam.lookAt(0,cy,0); cam.fov=2*Math.atan(half/d)*180/Math.PI; cam.updateProjectionMatrix();
  r.setViewport(0,cs.y-h,w,h); r.setScissor(0,cs.y-h,w,h); r.setScissorTest(true); r.clear(); r.render(this.scene,cam);
  ctx.clearRect(0,0,w,h); ctx.drawImage(r.domElement,0,0,w,h,0,0,w,h);
};
return { View:View, SHAPES:Object.keys(SH), FIN:FIN, mesh:mesh, shapeData:shapeData, ready:function(n){ return !!CACHE[n]; } };
}

/* ---------- 3D animals: three.js is imported only when an animal is first shown ---------- */
var G3={ st:0, A:null, p:null, q:[], busy:false };
var GL2=null; function hasGL2(){ if(GL2!==null) return GL2; try{ var c=document.createElement('canvas'); return GL2=!!(window.WebGL2RenderingContext && c.getContext('webgl2')); }catch(e){ return GL2=false; } }
function load3D(){ if(G3.p) return G3.p;
  if(AgentMascot.no3D || typeof AM3D!=='function' || !hasGL2()){ G3.st=-1; G3.p=Promise.reject(new Error('WebGL2 unavailable')); G3.p.catch(function(){}); return G3.p; }
  G3.p=import(AgentMascot.THREE_URL).then(function(T){ G3.A=AM3D(T); G3.st=1; return G3.A; }, function(e){ G3.st=-1; console.warn('agent-mascot: 3D animals unavailable, using the SVG fallback.', e); throw e; });
  G3.p.catch(function(){}); return G3.p; }
// meshing a shape takes a few dozen ms, so do one per task instead of freezing a page full of tiles
function needShape(name, cb){ G3.q.push([name,cb]); if(!G3.busy){ G3.busy=true; setTimeout(pump3,0); } }
function pump3(){ var it=G3.q.shift(); if(!it){ G3.busy=false; return; } try{ G3.A.shapeData(it[0]); }catch(e){ console.warn(e); } try{ it[1](); }catch(e){ console.warn(e); } setTimeout(pump3,0); }
var STAR='M0,-1C0.12,-0.12 0.12,-0.12 1,0C0.12,0.12 0.12,0.12 0,1C-0.12,0.12 -0.12,0.12 -1,0C-0.12,-0.12 -0.12,-0.12 0,-1Z';

/* ---------- shared clock + pointer ---------- */
var live = new Set(), last = 0, ptr = { x:0, y:0, t:-1e9, h:-1e9 };
function now(){ return performance.now()/1000; }
window.addEventListener('pointermove', function(e){ ptr.x=e.clientX; ptr.y=e.clientY; ptr.t=ptr.h=now(); }, { passive:true });
// last touch or click anywhere, so 3D animals draw every frame while someone is interacting (see the frame cap in _render3d)
window.addEventListener('pointerdown', function(){ ptr.h=now(); }, { passive:true });
function loop(ts){ requestAnimationFrame(loop); var t=ts/1000; var dt=last?Math.min(0.05,t-last):0; last=t; if(AgentMascot.manual) return; live.forEach(function(m){ m.step(dt); }); }
requestAnimationFrame(loop);

var uidN = 0;
function el(tag, attrs, parent){ var e=document.createElementNS('http://www.w3.org/2000/svg',tag); for(var k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; }

class AgentMascot extends HTMLElement {
  static get observedAttributes(){ return ['shape','color','material','state','eyes','cheeks','accessory','acc-color','still','seed']; }
  constructor(){
    super();
    this.uid = 'am'+(++uidN)+Math.random().toString(36).slice(2,6);
    var root = this.attachShadow({mode:'open'});
    root.innerHTML = '<style>:host{display:inline-block;width:240px;height:240px;position:relative;-webkit-tap-highlight-color:transparent}svg{width:100%;height:100%;display:block;position:relative;overflow:visible;touch-action:none;cursor:grab;user-select:none}svg:active{cursor:grabbing}</style>';
    this.cfg = { shape:'mochi', color:PALETTE.peach, material:'jelly', state:'idle', eyes:'dot', cheeks:true, accessory:'none', accColor:'ink' };
    this.t = 0; this.rand = rng(7);
    var g = GEO.mochi; this.from = Float64Array.from(g.p); this.to = Float64Array.from(g.p); this.cur = Float64Array.from(g.p);
    this.fg = { top:g.top, hw:g.hw, fy:g.fy, sp:g.sp }; this.tg = Object.assign({}, this.fg);
    this.k = { morph:1, morphV:0, s:0, sV:0, ox:0, oy:0, oxV:0, oyV:0, gx:0, gy:0, gxV:0, gyV:0, bx:0, by:0, bxV:0, byV:0,
      eye:1, eyeV:0, eL:0, eLV:0, eR:0, eRV:0, lidS:1, expr:0, exprV:0, badge:0, badgeV:0, tilt:0, tiltV:0, fl:0, flV:0 };
    this.col = hex2rgb(this.cfg.color); this.colFrom = this.col.slice(); this.colTo = this.col.slice(); this.colT = 1;
    this.blink = { next:1.4, t:-1 }; this.drift = { next:0.6, x:0, y:0 };
    this.st = { t:0, prev:'idle', shakeT:-9, hopT:0, landed:true, exprMode:'happy', exprUntil:0 };
    this.x3=0; this._vis=true; this._emaN=0; this._shOp=0.5; this._shN=0;
    this.sparks = []; this.look = null; this.drag = null;
    this._build();
  }
  connectedCallback(){ this._apply(); if(!this.hasAttribute('still')) live.add(this); this._readShadow(); this.step(0);
    var self=this; if(!this._io && window.IntersectionObserver){ this._io=new IntersectionObserver(function(es){ self._vis=es[es.length-1].isIntersecting; if(self._vis) self.step(0); }); this._io.observe(this); } }
  disconnectedCallback(){ live.delete(this); }
  get is3D(){ return !!(this.view3 && this.x3>0.5 && this._want3d()); }
  attributeChangedCallback(n,o,v){
    if(n==='still'){ if(v!==null) live.delete(this); else if(this.isConnected) live.add(this); return; }
    if(n==='seed'){ this.rand = rng(parseInt(v,10)||7); return; }
    if(this._building) return; this._apply();
  }
  _apply(){
    var a = {};
    ['shape','color','material','state','eyes','accessory'].forEach(function(k){ if(this.hasAttribute(k)) a[k]=this.getAttribute(k); }, this);
    if(this.hasAttribute('cheeks')) a.cheeks = this.getAttribute('cheeks')!=='false';
    a.accColor = this.getAttribute('acc-color')||'ink';
    this.setConfig(a, true);
  }
  get config(){ return Object.assign({}, this.cfg); }
  get state(){ return this.cfg.state; }
  setState(s){ this.setConfig({state:s}); return this; }
  setConfig(c, fromAttr){
    this._hot=now();
    var C = this.cfg, still = this.hasAttribute('still');
    var shp = c.shape && (ALIAS[c.shape] || c.shape);
    if(shp && GEO[shp] && shp!==C.shape){ C.shape=shp; this.from=Float64Array.from(this.cur); this.to=GEO[shp].p; this._buildParts(); this._paint();
      this.fgFrom=Object.assign({}, this.fg); var g=GEO[shp]; this.tg={top:g.top,hw:g.hw,fy:g.fy,sp:g.sp};
      this.k.morph=0; this.k.morphV=0; if(still){ this.k.morph=1; } else this.k.sV-=1.4; }
    if(c.color){ var hx=resolveColor(c.color); if(hx.toLowerCase()!==C.color.toLowerCase()){ C.color=hx; this.colFrom=this.col.slice(); this.colTo=hex2rgb(hx); this.colT=still?1:0; } }
    var mat=c.material && (ALIAS[c.material] || c.material);
    if(mat && ALL_MATERIALS.indexOf(mat)>=0 && mat!==C.material){ c.material=mat; C.material=c.material; this._buildMaterial(); if(!still) this.k.sV-=1.8; }
    if(c.eyes && (c.eyes==='dot'||c.eyes==='capsule')) C.eyes=c.eyes;
    if(c.cheeks!==undefined) C.cheeks=!!c.cheeks;
    if(c.accessory && ACCESSORIES.indexOf(c.accessory)>=0) C.accessory=c.accessory;
    if(c.accColor!==undefined){ var an=accColorName(c.accColor); C.accColor=an||'ink'; }
    if(c.state && STATES.indexOf(c.state)>=0 && c.state!==C.state){ this.st.prev=C.state; C.state=c.state; this._enterState(); }
    if(!fromAttr){ this._building=true; ['shape','material','state','eyes'].forEach(function(k){ this.setAttribute(k,C[k]); },this); if(C.accessory!=='none' || this.hasAttribute('accessory')) this.setAttribute('accessory',C.accessory);
      if(C.accColor!=='ink') this.setAttribute('acc-color',C.accColor); else this.removeAttribute('acc-color');
      var nm=null; for(var p in PALETTE) if(PALETTE[p].toLowerCase()===C.color.toLowerCase()) nm=p; this.setAttribute('color', nm||C.color);
      this.setAttribute('cheeks', C.cheeks?'true':'false'); this._building=false; }
    if(still || !live.has(this)) this.step(0);
    this.dispatchEvent(new CustomEvent('change',{detail:this.config}));
    return this;
  }
  poke(){ this._hot=now(); this.k.sV -= 3.2; this.k.tiltV += (this.rand()-0.5)*40; this._twitch(this.rand()<0.5?0:1, 1); this.dispatchEvent(new CustomEvent('poke')); return this; }
  _twitch(side, amt){ var k=this.k; if(side!==1) k.eLV -= 26*amt; if(side!==0) k.eRV -= 26*amt*(side===2?0.8:1); }
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
    var sh=grad('radialGradient','shadow',{},2); sh.children[0].setAttribute('offset','0'); sh.children[0].setAttribute('stop-color','#2a2140'); sh.children[0].setAttribute('stop-opacity','.2'); sh.children[0].setAttribute('style','stop-color:var(--am-shadow,#2a2140);stop-opacity:var(--am-shadow-opacity,.2)');
    sh.children[1].setAttribute('offset','1'); sh.children[1].setAttribute('stop-color','#2a2140'); sh.children[1].setAttribute('stop-opacity','0');
    [2,4,8,13,20].forEach(function(b){ var f=el('filter',{id:U+'-b'+b,x:'-60%',y:'-60%',width:'220%',height:'220%'},defs); el('feGaussianBlur',{stdDeviation:b*0.5},f); });
    var fz=el('filter',{id:U+'-fuzz',x:'-15%',y:'-15%',width:'130%',height:'130%'},defs);
    el('feTurbulence',{type:'fractalNoise',baseFrequency:'.9',numOctaves:'2',seed:'4',result:'n'},fz);
    el('feDisplacementMap',{'in':'SourceGraphic',in2:'n',scale:'5',xChannelSelector:'R',yChannelSelector:'G'},fz);
    this._fabricDefs(defs);
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
    this.gBack=el('g',{},this.gSkin);
    this.base=el('path',{'class':'bp'},this.gSkin);
    this.gPatch=el('g',{'clip-path':'url(#'+U+'-clip)'},this.gSkin);
    this.gMat=el('g',{'clip-path':'url(#'+U+'-clip)'},this.gSkin);
    this.gFront=el('g',{},this.gSkin);
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
    this.bps=[]; this.parts=null; this.partsOld=null;
    this.shadowRoot.appendChild(svg);
    this._buildParts();
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
    if(FABRICS.indexOf(m)>=0){
      M.lt=mk('path',{'class':'bp',fill:'none',stroke:'#fff','stroke-width':'30',opacity:m==='knit'?'.34':'.4',filter:B(13),transform:'translate(-9 -11)'});
      M.dk=mk('path',{'class':'bp',fill:'none','stroke-width':'34',opacity:'.3',filter:B(13),transform:'translate(9 13)'});
      if(m==='fluffy') M.sheen=mk('path',{'class':'bp',fill:'none','stroke-width':'10',opacity:'.5',filter:B(8)});
      this.gSkin.setAttribute('filter','url(#'+U+'-'+(m==='felt'?'felt':m==='knit'?'knit':'plush')+'F)');
    }
    this.bps=Array.prototype.slice.call(this.svg.querySelectorAll('.bp'));
    this._partsMaterial(this.parts); this._partsMaterial(this.partsOld);
    this._paint(true);
  }
  /* ---------- fabric finishes, SVG fallback (no WebGL, or while three.js loads) ---------- */
  _fabricDefs(defs){
    var U=this.uid, F=function(id,x){ return el('filter',{id:U+'-'+id,x:x||'-20%',y:x||'-20%',width:'140%',height:'140%','color-interpolation-filters':'sRGB'},defs); };
    function light(f,inp,ss,az,elv,res){ var l=el('feDiffuseLighting',{'in':inp,surfaceScale:ss,diffuseConstant:'1','lighting-color':'#fff',result:res},f); el('feDistantLight',{azimuth:az,elevation:elv},l); }
    // felt: matted wool. wiggly fibre ridges as a soft bump map, a stray-fibre halo and a slightly lumpy edge
    var f=F('feltF','-12%');
    el('feTurbulence',{type:'fractalNoise',baseFrequency:'.05',numOctaves:'2',seed:'3',result:'lump'},f);
    el('feTurbulence',{type:'turbulence',baseFrequency:'.42',numOctaves:'2',seed:'7',result:'fib'},f);
    el('feGaussianBlur',{'in':'fib',stdDeviation:'.35',result:'fibs'},f);
    el('feDisplacementMap',{'in':'SourceGraphic',in2:'lump',scale:'5',xChannelSelector:'R',yChannelSelector:'G',result:'s0'},f);
    el('feDisplacementMap',{'in':'s0',in2:'fib',scale:'3',xChannelSelector:'R',yChannelSelector:'G',result:'s1'},f);
    light(f,'fibs','1.1','235','62','lit');
    el('feComposite',{'in':'s1',in2:'lit',operator:'arithmetic',k1:'.52',k2:'.54',k3:'0',k4:'0',result:'tx'},f);
    el('feComposite',{'in':'tx',in2:'s1',operator:'in',result:'body'},f);
    el('feTurbulence',{type:'turbulence',baseFrequency:'1.3',numOctaves:'1',seed:'11',result:'hf'},f);
    el('feDisplacementMap',{'in':'body',in2:'hf',scale:'7',xChannelSelector:'R',yChannelSelector:'B',result:'halo'},f);
    el('feGaussianBlur',{'in':'halo',stdDeviation:'.4',result:'halob'},f);
    el('feColorMatrix',{'in':'halob',type:'matrix',values:'1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .5 0',result:'haloA'},f);
    var mg=el('feMerge',{},f); el('feMergeNode',{'in':'haloA'},mg); el('feMergeNode',{'in':'body'},mg);
    // knit: yarn stitches. a stretched cellular bump in rows of little loops, lit from the top left, slightly lumpy edge
    f=F('knitF','-10%');
    el('feTurbulence',{type:'fractalNoise',baseFrequency:'.05',numOctaves:'1',seed:'4',result:'lump'},f);
    el('feTurbulence',{type:'turbulence',baseFrequency:'.16 .24',numOctaves:'1',seed:'9',result:'st'},f);
    el('feGaussianBlur',{'in':'st',stdDeviation:'.5',result:'sts'},f);
    el('feDisplacementMap',{'in':'SourceGraphic',in2:'lump',scale:'4',xChannelSelector:'R',yChannelSelector:'G',result:'s0'},f);
    el('feDisplacementMap',{'in':'s0',in2:'st',scale:'2.5',xChannelSelector:'R',yChannelSelector:'G',result:'s1'},f);
    light(f,'sts','2.2','235','55','lit');
    el('feComposite',{'in':'s1',in2:'lit',operator:'arithmetic',k1:'.6',k2:'.46',k3:'0',k4:'0',result:'tx'},f);
    el('feComposite',{'in':'tx',in2:'s1',operator:'in',result:'body'},f);
    mg=el('feMerge',{},f); el('feMergeNode',{'in':'body'},mg);
    // fluffy (filter id plushF): soft fur. a smooth velvety pile, clumped edge and a long soft fringe
    f=F('plushF','-15%');
    el('feTurbulence',{type:'fractalNoise',baseFrequency:'.14',numOctaves:'2',seed:'5',result:'clump'},f);
    el('feTurbulence',{type:'fractalNoise',baseFrequency:'.9 .35',numOctaves:'2',seed:'2',result:'pile'},f);
    el('feGaussianBlur',{'in':'pile',stdDeviation:'.6',result:'piles'},f);
    el('feTurbulence',{type:'turbulence',baseFrequency:'1.1',numOctaves:'2',seed:'8',result:'hair'},f);
    el('feDisplacementMap',{'in':'SourceGraphic',in2:'clump',scale:'8',xChannelSelector:'R',yChannelSelector:'G',result:'s0'},f);
    el('feDisplacementMap',{'in':'s0',in2:'hair',scale:'5',xChannelSelector:'R',yChannelSelector:'G',result:'s1'},f);
    light(f,'piles','.9','240','64','lit');
    el('feComposite',{'in':'s1',in2:'lit',operator:'arithmetic',k1:'.38',k2:'.68',k3:'0',k4:'0',result:'tx'},f);
    el('feComposite',{'in':'tx',in2:'s1',operator:'in',result:'body'},f);
    el('feDisplacementMap',{'in':'s0',in2:'hair',scale:'18',xChannelSelector:'G',yChannelSelector:'R',result:'fr'},f);
    el('feGaussianBlur',{'in':'fr',stdDeviation:'1.6',result:'frb'},f);
    el('feColorMatrix',{'in':'frb',type:'matrix',values:'1 0 0 0 .05  0 1 0 0 .05  0 0 1 0 .05  0 0 0 .75 0',result:'fringe'},f);
    mg=el('feMerge',{},f); el('feMergeNode',{'in':'fringe'},mg); el('feMergeNode',{'in':'body'},mg);
    // gradients for parts (ears, tails, patches)
    var self=this; ['pB','pD','pI','pL'].forEach(function(k){ var g=el('radialGradient',{id:U+'-'+k,cx:'.36',cy:'.3',r:'.9'},defs); for(var i=0;i<3;i++) el('stop',{},g); self['g'+k]=g; });
    this.gFab=el('radialGradient',{id:U+'-fab',cx:'.38',cy:'.3',r:'.92'},defs); for(var i=0;i<3;i++) el('stop',{},this.gFab);
  }
  /* ---------- animal parts ---------- */
  _buildParts(){
    var spec=PARTS[this.cfg.shape], U=this.uid, self=this;
    if(this.partsOld) this._dropParts(this.partsOld);
    this.partsOld=this.parts; this.parts=null;
    if(this.hasAttribute('still') && this.partsOld){ this._dropParts(this.partsOld); this.partsOld=null; }
    if(!spec) return;
    var items=[];
    spec.forEach(function(q){
      var sides = (q.single || q.face && !q.eye || q.abs) ? [q.right?1:0] : [-1,1];
      sides.forEach(function(side){
        var host = q.L==='back'?self.gBack : q.L==='front'?self.gFront : self.gPatch;
        var g=el('g',{},host), it={q:q, side:side, g:g};
        var d = q.d || (q.kind==='nose'?NOSE : q.kind==='beak'?BEAK : null);
        if(q.kind==='bump'){ it.p=el('circle',{r:q.r},g); it.tex=el('circle',{r:q.r,opacity:'0'},g); }
        else if(q.kind==='oval' || q.kind==='eyepatch'){ it.p=el('ellipse',{},g); }
        else { it.p=el('path',{d:d},g); }
        if(q.inner) it.inner=el('path',{d:q.inner},g);
        if(!q.face && !q.eye && !q.abs) it.tex=el('path',{d:d, opacity:'0'},g);
        items.push(it);
      });
    });
    this.parts={shape:this.cfg.shape, items:items};
    this._partsMaterial(this.parts);
  }
  _dropParts(P){ if(!P) return; P.items.forEach(function(it){ it.g.remove(); }); }
  _partsMaterial(P){
    if(!P) return; var m=this.cfg.material, U=this.uid, fab=FABRICS.indexOf(m)>=0;
    P.items.forEach(function(it){
      if(it.tex) it.tex.setAttribute('opacity','0');
    });
    P.fab=fab;
  }
  _partsPaint(P){
    if(!P) return; var R=this.pcol, U=this.uid, fill=this.base.getAttribute('fill'), fo=this.base.getAttribute('fill-opacity');
    P.items.forEach(function(it){ var c=it.q.col||'base';
      var f = c==='base' ? (P.fab?'url(#'+U+'-pB)':fill) : c==='dark' ? 'url(#'+U+'-pD)' : c==='light' ? 'url(#'+U+'-pL)' : R[c];
      it.p.setAttribute('fill',f); it.p.setAttribute('fill-opacity', c==='base'&&!P.fab?fo:'1');
      if(it.q.op) it.p.setAttribute('opacity',it.q.op);
      if(it.inner) it.inner.setAttribute('fill','url(#'+U+'-pI)');
    });
  }
  _paint(){
    var c=this.col, m=this.cfg.material, ink=[38,26,66];
    var L=lum(c), light=rgb2hex(mixc(c,[255,255,255],0.5)), shade=rgb2hex(mixc(c,ink,0.3)), deep=rgb2hex(mixc(c,ink,0.5)), base=rgb2hex(c);
    var dark=L<(ANIMALS.indexOf(this.cfg.shape)>=0?0.06:0.18);
    this.eyeCol = dark ? '#FFFFFF' : '#1E1C24'; this.dark=dark; this.roles={light:light,shade:shade,deep:deep,base:base};
    var st=function(g,cols){ for(var i=0;i<cols.length;i++){ g.children[i].setAttribute('offset',cols[i][0]); g.children[i].setAttribute('stop-color',cols[i][1]); if(cols[i][2]!=null) g.children[i].setAttribute('stop-opacity',cols[i][2]); } };
    st(this.gSoft,[[0,rgb2hex(mixc(c,[255,255,255],dark?0.22:0.42))],[0.55,base],[1,rgb2hex(mixc(c,ink,dark?0.1:0.2))]]);
    var sat=hueShift(c,0,0.12,0);
    st(this.gJelly,[[0,rgb2hex(mixc(sat,[255,255,255],0.3))],[0.5,rgb2hex(sat)],[1,rgb2hex(mixc(hueShift(c,-6,0.18,0),ink,0.24))]]);
    st(this.gVel,[[0,rgb2hex(mixc(c,ink,dark?0:0.16))],[0.7,base],[1,rgb2hex(mixc(c,[255,255,255],0.18))]]);
    st(this.gClay,[[0,rgb2hex(mixc(c,[255,255,255],0.12))],[1,base]]);
    var fab=FABRICS.indexOf(m)>=0;
    st(this.gFab,[[0,rgb2hex(mixc(c,[255,252,246],dark?0.16:0.3))],[0.58,base],[1,rgb2hex(mixc(c,ink,dark?0.12:0.24))]]);
    var fill = fab?'url(#'+this.uid+'-fab)': m==='soft'?'url(#'+this.uid+'-soft)': m==='jelly'?'url(#'+this.uid+'-jelly)': m==='velvet'?'url(#'+this.uid+'-velvet)': m==='clay'?'url(#'+this.uid+'-clay)': m==='glass'?rgb2hex(mixc(c,[255,255,255],0.45)):base;
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
    this.shadow.setAttribute('opacity', m==='clay'||fab?'1.35':m==='glass'?'.6':'1');
    // animal part colours
    var shp=this.cfg.shape, hh=rgb2hsl(c), warm=[96,58,44];
    var dk = shp==='panda' ? (dark?[236,232,226]:[50,48,56]) : dark ? mixc(c,[255,255,255],0.22) : mixc(c, warm, L>0.6?0.3:0.24);
    var lt = dark ? mixc(c,[255,255,255],0.3) : mixc(c,[255,250,242], L>0.75?0.0:0.62);
    if(L>0.75) lt=mixc(c,[255,255,255],0.75);
    var hd=hh[0]*360, pinkish=(hd>290||hd<18)&&hh[1]>0.3&&L>0.3;
    var pink = dark ? [210,120,150] : pinkish ? mixc(c,[222,78,122],0.5) : mixc(mixc(c,[255,150,175],0.72),[255,255,255],0.12);
    this.pcol={ pnose: dark?'#E58CA8':pinkish?'#D4447A':rgb2hex(mixc([238,104,134],c,0.12)), dnose: lum(lt)<0.2?'#F1E8E2':'#3A2C30', beak: (hh[0]*360>15&&hh[0]*360<45&&hh[1]>0.6)?'#F27321':'#FF9E3D' };
    var lit=function(cc,a){ return rgb2hex(mixc(cc,[255,255,255],a)); }, shd=function(cc,a){ return rgb2hex(mixc(cc,ink,a)); };
    st(this.gpB,[[0,lit(c,dark?0.14:0.28)],[0.6,base],[1,shd(c,dark?0.1:0.22)]]);
    st(this.gpD,[[0,lit(dk,0.24)],[0.6,rgb2hex(dk)],[1,shd(dk,0.2)]]);
    st(this.gpI,[[0,lit(pink,0.2)],[0.7,rgb2hex(pink)],[1,shd(pink,0.12)]]);
    st(this.gpL,[[0,lit(lt,0.25)],[0.65,rgb2hex(lt)],[1,shd(lt,0.08)]]);
    if(shp==='panda'){ this.eyeCol = dark ? '#1E1C24' : '#FFFFFF'; var ec2=this.eyeCol; this.eyes.forEach(function(e){ e.r.setAttribute('fill',ec2); e.gl.setAttribute('opacity',ec2==='#FFFFFF'?'0':'.9'); }); this.xeyes.forEach(function(x){ x.setAttribute('stroke',ec2); }); }
    this._partsPaint(this.parts); this._partsPaint(this.partsOld);
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
      else { if(!st.landed){ st.landed=true; k.sV-=3.6; this._twitch(2, 0.8); if(this.rand()<0.7) this._burst(2); } } gy=-0.15; }
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
      k.flV+=(70*(-k.s*130-k.fl)-6*k.flV)*h; k.fl+=k.flV*h;
      k.eLV+=(600*(0-k.eL)-14*k.eLV)*h; k.eL+=k.eLV*h; k.eRV+=(600*(0-k.eR)-14*k.eRV)*h; k.eR+=k.eRV*h;
    }
    if(still){ k.eL=k.eR=k.eLV=k.eRV=0; k.fl=k.flV=0; k.morph=1; k.s=sT; k.gx=gx; k.gy=gy; k.bx=gx; k.by=gy; k.eye=eyeT; k.expr=exprT; k.badge=badgeT; k.tilt=tiltT; k.ox=k.oy=0; }
    if(mode!==st.exprMode && k.expr<0.05) st.exprMode=mode; if(exprT>0) st.exprMode=mode;
    // blink
    var B=this.blink, lidB=1;
    if(!still){ if(B.t<0 && t>B.next && k.expr<0.3){ B.t=0; var dbl=this.rand()<0.16; B.next=t+(dbl?0.32:(2.0+this.rand()*3.6)/blinkRate); }
      if(B.t>=0){ B.t+=dt; var bt=B.t; lidB = bt<0.075? 1-bt/0.075*0.94 : bt<0.1? 0.06 : bt<0.24? 0.06+0.94*(1-Math.pow(1-(bt-0.1)/0.14,3)) : 1; if(bt>0.24) B.t=-1; } }
    k.lidS = lid*lidB;
    // shape morph
    var m=k.morph, p=this.cur, A=this.from, Z=this.to;
    for(i=0;i<2*N;i++) p[i]=A[i]+(Z[i]-A[i])*m;
    var EA=GEO[C.shape].ear; if(EA && (Math.abs(k.eL)>1e-3 || Math.abs(k.eR)>1e-3)){ var ew=clamp(m,0,1)*S;
      for(i=0;i<N;i++){ var wl=EA[2*i]*k.eL, wr=EA[2*i+1]*k.eR; p[2*i+1]+=(wl+wr)*0.09*ew; p[2*i]+=(-wl+wr)*0.045*ew; } }
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
    this.gBody.setAttribute('transform',tr); o.sx=sx; o.sy=sy; o.tilt=tilt; o.bx=bx; o.by=by;
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
    var lidS=clamp(k.lidS,0.04,1.2), xe=k.expr, mode=this.st.exprMode, eyeP=[];
    for(i=0;i<2;i++){
      var side=i?1:-1, a=Math.asin(clamp(fg.sp/Rs,-0.95,0.95))*side, b=Math.asin(clamp(cy/Rs,-0.9,0.9));
      var vx=Math.sin(a)*Math.cos(b), vy=Math.sin(b), vz=Math.cos(a)*Math.cos(b);
      var x1=vx*Math.cos(yaw)+vz*Math.sin(yaw), z1=-vx*Math.sin(yaw)+vz*Math.cos(yaw);
      var y2=vy*Math.cos(pit)+z1*Math.sin(pit), z2=-vy*Math.sin(pit)+z1*Math.cos(pit);
      var X=x1*Rs, Y=(top+90)/2+y2*Rs, fs=0.5+0.5*clamp(z2,0,1), w=ew*fs, hh=eh*lidS; eyeP[i]={X:X,Y:Y,fs:fs};
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
    // animal parts
    if(this.parts||this.partsOld){ var proj=function(dy){ var b=Math.asin(clamp((fy+dy-(top+90)/2)/Rs,-0.95,0.95)), vy=Math.sin(b), vz=Math.cos(b);
        var x1=vz*Math.sin(yaw), z1=vz*Math.cos(yaw), y2=vy*Math.cos(pit)+z1*Math.sin(pit), z2=-vy*Math.sin(pit)+z1*Math.cos(pit); return {X:x1*Rs, Y:(top+90)/2+y2*Rs, fs:0.5+0.5*clamp(z2,0,1), yaw:yaw}; };
      var mm=k.morph; if(this.partsOld){ if(mm>0.985 || o.still){ this._dropParts(this.partsOld); this.partsOld=null; } else this._renderParts(this.partsOld, clamp(1-mm,0,1), eyeP, proj, hw, top, o); }
      if(this.parts) this._renderParts(this.parts, o.still?1:clamp(mm,0,1.3), eyeP, proj, hw, top, o); }
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
    if(this.cv3 || this._want3d()) this._render3d(o);
  }
  /* ---------- 3D ---------- */
  _want3d(){ return ANIMALS.indexOf(this.cfg.shape)>=0 && G3.st!==-1; }
  _readShadow(){ var v=parseFloat(getComputedStyle(this).getPropertyValue('--am-shadow-opacity')); this._shOp = isNaN(v)?0.5:clamp(v*1.8,0.3,0.9); }
  _blend3(x){ this.x3=x; if(this.cv3) this.cv3.style.opacity=String(x); var hide=x>=0.999, op=String(1-x);
    [this.gSkin,this.gFace,this.shadow].forEach(function(g){ g.style.display=hide?'none':''; g.style.opacity=op; }); }
  _render3d(o){
    var self=this, C=this.cfg, want=this._want3d(), tn=now(), dt=Math.min(0.1,tn-(this._t3||tn)); this._t3=tn;
    if(want && !this.cv3){ var cv=document.createElement('canvas'); cv.setAttribute('aria-hidden','true'); cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;opacity:0'; this.shadowRoot.insertBefore(cv,this.svg); this.cv3=cv; this.ctx3=cv.getContext('2d'); }
    if(want && G3.st===0){ load3D().then(function(){ self.step(0); }, function(){ self._blend3(0); self.step(0); }); }
    var ready = want && G3.st===1;
    if(ready && !this.view3){ try{ this.view3=new G3.A.View(); }catch(e){ console.warn(e); G3.st=-1; ready=false; } }
    if(ready && !G3.A.ready(C.shape)){ ready=false; if(this._q3!==C.shape){ this._q3=C.shape; needShape(C.shape,function(){ self._q3=null; self.step(0); }); } }
    var target = ready?1:0, x = (o.still||this.hasAttribute('still')) ? target : (target>this.x3 ? Math.min(target,this.x3+dt/0.3) : Math.max(target,this.x3-dt/0.22));
    if(!ready && want && this.x3>0 && G3.st===1){ x=this.x3; } // keep the last 3D frame while the next shape meshes
    if(x!==this.x3 || x===0 || x===1) this._blend3(x);
    if(!ready || !this._vis) return;
    if(++this._shN>90){ this._shN=0; this._readShadow(); }
    var hex=rgb2hex(this.col), key=[C.shape,C.material,C.eyes,C.cheeks,C.accessory,C.accColor,hex,this._shOp].join('|');
    if(key!==this._k3){ this._k3=key; this.view3.set({shape:C.shape, material:FABRICS.indexOf(C.material)>=0?C.material:'fluffy', color:hex, eyes:C.eyes, cheeks:C.cheeks, acc:C.accessory, accColor:C.accColor==='ink'?'':(ACC_COLORS[C.accColor]||C.accColor), shadowOp:this._shOp}); }
    var k=this.k, m=clamp(k.morph,0,1.15), pop=lerp(0.84,1,m);
    var P={ sx:o.sx*pop, sy:o.sy*pop, tilt:-o.tilt*Math.PI/180, tx:o.bx/100, ty:-o.by/100, yaw:k.gx*0.42, pitch:k.gy*0.2,
      lid:clamp(k.lidS,0.04,1.2), eye:k.eye, expr:k.expr, mode:this.st.exprMode, earL:k.eL*0.3+k.fl*0.012, earR:k.eR*0.3+k.fl*0.012, gx:k.gx, gy:k.gy };
    this.view3.pose(P);
    // how fast the pose is changing: following the pointer, glancing around, blinking, hops and squash all move it quickly,
    // breathing alone stays well under 0.06/s
    var mv=0, L=this._p3; if(L && dt>0) for(var q in P) if(q!=='mode') mv=Math.max(mv,Math.abs(P[q]-L[q])/dt); this._p3=P;
    // adaptive resolution: if a slow GPU can't keep up for a couple of seconds, render fewer pixels (never below 1x)
    var dq0=AgentMascot.lite?1.5:2;
    if(!o.still && AgentMascot.adaptive && dt>0){ this._ema=(this._ema||0.016)*0.95+dt*0.05; if(++this._emaN>150 && this._ema>0.024 && (this._dq||dq0)>1){ this._dq=Math.max(1,(this._dq||dq0)-0.25); this._emaN=0; } }
    // frame cap: a fur frame is expensive, so while the animal is nearly still (just breathing) draw at most 60fps, 30 on
    // phones. Whenever it visibly moves, and for 2s after a touch, drag, poke or config change, there is no cap, so motion
    // stays as smooth as the screen allows. The pose above still updates every tick, only the GPU work is skipped
    var hot=this.drag || mv>0.06 || tn-Math.max(ptr.h,this._hot||0) < 2;
    if(!o.still && !AgentMascot.manual && !hot && key===this._k3d && tn-(this._r3||0) < 1/(AgentMascot.lite?30:60)-0.004) return;
    this._r3=tn; this._k3d=key;
    var r=this.getBoundingClientRect(), dpr=Math.min(this._dq||dq0,window.devicePixelRatio||1), w=Math.round(r.width*dpr), h=Math.round(r.height*dpr);
    if(!w||!h) return; if(this.cv3.width!==w||this.cv3.height!==h){ this.cv3.width=w; this.cv3.height=h; }
    this.view3.render(this.ctx3,w,h);
  }
  /* a still frame on a canvas: works for blobs (SVG) and 3D animals; used for PNG, GIF and WebM export */
  renderFrame(size, bg){
    size=size||1024; var cv=document.createElement('canvas'); cv.width=cv.height=size; var ctx=cv.getContext('2d'), self=this;
    if(bg){ ctx.fillStyle=bg; ctx.fillRect(0,0,size,size); }
    var load=function(str){ return new Promise(function(res,rej){ var i=new Image(); i.onload=function(){ res(i); }; i.onerror=rej; i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(str); }); };
    if(this.is3D){ var t=document.createElement('canvas'); t.width=t.height=size; this.view3.render(t.getContext('2d'),size,size); ctx.drawImage(t,0,0);
      return load(this.toSVGString(size,null,true)).then(function(i){ ctx.drawImage(i,0,0,size,size); return cv; }); }
    return load(this.toSVGString(size)).then(function(i){ ctx.drawImage(i,0,0,size,size); return cv; });
  }
  _renderParts(P, sc, eyeP, proj, hw, top, o){
    var k=this.k, p=this.cur, t=this.t, f=function(v){ return v.toFixed(2); }, gone=sc<0.01;
    P.items.forEach(function(it){
      var q=it.q, side=it.side, g=it.g; g.style.display=gone?'none':''; if(gone) return;
      if(q.kind==='bump'){ var E=eyeP[side<0?0:1]; g.setAttribute('transform','translate('+f(E.X)+' '+f(E.Y+q.dy)+') scale('+f(sc*(0.85+0.15*E.fs))+')'); return; }
      if(q.kind==='eyepatch'){ var E2=eyeP[side<0?0:1]; it.p.setAttribute('rx',f(q.rx*E2.fs)); it.p.setAttribute('ry',f(q.ry)); g.setAttribute('transform','translate('+f(E2.X+side*1.5)+' '+f(E2.Y+2)+') rotate('+(side*-24)+') scale('+f(sc)+')'); return; }
      if(q.abs){ it.p.setAttribute('rx',f(q.rx*hw)); it.p.setAttribute('ry',f(q.ry)); g.setAttribute('transform','translate('+f(-k.bx*4)+' '+f(top+(90-top)*q.y)+') scale('+f(sc)+')'); return; }
      if(q.face){ var P2=proj(q.dy), cs=Math.cos(P2.yaw);
        if(q.kind==='oval'){ var rx=q.rel?q.rx*hw:q.rx; it.p.setAttribute('rx',f(rx*(0.72+0.28*cs))); it.p.setAttribute('ry',f(q.ry)); g.setAttribute('transform','translate('+f(P2.X*(q.rel?0.6:1))+' '+f(P2.Y)+') scale('+f(sc)+')'); }
        else { var w=q.w*P2.fs*1.25; g.setAttribute('transform','translate('+f(P2.X)+' '+f(P2.Y)+') scale('+f(w*sc*(0.75+0.25*cs))+' '+f(q.w*0.95*sc)+')'); }
        return; }
      // attached to the outline
      var tt=1.5*Math.PI+(side>0&&!q.single?-q.at:q.at), idx=Math.round(((tt%TAU+TAU)%TAU)/TAU*N)%N;
      var ax=p[2*idx], ay=p[2*idx+1], mir=side>0&&!q.single;
      var sw=(q.swing||0)*(k.fl+(side<0?k.eL:k.eR)*9), sway=(q.sway||0)*Math.sin(t*1.7+(side>0?0.9:0));
      var rot=q.rot-sw+sway, px=ax+(mir?-1:1)*(q.dx||0)-(q.L==='back'?k.gx*4:0), py=ay+(q.dy||0);
      g.setAttribute('transform','translate('+f(px)+' '+f(py)+')'+(mir?' scale(-1 1)':'')+' rotate('+f(rot)+') scale('+f(sc)+')');
    });
  }
  _sparkClock(){ var now2=this.t; if(this._lastSparkT==null) this._lastSparkT=now2; var dt=now2-this._lastSparkT; this._lastSparkT=now2;
    this.sparks.forEach(function(q){ q.t+=dt; }); this.sparks=this.sparks.filter(function(q){ return q.t<0.8; }).slice(-8); }

  /* ---------- export helpers ---------- */
  toSVGString(size, bg, overlayOnly){
    var c=this.svg.cloneNode(true); size=size||512;
    if(this.is3D && !overlayOnly && this.cv3){ // 3D animals are raster: embed the current frame under the vector overlays
      var im=document.createElementNS('http://www.w3.org/2000/svg','image'); im.setAttribute('x','-160'); im.setAttribute('y','-165'); im.setAttribute('width','320'); im.setAttribute('height','320'); im.setAttribute('href',this.cv3.toDataURL('image/png')); c.insertBefore(im,c.firstChild.nextSibling); }
    c.setAttribute('width',size); c.setAttribute('height',size); c.setAttribute('xmlns','http://www.w3.org/2000/svg');
    if(bg){ var r=document.createElementNS('http://www.w3.org/2000/svg','rect'); r.setAttribute('x','-160'); r.setAttribute('y','-165'); r.setAttribute('width','320'); r.setAttribute('height','320'); r.setAttribute('fill',bg); c.insertBefore(r,c.firstChild.nextSibling); }
    return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(c);
  }
}
AgentMascot.manual = false;
AgentMascot.tick = function(dt){ live.forEach(function(m){ m.step(dt); }); };
AgentMascot.PALETTE = PALETTE; AgentMascot.STATES = STATES; AgentMascot.MATERIALS = MATERIALS; AgentMascot.SHAPES = SHAPES; AgentMascot.ALIASES = ALIAS;
AgentMascot.THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js'; AgentMascot.no3D = false; AgentMascot.adaptive = true;
// phones and tablets (touch-first, or little memory): fewer fur shells, a smaller shadow map, a lower 3D resolution and
// 30fps when idle, so the GPU gets to idle between frames instead of running flat out and heating up. Set before the first animal shows.
AgentMascot.lite = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.deviceMemory||8) <= 4;
AgentMascot.supports3D = function(){ return !AgentMascot.no3D && G3.st!==-1 && hasGL2(); };
AgentMascot.ANIMALS = ANIMALS; AgentMascot.ACCESSORIES = ACCESSORIES; AgentMascot.ACC_COLORS = ACC_COLORS; AgentMascot.FABRICS = FABRICS; AgentMascot.SERIES = SERIES;
AgentMascot.seriesOf = function(shape){ shape=ALIAS[shape]||shape; return ANIMALS.indexOf(shape)>=0?'animals':'blobs'; };
window.AgentMascot = AgentMascot;
customElements.define('agent-mascot', AgentMascot);
})();
