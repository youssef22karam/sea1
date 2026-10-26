
/* ---- glue: BoatModel assembly + BoatMaterials (WGSL -> three.js WebGL port) ---- */
{
const {HullLines}=NS.HullLines,{GeoKit}=NS.GeoKit,{buildHull}=NS.HullBuilder,{buildDeckGear}=NS.DeckGear;
const {buildWheelhouse,HOUSE,wheelGeometry,throttleGeometry,radarArrayGeometry}=NS.Wheelhouse,{PROP,RUDDER,propellerGeometry,rudderGeometry}=NS.Running;
const V3=(c)=>{const k=new THREE.Color(c);return `vec3(${k.r.toFixed(4)},${k.g.toFixed(4)},${k.b.toFixed(4)})`};
const NOISE=`
float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float h11(float x){return fract(sin(x*127.1+3.7)*43758.5453);}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
  mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z)*2.-1.;}
float fbm(vec3 p){return vn(p)*.57+vn(p*2.)*.29+vn(p*4.)*.14;}
float ls(float a,float b,float x){return smoothstep(a,b,x);}
float iv(float a,float b,float x){return 1.-smoothstep(a,b,x);}
float pat(float z,float id){return step(abs(z-id),.5);}`;

window.BoatKit={build(){
 const L=new HullLines(),kit=new GeoKit(),parts={},uni={uNight:{value:0},uNav:{value:1}};
 buildHull(kit,L);buildDeckGear(kit,L,parts);buildWheelhouse(kit,L,parts);

 const mk=(Cls,opt,name,body)=>{const m=new Cls({vertexColors:true,color:0xffffff,...opt});m.customProgramCacheKey=()=>name;
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,uni);
   sh.vertexShader='attribute vec4 aux;varying vec4 vAux;varying vec3 vLoc;varying vec2 vUV0;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAux=aux;vLoc=position;vUV0=uv;');
   sh.fragmentShader='varying vec4 vAux;varying vec3 vLoc;varying vec2 vUV0;uniform float uNight,uNav;\n'+NOISE+'\n'+sh.fragmentShader
    .replace('#include <color_fragment>','vec3 vCol=vColor.rgb;vec3 alb=vCol;float rg=vAux.x,mt=vAux.y*.55,al=1.;vec3 em=vec3(0.);vec2 uv0=vUV0;\n{'+body.replace(/\bvColor\b/g,'vCol')+'}\ndiffuseColor.rgb=alb;diffuseColor.a*=al;')
    .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(rg,.04,1.);')
    .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=clamp(mt,0.,1.);')
    .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=em;')};return m};

 const hull=mk(THREE.MeshPhysicalMaterial,{clearcoat:1,clearcoatRoughness:.1},'bHull',`
 vec3 p=vLoc;float tS=clamp((p.z+${(-L.zAft).toFixed(3)})/${L.length.toFixed(3)},0.,1.);
 float sheer=pow(tS,2.2)*.62+.98+pow(max(1.-tS/.2,0.),2.)*.04;
 float boot=p.y-ls(.8,4.3,p.z)*.06,aaB=fwidth(boot)+1e-4;
 float aB=ls(-aaB,aaB,boot-.05),aS=ls(-aaB,aaB,boot-.15);
 float below=sheer-p.y,aaS=fwidth(below)+1e-4;float cove=ls(-aaS,aaS,below-.1)*iv(-aaS,aaS,below-.122);
 float n1=fbm(p*vec3(.9,2.4,.9));
 vec3 c=mix(${V3(0x7a1d15)},${V3(0x0f1a30)},aB);c=mix(c,${V3(0xf2efe6)},aS);c=mix(c,${V3(0x0f1a30)},cove);
 float scum=iv(.16,n1*.09+.42,boot)*aS*clamp(n1*.6+.7,0.,1.);c=mix(c,${V3(0x8b7b57)},scum*.32);
 float algae=ls(-.35,.03,boot)*(1.-aB)*clamp(n1+.45,0.,1.);c=mix(c,${V3(0x2c3a1f)},algae*.45);
 float streak=ls(.3,.75,vn(vec3(p.z*7.,p.y*.45,p.x*7.)))*ls(.05,.2,below)*iv(.4,.95,below)*aS;c=mix(c,${V3(0xa29579)},streak*.2);
 alb=c;rg=mix(mix(.75,.35,aB),.2,aS)+scum*.25;`);

 const gel=mk(THREE.MeshStandardMaterial,{},'bGel',`
 vec3 p=vLoc;float grip=pat(vAux.z,1.),plain=1.-grip;
 float seamDz=.305-abs(fract((p.z+.13)/.61)-.5)*.61,dyA=abs(p.y-1.17),dyB=abs(p.y-1.52);
 float sd=min(seamDz,min(dyA,dyB)),aa=fwidth(sd)+1e-4;   // derivatives stay outside the branch (D3D/ANGLE safe)
 float dirt=clamp(vn(p*1.7)*.5+.35,0.,1.)*.22*grip;
 float wear=fbm(p*vec3(1.1,1.6,1.1)+vec3(5.3,1.1,2.9));
 float lowD=iv(.38,1.15,p.y)*clamp(wear+.7,0.,1.)*.34*plain;
 alb=vColor*(1.-dirt-lowD);alb=mix(alb,alb*vec3(.94,.89,.78),ls(-.15,.35,wear)*.45*plain);
 rg=mix(vAux.x,.72,grip)+clamp(wear+.3,0.,1.)*.18*plain;
 if(vAux.z>1.5){float panel=pat(vAux.z,2.),head=pat(vAux.z,3.);
  float mott=fbm(p*vec3(2.3,3.1,2.3));
  float seam=iv(.0015,.0015+aa*1.5,sd)*panel;
  float grime=clamp(iv(1.15,1.6,p.y)*(.35+mott*.3)+iv(0.,.035,sd)*.18+mott*.08,0.,1.)*panel;
  vec3 pc=vColor*vec3(.97,.94,.87);pc=mix(pc,pc*vec3(.9,.82,.64),ls(-.1,.35,fbm(p*vec3(.9,1.4,.9)+3.1))*.7);
  pc*=1.-grime*.6;pc=mix(pc,pc*.3,seam);
  vec3 hc=vec3(.72,.69,.63)*(mott*.08+.96);
  alb=mix(mix(alb,pc*.62,panel),hc*.5,head);rg=mix(rg,.5+grime*.3,panel);
  em=hc*.06*head;}`);

 const wood=mk(THREE.MeshStandardMaterial,{},'bWood',`
 vec2 w=uv0;float g1=vn(vec3(w.x*.8,w.y*30.,.37)),g2=vn(vec3(w.x*10.,w.y*170.,5.1));
 float rings=sin(w.y*150.+g1*5.+w.x*.6)*.5+.5,grain=clamp(rings*.45+g2*.22+g1*.22+.28,0.,1.);
 float plain=pat(vAux.z,1.),sole=pat(vAux.z,2.);
 vec3 wd=mix(${V3(0x4a230f)},${V3(0x9c5b2b)},grain);
 float pv=w.y/.1,pi=floor(pv),pf=abs(fract(pv)-.5),aaP=fwidth(pv)+1e-4;
 float holly=ls(.44-aaP,.44,pf),caulk=ls(.488-aaP,.488,pf);
 float butt=iv(0.,.004+fwidth(w.x),abs(fract(w.x/1.8+h11(pi))-.5)*1.8);
 vec3 teak=mix(${V3(0x6b3f1d)},${V3(0xa87445)},grain)*(h11(pi+7.)*.25+.85);
 teak=mix(teak,${V3(0xd9c9a6)},holly*(1.-caulk));teak=mix(teak,${V3(0x1c140e)},max(caulk,butt));
 wd=mix(wd,teak,sole);alb=mix(wd,vec3(1.),plain)*vColor;rg=mix(vAux.x+g2*.04*(1.-plain),.45,sole);`);

 const fit=mk(THREE.MeshStandardMaterial,{},'bFit',`
 vec2 u=uv0;float rope=ls(-.7,.7,sin((u.x/.07+u.y)*18.85))*.4+.6;
 float si=floor(clamp(u.y,0.,1.)*12.999),red=1.-mod(si,2.);
 vec3 fl=mix(${V3(0xf4f1ea)},${V3(0xb3172a)},red);fl=mix(fl,${V3(0x1c2a5c)},step(u.x,.4)*step(.4615,u.y));
 alb=mix(mix(vColor,vColor*rope,pat(vAux.z,1.)),fl,pat(vAux.z,2.));
 alb*=1.+vn(vLoc*380.)*.04*pat(vAux.z,4.);`);

 const glow=mk(THREE.MeshStandardMaterial,{},'bGlow',`
 float m=vAux.z,n=uNight;
 em=vColor*uNav*(n*7.+1.5)*pat(m,0.)+vec3(.02,.12,.07)*(1.+n*2.)*pat(m,1.)+vec3(.12,.25,.4)*(.7+n)*pat(m,2.)
  +vec3(.2,.2,.22)*(.5+n*1.4)*pat(m,3.)+vColor*(n*9.+.02)*pat(m,4.)+vColor*(n*2.2+.02)*pat(m,5.)+vColor*(n*.5+.45)*pat(m,6.);
 alb=vColor*.06;`);

 const trap=mk(THREE.MeshStandardMaterial,{side:THREE.DoubleSide,alphaTest:.5},'bTrap',`
 vec2 u=uv0;float net=pat(vAux.z,1.);vec2 dg=vec2(u.x+u.y,u.x-u.y)*.7071;
 vec2 q=mix(u/.038,dg/.05,net),fr=abs(fract(q)-.5),fw=fwidth(q)+1e-4;float hf=mix(.5-.0045/.038,.5-.002/.05,net);
 float inn=step(.014,u.x)*step(.014,u.y)*step(u.x,vAux.x-.014)*step(u.y,vAux.y-.014),bd=(1.-inn)*(1.-net);
 al=max(max(ls(hf-fw.x,hf,fr.x),ls(hf-fw.y,hf,fr.y)),bd);alb=vColor*mix(1.,.8,bd);rg=.55;mt=0.;`);

 const glass=new THREE.MeshStandardMaterial({color:0xa9bec4,roughness:.05,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false});
 const M={hull,gelcoat:gel,wood,fittings:fit,glass,glow,trap};
 const model=new THREE.Group();model.rotation.y=Math.PI;     // modules: +Z bow, +X port  ->  simulator: bow -Z
 const mesh=(g,m)=>{const o=new THREE.Mesh(g,m);o.frustumCulled=false;return o};
 for(const k in M){const g=kit.merged(k);if(g)model.add(mesh(g,M[k]))}

 // animated parts
 const wheel=mesh(wheelGeometry(),wood),wp=new THREE.Group();wp.position.copy(parts.wheelCenter);
 wp.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),parts.wheelAxis);wp.add(wheel);model.add(wp);
 const thr=mesh(throttleGeometry(),fit);thr.position.copy(parts.throttlePivot);
 const radar=mesh(radarArrayGeometry(),fit);radar.position.copy(parts.radarPivot);
 const prop=mesh(propellerGeometry(),fit);prop.position.copy(PROP.position);
 const rud=mesh(rudderGeometry(),fit);rud.position.copy(RUDDER.pivot);
 model.add(thr,radar,prop,rud);
 let wa=0,spin=0,rs=0;
 const animate=(dt,power,lean)=>{wa+=(-lean*2.6-wa)*(1-Math.exp(-dt*5));wheel.rotation.z=wa;
  thr.rotation.x=Math.max(-3,Math.min(10,power))*.08;spin+=power*dt*3;prop.rotation.z=spin;rs+=dt*2.5;radar.rotation.y=rs;
  rud.rotation.y=-lean*RUDDER.maxAngle*.9};
 return {root:model,uni,parts,animate,eye:new THREE.Vector3(HOUSE.helmX,1.86,HOUSE.seatZ+.14)};   // eye = helmsman's head, starboard side behind the wheel
}};
}

