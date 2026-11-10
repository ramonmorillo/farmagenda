import {KEY,PRIORITIES,blank,normalize,settings,task,load,save,clear,localParts,localDay,toUTC,display,addDays,end,overdue,past,conflicts,plan,apply as applyPlan,log,ics} from './core.mjs';
import {demo} from './demos.mjs';
const $=id=>document.getElementById(id);
function el(tag,attrs={},children=[]){const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs))if(v!==undefined&&v!==null)n.setAttribute(k,String(v));for(const c of Array.isArray(children)?children:[children])n.append(c instanceof Node?c:document.createTextNode(String(c)));return n;}
function button(text,fn){const b=el('button',{type:'button',class:'agenda-secondary'},text);b.addEventListener('click',fn);return b;}
function status(s){$('status').textContent=s;}
function download(name,data,type='application/json'){const url=URL.createObjectURL(new Blob([data],{type})),a=el('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
let state=blank(),dirty=false,editing='',selected=new Set(),packet=null;
try{state=load();if(state.tasks.length)status('Agenda recuperada de este navegador, sin sincronización.');}catch(e){status(e.message);}
function invalidate(){packet=null;$('proposals').hidden=true;$('proposal-list').replaceChildren();$('confirm-plan').checked=false;$('ack-late').checked=false;}
function changed(){dirty=true;selected.clear();invalidate();}
function resetForm(){editing='';$('task-form').reset();$('form-title').textContent='Añadir tarea';$('submit-task').textContent='Añadir tarea';$('errors').hidden=true;}
function error(e){$('errors').hidden=false;$('errors').replaceChildren(el('p',{},e.message));$('errors').focus();}
function renderSettings(){
  const s=state.settings;$('zone').value=s.zone;$('day-start').value=s.dayStart;$('day-end').value=s.dayEnd;$('capacity').value=s.capacity;
  $('zone-hint').textContent=`La programación se interpreta en ${s.zone}. Las horas ambiguas o inexistentes por cambio horario se rechazan; las exportaciones usan UTC.`;
  $('weekdays').replaceChildren(...['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].map((name,index)=>{const input=el('input',{type:'checkbox',id:'day-'+index,'data-day':index});input.checked=s.days.includes(index);return el('label',{class:'agenda-check',for:'day-'+index},[input,name]);}));
  $('plan-date').value=addDays(localDay(new Date().toISOString(),s.zone),1);
}
function render(){
  const now=new Date().toISOString(),s=state.settings,pairs=conflicts(state.tasks),conflicted=new Set(pairs.flat()),mode=$('filter').value,query=$('search').value.trim().toLocaleLowerCase('es');
  $('summary').textContent=`${state.tasks.length} tareas · ${state.tasks.filter(t=>!t.done).length} pendientes · ${state.tasks.filter(t=>overdue(t,now,s.zone)).length} vencidas por fecha límite · ${pairs.length} solapamientos del mismo responsable. Zona: ${s.zone}.`;
  const rows=[...state.tasks].sort((a,b)=>a.deadline.localeCompare(b.deadline)||PRIORITIES[a.priority]-PRIORITIES[b.priority]).filter(t=>(mode==='all'||mode==='pending'&&!t.done||mode==='done'&&t.done||mode==='overdue'&&overdue(t,now,s.zone))&&(!query||(t.title+' '+t.owner).toLocaleLowerCase('es').includes(query)));
  $('tasks').replaceChildren(...rows.map(t=>{
    const select=el('input',{type:'checkbox','aria-label':'Seleccionar '+t.title,id:'select-'+t.id});select.disabled=t.done||t.fixed;select.checked=selected.has(t.id);
    select.addEventListener('change',()=>{if(select.checked)selected.add(t.id);else selected.delete(t.id);invalidate();$('selection-count').textContent=`${selected.size} tareas seleccionadas para propuestas.`;});
    return el('tr',{},[el('td',{},el('label',{class:'agenda-check',for:'select-'+t.id},[select,t.fixed?'Fija':t.done?'Completada':'Seleccionar'])),el('td',{},[el('strong',{},t.title),el('p',{},t.owner),...(conflicted.has(t.id)?[el('p',{class:'agenda-notice'},'Conflicto de horario: revisa antes de usar este plan.')]:[])]),el('td',{},`${t.duration} min · prioridad ${t.priority}`),el('td',{},`${t.deadline} · ${t.done?'Completada':overdue(t,now,s.zone)?'Vencida':past(t,now)?'Programación pasada, pendiente':'Pendiente'}`),el('td',{},t.start?display(t.start,s.zone)+' · '+t.duration+' min':'Sin programación'),el('td',{},el('div',{class:'agenda-actions'},[
      button('Editar',()=>{editing=t.id;for(const[k,id]of[['title','title'],['owner','owner'],['duration','duration'],['priority','priority'],['deadline','deadline'],['note','note']])$(id).value=t[k];$('fixed').checked=t.fixed;$('scheduled').value=t.start?localParts(t.start,s.zone):'';$('form-title').textContent='Editar tarea';$('submit-task').textContent='Guardar cambios en memoria';$('form-title').focus();}),
      button(t.done?'Reabrir':'Completar',()=>{t.done=!t.done;t.revision++;log(state,t,t.done?'complete':'reopen');changed();render();status('Estado cambiado en memoria. Guarda para conservarlo.');}),
      button('Eliminar',()=>{if(!confirm('¿Eliminar esta tarea? Su registro de cambios se conserva hasta el borrado total.'))return;log(state,t,'delete',t.start);state.tasks=state.tasks.filter(o=>o.id!==t.id);if(editing===t.id)resetForm();changed();render();status('Tarea eliminada en memoria. Guarda para conservar el cambio.');})
    ]))]);
  }));
  if(!rows.length)$('tasks').append(el('tr',{},el('td',{colspan:'6'},'No hay tareas con este filtro.')));
  $('selection-count').textContent=`${selected.size} tareas seleccionadas para propuestas.`;
  const kind={edit:'Edición',delete:'Eliminación',complete:'Completada',reopen:'Reabierta',reschedule:'Reprogramación confirmada'};
  $('history').replaceChildren(...[...state.history].reverse().map(e=>el('li',{},`${display(e.at,s.zone)} · ${e.title} · ${kind[e.kind]}${e.to?' → '+display(e.to,s.zone):''}`)));
}
for(const id of ['filter','search'])$(id).addEventListener('input',()=>{selected.clear();invalidate();render();});
$('settings-form').addEventListener('submit',e=>{e.preventDefault();try{
  const next=settings({zone:$('zone').value,dayStart:$('day-start').value,dayEnd:$('day-end').value,capacity:Number($('capacity').value),days:[...document.querySelectorAll('[data-day]:checked')].map(c=>Number(c.dataset.day))});
  if($('title').value&&!confirm('Al cambiar configuración se vaciará el formulario de tarea, sin alterar las tareas guardadas en memoria. ¿Continuar?'))return;
  state.settings=next;resetForm();changed();renderSettings();render();status('Configuración aplicada. Los instantes UTC existentes se conservan; revisa su visualización y los conflictos.');
}catch(e){status(e.message);}});
$('task-form').addEventListener('submit',e=>{e.preventDefault();try{
  if(!editing&&state.tasks.length>=500)throw new Error('Máximo 500 tareas. Exporta antes de crear otra agenda.');
  const previous=state.tasks.find(t=>t.id===editing),next=task({id:editing||undefined,title:$('title').value,owner:$('owner').value,duration:$('duration').value,priority:$('priority').value,deadline:$('deadline').value,start:$('scheduled').value?toUTC($('scheduled').value,state.settings.zone):'',fixed:$('fixed').checked,done:previous?.done||false,note:$('note').value,revision:(previous?.revision||0)+1});
  if(previous)state.tasks=state.tasks.map(t=>t.id===editing?next:t);else state.tasks.push(next);log(state,next,'edit',previous?.start||'',next.start);resetForm();changed();render();status(conflicts(state.tasks).some(pair=>pair.includes(next.id))?'Tarea guardada en memoria con un conflicto de horario visible. Corrígelo antes de usar el plan.':'Tarea guardada en memoria. Pulsa Guardar agenda para conservarla tras cerrar.');
}catch(err){error(err);}});
$('cancel-edit').addEventListener('click',resetForm);
$('demo').addEventListener('click',()=>{if((dirty||state.tasks.length)&&!confirm('¿Sustituir la agenda en memoria por la demostración ficticia? No se guarda automáticamente.'))return;state=demo();changed();resetForm();renderSettings();render();status('Demostración ficticia cargada. Selecciona las dos tareas vencidas para proponer horarios.');});
$('save').addEventListener('click',()=>{try{save(state);dirty=false;status('Agenda guardada solo en este navegador, sin cifrar.'+($('title').value.trim()?' El formulario de tarea aún no se ha incorporado: pulsa Añadir o Guardar cambios.':''));}catch(e){status('No se pudo guardar: '+e.message+' Exporta una copia JSON antes de borrar datos.');}});
$('export-json').addEventListener('click',()=>{try{download('FarmaAgenda-copia.json',JSON.stringify(normalize(state),null,2));status('Copia JSON exportada. Contiene tareas y cambios locales, no datos de otros calendarios.');}catch(e){status(e.message);}});
$('import-json').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5000000)throw new Error('Máximo 5 MB por copia JSON.');const imported=normalize(JSON.parse(await file.text()));if((dirty||state.tasks.length)&&!confirm('¿Sustituir la agenda actual por esta copia, incluidos horario e historial?'))return;state=imported;changed();resetForm();renderSettings();render();status('Copia importada y comprobada. Revisa zona, horario y solapamientos; no se guarda automáticamente.');}catch(error){status('No se pudo importar: '+error.message);}finally{e.target.value='';}});
$('export-ics').addEventListener('click',()=>{try{download('FarmaAgenda-calendario.ics',ics(state),'text/calendar;charset=utf-8');status('ICS exportado con eventos UTC y UID estables. No se han enviado invitaciones ni sincronizado calendarios.');}catch(e){status(e.message);}});
$('generate').addEventListener('click',()=>{try{packet=plan(state,[...selected],$('plan-date').value,Number($('horizon').value));$('proposal-list').replaceChildren(el('h3',{},`${packet.proposals.length} propuestas · ${packet.unplaced.length} sin hueco`),...packet.proposals.map(p=>{const t=state.tasks.find(t=>t.id===p.id);return el('div',{class:'agenda-proposal'},[el('h4',{},t.title),el('p',{},`${t.owner} · ${t.duration} min · ${t.start?'Desde '+display(t.start,state.settings.zone):'Sin programación previa'} → ${display(p.start,state.settings.zone)}`),el('p',{class:p.late?'agenda-notice':'agenda-help'},p.late?'Después de la fecha límite '+t.deadline+'. Esa fecha NO se modificará.':'Dentro de la fecha límite actual.')]);}),...packet.unplaced.map(p=>el('p',{class:'agenda-notice'},state.tasks.find(t=>t.id===p.id).title+': '+p.reason)));$('ack-late').checked=false;$('confirm-plan').checked=false;$('proposals').hidden=false;status('Propuestas calculadas. La agenda sigue sin cambios hasta tu confirmación.');}catch(e){status(e.message);}});
$('apply').addEventListener('click',()=>{try{state=applyPlan(state,packet,$('confirm-plan').checked,$('ack-late').checked);changed();render();status('Propuestas confirmadas y aplicadas en memoria. Fechas límite conservadas. Guarda la agenda si deseas persistir el cambio.');}catch(e){status(e.message);}});
$('clear').addEventListener('click',()=>{if(!confirm('¿Borrar la agenda en memoria y su copia local, incluido el historial?'))return;try{clear();state=blank();dirty=false;selected.clear();invalidate();resetForm();$('import-json').value='';renderSettings();render();status('Agenda y datos locales borrados. Los archivos y eventos importados en otros calendarios deben borrarse aparte.');}catch{status('El navegador no permite borrar el almacenamiento. Usa sus ajustes de datos del sitio.');}});
window.addEventListener('beforeunload',e=>{if(dirty||$('title').value.trim()){e.preventDefault();e.returnValue='';}});
renderSettings();render();

for(const id of ['plan-date','horizon'])$(id).addEventListener('input',()=>invalidate());
$('task-form').addEventListener('input',()=>invalidate());
