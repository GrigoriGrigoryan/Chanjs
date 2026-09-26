'use strict';
// Phase-1 repeatability check: risky offer under each internal state across N
// seeds. Usage: node tools/sweep_seeds.cjs [seeds=20] [offer=risky|safe]
// Condition parameters mirror app.js; keep them in sync if those change.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..');
const FlyBrain=require(path.join(root,'model.js')),FlyBody=require(path.join(root,'body.js'));
const scope={};vm.runInNewContext(fs.readFileSync(path.join(root,'data/connectome.js'),'utf8'),scope);
const modScope={};vm.runInNewContext(fs.readFileSync(path.join(root,'data/modulators.js'),'utf8'),modScope);
const {meta,base64}=scope.FlyData,packed=zlib.gunzipSync(Buffer.from(base64,'base64'));
const at=packed.byteOffset,bytes=packed.buffer,n=meta.neuronCount,m=meta.edgeCount,o=meta.byteOffsets;
const ids=new BigUint64Array(bytes,at+o.ids,n),byRoot=new Map([...ids].map((id,i)=>[String(id),i]));
const groups={...meta.groups};for(const [name,roots] of Object.entries(modScope.ModulationData.groups))groups[name]=roots.map(r=>byRoot.get(String(r)));
const data={offsets:new Uint32Array(bytes,at+o.offsets,n+1),targets:new Uint32Array(bytes,at+o.targets,m),weights:new Int16Array(bytes,at+o.weights,m),ids,groups};
const conditions={baseline:null,daReward:{source:'daReward',rateHz:90,impulse:.0005,tauMs:500,thresholdShift:1.15},daAversive:{source:'daAversive',rateHz:110,impulse:.009,tauMs:500,thresholdShift:-1.15},octopamine:{source:'octopamine',rateHz:90,impulse:.0007,tauMs:500,thresholdShift:.55}};
const seeds=Number(process.argv[2])||20,offer=process.argv[3]==='safe'?[120,0]:[200,45],threshold=.85;
const mn9=new Set(groups.mn9);
for(const [name,c] of Object.entries(conditions)){
  const peaks=[];
  for(let s=0;s<seeds;s++){
    const brain=new FlyBrain(data,12648430+s),body=new FlyBody();body.drop={x:105,y:23,radius:27};
    if(c){brain.setInputProgram(c.source,{rateHz:c.rateHz,startMs:0,durationMs:3000});brain.setModulators({[name]:{...c,target:'mn9'}});}
    brain.setRates(...offer);
    let peak=0;
    for(let tick=0;tick<30000;tick++){let out=0;for(const i of brain.step())if(mn9.has(i))out++;body.step(.1,out);peak=Math.max(peak,body.extension);}
    peaks.push(peak);
  }
  const accept=peaks.filter(p=>p>=threshold).length,mean=peaks.reduce((a,b)=>a+b)/seeds;
  const sd=Math.sqrt(peaks.reduce((a,p)=>a+(p-mean)**2,0)/(seeds-1));
  console.log(`${name.padEnd(11)} accept ${String(accept).padStart(2)}/${seeds}  peak ${mean.toFixed(3)} ± ${sd.toFixed(3)}  [${Math.min(...peaks).toFixed(3)}–${Math.max(...peaks).toFixed(3)}]`);
}
