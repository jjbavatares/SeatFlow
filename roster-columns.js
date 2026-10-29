(function(root){
  'use strict';
  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’'./:_-]+/g,' ').replace(/\s+/g,' ').trim();
  const stripNumber=s=>String(s??'').replace(/^\s*(?:(?:\[\d+\]|\(\d+\)|\d+[.)\-:º°]+)\s*|\d+\s+)/,'').trim();
  function headerKind(s){const n=norm(s);if(/^(?:nom(?:s)? (?:i |y )?cognoms?|nombre(?:s)? (?:y |i )?apellidos?|nom complet|nombre completo|full name|student name|alumne a?|alumno a?|alumne|alumno)$/.test(n))return'full';if(/^(?:nom|noms|nombre|nombres|first name|given name)$/.test(n))return'name';if(/^(?:primer cognom|1r cognom|cognom 1|primer apellido|apellido 1|first surname)$/.test(n))return'firstSurname';if(/^(?:cognom|cognoms|apellido|apellidos|surname|last name)$/.test(n))return'surname';if(/^(?:segon cognom|2n cognom|cognom 2|segundo apellido|apellido 2)$/.test(n))return'secondSurname';if(/^(?:n|no|num|numero|ordre|orden|curs|curso|grup|grupo|classe|clase|aula|id|identificador|dni|nie|data|fecha|sexe|sexo|email|correu|telefon|telefono|observacions|observaciones)$/.test(n))return'ignore';return null;}
  function prepare(rows){return rows.map(r=>(Array.isArray(r)?r:[r]).map(c=>String(c??'').trim())).filter(r=>r.some(Boolean));}
  function detect(rows){rows=prepare(rows);let best=null;for(let i=0;i<Math.min(rows.length,60);i++){const kinds=rows[i].map(headerKind),full=kinds.indexOf('full'),name=kinds.indexOf('name'),surname=kinds.indexOf('firstSurname')>=0?kinds.indexOf('firstSurname'):kinds.indexOf('surname');let choice=null;if(full>=0)choice={mode:'full',full};else if(name>=0&&surname>=0)choice={mode:'separate',name,surname};else if(name>=0&&kinds.some(k=>k==='ignore'))choice={mode:'full',full:name};const score=kinds.filter(Boolean).length;if(choice&&(!best||score>best.score))best={rows,headerIndex:i,headers:rows[i],...choice,score};}return best||{rows,headerIndex:-1,headers:[],mode:null};}
  function select(rows,choice=null){const found=detect(rows);rows=found.rows;const width=Math.max(1,...rows.map(r=>r.length)),config=choice||found;
    if(config.mode){const start=found.headerIndex>=0?found.headerIndex+1:0;const text=rows.slice(start).filter(r=>!r.some(c=>['full','name','firstSurname','surname'].includes(headerKind(c)))).map(r=>{if(config.mode==='separate'){const name=stripNumber(r[config.name]),surname=stripNumber(r[config.surname]);return name?[name,surname].join('\t'):'';}return stripNumber(r[config.full]);}).filter(Boolean).join('\n');return{text,needsChoice:false,headers:found.headers,headerIndex:found.headerIndex,width};}
    if(width===1)return{text:rows.map(r=>stripNumber(r[0])).join('\n'),needsChoice:false,headers:[],headerIndex:-1,width};
    const candidates=Array.from({length:width},(_,i)=>i).filter(i=>{const values=rows.map(r=>r[i]||'').filter(Boolean);return values.length&&values.some(v=>/[A-Za-zÀ-ÿ]/.test(v))&&!values.every(v=>/^\d+[.)\-:]?$/.test(v)||/^[1-6]\s*(?:r|n|t|è)?\s*(?:ESO|BATX)?\s*[-–]?\s*[A-F]?$/i.test(v));});
    if(candidates.length===1)return select(rows,{mode:'full',full:candidates[0]});
    return{text:null,needsChoice:true,rows,headers:found.headers,headerIndex:found.headerIndex,width};
  }
  function numberedRows(input){
    const rows=prepare(input);
    function indexed(row){const column=row.findIndex(Boolean);if(column<0)return null;const value=row[column];let m=value.match(/^\s*(?:\[(\d{1,3})\]|\((\d{1,3})\)|(\d{1,3})[.)\-:º°]*)(?:\s+|(?=[\p{L}])|$)(.*)$/u),number,rest;
      if(m){number=Number(m[1]||m[2]||m[3]);rest=m[4].trim();}else{m=value.match(/^(\d{1,3})([\p{L}].*\s+[\p{L}].*)$/u);if(!m)return null;number=Number(m[1]);rest=m[2].trim();}
      if(number<1||number>200||/^(?:ESO\b|[rnt][A-F]\b)/i.test(rest))return null;
      const cleaned=row.slice();cleaned[column]=rest;const names=cleaned.filter(Boolean).filter(v=>!headerKind(v)&&!/^\d+$/.test(v)&&!/^[1-6]\s*(?:r|n|t)?\s*(?:ESO|BATX)?\s*[-–]?\s*[A-F]?$/i.test(v));
      if(!names.some(v=>/[\p{L}]/u.test(v)))return null;return{number,row:cleaned};
    }
    const start=rows.findIndex(r=>indexed(r)?.number===1);if(start<0)return{found:false,rows:[],count:0};
    const header=detect(rows.slice(0,start)),selected=[];let last=0;
    for(const row of rows.slice(start)){const r=indexed(row);if(!r)continue;if(r.number===1&&last>1)break;if(r.number<=last)continue;last=r.number;selected.push(r.row);}
    return{found:true,rows:header.mode?[header.headers,...selected]:selected,count:selected.length};
  }
  const api={norm,stripNumber,headerKind,detect,select,numberedRows};root.SeatRosterColumns=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
