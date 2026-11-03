import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{Quota,modelFailure,decodePlanText} from '../ai-worker/worker.mjs';

test('quota reservations serialize concurrent clients and never exceed limits',async()=>{
  let record, tail=Promise.resolve();
  const quota=new Quota({storage:{transaction(fn){
    const task=tail.then(()=>fn({get:async()=>structuredClone(record),put:async(_,v)=>{record=structuredClone(v);}}));
    tail=task.catch(()=>{});return task;
  }}});
  const reserve=client=>quota.fetch(new Request('https://quota/reserve',{method:'POST',body:JSON.stringify({client,globalLimit:4,clientLimit:2,minuteLimit:4})})).then(r=>r.json());
  assert.equal((await Promise.all(Array.from({length:8},()=>reserve('same')))).filter(x=>x.allowed).length,2);
  assert.equal((await Promise.all(Array.from({length:8},(_,i)=>reserve('other'+i)))).filter(x=>x.allowed).length,2);
});
test('unconfigured deployment fails closed; origin and method are checked',async()=>{
  const env={ALLOWED_ORIGIN:'https://ram1x7.github.io'};
  const req=(origin,method='POST')=>new Request('https://worker/generate',{method,headers:{Origin:origin}});
  assert.equal((await worker.fetch(req(env.ALLOWED_ORIGIN),env)).status,503);
  assert.equal((await worker.fetch(req('https://attacker.example'),env)).status,403);
  assert.equal((await worker.fetch(req(env.ALLOWED_ORIGIN,'GET'),env)).status,405);
  assert.equal((await worker.fetch(req(env.ALLOWED_ORIGIN,'OPTIONS'),env)).status,204);
});

test('owner-authenticated generation reserves quota and makes one bounded model call',async()=>{
  const originalFetch=globalThis.fetch;
  let apiCalls=0,reservations=0,modelPlan;
  const plan={title:'試験',shapes:[{shape:'box',op:'add',x:0,y:0,z:0,w:2,h:2,d:2,materialId:'006',hex:'#ffffff'}]};
  modelPlan=plan;
  const env={ALLOWED_ORIGIN:'https://ram1x7.github.io',ENABLED:'true',FREE_TIER_CONFIRMED:'true',GEMINI_MODEL:'gemini-3.5-flash-lite',GEMINI_API_KEY:'test',PRIVATE_TRIAL_ONLY:'true',PRIVATE_TRIAL_TOKEN:'t'.repeat(20),CLIENT_HASH_SECRET:'test',DAILY_GLOBAL_LIMIT:'20',DAILY_CLIENT_LIMIT:'2',MINUTE_GLOBAL_LIMIT:'2',QUOTA:{idFromName:n=>n,get:()=>({fetch:async()=>{reservations++;return Response.json({allowed:true});}})}};
  globalThis.fetch=async(url,init)=>{
    apiCalls++;
    const sent=JSON.parse(init.body);
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
    assert.deepEqual(sent.generationConfig,{responseFormat:{text:{mimeType:'APPLICATION_JSON'}},maxOutputTokens:6000});
    assert.match(sent.systemInstruction.parts[0].text,/\"materialId\"/);
    assert.equal(sent.generationConfig.maxOutputTokens,6000);
    assert.equal(init.headers['x-goog-api-key'],'test');
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(modelPlan)}]}}]});
  };
  try{
    const response=await worker.fetch(new Request('https://worker/generate',{method:'POST',headers:{Origin:env.ALLOWED_ORIGIN,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1','Authorization':'Bearer '+'t'.repeat(20)},body:JSON.stringify({prompt:'小さなお城',limits:{w:8,h:4,d:8}})}),env);
    assert.equal(response.status,200); assert.deepEqual((await response.json()).plan,plan);
    assert.equal(apiCalls,1);assert.equal(reservations,1);
    // JSON mode is not a trust boundary: reject malformed, out-of-bounds and unknown-material output.
    for (const changed of [{w:0},{materialId:'999'},{x:NaN}]) {
      modelPlan={...plan,shapes:[{...plan.shapes[0],...changed}]};
      const rejected=await worker.fetch(new Request('https://worker/generate',{method:'POST',headers:{Origin:env.ALLOWED_ORIGIN,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1','Authorization':'Bearer '+'t'.repeat(20)},body:JSON.stringify({prompt:'小さなお城',limits:{w:8,h:4,d:8}})}),env);
      assert.equal(rejected.status,502);
      const failure=await rejected.json();
      assert.ok(!failure.plan);
      assert.match(failure.error,/処理: validation/);
    }
    assert.equal(apiCalls,4);assert.equal(reservations,4);
    modelPlan={...plan,shapes:[{...plan.shapes[0],x:20,w:20}]};
    const fitted=await worker.fetch(new Request('https://worker/generate',{method:'POST',headers:{Origin:env.ALLOWED_ORIGIN,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1','Authorization':'Bearer '+'t'.repeat(20)},body:JSON.stringify({prompt:'小さなお城',limits:{w:8,h:4,d:8}})}),env);
    assert.equal(fitted.status,200);
    const fittedBody=await fitted.json();
    assert.ok(fittedBody.adjustment.scale<1);
    assert.ok(fittedBody.plan.shapes[0].x+fittedBody.plan.shapes[0].w<=8);
    const failures=[
      [async()=>{throw new DOMException('sensitive provider detail','TimeoutError');},/50秒.*network/],
      [async()=>new Response('non-JSON provider body'),/処理: response/],
      [async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'invalid JSON sensitive'}]}}]}),/処理: json/],
    ];
    for (const [mock,expected] of failures) {
      globalThis.fetch=mock;
      const rejected=await worker.fetch(new Request('https://worker/generate',{method:'POST',headers:{Origin:env.ALLOWED_ORIGIN,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1','Authorization':'Bearer '+'t'.repeat(20)},body:JSON.stringify({prompt:'小さなお城',limits:{w:8,h:4,d:8}})}),env);
      assert.equal(rejected.status,502);
      const failure=await rejected.json();
      assert.match(failure.error,expected);
      assert.doesNotMatch(failure.error,/sensitive|provider body/);
    }
  }finally{globalThis.fetch=originalFetch;}
});


test('private trial refuses missing keys before external calls', async()=>{
  const env={ALLOWED_ORIGIN:'https://ram1x7.github.io',ENABLED:'true',FREE_TIER_CONFIRMED:'true',GEMINI_API_KEY:'test',CLIENT_HASH_SECRET:'test',QUOTA:{},PRIVATE_TRIAL_ONLY:'true',PRIVATE_TRIAL_TOKEN:'t'.repeat(20)};
  const request=new Request('https://worker/generate',{method:'POST',headers:{Origin:env.ALLOWED_ORIGIN}});
  assert.equal((await worker.fetch(request,env)).status,401);
  assert.equal((await worker.fetch(request,{...env,PRIVATE_TRIAL_ONLY:'false'})).status,503);
  assert.equal((await worker.fetch(request,{...env,PRIVATE_TRIAL_TOKEN:'t'.repeat(19)})).status,503);
});

 test('upstream failures identify HTTP status without exposing upstream secrets or prompts',async()=>{
  for (const status of [400,401,403,404,429,500]) {
    const result=await modelFailure(Response.json({error:{message:'SECRET_KEY private prompt',details:[{reason:'unsafe SECRET_KEY'}]}},{status}),['SECRET_KEY','private prompt']);
    assert.match(result.error,new RegExp('Gemini HTTP '+status));
    assert.doesNotMatch(result.error,/SECRET_KEY|private prompt/);
  }
  const invalid=await modelFailure(Response.json({error:{details:[{reason:'API_KEY_INVALID'}]}},{status:400}));
  assert.match(invalid.error,/GEMINI_API_KEY/);
  assert.match(invalid.error,/API_KEY_INVALID/);
  const plain=await modelFailure(new Response('sensitive upstream text',{status:502}));
  assert.match(plain.error,/HTTP 502/);
  assert.doesNotMatch(plain.error,/sensitive/);
});

test('400 diagnostics show provider explanation but redact configured secrets and escaped prompts',async()=>{
 const key='AIza'+'a'.repeat(35), token='owner-token-20-chars!', prompt='my \"private\" design';
 const response=Response.json({error:{message:`Invalid JSON payload: Unknown name responseJsonSchema. ${key} ${token} ${JSON.stringify(prompt)} Bearer unlisted-secret`}}, {status:400});
 const result=await modelFailure(response,[key,token,prompt]);
 assert.match(result.error,/Unknown name responseJsonSchema/);
 for(const value of [key,token,'private','unlisted-secret']) assert.ok(!result.error.includes(value));
 const long=await modelFailure(Response.json({error:{message:'x'.repeat(10000)}},{status:400}));
 assert.ok(long.error.length<850);
});

test('model JSON decoder tolerates a complete fence, but never repairs invalid documents',()=>{
 const plan={title:'test',shapes:[]};
 assert.deepEqual(decodePlanText('```json\n'+JSON.stringify(plan)+'\n```'),plan);
 assert.deepEqual(decodePlanText('\ufeff '+JSON.stringify(plan)),plan);
 assert.throws(()=>decodePlanText('{"title":"unfinished"'));
 assert.throws(()=>decodePlanText('explanation '+JSON.stringify(plan)));
});
