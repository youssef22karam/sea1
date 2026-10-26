

const WFS=SKY+`
varying vec3 vP;varying vec2 vUV;uniform sampler2D uD0,uD1,uD2,uF0,uF1,uF2;uniform vec3 uLS;
uniform vec3 uBody,uFoam;uniform vec2 uWD;uniform float uClar,uRough,uFog,uHs;
uniform sampler2D uWake;uniform vec3 uWi;uniform float uWN;uniform vec4 uBLp[3],uBLd[3];uniform float uBLk;
vec3 glint(vec3 L,vec3 N,vec3 V,float a,float nv){
 vec3 H=normalize(L+V);float nh=max(dot(N,H),0.),nl=max(dot(N,L),0.),vh=max(dot(V,H),0.);
 float a2=a*a,d=nh*nh*(a2-1.)+1.,D=a2/(3.14159*d*d);
 float Vis=.5/(nl*sqrt(nv*nv*(1.-a2)+a2)+nv*sqrt(nl*nl*(1.-a2)+a2)+1e-4);   // GGX + Smith
 return vec3(min(D*Vis*(.02+.98*pow(1.-vh,5.))*nl,6.));}                    // clamped glint
void main(){
 vec3 V=cameraPosition-vP;float dist=length(V);V/=dist;vec2 q=vUV;float ov=smoothstep(.25,.85,uStorm);
 float calm=1.-.55*smoothstep(300.,1600.,dist);                 // far swell slopes relax: calm horizon
 vec4 dv=texture(uF0,q/uLS.x)*calm+texture(uF1,q/uLS.y)*(.5+.5*calm)+texture(uF2,q/uLS.z);
 vec2 wu=(q-uWi.xy)/uWi.z+.5,we=abs(wu-.5);float wef=(1.-smoothstep(.4,.49,max(we.x,we.y)))*(1.-smoothstep(120.,300.,dist));
 vec4 wk=texture(uWake,wu);float wtx=1./uWN;
 vec2 wg=vec2(texture(uWake,wu+vec2(wtx,0.)).x-texture(uWake,wu-vec2(wtx,0.)).x,texture(uWake,wu+vec2(0.,wtx)).x-texture(uWake,wu-vec2(0.,wtx)).x)/(2.*uWi.z*wtx);   // wake slopes
 vec3 N=normalize(vec3(-dv.x/(1.+dv.z)-wg.x*wef,1.,-dv.y/(1.+dv.w)-wg.y*wef));       // slopes from the three derivative maps + the wake
 float nvr=dot(N,V);if(nvr<0.)N=normalize(N-V*nvr*1.02);           // no black back-facing sparkles
 float nv=clamp(dot(N,V),.02,1.);
 float rough=clamp(uRough+dist*.00006+uStorm*.04,.02,.5),ra=rough*.6+.02;   // rougher with distance: no mirror sea
 float F=.02+(max(1.-rough,.02)-.02)*pow(1.-nv,5.);
 vec3 R=reflect(-V,N);R.y=abs(R.y);
 vec3 spec=glint(uSun,N,V,ra,nv)*uSunCol*smoothstep(0.,.06,uSun.y)*(1.-.92*ov)+glint(uMoon,N,V,ra,nv)*vec3(.14,.17,.26)*uNight*smoothstep(0.,.06,uMoon.y);
 // see-through body: absorption grows with path length (1/cos), so it is clear looking down and murky at grazing angles
 float thk=max(vP.y+.4*uHs,0.)*smoothstep(1.5,5.,uHs);   // water depth above the trough: crests are thick, only the lower flanks stay see-through
 float aB=1.-exp(-(2.6*pow(1.-uClar,2.)+.04+.9*thk)/max(nv,.07));
 vec3 body=uBody*uLight*mix(1.,.4,uStorm);
 body+=vec3(.03,.24,.34)*pow(clamp(dot(uSun,-V),0.,1.),4.)*smoothstep(-.1*uHs,.45*uHs,vP.y)*uDay*uSunCol*.9*(1.-ov);   // crest scattering
 vec3 col=sky(R)*F+spec+body*(1.-F)*aB;                                      // premultiplied
 float al=F+(1.-F)*aB;
 if(uBLk>.01){vec3 lc=vec3(0.);   // the boat's own lights on the sea: a lit pool plus glitter on the waves
  for(int i=0;i<3;i++){vec3 d=uBLp[i].xyz-vP;float r=length(d);vec3 Lv=d/r;
   float cone=uBLd[i].w<-1.5?1.:smoothstep(uBLd[i].w-.05,uBLd[i].w,dot(-Lv,uBLd[i].xyz));
   float att=uBLp[i].w/(1.+.015*r*r),dif=max(dot(N,Lv),0.),spc=pow(max(dot(N,normalize(Lv+V)),0.),70.);
   lc+=att*cone*(vec3(.35,.65,.75)*dif*.35+vec3(1.,.95,.82)*spc*1.6);}
  col+=lc;al=max(al,clamp(dot(lc,vec3(.33))*2.,0.,1.));}
 float fp=length(fwidth(vUV))*uFoam.y,pat=0.,am=.5,fr=1.;
 vec2 qs=vec2(dot(q,uWD)*.4,dot(q,vec2(-uWD.y,uWD.x)));   // stretched along the wind: streaky foam
 for(int i=0;i<4;i++){float w=1.-smoothstep(.2,.8,fp*fr);pat+=am*mix(.5,vn(qs*uFoam.y*fr+uTime*.05*fr),w);fr*=2.1;am*=.5;}
 pat/=.9375;                                                                 // fine octaves fade to the mean
 float tb=1.+(texture(uD0,q/uLS.x).a-1.)+(texture(uD1,q/uLS.y).a-1.)*.8+(texture(uD2,q/uLS.z).a-1.)*.4;   // accumulated turbulence
 float raw=clamp((uFoam.x-tb)*3.2,0.,1.);
 float fo=clamp(smoothstep(1.-uFoam.z,1.,raw*(.55+pat))+raw*.15,0.,1.);
 fo=mix(fo,raw*.35*uFoam.z,smoothstep(250.,900.,dist));
 float tip=smoothstep(.34,.66,vP.y/uHs)*smoothstep(.12,.7,uStorm)*(1.-smoothstep(250.,800.,dist));   // storm whitecaps: foam only on the highest wave tips
 fo=max(fo,tip*smoothstep(.38,.62,pat+.2*tip));
 fo*=1.-.85*smoothstep(450.,1500.,dist);                        // no foam specks on the horizon
 fo=max(fo,smoothstep(.5,.72,wk.z*1.25+(pat-.5)*.9)*wef*.85);               // the boat's foam trail: breaks into lace as it ages, no smooth smear
 vec3 fc=vec3(.92,.95,.97)*(hzSoft()*.5+uSunCol*uDay*max(dot(N,uSun),0.)*.35*(1.-.75*ov)+(.04+1.5*uStorm)*uLight);  // lit by the smooth normal
 col+=vec3(.02,.18,.26)*uLight*smoothstep(0.,.6,raw*uFoam.z)*(1.-fo)*(1.-F)*.7;
 col+=vec3(.03,.27,.31)*uLight*smoothstep(0.,.5,wk.z)*(1.-fo)*(1.-F)*wef*.5;   // aerated, bubble-filled water under the trail   // turquoise bubble layer
 col=mix(col,fc,fo);al=mix(al,1.,fo);
 float fg=1.-exp(-dist*uFog);col=mix(col,horizon(),fg);al=mix(al,1.,fg);
 gl_FragColor=vec4(col,al);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

/* ===== 5. scene objects ===== */
const skyMesh=new THREE.Mesh(new THREE.SphereGeometry(5000,24,12),new THREE.ShaderMaterial({uniforms:{...U},side:THREE.BackSide,depthWrite:false,depthTest:false,
 vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.);}`,
 fragmentShader:SKY+`
varying vec3 vD;
void main(){gl_FragColor=vec4(sky(normalize(vD)),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}));
skyMesh.frustumCulled=false;skyMesh.renderOrder=-10;scene.add(skyMesh);

const seabed=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x998866,depthTest:false,depthWrite:false}));
seabed.renderOrder=-5;seabed.position.y=-14;scene.add(seabed);   // drawn right after the sky, before the water: waves can never expose it

function radialGrid(seg,outer=6e4){                              // log-spaced rings: dense at the camera, sparse to the horizon
 const step=Math.PI*2/seg,radii=[0];let r=.4;
 while(r<outer){radii.push(r);r*=r<4e3?1+step:1.08}radii.push(outer);
 const pos=new Float32Array(radii.length*seg*3),idx=[];let o=0;
 for(const rad of radii)for(let s=0;s<seg;s++){pos[o++]=Math.cos(s*step)*rad;pos[o++]=0;pos[o++]=Math.sin(s*step)*rad}
 for(let q=0;q<radii.length-1;q++)for(let s=0;s<seg;s++){const n=(s+1)%seg,i=q*seg,j=i+seg;idx.push(i+s,j+n,j+s,i+s,i+n,j+n)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx),1));return g}
const WU={uD0:{value:null},uD1:{value:null},uD2:{value:null},uF0:{value:null},uF1:{value:null},uF2:{value:null},uLS:{value:new THREE.Vector3(...CASCADE_LENGTHS)},uTexels:{value:sim.size},uAng:{value:.01},uWake:{value:null},uWi:{value:new THREE.Vector3(0,0,240)},uWN:{value:512},uWk:{value:1},uBLp:{value:[new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4()]},uBLd:{value:[new THREE.Vector4(0,0,1,-2),new THREE.Vector4(0,0,1,-2),new THREE.Vector4(0,0,1,-2)]},uBLk:{value:0}};
const water=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.ShaderMaterial({uniforms:{...U,...WU},vertexShader:WVS,fragmentShader:WFS,
 transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendEquation:THREE.AddEquation}));
water.frustumCulled=false;water.renderOrder=1;scene.add(water);
/* depth pre-pass: water has no depth write, so overlapping crests were blended in triangle order and the sea BEHIND a near wave showed through its tip (a fake horizon).
   This pass writes only depth (slightly pushed back); the shaded pass below then keeps just the nearest surface fragment, still alpha-blended over the sea bed and submerged objects. */
const waterZ=new THREE.Mesh(water.geometry,new THREE.ShaderMaterial({uniforms:water.material.uniforms,vertexShader:WVS,fragmentShader:'void main(){gl_FragColor=vec4(0.);}',colorWrite:false,depthWrite:true,depthTest:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:2}));
waterZ.frustumCulled=false;waterZ.renderOrder=.5;scene.add(waterZ);

/* ===== 6. rain: 4 camera-centred layers of instanced streak quads ===== */
const RL=[[14,700,.05,1.4,.34,9],[40,900,.04,1.3,.3,10],[110,1100,.032,1.2,.26,11],[260,1300,.026,1.1,.22,12]].map(([box,n,len,wid,op,spd])=>{
 const g=new THREE.InstancedBufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-.5,0,0,.5,0,0,-.5,1,0,.5,1,0]),3));g.setIndex([0,1,2,2,1,3]);
 g.setAttribute('aS',new THREE.InstancedBufferAttribute(Float32Array.from({length:n*4},Math.random),4));
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,   // double-sided: no silent culling
  uniforms:{...U,uBox:{value:box},uLen:{value:len},uWid:{value:wid},uOp:{value:op},uSpd:{value:spd}},
  vertexShader:`attribute vec4 aS;uniform float uBox,uLen,uWid,uOp,uSpd,uTime,uRain,uPx;uniform vec2 uWind;varying float vA,vU;
void main(){
 vec3 vel=normalize(vec3(uWind.x,-1.,uWind.y));
 vec3 q=mod(aS.xyz*uBox+vel*uSpd*uTime-cameraPosition+uBox*.5,uBox)-uBox*.5;
 vec3 head=cameraPosition+q+vec3(0.,uBox*.3,0.);
 vec4 a=viewMatrix*vec4(head,1.);float dep=-a.z;
 vec4 b=viewMatrix*vec4(head-vel*(dep*uLen),1.);                // streak length is an angle: ~15-25 px on screen at any distance
 vec3 sd=normalize(cross(b.xyz-a.xyz,a.xyz)+1e-6);
 float w=dep*uPx*uWid;                                           // ~1 px wide at any distance
 gl_Position=projectionMatrix*vec4(mix(a.xyz,b.xyz,position.y)+sd*position.x*w,1.);
 vA=uOp*step(aS.w,uRain)*smoothstep(uBox*.04,uBox*.12,dep)*smoothstep(0.,3.,head.y)*(1.-smoothstep(.38,.5,length(q)/uBox));
 vU=position.x+.5;}`,
  fragmentShader:`uniform vec3 uRainCol;varying float vA,vU;
void main(){float e=smoothstep(0.,.5,1.-abs(vU*2.-1.));gl_FragColor=vec4(uRainCol,vA*e);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const o=new THREE.Mesh(g,m);o.frustumCulled=false;o.renderOrder=3;o.userData.n=n;scene.add(o);return o});

/* ===== 7. lightning (storm > 55 %): 2-4 pulses, lights the cloud deck and kicks exposure ===== */
let nextStrike=6,pulses=[],strikeT=0;
function lightning(dt){
 if(storm>.55&&(nextStrike-=dt)<=0){let t=0;pulses=Array.from({length:2+Math.floor(Math.random()*3)},()=>t+=.05+Math.random()*.12);
  strikeT=0;nextStrike=(6+Math.random()*11)*(1.6-storm*.7)}
 flash=0;
 if(pulses.length){strikeT+=dt;pulses.forEach(p=>flash=Math.max(flash,1-Math.abs(strikeT-p)/.06));if(strikeT>pulses[pulses.length-1]+.1)pulses=[]}
 U.uFlash.value=flash=clamp(flash,0,1)}

/* ===== 8. time of day and lighting ===== */
const bodyNoon=new THREE.Color(),LAT=30*Math.PI/180,DEC=.2,warm=new THREE.Color(1,.38,.14),white=new THREE.Color(1,.96,.88),grey=new THREE.Color();
const sunAt=h=>{const H=(h-12)*Math.PI/12,sp=Math.sin(LAT),cp=Math.cos(LAT),sd=Math.sin(DEC),cd=Math.cos(DEC);
 return new THREE.Vector3(-cd*Math.sin(H),sp*sd+cp*cd*Math.cos(H),-(cp*sd-sp*cd*Math.cos(H))).normalize()};
function lighting(){
 const h=P.hour,sun=sunAt(h),el=sun.y,dusk=h>12;
 const day=sstep(-.1,.2,el),night=1-sstep(-.22,-.05,el);
 const w=dusk?.3:.22,twi=Math.exp(-el*el/(w*w))*(1-.5*storm);      // dusk: wider, warmer band than dawn
 U.uSun.value.copy(sun);U.uMoon.value.copy(sun).negate();
 U.uTint.value.set(dusk?'#ff6a1f':'#ff8cc4');
 const sc=U.uSunCol.value.copy(warm).lerp(white,sstep(0,.45,el));
 grey.setScalar(.3*sc.r+.59*sc.g+.11*sc.b);
 sc.lerp(grey,storm*.7).multiplyScalar(3.2*(1-.6*storm)*day*(1+.6*twi*(dusk?1:.3)));   // dim + desaturate; stronger low-sun glitter at dusk
 U.uDay.value=day;U.uNight.value=night;U.uTwi.value=twi;U.uCov.value=P.cov;U.uDens.value=P.dens;U.uStorm.value=storm;
 const L=(.05+.95*sstep(-.1,.5,el))*lerp(1,.5,storm);U.uLight.value=L;
 renderer.toneMappingExposure=P.expo*(.85+.65*(1-sstep(0,.9,Math.max(el,0))))*(1-.65*night)*(1+.35*twi)*(1+.5*flash);
 U.uBody.value.set(P.body).lerp(bodyNoon.set(P.bodyNoon),sstep(.3,.85,el)*(1-storm));   // deep teal -> turquoise as the sun climbs
 U.uClar.value=P.clar*(1-.75*storm)/(1+.08*Math.max(P.hs-3,0));   // storms and big seas churn up the water: opaque, no see-through
 U.uRough.value=P.rough;U.uFoam.value.set(lerp(P.foamB,clamp(.6-.0185*(P.hs-10),.3,.6),storm),P.foamS,P.foamC);   // storm: foam threshold follows wave size, so huge seas don't turn white
 U.uFog.value=(.00025+.0018*storm)*P.fog*2;
 U.uRain.value=sstep(.1,.55,storm);
 const a=WS.dir*Math.PI/180,s=WS.wind/19*.55;U.uWind.value.set(Math.cos(a)*s,Math.sin(a)*s);U.uWD.value.set(Math.cos(a),Math.sin(a));U.uHs.value=Math.max(P.hs,.3);
 U.uRainCol.value.setRGB(.8,.85,.95).multiplyScalar(.1+.9*L);
 seabed.visible=P.seabed;seabed.material.color.copy(U.uBody.value).multiplyScalar(L*lerp(1,.4,storm));   // same tint as the water body, so see-through never shows brown
 $('#clock').textContent=String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor(h%1*60)).padStart(2,'0')}

/* ===== 9. performance: tiers + auto resolution with hysteresis ===== */
let tier='High',res=1,hold=4,ema=16;
function resize(){const pr=Math.min(devicePixelRatio,TIERS[tier].pr)*res;renderer.setPixelRatio(pr);renderer.setSize(innerWidth,innerHeight);
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();U.uPx.value=2*Math.tan(camera.fov*Math.PI/360)/(innerHeight*pr)}
function setQuality(){tier=P.quality==='Auto'?(touch?'Low':'High'):P.quality;const t=TIERS[tier];res=1;hold=4;
 water.geometry.dispose();water.geometry=waterZ.geometry=radialGrid(t.seg);WU.uAng.value=Math.PI*2/t.seg;
 RL.forEach(l=>l.geometry.instanceCount=Math.floor(l.userData.n*t.rain));resize()}
addEventListener('resize',resize);

/* ===== 10. UI ===== */
const PRE={'Golden Hour':[17.6,0,[11,1,120,6,600,.9,.4,.45,1]],'Midday':[12,0,[9,.9,100,6,500,.85,.25,.4,1]],'Sunset':[18.25,0,[11,1,120,6,600,.9,.5,.6,1]],
 'Dawn':[5.85,0,[8,.9,100,6,600,.85,.45,.5,1]],'Storm':[15,1,[11,1,120,6,600,.9,.4,.45,1]],'Night':[23.5,0,[8,.9,100,6,600,.85,.3,.4,1.15]]};
const gui=new GUI({title:'Sea surface',width:250});if(touch)gui.close();
const refresh=()=>gui.controllersRecursive().forEach(c=>c.updateDisplay());
function applyPreset(n){const[h,s,b]=PRE[n];P.hour=h;target=s;b.forEach((v,i)=>B[i]=v);applyStorm();dirty=true;refresh()}
const ctl=(f,o,k,a,b,s)=>{const c=f.add(o,k,a,b,s).listen();const i=REF.findIndex(r=>r[0]===o&&r[1]===k);if(i>=0)c.onChange(v=>{if(storm<.01)B[i]=v});return c};
gui.add(P,'preset',Object.keys(PRE)).name('Preset').onChange(applyPreset);
gui.add(P,'height',.2,2.5,.01).name('Wave height').listen();gui.add(P,'hs').name('Hs (metres)').decimals(1).listen().disable();
gui.add(P,'quality',['Auto','Low','Medium','High']).onChange(setQuality);
let f=gui.addFolder('Sun & Sky');f.add(P,'hour',0,24,.01).listen();f.add(P,'play').name('play clock');f.add(P,'dayMin',1,30,1).name('minutes / day');
ctl(f,P,'cov',0,1,.01).name('cloudCoverage');ctl(f,P,'dens',0,1,.01).name('cloudDensity');
[['Wind Sea',WS],['Swell',SW]].forEach(([n,S])=>{f=gui.addFolder(n);
 ctl(f,S,'scale',0,3,.01);ctl(f,S,'wind',2,30,.1).name('windSpeed');f.add(S,'dir',-180,180,1).name('direction');
 ctl(f,S,'fetch',10,1000,1);f.add(S,'spread',0,1,.01).name('spreadBlend');f.add(S,'peak',1,7,.1).name('peakEnhancement');f.add(S,'swell',0,1,.01).name('swellness');f.add(S,'fade',0,1,.01).name('shortWavesFade');if(n==='Swell')f.close()});
f=gui.addFolder('Water');ctl(f,P,'chop',0,3,.01).name('choppiness');f.add(P,'clar',0,1,.01).name('clarity (see-through)');
f.add(P,'foamB',0,1.5,.01).name('foam bias');f.add(P,'foamS',.1,2,.01).name('foam scale');f.add(P,'foamC',0,1,.01).name('foam coverage');
f.add(P,'rough',.02,.4,.01).name('roughness');f.add(P,'foamDecay',.05,2,.01).name('foam recovery');f.add(P,'fog',0,2,.01);f.addColor(P,'body').name('deep colour');f.addColor(P,'bodyNoon').name('midday colour');f.add(P,'seabed').name('show seabed');
f=gui.addFolder('Post');ctl(f,P,'expo',.2,2,.01).name('exposure');
gui.onChange(()=>dirty=true);

const hud=$('#hud'),btn=(t,fn)=>{const b=document.createElement('button');b.textContent=t;b.onclick=fn;hud.append(b);return b};
btn('☰',()=>{const s=gui.domElement.style;s.display=s.display==='none'?'':'none'});
const pp=btn('⏸',()=>P.play=!P.play);
[['Dawn',5.9],['Noon',12],['Dusk',18.1],['Night',23.5]].forEach(([n,h])=>btn(n,()=>P.hour=h));
const st=document.createElement('input');st.type='range';st.min=0;st.max=100;st.value=0;st.oninput=()=>target=st.value/100;hud.append(st);
[['Clear',0],['Rough',.5],['Storm',1]].forEach(([n,v])=>btn(n,()=>target=v));
const wl=document.createElement('label'),wh=document.createElement('input');wl.textContent='Waves ';
Object.assign(wh,{type:'range',min:.2,max:2.5,step:.01,value:P.height,oninput:()=>{P.height=+wh.value;dirty=true}});wl.append(wh);hud.append(wl);

/* ===== 11. BOAT: hull from sea-storm, rigid-body buoyancy on the real FFT surface, 6 cameras, flip bar, touch pad ===== */
const {Group,Vector3,Euler,Quaternion}=THREE,tmpC=new Color();
const KIT=window.BoatKit.build(),boat=new Group(),hullG=KIT.root,shell=[];boat.add(hullG);Object.assign(boat,{heading:1.92,speed:0,power:0});scene.add(boat);   // real hull from the boat modules; bow (-Z) faces into the wind sea
const sunL=new THREE.DirectionalLight(0xffffff,2),hemi=new THREE.HemisphereLight(0xa8c8ee,0x20404e,.6);scene.add(sunL,hemi);
function boatLight(){KIT.uni.uNight.value=U.uNight.value;const day=U.uDay.value,L=U.uLight.value,c=U.uSunCol.value,m=Math.max(c.r,c.g,c.b,.01);
 sunL.position.copy(day>.1?U.uSun.value:U.uMoon.value).multiplyScalar(60);sunL.color.copy(c).multiplyScalar(1/m).lerp(tmpC.setRGB(.6,.7,1),1-day);
 sunL.intensity=2.8*day*(1-.55*storm)+.4*U.uNight.value;hemi.intensity=.12+.9*L}

/* --- GPU wave probe: samples the 3 FFT cascades at the hull's 8 buoyancy points (inverting the choppy horizontal shift), async read-back --- */
const NP=8,probeRT=new THREE.WebGLRenderTarget(NP,1,{type:FloatType,format:RGBAFormat,minFilter:NearestFilter,magFilter:NearestFilter,depthBuffer:false});
const probeU={uD0:WU.uD0,uD1:WU.uD1,uD2:WU.uD2,uLS:WU.uLS,uP:{value:Array.from({length:NP},()=>new THREE.Vector2())}};
const pScene=new Scene(),pCam=new OrthographicCamera(-1,1,1,-1,0,1),pGeo=new BufferGeometry();pGeo.setAttribute('position',new Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
const pMesh=new THREE.Mesh(pGeo,new ShaderMaterial({uniforms:probeU,depthTest:false,depthWrite:false,side:THREE.DoubleSide,vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`uniform sampler2D uD0,uD1,uD2;uniform vec3 uLS;uniform vec2 uP[${NP}];
void main(){vec2 P=uP[int(gl_FragCoord.x)],s=P;vec3 d=vec3(0.);
 for(int i=0;i<4;i++){d=textureLod(uD0,s/uLS.x,0.).xyz+textureLod(uD1,s/uLS.y,0.).xyz+textureLod(uD2,s/uLS.z,0.).xyz;s=P-d.xz;}   // surface point = grid + displacement
 gl_FragColor=vec4(d.y,d.x,d.z,1.);}`}));
pMesh.frustumCulled=false;pScene.add(pMesh);
const pbuf=new Float32Array(NP*4),pd=new Float32Array(NP*4);let pend=false,pvalid=false,pmode='async',pframes=0,fresh=false,sT=0,psT=0;
function probe(pts,t){
 pts.forEach((p,i)=>probeU.uP.value[i].set(p[0],p[1]));pframes++;
 const prev=renderer.getRenderTarget();renderer.setRenderTarget(probeRT);renderer.render(pScene,pCam);renderer.setRenderTarget(prev);
 const got=d=>{if(d&&d.length>=NP*4&&d[3]===1&&d[7]===1){pd.set(d.subarray?d.subarray(0,NP*4):d);pvalid=true}};
 if(pmode==='sync'){renderer.readRenderTargetPixels(probeRT,0,0,NP,1,pbuf);got(pbuf);fresh=pvalid;sT=t;return}
 if(pframes>150&&!pvalid)pmode='sync';
 if(pend)return;
 pend=true;try{const r=renderer.readRenderTargetPixelsAsync(probeRT,0,0,NP,1,pbuf);Promise.resolve(r).then(a=>{pend=false;got(a&&a.length?a:pbuf);if(pvalid){fresh=true;sT=t}}).catch(()=>{pend=false;pmode='sync'})}catch(e){pend=false;pmode='sync'}}
const analytic=(x,z,t)=>{const a=WS.dir*Math.PI/180,q=x*Math.cos(a)+z*Math.sin(a);return P.hs*.3*(Math.sin(.16*q-1.25*t)+.5*Math.sin(.35*q-1.85*t+1))};   // last-resort fallback

/* --- rigid-body buoyancy (ported from sea-storm): 8 points push up with depth, damped against the water's own vertical speed --- */
const BP=[[0,-3,.05],[-.75,-1.8,.13],[.75,-1.8,.13],[-1.1,.2,.19],[1.1,.2,.19],[-1,2.2,.13],[1,2.2,.13],[0,3,.05]],NB=8,G0=9.81,DR=.7,KH=G0/DR,CD=4,IP=6.8,IR=2.25,PHV=.95,
 TUNE={noise:.42,kick:1.1,tau:.12,cap:3,heave:0.9,roll:0,pitch:.8,lean:0,vmax:5,lead:0.9,fall:1.3,rise:.3,drag:0.3,slamDrag:2.5,floor:.15,floorK:40,deck:.5,deckK:8};   // sea-state difficulty knobs (window.sea.TUNE)
const FRE=[1.6,1.25,1.25,1.1,1.1,1,1,1],ZP=[],HH=new Float32Array(NB),WV=new Float32Array(NB),HF=new Float32Array(NB),WF=new Float32Array(NB);let zcg=0,KP=0,KR=0,slamCD=0,yaw=0,thrLever=0;
BP.forEach(b=>zcg+=b[1]*b[2]);BP.forEach((b,i)=>{ZP[i]=b[1]-zcg;KP+=b[2]*ZP[i]**2;KR+=b[2]*b[0]**2});KP*=KH;KR*=KH;
const S={y:0,vy:0,p:0,vp:0,r:0,vr:0,init:false},ST={evt:0,wash:0,cap:0,capT:0,capH:0,bal:0,roll:0,pitch:0,sev:0,hit:3,slam:0,flip:true,lean:0,bowW:1,midW:1,sternW:1,sprayE:0,hcd:0},keys=new Set();
const rightBoat=()=>{if(ST.cap===1||ST.cap===-1){ST.cap=2;ST.capT=0}};
function floatStep(dt,t){
 const VM=4+9*ST.sev;   // vertical-speed limits grow with the sea: the hull can climb steep faces
 const h=boat.heading,ch=Math.cos(h),sh=Math.sin(h),p=boat.position,speed=boat.speed,pts=BP.map(b=>[p.x+b[0]*ch+b[1]*sh,p.z-b[0]*sh+b[1]*ch]);
 probe(pts,t);if(!pvalid&&pframes<150)return;                       // wait for the first GPU sample
 if(pvalid){if(fresh){fresh=false;const d=sT-psT;for(let i=0;i<NB;i++){const H=pd[i*4];if(S.init&&d>1e-3)WV[i]+=(clamp((H-HH[i])/d,-VM,VM)-WV[i])*Math.min(1,d*7);HH[i]=H}psT=sT}}
 else for(let i=0;i<NB;i++){const H=analytic(pts[i][0],pts[i][1],t);WV[i]+=(clamp((H-HH[i])/dt,-VM,VM)-WV[i])*(1-Math.exp(-dt*7));HH[i]=H;sT=t}
 const LEAD=(TUNE.tau+.3*ST.sev)*TUNE.lead,age=Math.min(t-sT,.2),fa=1-Math.exp(-dt/(TUNE.tau+.3*ST.sev));let hm=0;   // low-pass the sampled water: the hull rides the swell, not the chop
 for(let i=0;i<NB;i++){const raw=HH[i]+WV[i]*age;HF[i]=S.init?HF[i]+(raw-HF[i])*fa:raw;WF[i]+=(WV[i]-WF[i])*fa;hm+=HF[i]*BP[i][2]}
 if(!S.init){S.y=hm;S.init=true;return}
 // sea severity -> roll forcing (the sea shakes the hull; steering is the counter), wave hits in rough water
 const sev=ST.sev=Math.max(clamp(P.hs/6,0,1),storm*.85),spN=Math.min(Math.abs(speed)/8,1),amp=sev*(.3+.7*spN),grp=.65+.35*Math.sin(t*.37+1.1);
 const nz=.55*Math.sin(t*1.85+.4)+.35*Math.sin(t*1.19+2.1)+.25*Math.sin(t*2.73+4),thd=TUNE.noise*amp*grp*nz;
 ST.hit-=dt;if(ST.hit<=0&&sev>.12&&!ST.pm){ST.pd=Math.random()<.5?-1:1;ST.pm=ST.pmT=(.35+.7*Math.random())*sev*(.3+.7*spN)*TUNE.kick;ST.pw=.3;ST.hit=(2.2+3.5*Math.random())/(.5+.5*sev)}   // wave hit: 0.55 s warning on the bar, then a 0.4 s push (not an instant jolt)
 if(ST.pm){if(ST.pw>0)ST.pw-=dt;else{const a=Math.min(ST.pm,ST.pmT*dt/.22);S.vr+=ST.pd*a;ST.pm-=a;if(ST.pm<1e-3)ST.pm=0}}
 const trim=.055*Math.tanh(speed/4)-.012*Math.tanh(Math.max(0,-boat.power)/2),ks=1-.35*sev,heel=clamp(.062*yaw*(1.5+Math.abs(speed))+TUNE.lean*ST.lean*(.4+.6*Math.min(1,Math.abs(speed)/3)),-.68,.68),trimT=KP*trim,heelT=KR*(heel+thd);
 const off2=TUNE.rise*sev-.05*Math.tanh(speed/5)-.5*clamp((Math.abs(S.r)-1)/1.6,0,1)+(ST.cap===2?.45*Math.sin(Math.PI*clamp(ST.capT/1.8,0,1)):0),n=Math.max(1,Math.ceil(dt/.008)),sd=dt/n;
 let wsh=0;
 for(let k=0;k<n;k++){
  const sp=Math.sin(S.p),cs=Math.cos(S.p),sr=Math.sin(S.r),tau=(k+1)*sd-dt;let fy=0,mp=0,mr=0;
  for(let b=0;b<NB;b++){const lx=BP[b][0],lz=ZP[b],w=BP[b][2],e=HF[b]+WF[b]*(tau+LEAD)-(S.y-off2+lx*sr*cs-lz*sp);   // e>0: point under water
   if(e<=-DR)continue;const xx=e/DR,rel=(S.vy+lx*S.vr-lz*S.vp)-WF[b],sub=clamp((e+.25*DR)/(.25*DR),0,1);
   let f=w*G0*Math.min(1+xx+(xx>0?.4*xx*xx:0),TUNE.cap)-w*CD*clamp(rel,-VM-1,VM+1)*sub*(1+.6*clamp(-rel/4,0,1));{const er=HH[b]+WV[b]*(age+tau)-(S.y+lx*sr*cs-lz*sp)-TUNE.deck*FRE[b];if(er>0){f+=w*G0*TUNE.deckK*er/DR-w*CD*clamp(rel,-VM,VM)*.6*clamp(er,0,1);wsh=Math.max(wsh,er)}}   // water reaching the gunwale pushes that corner of the hull up: it climbs the wave
   if(f<0)f=0;fy+=f;mp-=f*lz;mr+=f*lx}
  const air=clamp(1-fy/(.5*G0),0,1);const dfc=hm+TUNE.rise*sev-TUNE.floor-S.y;S.vy=clamp(S.vy+(fy-G0*(1+TUNE.fall*air)-TUNE.heave*S.vy+(dfc>0?TUNE.floorK*dfc-3*Math.min(S.vy,0)*Math.min(dfc,1):0))*sd,-TUNE.vmax*(1+1.6*sev),TUNE.vmax*(1+1.6*sev));S.vp+=((mp+trimT)/IP-TUNE.pitch*S.vp)*sd;
  if(ST.cap===0)S.vr+=(((mr*ks+heelT-S.vr)/IR)-(TUNE.roll+.4*sev)*S.vr)*sd;else if(ST.cap===2)S.vr+=((KR*1.05*(0-S.r)-8*S.vr)/IR)*sd;else S.vr+=((KR*Math.sin(ST.cap*Math.PI-S.r)-5.2*S.vr)/IR)*sd;
  S.vr=clamp(S.vr,-2.2,2.2);S.y+=S.vy*sd;S.p+=S.vp*sd;S.r+=S.vr*sd;if(S.p>.7||S.p<-.7){S.p=clamp(S.p,-.7,.7);S.vp*=.5}
  const rl=ST.cap===0?(ST.flip?1.3:.9):3.9;if(S.r>rl||S.r<-rl){S.r=clamp(S.r,-rl,rl);S.vr*=.3}}
 ST.wash=wsh;
 // capsize / recovery
 if(ST.flip){if(ST.cap===0){if(Math.abs(S.r)>PHV)ST.capH+=dt;else ST.capH=Math.max(0,ST.capH-dt*2);
   if(ST.capH>.1+.12*sev||Math.abs(S.r)>1.25){ST.cap=S.r>0?1:-1;ST.capT=0;ST.capH=0;ST.slam=1;S.vy-=.8;S.vp-=.35}}
  else if(ST.cap===2){ST.capT+=dt;if((ST.capT>1.4&&Math.abs(S.r)<.12&&Math.abs(S.vr)<.5)||ST.capT>4.5){ST.cap=0;if(ST.capT>4.5){S.r=0;S.vr=0}}}
  else{ST.capT+=dt;if(ST.capT>7){ST.cap=2;ST.capT=0}}}else ST.cap=0;
 ST.bal=clamp(S.r/PHV,-1.3,1.3);
 slamCD-=dt;const bowRel=S.vy+BP[0][0]*S.vr-ZP[0]*S.vp-WV[0];let slam=0;
 if(bowRel<-1.7&&slamCD<=0){slam=clamp((-bowRel-1.7)/3,0,1);if(slam>.08){slamCD=.4;S.vp-=slam*.3;ST.evt=slam}}
 ST.slam=Math.max(ST.slam*Math.exp(-dt*5),slam);
 {const sr=Math.sin(S.r),cs=Math.cos(S.r),sp=Math.sin(S.p),em=b=>HF[b]+WF[b]*LEAD-(S.y-off2+BP[b][0]*sr*cs-ZP[b]*sp),k=1-Math.exp(-dt*9);   // em > 0: that hull point is under water
  ST.bowW+=(sstep(-.3,.25,(em(0)*2+em(1)+em(2))/4)-ST.bowW)*k;ST.midW+=(sstep(-.3,.25,(em(3)+em(4))/2)-ST.midW)*k;ST.sternW+=(sstep(-.3,.25,(em(5)+em(6)+em(7))/3)-ST.sternW)*k;   // bow / waist / stern wetness 0..1
  const rise=clamp((-bowRel-.5)/3.5,0,1)*ST.bowW;   // water rushing up at the wetted bow = a wave hitting it
  ST.sprayE=Math.max(ST.sprayE*Math.exp(-dt*2.4),rise,slam);   // spray energy: jumps on a hit or slam, then decays
  if((ST.hcd-=dt)<=0&&rise>.3&&!slam){ST.evt=Math.max(ST.evt,rise*.55);ST.hcd=.5}}
 if(!isFinite(S.y+S.vy+S.p+S.r)){Object.assign(S,{y:hm,vy:0,p:0,vp:0,r:0,vr:0});ST.cap=0}
 const wob=1+2*storm;ST.pitch=S.p+.003*wob*Math.sin(t*1.13)+.002*wob*Math.sin(t*2.3+1.7);ST.roll=S.r+.004*wob*Math.sin(t*.71+2)+.002*wob*Math.sin(t*1.9);
 p.y=S.y;boat.quaternion.setFromEuler(new Euler(ST.pitch,h,ST.roll,'YXZ'))}

/* --- floating test objects: buoys, barrels, crates, a log, a striped spar and hanging rings/spheres that reach 10-24 m down.
   Opaque meshes below y=0 draw before the water, which blends over them: this is the see-through test. Heights come from a second GPU wave probe. --- */
const FN=11,fU={uD0:WU.uD0,uD1:WU.uD1,uD2:WU.uD2,uLS:WU.uLS,uP:{value:Array.from({length:FN},()=>new THREE.Vector2())}};
const fRT=new THREE.WebGLRenderTarget(FN,1,{type:FloatType,format:RGBAFormat,minFilter:NearestFilter,magFilter:NearestFilter,depthBuffer:false});
const fScene=new Scene(),fMesh=new THREE.Mesh(pGeo,new ShaderMaterial({uniforms:fU,depthTest:false,depthWrite:false,side:THREE.DoubleSide,vertexShader:pMesh.material.vertexShader,fragmentShader:pMesh.material.fragmentShader.replace('uP['+NP+']','uP['+FN+']')}));
fMesh.frustumCulled=false;fScene.add(fMesh);
const fbuf=new Float32Array(FN*4),fh=new Float32Array(FN);let fpend=false,fsync=false,fgot=false;
const fTake=d=>{if(d&&d.length>=FN*4&&d[3]===1){for(let i=0;i<FN;i++)fh[i]=d[i*4];fgot=true}};
function fProbe(){
 const prev=renderer.getRenderTarget();renderer.setRenderTarget(fRT);renderer.render(fScene,pCam);renderer.setRenderTarget(prev);
 if(fsync||pmode==='sync'){renderer.readRenderTargetPixels(fRT,0,0,FN,1,fbuf);fTake(fbuf);return}
 if(fpend)return;fpend=true;
 try{const r=renderer.readRenderTargetPixelsAsync(fRT,0,0,FN,1,fbuf);Promise.resolve(r).then(a=>{fpend=false;fTake(a&&a.length?a:fbuf)}).catch(()=>{fpend=false;fsync=true})}catch(e){fpend=false;fsync=true}}