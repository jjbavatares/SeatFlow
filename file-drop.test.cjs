const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(active=true){
  const docListeners={},winListeners={},classes=new Set(),nodes=new Map(),imported=[],messages=[];
  const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},click(){}});return nodes.get(id);};
  const context={Array,document:{addEventListener:(name,fn)=>docListeners[name]=fn},window:{addEventListener:(name,fn)=>winListeners[name]=fn},$:node,rosterBusy:false,fileDragDepth:0,currentScreen:active?'setup':'editor',importRosterFile:f=>imported.push(f),toast:m=>messages.push(m)};
  const app=fs.readFileSync(require('node:path').join(__dirname,'app.js'),'utf8');const start=app.indexOf('  const hasFiles='),end=app.indexOf('  async function openSession',start);assert.ok(start>0&&end>start);vm.runInNewContext(app.slice(start,end),context);
  function fire(name,files,types=['Files']){let prevented=false;const event={dataTransfer:{types,files},preventDefault(){prevented=true;},relatedTarget:{}};docListeners[name](event);return{prevented,event};}
  return{fire,imported,messages,classes,nodes,winListeners};
}
test('arrossegar un fitxer destaca la zona i importa en deixar-lo anar',()=>{const h=harness(),file={name:'llista.docx'};assert.equal(h.fire('dragenter',[file]).prevented,true);assert.equal(h.classes.has('drag-over'),true);assert.equal(h.fire('dragover',[file]).event.dataTransfer.dropEffect,'copy');assert.equal(h.fire('drop',[file]).prevented,true);assert.deepEqual(h.imported,[file]);assert.equal(h.classes.has('drag-over'),false);});
test('diversos fitxers es rebutgen sense substituir la llista',()=>{const h=harness();h.fire('drop',[{name:'a.pdf'},{name:'b.pdf'}]);assert.equal(h.imported.length,0);assert.match(h.messages[0],/un sol document/);});
test('fora de preparacio impedeix que el navegador obri el fitxer arrossegat',()=>{const h=harness(false);assert.equal(h.fire('drop',[{name:'a.pdf'}]).prevented,true);assert.equal(h.imported.length,0);assert.match(h.messages[0],/preparació/);});
test('arrossegar noms interns no activa la importacio de fitxers',()=>{const h=harness();assert.equal(h.fire('drop',[],['application/x-seatflow-student']).prevented,false);assert.equal(h.imported.length,0);});
