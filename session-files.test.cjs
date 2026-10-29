const test=require('node:test'),assert=require('node:assert/strict');
const {save}=require('./session-files.js');
function browser(fail=false){
  const actions=[],link={click(){actions.push('clicked');if(fail)throw Error('blocked');},remove(){actions.push('removed');}};
  let exported;
  return {actions,link,get exported(){return exported;},env:{
    Blob,URL:{createObjectURL(blob){exported=blob;return 'blob:test';},revokeObjectURL:url=>actions.push(url)},
    document:{createElement:()=>link,body:{append:()=>actions.push('appended')}},setTimeout:fn=>fn()
  }};
}
test('web export preserves the complete session and requests download confirmation',async()=>{
  const b=browser(),snapshot=JSON.stringify({students:[{name:'Anna',surname:'Exemple'}],items:[{angle:90}],orientation:'vertical'});
  const result=await save(snapshot,'version.seatflow.json',b.env);
  assert.equal(await b.exported.text(),snapshot);assert.equal(b.exported.type,'application/json');
  assert.equal(b.link.download,'version.seatflow.json');assert.equal(b.link.href,'blob:test');
  assert.deepEqual(b.actions,['appended','clicked','removed','blob:test']);assert.deepEqual(result,{confirmed:false,name:'version.seatflow.json'});
});
test('a failed download cleans up resources and does not report success',async()=>{
  const b=browser(true);await assert.rejects(save('{}','session.json',b.env),/blocked/);
  assert.deepEqual(b.actions,['appended','clicked','removed','blob:test']);
});
