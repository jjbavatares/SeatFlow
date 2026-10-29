/* Browser-only session exports. No session content leaves this device. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SeatSessionFiles=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  async function save(snapshot,name,env=window){
    const url=env.URL.createObjectURL(new env.Blob([snapshot],{type:'application/json'}));
    const link=env.document.createElement('a');
    link.href=url;link.download=name;link.hidden=true;env.document.body.append(link);
    try{link.click();}finally{link.remove();env.setTimeout(()=>env.URL.revokeObjectURL(url),60000);}
    // A download being requested does not prove that the file was saved.
    return {confirmed:false,name};
  }
  return {save};
});
