const test=require('node:test'),assert=require('node:assert/strict');
const {save}=require('./session-files.js');
test('browser export confirms only after writing and closing the chosen file',async()=>{
  const actions=[];
  const result=await save('{"session":true}','version.seatflow.json',{showSaveFilePicker:async options=>{
    assert.equal(options.suggestedName,'version.seatflow.json');
    return {name:'renamed.json',createWritable:async()=>({write:async text=>actions.push(text),close:async()=>actions.push('closed')})};
  }});
  assert.deepEqual(actions,['{"session":true}','closed']);assert.deepEqual(result,{confirmed:true,name:'renamed.json'});
});
test('cancelling the file picker does not start another download',async()=>{
  const error=Object.assign(new Error('cancelled'),{name:'AbortError'});
  await assert.rejects(save('{}','session.json',{showSaveFilePicker:async()=>{throw error;}}),e=>e===error);
});
test('write failure aborts the stream and is not reported as saved',async()=>{
  let aborted=false;
  await assert.rejects(save('{}','session.json',{showSaveFilePicker:async()=>({createWritable:async()=>({write:async()=>{throw Error('disk full');},abort:async()=>{aborted=true;}})})}),/disk full/);
  assert.equal(aborted,true);
});
test('download fallback exports the contents but requires confirmation',async()=>{
  const actions=[],link={click(){actions.push('clicked');},remove(){actions.push('removed');}};
  const result=await save('{"test":1}','session.seatflow.json',{
    Blob,URL:{createObjectURL(blob){assert.equal(blob.type,'application/json');return 'blob:test';},revokeObjectURL:url=>actions.push(url)},
    document:{createElement:()=>link,body:{append:()=>actions.push('appended')}},setTimeout:fn=>fn()
  });
  assert.equal(link.download,'session.seatflow.json');assert.equal(link.href,'blob:test');
  assert.deepEqual(actions,['appended','clicked','removed','blob:test']);assert.equal(result.confirmed,false);
});
