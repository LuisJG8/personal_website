import test from 'node:test';
import assert from 'node:assert/strict';
import {ROWS, samplePath, binomialProbabilities, moments} from '../src/galton/lib/probability.ts';
test('exact binomial model normalizes and has the required moments',()=>{
 const p=binomialProbabilities();
 assert.ok(Math.abs(p.reduce((a,b)=>a+b,0)-1)<1e-12);
 for(let k=0;k<=ROWS;k++)assert.equal(p[k],p[ROWS-k]);
 const {mean,deviation}=moments(p);assert.equal(mean,8);assert.equal(deviation,2);
});
test('independent seeded ball paths converge without imposing a histogram',()=>{
 let seed=78231;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const counts=Array(ROWS+1).fill(0),n=200_000;
 for(let i=0;i<n;i++){const path=samplePath(ROWS,random);assert.equal(path.length,17);for(let j=1;j<path.length;j++)assert.ok(path[j]===path[j-1]||path[j]===path[j-1]+1);counts[path[ROWS]]++;}
 const m=moments(counts);assert.ok(Math.abs(m.mean-8)<.025);assert.ok(Math.abs(m.deviation-2)<.025);
 const p=binomialProbabilities();let chi2=0;for(let k=0;k<=ROWS;k++){const expected=n*p[k];if(expected>=5)chi2+=(counts[k]-expected)**2/expected;}assert.ok(chi2<45,`chi-square ${chi2}`);
 console.log(JSON.stringify({balls:n,mean:m.mean,deviation:m.deviation,chi2,counts}));
});
test('leftmost and rightmost routes are possible and independent of packing',()=>{assert.equal(samplePath(ROWS,()=>0).at(-1),0);assert.equal(samplePath(ROWS,()=>.999).at(-1),16);});
