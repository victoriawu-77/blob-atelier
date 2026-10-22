// Regression test for 3D animals: face parts (eyes, arcs, chevrons, googly eyes, nose, beak, glasses, beret) built
// while the head is turned toward the panel and mid-squash must match a fresh page load of the same config.
// Run: npm i -D playwright-core && node test/face-rebuild.test.js   (CHROME=/path/to/chrome, uses SwiftShader WebGL)
const { chromium } = require('playwright-core');
const path=require('path');
const URL=process.env.APP||'file://'+path.resolve(__dirname,'../index.html');
const CASES=[
  ['switch shape',  'shape=bunny&material=fluffy&color=sky&eyes=dot',     {shape:'cat'}],
  ['switch shape+glasses','shape=dog&material=knit&color=butter&eyes=dot&acc=glasses', {shape:'bear'}],
  ['switch to frog','shape=hamster&material=fluffy&color=peach&eyes=dot&acc=sunglasses', {shape:'frog'}],
  ['switch to panda (white eyes)','shape=chick&material=felt&color=milk&eyes=dot', {shape:'panda'}],
  ['switch finish', 'shape=dog&material=knit&color=butter&eyes=dot',     {material:'fluffy'}],
  ['switch eye type','shape=bunny&material=fluffy&color=sky&eyes=dot&acc=beret', {eyes:'capsule'}],
];
const READ = `(()=>{ const m=mascot, v=m.view3, B=v.body; B.updateMatrixWorld(true); const inv=B.matrixWorld.clone().invert(); const out={};
  const rel=(o)=>{ const M=inv.clone().multiply(o.matrixWorld); return Array.from(M.elements).map(x=>+x.toFixed(5)); };
  v.eyeL.forEach((e,i)=>{ out['eye'+i]=rel(e.g); out['arc'+i]=rel(e.arc); out['chev'+i]=rel(e.chev); });
  B.traverse(o=>{ if(o.isMesh && o.material===v.noseMat) out.nose=rel(o); if(o.isMesh && o.material===v.beakMat) out.beak=rel(o); });
  if(v.accG){ let i=0; v.accG.traverse(o=>{ if(o.isMesh) out['acc'+(i++)]=rel(o); }); }
  const U=v.mat.userData.U; if(U.uCarveC) out.carve=[U.uCarveK.value].concat(...U.uCarveC.value.map(c=>[c.x,c.y,c.z].map(x=>+x.toFixed(5))));
  return out; })()`;
const ready = p => p.waitForFunction(()=>window.mascot && mascot.x3===1 && mascot.view3 && mascot._k3,null,{timeout:240000});
(async()=>{
  const b = await chromium.launch({ executablePath:process.env.CHROME||'/usr/bin/google-chrome', args:['--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  let fails=0;
  for (const [name, hash, change] of CASES) {
    const p = await b.newPage({ viewport:{width:1440,height:900} });
    await p.goto(URL+'#series=animals&'+hash); await ready(p);
    // head turned toward the panel + mid-squash, then change config like a panel click
    await p.mouse.move(1300,200);
    await p.evaluate(()=>{ AgentMascot.manual=true; for(let i=0;i<20;i++) mascot.step(1/30); mascot.k.gx=1; mascot.k.gy=-0.6; mascot.poke(); mascot.step(1/30); mascot.step(1/30); });
    const pose = await p.evaluate(()=>{ const b=mascot.view3.body, r=mascot.view3.root; return [b.rotation.x,b.rotation.y,r.scale.x,r.scale.y,r.rotation.z].map(x=>+x.toFixed(3)); });
    const ch = Object.assign({}, change); if(ch.shape) {} 
    await p.evaluate(c=>{ mascot.setConfig(c); }, ch);
    await p.evaluate(()=>{ AgentMascot.manual=false; }); await ready(p);
    await p.waitForFunction(()=>{ const C=mascot.cfg; return mascot.view3.cfg.shape===C.shape && mascot.view3.cfg.material===C.material && mascot.view3.cfg.eyes===C.eyes; },null,{timeout:240000});
    await p.evaluate(()=>{ AgentMascot.manual=true; mascot.k.gx=0.8; mascot.k.gy=0.4; mascot.step(1/30); });
    const A = await p.evaluate(READ); const cfg = await p.evaluate(()=>mascot.cfg);
    await p.close();
    const q = await b.newPage({ viewport:{width:1440,height:900} });
    const acc = cfg.accessory!=='none' ? '&acc='+cfg.accessory : '';
    await q.goto(URL+'#series=animals&shape='+cfg.shape+'&material='+cfg.material+'&color='+encodeURIComponent(cfg.color)+'&eyes='+cfg.eyes+acc); await ready(q);
    await q.evaluate(()=>{ AgentMascot.manual=true; mascot.step(1/30); });
    const F = await q.evaluate(READ); await q.close();
    let worst=0, key=''; for (const k of Object.keys(F)) { if(!A[k]){ worst=1e9; key=k+' missing'; break; } F[k].forEach((x,i)=>{ const d=Math.abs(x-A[k][i]); if(d>worst){ worst=d; key=k; } }); }
    if (Object.keys(A).length!==Object.keys(F).length) { worst=1e9; key='part count '+Object.keys(A).length+' vs '+Object.keys(F).length; }
    const ok = worst<1e-3; if(!ok) fails++;
    console.log((ok?'PASS':'FAIL'), name.padEnd(30), 'pose at switch', JSON.stringify(pose), 'parts', Object.keys(F).length, 'max diff', worst.toExponential(2), key);
  }
  await b.close(); process.exit(fails?1:0);
})();
