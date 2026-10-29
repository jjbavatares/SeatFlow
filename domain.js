(function(root){
  'use strict';
  const uid=()=>globalThis.crypto?.randomUUID?.()||`sf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const dimensions=o=>o==='horizontal'?{w:1440,h:960}:{w:960,h:1440};
  const norm=a=>((a%360)+360)%360;
  const finite=n=>typeof n==='number'&&Number.isFinite(n);
  const clean=s=>String(s||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,160);
  const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
  function rosterMetadata(line,className=''){
    const n=normalized(line);if(!n)return true;
    if(className&&n===normalized(className))return true;
    if(/^(?:curs|curso|grup|grupo|classe|clase|aula|escola|colegi|colegio|institut|instituto|centre|centro|tutor|tutora|professor|professora|profesor|profesora|data|fecha|pagina|page|llistat|listado|llista|lista|relacio|relacion)(?:\s|$)/.test(n))return true;
    if(/^(?:educacio|educacion|ensenyament|ensenanza)\s/.test(n))return true;
    if(/^\d{1,2}\s*(?:r|n|t|e|er|on|rt|st|nd|rd|th|o|a)?\s*(?:eso|primaria|infantil|batxillerat|bachillerato)?\s*[a-z]?(?:\s*(?:eso|primaria|infantil|batxillerat|bachillerato))?$/.test(n))return true;
    if(/^\d{4}\s+\d{4}$/.test(n)||/^\d+(?:\s+\d+)*$/.test(n))return true;
    if(/^(?:n|num|numero|num alumne|num alumno|ordre)\s+(?:nom|nombre|cognom|apellid)/.test(n))return true;
    if(n.split(' ').every(t=>['nom','noms','nombre','cognom','cognoms','apellido','apellidos','grup','grupo','curs','curso','primer','segon','1r','2n','i','y','alumne','alumnes','alumno','alumnos','n','num','numero','ordre'].includes(t)))return true;
    if(/^(?:nom(?:s)?(?: i cognoms?)?|alumnes?|alumnos?|nombre(?: y apellidos?)?|nom(?:s)?\s+(?:primer )?cognoms?(?:\s+segon cognom)?|nombre\s+apellidos?|cognoms?\s+nom|apellidos?\s+nombre)$/.test(n))return true;
    return false;
  }
  function removeClassCodes(line){return line.replace(/[1-6]\s*(?:r|n|t|è|é|er|o|º|°)?\s*(?:ESO|BATX(?:ILLERAT)?|BACH(?:ILLERATO)?|PRIM[AÀ]RIA|INFANTIL)(?:\s*[-–]?\s*[A-Z]\b)?/gi,' ').replace(/\b[1-6]\s*(?:r|n|t|è|é|er)\s*[-–]?\s*[A-F]\b/gi,' ').replace(/ +/g,' ').trim();}
  function parseNames(text,options={}){
    return String(text).split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!rosterMetadata(s,options.className)).map(s=>removeClassCodes(s.replace(/^\s*(?:(?:\[\d+\]|\(\d+\)|\d+[.)\-:º°]+)\s*|\d+\s+|[•·]\s*)/,''))).filter(s=>s&&!rosterMetadata(s,options.className)).map(line=>{
      let name='',surname='',uncertain=false;
      const cells=line.split(/\t|;/).map(s=>s.trim()).filter(Boolean);
      if(cells.length>1){name=cells[0];surname=cells[1];uncertain=true;}
      else if(line.includes(',')){const a=line.split(',');surname=a[0].trim().split(/\s+/)[0];name=a.slice(1).join(' ').trim();uncertain=true;}
      else{const p=line.split(/\s+/);if(p.length===1){name=p[0];uncertain=true;}else if(p.length===2){[name,surname]=p;}else{name=p.slice(0,-2).join(' ');surname=p.at(-2);uncertain=p.length!==3||p.some(x=>/^(de|del|la|las|los|d'|i|y|san|santa)$/i.test(x));}}
      return{id:uid(),name:clean(name),surname:clean(surname),full:clean(line),uncertain};
    }).slice(0,200);
  }
  const item=(kind,x,y,extra={})=>({id:uid(),kind,x,y,angle:0,group:null,student:null,textAngle:null,...extra});
  function create(meta,students){
    const s={format:'SeatFlow',version:1,meta:{className:clean(meta.className),teacher:clean(meta.teacher),date:meta.date},orientation:meta.orientation==='horizontal'?'horizontal':'vertical',deskSize:100,gridEnabled:true,snapEnabled:true,layout:'empty',desiredCount:meta.count||students.length,students:clone(students),items:[],mainTeacher:null};
    const{w,h}=dimensions(s.orientation);const t=item('teacher',w/2,h-165);s.mainTeacher=t.id;
    s.items=[t,item('board',w/2,h-22),item('door',22,h-155,{angle:90}),item('window',w-22,h*.43,{angle:90})];return s;
  }
  function size(it,s){const scale=s.deskSize/100;switch(it.kind){case'desk':return{w:108*scale,h:86*scale};case'teacher':return{w:176,h:111};case'board':return{w:365,h:18};case'window':return{w:225,h:22};case'door':return{w:115,h:115};default:return{w:50,h:50};}}
  function bounds(it,s){const d=size(it,s),a=it.angle*Math.PI/180;return{x:it.x,y:it.y,w:Math.abs(d.w*Math.cos(a))+Math.abs(d.h*Math.sin(a)),h:Math.abs(d.w*Math.sin(a))+Math.abs(d.h*Math.cos(a))};}
  function boundSet(items,s){const b=items.map(it=>bounds(it,s));return{left:Math.min(...b.map(b=>b.x-b.w/2)),right:Math.max(...b.map(b=>b.x+b.w/2)),top:Math.min(...b.map(b=>b.y-b.h/2)),bottom:Math.max(...b.map(b=>b.y+b.h/2))};}
  function keepInside(items,s){if(!items.length)return;const{w,h}=dimensions(s.orientation),b=boundSet(items,s);const dx=b.left<30?30-b.left:b.right>w-30?w-30-b.right:0,dy=b.top<30?30-b.top:b.bottom>h-30?h-30-b.bottom:0;items.forEach(it=>{it.x+=dx;it.y+=dy;});}
  function snapWall(it,s){const{w,h}=dimensions(s.orientation);const edges=[{d:Math.abs(it.x-22),x:22,a:90},{d:Math.abs(it.x-(w-22)),x:w-22,a:90},{d:Math.abs(it.y-22),y:22,a:0},{d:Math.abs(it.y-(h-22)),y:h-22,a:0}].sort((a,b)=>a.d-b.d);const e=edges[0];it.angle=e.a;if(e.x!==undefined){it.x=e.x;it.y=Math.max(100,Math.min(h-100,it.y));}else{it.y=e.y;it.x=Math.max(100,Math.min(w-100,it.x));}}
  function deskFacingBoard(s){const teacher=s.items.find(i=>i.id===s.mainTeacher),boards=s.items.filter(i=>i.kind==='board'),board=boards.sort((a,b)=>teacher?Math.hypot(a.x-teacher.x,a.y-teacher.y)-Math.hypot(b.x-teacher.x,b.y-teacher.y):0)[0];if(!board)return norm(autoTextAngle(s)+180);const{w,h}=dimensions(s.orientation);return[{d:board.y/h,a:0},{d:(h-board.y)/h,a:180},{d:board.x/w,a:270},{d:(w-board.x)/w,a:90}].sort((a,b)=>a.d-b.d)[0].a;}
  function orientDesks(s,ids=null){const desks=s.items.filter(i=>i.kind==='desk'&&(ids?ids.includes(i.id):!i.group));const angle=deskFacingBoard(s);desks.forEach(i=>i.angle=angle);return desks.length;}
  function buildLayout(s,count,type){
    if(!Number.isInteger(count)||count<0||count>100)throw Error('El nombre de pupitres ha de ser entre 1 i 100.');
    if(!['individual','pairs','triples','groups4','groups6','empty'].includes(type))throw Error('Distribució desconeguda.');
    const old=s.items.filter(x=>x.kind==='desk'),assigned=old.filter(x=>x.student),{w,h}=dimensions(s.orientation),scale=s.deskSize/100,dw=108*scale,dh=86*scale;
    let cols,rows,points=[],groups=[];
    if(type!=='empty'&&count){
      if(type==='groups4'||type==='groups6'){
        const n=type==='groups4'?4:6,across=n/2,gcount=Math.ceil(count/n),gw=144*scale,gh=dw*across+4*(across-1),left=80,top=80,aw=w-160,ah=h-360;
        let grid=null;for(let columns=1;columns<=gcount;columns++){const rows=Math.ceil(gcount/columns),gapX=aw/columns-gw,gapY=ah/rows-gh;if(gapX<24||gapY<24)continue;const score=Math.abs(gapX-gapY)+(columns*rows-gcount)*30;if(!grid||score<grid.score)grid={columns,rows,score};}
        if(!grid)throw Error('Aquests grups no caben deixant espai a les parets i al professor. Redueix la mida dels pupitres o tria una altra distribució.');
        const perRow=grid.columns,grow=grid.rows;for(let g=0;g<gcount;g++){const row=deskFacingBoard(s)===180?grow-1-Math.floor(g/perRow):Math.floor(g/perRow),gx=left+(g%perRow+.5)*aw/perRow,gy=top+(row+.5)*ah/grow,id=uid(),members=Math.min(n,count-points.length),memberAcross=Math.ceil(members/2);for(let k=0;k<members;k++){const lower=k>=memberAcross,rowMembers=lower?members-memberAcross:memberAcross,localX=(k%memberAcross-(rowMembers-1)/2)*(dw+2),localY=(lower?32:-32)*scale;points.push({x:gx-localY,y:gy+localX,angle:lower?90:270});groups.push(id);}}
      }else{
        cols=type==='individual'?(s.orientation==='horizontal'?7:5):type==='pairs'?(s.orientation==='horizontal'?10:6):(s.orientation==='horizontal'?12:6);
        cols=Math.min(cols,count);rows=Math.ceil(count/cols);const block=type==='pairs'?2:type==='triples'?3:1,blocks=Math.ceil(cols/block),gap=4,pad=type==='triples'&&s.orientation==='horizontal'?40:60;
        const blockWidth=block*dw+(block-1)*gap,availW=w-2*pad,availH=h-290;
        if(blockWidth*blocks>availW||rows*dh>availH)throw Error('No hi caben tots els pupitres amb aquesta mida i distribució. Redueix-ne la mida o tria una altra distribució.');
        const blockStep=blocks>1?(availW-blockWidth)/(blocks-1):0;
        const rowGap=rows>1?(availH-rows*dh)/(rows-1):0;
        if(rows>1&&rowGap<12)throw Error('No queda prou separació entre files. Redueix la mida dels pupitres o tria una altra distribució.');
        for(let i=0;i<count;i++){const col=i%cols,row=deskFacingBoard(s)===180?rows-1-Math.floor(i/cols):Math.floor(i/cols);points.push({x:blocks===1?w/2-blockWidth/2+dw/2+(col%block)*(dw+gap):pad+dw/2+Math.floor(col/block)*blockStep+(col%block)*(dw+gap),y:rows===1?65+availH/2:65+dh/2+row*(dh+rowGap)});groups.push(null);}
      }
    }
    const defaultAngle=deskFacingBoard(s);s.items=s.items.filter(x=>x.kind!=='desk');points.forEach((p,i)=>s.items.push(item('desk',p.x,p.y,{angle:p.angle??defaultAngle,student:assigned[i]?.student||null,group:groups[i]})));s.layout=type;s.desiredCount=count;
    return Math.max(0,assigned.length-points.length);
  }
  function assign(s,studentId,deskId){const dest=s.items.find(x=>x.id===deskId&&x.kind==='desk'),source=s.items.find(x=>x.kind==='desk'&&x.student===studentId);if(!s.students.some(x=>x.id===studentId)||!dest)return{ok:false,reason:'missing'};if(source?.id===dest.id)return{ok:true,unchanged:true};if(dest.student){if(source)source.student=null;return{ok:false,reason:'occupied'};}if(source)source.student=null;dest.student=studentId;return{ok:true};}
  function autoTextAngle(s){const t=s.items.find(x=>x.id===s.mainTeacher);if(!t)return 0;const{w,h}=dimensions(s.orientation);const sides=[{d:t.y/h,a:180},{d:(h-t.y)/h,a:0},{d:t.x/w,a:90},{d:(w-t.x)/w,a:270}];return sides.sort((a,b)=>a.d-b.d)[0].a;}
  function labelAngle(it,s){return it.textAngle??norm(autoTextAngle(s)+it.angle-deskFacingBoard(s));}
  function snapOffset(anchor,dx,dy,enabled,step=20){return enabled?{dx:Math.round((anchor.x+dx)/step)*step-anchor.x,dy:Math.round((anchor.y+dy)/step)*step-anchor.y}:{dx,dy};}
  function rotate(items,angle,s){if(!items.length)return;const c={x:items.reduce((n,i)=>n+i.x,0)/items.length,y:items.reduce((n,i)=>n+i.y,0)/items.length},a=angle*Math.PI/180;items.forEach(it=>{const x=it.x-c.x,y=it.y-c.y;it.x=c.x+x*Math.cos(a)-y*Math.sin(a);it.y=c.y+x*Math.sin(a)+y*Math.cos(a);it.angle=norm(it.angle+angle);if(it.kind==='desk'&&it.textAngle!==null)it.textAngle=norm(it.textAngle+angle);});keepInside(items,s);}
  function validate(raw){
    if(!raw||raw.format!=='SeatFlow'||raw.version!==1)throw Error('Aquest fitxer no és una sessió compatible de SeatFlow.');
    const s=clone(raw);if(!s.meta||typeof s.meta.className!=='string'||!s.meta.className.trim()||s.meta.className.length>120||typeof s.meta.teacher!=='string'||s.meta.teacher.length>100||!/^\d{4}-\d{2}-\d{2}$/.test(s.meta.date))throw Error('Les dades de la classe són incorrectes.');
    const dateValue=new Date(s.meta.date+'T12:00:00Z');if(!Number.isFinite(dateValue.getTime())||dateValue.toISOString().slice(0,10)!==s.meta.date)throw Error('La data de la sessió és incorrecta.');
    if(!['horizontal','vertical'].includes(s.orientation)||!['individual','pairs','triples','groups4','groups6','empty','custom'].includes(s.layout)||!finite(s.deskSize)||s.deskSize<75||s.deskSize>140||!Number.isInteger(s.desiredCount)||s.desiredCount<1||s.desiredCount>100)throw Error('La configuració de l’aula és incorrecta.');
    if(!Array.isArray(s.students)||s.students.length>200||!Array.isArray(s.items)||s.items.length>150)throw Error('La sessió supera els límits admesos.');
    const ids=new Set(),studentIds=new Set(),used=new Set();for(const p of s.students){if(typeof p.id!=='string'||p.id.length>100||studentIds.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>160||typeof p.surname!=='string'||p.surname.length>160)throw Error('La llista d’alumnes és incorrecta.');studentIds.add(p.id);}
    for(const it of s.items){if(typeof it.id!=='string'||it.id.length>100||ids.has(it.id)||!['desk','teacher','board','window','door'].includes(it.kind)||![it.x,it.y,it.angle].every(finite)||Math.abs(it.x)>5000||Math.abs(it.y)>5000||!finite(it.textAngle)&&it.textAngle!==null||it.textAngle!==null&&(it.textAngle<0||it.textAngle>359)||it.group!==null&&(typeof it.group!=='string'||it.group.length>100))throw Error('La sessió conté elements incorrectes.');ids.add(it.id);it.angle=norm(it.angle);if(it.student!==null){if(it.kind!=='desk'||!studentIds.has(it.student)||used.has(it.student))throw Error('Hi ha una assignació d’alumne incorrecta o duplicada.');used.add(it.student);}}
    if(s.items.filter(i=>i.kind==='desk').length>100||s.items.filter(i=>i.kind==='teacher').length>2||s.items.filter(i=>i.kind==='door').length>2)throw Error('Hi ha massa elements a la sessió.');
    if(s.mainTeacher!==null&&!s.items.some(x=>x.id===s.mainTeacher&&x.kind==='teacher'))throw Error('La taula principal no és vàlida.');
    s.meta={className:clean(s.meta.className),teacher:clean(s.meta.teacher),date:s.meta.date};s.students=s.students.map(p=>({id:p.id,name:clean(p.name),surname:clean(p.surname),full:clean(p.full),uncertain:!!p.uncertain}));return s;
  }
  const api={uid,clone,dimensions,norm,clean,parseNames,rosterMetadata,removeClassCodes,item,create,size,bounds,boundSet,keepInside,snapWall,deskFacingBoard,orientDesks,buildLayout,assign,autoTextAngle,labelAngle,snapOffset,rotate,validate};root.SeatDomain=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
