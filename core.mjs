export const KEY='farmagenda.agenda.v1';
export const PRIORITIES={alta:0,media:1,baja:2};
const clean=(s,max=200)=>typeof s==='string'?s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,max):'';
const resource=s=>s.trim().replace(/\s+/g,' ').toLocaleLowerCase('es');
const idOK=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(s);
export function day(s){if(!/^20\d{2}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw new Error('Fecha no válida: usa un día real entre 2000 y 2099.');return s;}
export function clock(s){if(!/^\d{2}:\d{2}$/.test(s)||Number(s.slice(0,2))>23||Number(s.slice(3))>59)throw new Error('Hora no válida.');return Number(s.slice(0,2))*60+Number(s.slice(3));}
export function addDays(s,n){return new Date(Date.parse(day(s)+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
export const weekday=s=>new Date(day(s)+'T00:00:00Z').getUTCDay();
const formats=new Map();
function formatter(zone){if(!formats.has(zone))formats.set(zone,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));return formats.get(zone);}
export function localParts(utc,zone){const p=Object.fromEntries(formatter(zone).formatToParts(new Date(utc)).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
export const localDay=(utc,zone)=>localParts(utc,zone).slice(0,10);
export function toUTC(local,zone){
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))throw new Error('Fecha y hora local no válidas.');day(local.slice(0,10));clock(local.slice(11));
  const guess=Date.parse(local+':00Z'),offsets=new Set();
  for(const delta of [-86400000,0,86400000]){const instant=guess+delta;const displayed=localParts(instant,zone);offsets.add(Date.parse(displayed+':00Z')-instant);}
  const candidates=[...offsets].map(offset=>guess-offset).filter(ms=>localParts(ms,zone)===local);
  if(candidates.length!==1)throw new Error(candidates.length?'Hora ambigua por cambio horario: elige otra hora o usa UTC.':'Hora inexistente por cambio horario: elige otra hora.');
  return new Date(candidates[0]).toISOString();
}
export function display(utc,zone){return new Intl.DateTimeFormat('es-ES',{timeZone:zone,year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(utc))+' · '+zone;}
export function settings(raw={}){
  const s={zone:clean(raw.zone||'Europe/Madrid',80),dayStart:raw.dayStart||'09:00',dayEnd:raw.dayEnd||'17:00',capacity:raw.capacity===undefined?360:Number(raw.capacity),days:raw.days===undefined?[1,2,3,4,5]:raw.days};
  try{formatter(s.zone);}catch{throw new Error('Zona horaria IANA no válida.');}
  const span=clock(s.dayEnd)-clock(s.dayStart);
  if(span<=0)throw new Error('El horario debe terminar después de empezar, dentro del mismo día. No se admiten turnos nocturnos.');
  if(!Number.isInteger(s.capacity)||s.capacity<1||s.capacity>span)throw new Error('La capacidad diaria debe ser un número de minutos entre 1 y la duración del horario.');
  if(!Array.isArray(s.days)||!s.days.length||s.days.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(s.days).size!==s.days.length)throw new Error('Selecciona al menos un día laborable, sin duplicados.');
  return {...s,days:[...s.days].sort()};
}
export function task(raw){
  if(!raw||['title','owner','note'].some(k=>raw[k]!==undefined&&(typeof raw[k]!=='string'||raw[k].length>({title:200,owner:100,note:2000}[k]))))throw new Error('Título, responsable o nota no válidos o demasiado extensos.');
  const t={id:raw.id||crypto.randomUUID(),title:clean(raw.title),owner:clean(raw.owner,100),duration:Number(raw.duration),priority:raw.priority,deadline:raw.deadline,start:raw.start||'',done:raw.done===true,fixed:raw.fixed===true,note:clean(raw.note,2000),revision:Number.isInteger(raw.revision)&&raw.revision>0?raw.revision:1};
  if(!idOK(t.id)||!t.title||!t.owner)throw new Error('Título, responsable e identificador de tarea son obligatorios y válidos.');
  if(!Number.isInteger(t.duration)||t.duration<1||t.duration>720)throw new Error('Duración: entre 1 y 720 minutos enteros.');
  if(!Object.hasOwn(PRIORITIES,t.priority))throw new Error('Prioridad no válida.');day(t.deadline);
  if(t.start){const date=new Date(t.start);if(typeof t.start!=='string'||!t.start.endsWith('Z')||Number.isNaN(date.getTime())||date.getUTCSeconds()||date.getUTCMilliseconds()||date.toISOString()!==t.start)throw new Error('La programación debe ser una fecha UTC canónica válida con precisión de minutos.');t.start=date.toISOString();day(t.start.slice(0,10));}
  return t;
}
export function blank(){return {schema:1,settings:settings(),tasks:[],history:[]};}
export function normalize(raw){
  if(!raw||raw.schema!==1||!raw.settings||typeof raw.settings!=='object'||Array.isArray(raw.settings)||!Array.isArray(raw.tasks)||raw.tasks.length>500||!Array.isArray(raw.history)||raw.history.length>1000)throw new Error('Agenda no compatible: esquema 1, configuración, máximo 500 tareas y 1000 cambios.');
  const tasks=raw.tasks.map(t=>{if(!t||!idOK(t.id))throw new Error('Toda tarea importada debe conservar un ID válido.');return task(t);});
  if(new Set(tasks.map(t=>t.id)).size!==tasks.length)throw new Error('La agenda tiene IDs de tarea duplicados.');
  const history=raw.history.map(e=>{if(!e||!idOK(e.taskId)||typeof e.at!=='string'||!e.at.endsWith('Z')||Number.isNaN(Date.parse(e.at))||!['edit','delete','complete','reopen','reschedule'].includes(e.kind))throw new Error('Historial de cambios no compatible.');for(const k of ['from','to'])if(e[k]&&(typeof e[k]!=='string'||!e[k].endsWith('Z')||Number.isNaN(Date.parse(e[k]))))throw new Error('Fecha de historial no válida.');return {taskId:e.taskId,title:clean(e.title),at:e.at,kind:e.kind,from:clean(e.from,80),to:clean(e.to,80)};});
  return {schema:1,settings:settings(raw.settings),tasks,history};
}
export function load(storage=globalThis.localStorage){const raw=storage.getItem(KEY);if(raw===null)return blank();try{return normalize(JSON.parse(raw));}catch{throw new Error('Agenda local dañada o no compatible. No se sobrescribe: exporta lo posible o borra sus datos.');}}
export function save(state,storage=globalThis.localStorage){load(storage);storage.setItem(KEY,JSON.stringify(normalize(state)));}
export function clear(storage=globalThis.localStorage){storage.removeItem(KEY);}
export const end=t=>new Date(Date.parse(t.start)+t.duration*60000).toISOString();
export const overdue=(t,now,zone)=>!t.done&&t.deadline<localDay(now,zone);
export const past=(t,now)=>!t.done&&t.start&&Date.parse(end(t))<=Date.parse(now);
const intersects=(a,b)=>a.start<b.end&&b.start<a.end;
function interval(t){return {id:t.id,owner:resource(t.owner),start:Date.parse(t.start),end:Date.parse(end(t))};}
export function conflicts(tasks){const planned=tasks.filter(t=>t.start&&!t.done).map(interval),result=[];for(let i=0;i<planned.length;i++)for(let j=i+1;j<planned.length;j++)if(planned[i].owner===planned[j].owner&&intersects(planned[i],planned[j]))result.push([planned[i].id,planned[j].id]);return result;}
export function log(state,t,kind,from='',to=''){state.history=[...state.history,{taskId:t.id,title:t.title,kind,from,to,at:new Date().toISOString()}].slice(-1000);}
export function plan(state,ids,startDate,horizon=7,now=new Date().toISOString()){
  const model=normalize(state),s=model.settings;day(startDate);if(startDate<localDay(now,s.zone))throw new Error('El inicio de búsqueda no puede ser anterior a hoy.');
  if(!Number.isInteger(horizon)||horizon<1||horizon>30)throw new Error('Horizonte: entre 1 y 30 días naturales.');
  if(!ids.length||ids.length>50||new Set(ids).size!==ids.length)throw new Error('Selecciona entre 1 y 50 tareas pendientes no fijas.');
  const chosen=ids.map(id=>{const t=model.tasks.find(t=>t.id===id);if(!t||t.done||t.fixed)throw new Error('Una tarea seleccionada no existe, es fija o ya está completada.');return t;}).sort((a,b)=>PRIORITIES[a.priority]-PRIORITIES[b.priority]||a.deadline.localeCompare(b.deadline)||a.id.localeCompare(b.id));
  // Conservador: no se liberan los huecos actuales mientras se buscan propuestas.
  const busy=model.tasks.filter(t=>t.start&&!t.done).map(interval),proposals=[],unplaced=[];
  for(const t of chosen){let proposal=null;
    for(let d=0;d<horizon&&!proposal;d++){
      const date=addDays(startDate,d);if(!s.days.includes(weekday(date)))continue;
      let first,last;try{first=Date.parse(toUTC(date+'T'+s.dayStart,s.zone));last=Date.parse(toUTC(date+'T'+s.dayEnd,s.zone));}catch{continue;}
      const owned=busy.filter(b=>b.owner===resource(t.owner)),used=owned.reduce((sum,b)=>sum+Math.max(0,Math.min(last,b.end)-Math.max(first,b.start))/60000,0);
      if(used+t.duration>s.capacity)continue;
      const earliest=Math.max(first,Date.parse(now));
      for(let candidate=first+Math.ceil((earliest-first)/900000)*900000;candidate+t.duration*60000<=last;candidate+=900000){
        const candidateInterval={id:t.id,owner:resource(t.owner),start:candidate,end:candidate+t.duration*60000};
        try{toUTC(localParts(candidate,s.zone),s.zone);toUTC(localParts(candidateInterval.end,s.zone),s.zone);}catch{continue;}
        if(!owned.some(b=>intersects(b,candidateInterval))){proposal={id:t.id,start:new Date(candidate).toISOString(),late:localDay(candidateInterval.end-1,s.zone)>t.deadline};busy.push(candidateInterval);break;}
      }
    }
    if(proposal)proposals.push(proposal);else unplaced.push({id:t.id,reason:'Sin hueco bajo el horario, capacidad y horizonte configurados. No se divide la tarea ni se mueve automáticamente.'});
  }
  return {schema:1,base:JSON.stringify(model),createdAt:now,proposals,unplaced};
}
export function apply(state,packet,confirmed,ackLate,now=new Date().toISOString()){
  const model=normalize(state),s=model.settings;
  if(!confirmed)throw new Error('Confirma la aplicación de las propuestas.');
  if(packet?.schema!==1||packet.base!==JSON.stringify(model))throw new Error('La agenda cambió: genera nuevas propuestas antes de confirmar.');
  if(!packet.proposals.length)throw new Error('No hay propuestas para aplicar.');
  const selected=new Set(packet.proposals.map(p=>p.id));if(selected.size!==packet.proposals.length)throw new Error('Propuestas duplicadas.');
  if([...selected].some(id=>!model.tasks.some(t=>t.id===id)))throw new Error('Una propuesta se refiere a una tarea inexistente.');
  const proposals=new Map(packet.proposals.map(p=>[p.id,p]));
  const result=structuredClone(model);
  for(const t of result.tasks){const p=proposals.get(t.id);if(!p)continue;if(t.done||t.fixed)throw new Error('No se pueden mover tareas fijas o completadas.');
    const old=t.start;t.start=task({...t,start:p.start}).start;
    const local=localParts(t.start,s.zone),date=local.slice(0,10),endLocal=localParts(end(t),s.zone);
    toUTC(local,s.zone);toUTC(endLocal,s.zone);
    if(Date.parse(t.start)<Date.parse(now)||!s.days.includes(weekday(date))||clock(local.slice(11))<clock(s.dayStart)||endLocal.slice(0,10)!==date||clock(endLocal.slice(11))>clock(s.dayEnd))throw new Error('Una propuesta queda fuera del horario o en el pasado.');
    if(localDay(Date.parse(end(t))-1,s.zone)>t.deadline&&!ackLate)throw new Error('Reconoce que hay propuestas posteriores a la fecha límite; esa fecha no se modifica.');
    t.revision++;log(result,t,'reschedule',old,t.start);
  }
  if(conflicts(result.tasks).some(pair=>pair.some(id=>selected.has(id))))throw new Error('Las propuestas generan un conflicto para un responsable.');
  for(const t of result.tasks.filter(t=>selected.has(t.id))){const date=localDay(t.start,s.zone),first=Date.parse(toUTC(date+'T'+s.dayStart,s.zone)),last=Date.parse(toUTC(date+'T'+s.dayEnd,s.zone));const used=result.tasks.filter(o=>!o.done&&o.start&&resource(o.owner)===resource(t.owner)).map(interval).reduce((sum,b)=>sum+Math.max(0,Math.min(last,b.end)-Math.max(first,b.start))/60000,0);if(used>s.capacity)throw new Error('La capacidad diaria del responsable ha sido superada.');}
  return result;
}
const escapeICS=s=>String(s).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
function fold(line){const encoder=new TextEncoder();let result='',current='',size=0;for(const c of line){const bytes=encoder.encode(c).length;if(size+bytes>75){result+=current+'\r\n';current=' ';size=1;}current+=c;size+=bytes;}return result+current;}
const stamp=iso=>new Date(iso).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
export function ics(state,now=new Date().toISOString()){
  const model=normalize(state),tasks=model.tasks.filter(t=>!t.done&&t.start);if(!tasks.length)throw new Error('No hay tareas pendientes programadas para exportar.');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FarmaAgenda Smart//Agenda docente//ES','CALSCALE:GREGORIAN'];
  for(const t of tasks)lines.push('BEGIN:VEVENT','UID:'+t.id+'@farmagenda.local','SEQUENCE:'+t.revision,'DTSTAMP:'+stamp(now),'DTSTART:'+stamp(t.start),'DTEND:'+stamp(end(t)),'SUMMARY:'+escapeICS(t.title),'DESCRIPTION:'+escapeICS(`Responsable: ${t.owner}\nPrioridad: ${t.priority}\nFecha límite sin modificar: ${t.deadline}\nZona de referencia: ${model.settings.zone}\n${t.note}\nExportación manual; no sincroniza ni envía invitaciones.`),'STATUS:CONFIRMED','END:VEVENT');
  lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}
