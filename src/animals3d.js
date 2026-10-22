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
  knit:{ shells:12, len:0.03, dens:430, grav:0.0, root:0.62, sheen:0.3, sheenR:0.8, rough:1.0, stray:0.16, lenVar:0.35, mottle:0.0, rad:0.13, knit:1, kw:0.105, kr:0.086 },
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
      + (fin.knit ? '#ifdef KNIT\nfloat legH(vec2 c,vec2 a,vec2 b,float w,inout float ply,inout float lit){ vec2 ab=b-a; float t=clamp(dot(c-a,ab)/dot(ab,ab),0.0,1.0); vec2 d=c-(a+ab*t); float r=length(d)/(w*(0.75+0.25*sin(3.1416*t))); if(r>=1.0) return 0.0; float h=sqrt(1.0-r*r); float side=sign(d.x*ab.y-d.y*ab.x)*r; ply=sin((t*length(ab)*3.2-side*0.55)*6.2832); lit=dot(normalize(d+1e-5),vec2(-0.35,0.94))*r; return h; }\n'
      + 'float knitH(out float ply,out float st,out float lit){ vec3 p=vObj; float v,phi,circ,u0=-1e9; lit=0.0; ply=0.0; st=0.5; if(abs(vEW)>0.5){ vec3 ax=uKEa, b=uKEb; if(p.x<0.0){ ax.x=-ax.x; b.x=-b.x; } vec3 d=p-b; v=dot(d,ax)-uKEo; vec3 e1=uKEw; if(p.x<0.0) e1.x=-e1.x; phi=0.0; circ=0.0; u0=dot(d,e1)/uKW; } else { v=vKV; phi=atan(p.x,p.z); circ=uKC[clamp(int(floor(v/uKR)),0,63)]; }\n'
      + ' float rowf=v/uKR, N=max(6.0,6.0*floor(circ/(6.0*uKW)+0.5)), u=u0>-1e8?u0:(phi/6.2831853+0.5)*N; vec2 c=vec2(fract(u),fract(rowf)); st=h33(vec3(floor(u),floor(rowf),abs(vEW)>0.5?7.0:3.0)).x;\n'
      + ' float p1=0.0,p2=0.0,l1=0.0,l2=0.0; float hl=legH(c,vec2(0.05,1.02),vec2(0.47,0.02),0.3,p1,l1), hr=legH(c,vec2(0.95,1.02),vec2(0.53,0.02),0.3,p2,l2); if(hl>=hr){ ply=p1; lit=l1; return hl; } ply=p2; lit=l2; return hr; }\n#endif\n' : '')
      + sh.fragmentShader
      .replace('void main() {','void main() {\nfloat furA=1.0, tipT=vH, fTint=0.5, fGap=1.0;\nmat3 fM=mat3(0.8165,-0.4082,-0.4082, 0.0,0.7071,-0.7071, 0.5774,0.5774,0.5774), fM2=mat3(0.0,0.8,0.6, 0.6,-0.48,0.64, 0.8,0.36,-0.48);\nfloat cv=uCarveK>0.0?carve():0.0;\n// fur is trimmed short around the eyes so shells never cover them\nif(vH>0.0 && vH>(1.0-cv)*1.02-0.02) discard;\nfloat kH=1.0,kPly=0.0,kSt=0.5,kFz=0.0,kLit=0.0;\n#ifdef KNIT\nkH=knitH(kPly,kSt,kLit); if(vH>0.0){ if(kH*0.7<vH){ vec3 n=fM*normalize(vONrm); vec3 q=(fM*vObj+vec3(0.3712,0.1131,0.5377))*uDens; float t1; furA=strand(q,n,vH,t1); if(furA<0.5 || h33(floor(q)+5.0).y>uStray) discard; kFz=1.0; } }\n#else\nif(vH>0.0){ vec3 n=normalize(vONrm); if(uFelt>0.5){ vec3 nf=fM*n, qf=(fM*vObj+vec3(0.3712,0.1131,0.5377))*uFSc; float a1=feltFib(qf,nf,vH,uFW,0.0,fTint); float a2=feltFib(qf*1.31+vec3(5.3,1.7,9.1),fM2*nf,vH,uFW*1.15,41.0,fTint); furA=max(a1,a2); if(furA<0.5) discard; } else { vec3 q=(mat3(0.8165,-0.4082,-0.4082, 0.0,0.7071,-0.7071, 0.5774,0.5774,0.5774)*vObj+vec3(0.3712,0.1131,0.5377))*uDens; n=mat3(0.8165,-0.4082,-0.4082, 0.0,0.7071,-0.7071, 0.5774,0.5774,0.5774)*n; if(uClump>0.5) q+= (vec3(vnoise(vObj*7.0),vnoise(vObj*7.0+7.1),vnoise(vObj*7.0+3.3))-0.5)*vH*9.0; float t1,t2; float a=strand(q,n,vH,t1); float b=strand(q*1.37+vec3(3.1,7.7,1.3),n,vH,t2); furA=max(a,b); tipT=max(t1,t2);\n if(uStray>0.0){ vec3 sc=floor(vObj*uDens*0.12); vec3 sr=h33(sc+11.0); if(sr.x<uStray*25.0){ float tt; furA=max(furA, strand(q*0.12,n,vH*0.22,tt)); } }\n if(furA<0.5) discard; } }\n#endif\n#ifdef FIBER\nfTint=vFT; if(uCarveK>0.0 && carve()>0.02) discard;\n#else\nif(vH==0.0 && uFelt>0.5){ vec3 nf=fM*normalize(vONrm), qf=(fM*vObj+vec3(0.3712,0.1131,0.5377))*uFSc; float t0=0.5; float a1=feltFib(qf,nf,0.0,uFW*1.1,0.0,t0); float a2=feltFib(qf*1.31+vec3(5.3,1.7,9.1),fM2*nf,0.0,uFW*1.25,41.0,t0); float t3=0.5; float a3=feltFib(qf*2.3+vec3(2.2,8.1,4.4),nf,0.0,uFW*1.3,73.0,t3); fGap=max(max(a1,a2),a3*0.7); fTint=max(a1,a2)>0.3?t0:t3; }\n#endif')
      .replace('#include <color_fragment>','#include <color_fragment>\nvec3 col=diffuseColor.rgb; col=mix(col,cLight,vPaint.x); col=mix(col,cPink,vPaint.y); col=mix(col,cDark,vPaint.z); col=mix(col,cCheek,vPaint.w*uCheeks*0.8);\nif(uMottle>0.0) col*=1.0+uMottle*((vnoise(vObj*16.0)-0.5)*1.4+(vnoise(vObj*70.0)-0.5)*1.2);\nif(uFelt>0.5){ col*=1.0+uMottle*1.5*(fTint-0.5); if(fTint>0.93) col*=1.1; col*=mix(0.86,1.0,fGap); }\nfloat ao=mix(0.55,1.0,smoothstep(0.0,0.42,vObj.y))*uAO+(1.0-uAO);\nfloat hh2=max(vH,cv*0.85);\n#ifdef KNIT\nhh2 = kFz>0.5 ? 1.0 : max(vH/0.7, cv*0.85); col*=(0.96+0.08*kSt)*(0.93+0.07*kPly)*(1.0+0.16*kLit*(1.0-kFz)); if(vH==0.0) col*=mix(0.85,1.0,cv);\n#endif\n#ifdef FIBER\nhh2=1.0;\n#endif\ncol*=mix(uRoot,1.0,pow(clamp(hh2,0.0,1.0),0.7))*ao;\ndiffuseColor.rgb=col;');
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
function hexToColor(h){ return new THREE.Color(h); }
/* ---------- a mascot view ---------- */
function View(){
  var r=renderer(), sc=new THREE.Scene(); this.scene=sc; sc.environment=ENV; sc.environmentIntensity=0.85;
  var cam=new THREE.PerspectiveCamera(20,1,0.1,50); this.cam=cam;
  var key=new THREE.DirectionalLight(0xffffff,1.5); key.position.set(-0.7,6,1.5); key.castShadow=true; key.shadow.mapSize.set(1024,1024);
  var s=key.shadow.camera; s.left=-2.2; s.right=2.2; s.top=2.2; s.bottom=-2.2; s.near=1; s.far=12; key.shadow.radius=14; key.shadow.blurSamples=20; key.shadow.bias=-0.0004; sc.add(key); this.key=key;
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
    if(fin.knit){ if(!D.knit) D.knit=knitField(D,S,fin.kr); var KU=mat.userData.U; KU.uKC.value.set(D.knit.cb); if(D.knit.ear){ KU.uKEa.value.copy(D.knit.ear.ax); KU.uKEw.value.copy(D.knit.ear.wd); KU.uKEb.value.copy(D.knit.ear.base); KU.uKEo.value=D.knit.ear.off; } } var im=new THREE.InstancedMesh(D.geo,mat,fin.shells); var I=new THREE.Matrix4(); for(var i=0;i<fin.shells;i++) im.setMatrixAt(i,I);
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
