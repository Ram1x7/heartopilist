import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {BUILD_RULES, calculateLoad, validateGrid} from '../js/build-rules.mjs';

test('existing editor counts every stacked pillar and uses corrected per-mode limits',()=>{
  const source=fs.readFileSync(new URL('../js/build.js',import.meta.url),'utf8')
    .replace(/^import .*;$/gm,'').replace(/\ninitBuildPage\(\);\s*$/,'');
  const context=vm.createContext({BUILD_RULES,calculateLoad,validateGrid,document:{addEventListener(){}},console});
  vm.runInContext(source,context);
  const result=vm.runInContext(`
    resultDims={w:1,h:3,d:1};
    resultVoxels=[0,1,2].map(y=>({x:0,y,z:0,materialId:'006',hex:'#ffffff',name:'木製支柱'}));
    const counts=computeBuildPillarSegments();
    settings.mode='solid'; const solidAspect=cellAspectRatio();
    settings.mode='wall'; const wallAspect=cellAspectRatio();
    JSON.stringify({count:counts.length,heights:counts.map(v=>v.height),load:calculateLoad(resultVoxels),wallMax:WALL_MAX_HEIGHT_TIERS,pillarMax:SITE_MAX_HEIGHT,solidAspect,wallAspect});
  `,context);
  assert.deepEqual(JSON.parse(result),{count:3,heights:[1,1,1],load:220,wallMax:13,pillarMax:17,solidAspect:0.5,wallAspect:2});
});
