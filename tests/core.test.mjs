import test from 'node:test';
import assert from 'node:assert/strict';
import {KEY,blank,normalize,settings,task,load,save,clear,toUTC,localParts,localDay,overdue,past,conflicts,plan,apply,ics} from '../core.mjs';
import {demo} from '../demos.mjs';
const NOW='2026-11-10T08:00:00.000Z',START='2026-11-11';
test('Zona horaria: Madrid, Canarias y UTC conservan el instante correcto',()=>{
  assert.equal(toUTC('2026-11-11T09:00','Europe/Madrid'),'2026-11-11T08:00:00.000Z');
  assert.equal(toUTC('2026-07-11T09:00','Europe/Madrid'),'2026-07-11T07:00:00.000Z');
  assert.equal(toUTC('2026-11-11T09:00','Atlantic/Canary'),'2026-11-11T09:00:00.000Z');
  assert.equal(localDay('2026-11-10T23:30:00.000Z','Europe/Madrid'),'2026-11-11');
});
test('Cambios horarios: se rechazan horas inexistentes y ambiguas sin adivinarlas',()=>{
  assert.throws(()=>toUTC('2026-03-29T02:30','Europe/Madrid'),/inexistente/);
  assert.throws(()=>toUTC('2026-10-25T02:30','Europe/Madrid'),/ambigua/);
  assert.equal(toUTC('2026-10-25T03:30','Europe/Madrid'),'2026-10-25T02:30:00.000Z');
});
test('Campos obligatorios, duración, prioridades y fechas inválidas',()=>{
  const raw={title:'Docencia',owner:'Equipo A',duration:60,priority:'alta',deadline:'2026-11-10'};
  assert.ok(task(raw).id);
  for(const patch of [{title:''},{owner:''},{duration:0},{duration:1.5},{priority:'urgente'},{deadline:'2026-02-30'},{start:'2026-02-30T09:00:00.000Z'}])assert.throws(()=>task({...raw,...patch}));
});
test('Configuración: capacidad, días, horario y zona se validan',()=>{
  for(const raw of [{zone:'No/Existe'},{dayStart:'18:00',dayEnd:'09:00'},{capacity:481},{days:[]},{days:[1,1]}])assert.throws(()=>settings(raw));
});
test('Demo: dos vencidas, bloques fijos y ningún calendario externo',()=>{
  const s=demo(NOW);assert.equal(s.tasks.filter(t=>overdue(t,NOW,s.settings.zone)).length,2);assert.equal(s.tasks.filter(t=>t.fixed).length,2);assert.equal(conflicts(s.tasks).length,0);
});
test('Conflictos: mismo responsable, intervalos adyacentes permitidos y equipos paralelos',()=>{
  const s=demo(NOW),block=s.tasks.find(t=>t.id==='demo-c');
  const other=task({...block,id:'test',fixed:false,title:'Otra actividad'});
  assert.equal(conflicts([block,other]).length,1);
  assert.equal(conflicts([block,{...other,owner:'Otro equipo'}]).length,0);
  assert.equal(conflicts([block,{...other,start:toUTC('2026-11-11T11:00','Europe/Madrid')}]).length,0);
});
test('Propuestas: prioridad, duración, responsable y bloque fijo, sin mutación',()=>{
  const s=demo(NOW),before=JSON.stringify(s),p=plan(s,['demo-b','demo-a'],START,7,NOW);
  assert.equal(p.proposals.length,2);assert.equal(p.proposals[0].id,'demo-a');
  assert.equal(localParts(p.proposals[0].start,s.settings.zone),'2026-11-11T09:00');
  assert.equal(localParts(p.proposals[1].start,s.settings.zone),'2026-11-11T11:00');
  assert.equal(JSON.stringify(s),before);
});
test('Aplicar requiere confirmación y reconocimiento de fechas límite, sin cambiarlas',()=>{
  const s=demo(NOW),p=plan(s,['demo-a','demo-b'],START,7,NOW);
  assert.throws(()=>apply(s,p,false,true,NOW),/Confirma/);assert.throws(()=>apply(s,p,true,false,NOW),/fecha límite/);
  const next=apply(s,p,true,true,NOW);assert.equal(next.tasks[0].deadline,s.tasks[0].deadline);assert.equal(next.tasks[0].start,p.proposals[0].start);assert.equal(next.history.length,2);assert.equal(conflicts(next.tasks).length,0);assert.equal(s.tasks[0].start,'');
});
test('Propuestas obsoletas, tareas fijas o completadas no se pueden aplicar',()=>{
  const s=demo(NOW),p=plan(s,['demo-a'],START,7,NOW);s.tasks[0].title='Cambio';assert.throws(()=>apply(s,p,true,true,NOW),/cambió/);
  assert.throws(()=>plan(s,['demo-c'],START,7,NOW),/fija/);s.tasks[0].done=true;assert.throws(()=>plan(s,['demo-a'],START,7,NOW),/completada/);
});
test('Capacidad y horizonte: explica las tareas sin hueco, no divide ni mueve a escondidas',()=>{
  const s=demo(NOW);s.settings.capacity=30;const p=plan(s,['demo-a'],START,1,NOW);assert.equal(p.proposals.length,0);assert.equal(p.unplaced.length,1);assert.equal(s.tasks[0].start,'');
  assert.throws(()=>plan(s,['demo-a'],START,0,NOW),/Horizonte/);assert.throws(()=>plan(s,[],START,7,NOW),/Selecciona/);
});
test('Fin de semana: solo usa días configurados y no propone en el pasado',()=>{
  const s=demo(NOW);const p=plan(s,['demo-a'],'2026-11-14',4,NOW);assert.equal(localDay(p.proposals[0].start,s.settings.zone),'2026-11-16');assert.throws(()=>plan(s,['demo-a'],'2026-11-09',7,NOW),/anterior/);
});
test('El buscador evita también las horas ambiguas al cambiar al horario de invierno',()=>{
  const s=blank();s.settings=settings({days:[0],dayStart:'01:00',dayEnd:'04:00',capacity:180});
  s.tasks=[task({id:'mover',title:'Tarea ficticia',owner:'A',duration:30,priority:'alta',deadline:'2026-10-24'}),task({id:'bloque',title:'Bloque ficticio',owner:'A',duration:90,priority:'alta',deadline:'2026-10-25',start:toUTC('2026-10-25T01:00',s.settings.zone),fixed:true})];
  const p=plan(s,['mover'],'2026-10-25',1,'2026-10-24T08:00:00.000Z');assert.equal(localParts(p.proposals[0].start,s.settings.zone),'2026-10-25T03:00');
});
test('Aplicación defensiva de propuestas: no acepta solapamientos ni fechas fuera de horario',()=>{
  const s=demo(NOW),p=plan(s,['demo-a'],START,7,NOW);p.proposals[0].start=toUTC('2026-11-11T10:00',s.settings.zone);assert.throws(()=>apply(s,p,true,true,NOW),/conflicto/);
  p.proposals[0].start=toUTC('2026-11-11T20:00',s.settings.zone);assert.throws(()=>apply(s,p,true,true,NOW),/horario/);
});
test('Vencimiento por día local y programación pasada no equivalen a completada',()=>{
  const s=demo(NOW),t=s.tasks[0];assert.equal(overdue(t,NOW,s.settings.zone),true);assert.equal(overdue({...t,done:true},NOW,s.settings.zone),false);
  assert.equal(past({...t,start:'2026-11-09T09:00:00.000Z'},NOW),true);
});
test('JSON normaliza solo campos conocidos; IDs duplicados e historial inválido se rechazan',()=>{
  const s=demo(NOW);s.unknown='ignorar';assert.ok(!Object.hasOwn(normalize(s),'unknown'));s.tasks[1].id=s.tasks[0].id;assert.throws(()=>normalize(s),/duplicados/);
  const b=blank();b.history=[{taskId:'x',kind:'edit',at:NOW,to:'fecha falsa'}];assert.throws(()=>normalize(b),/historial/);
});
class Storage{data=new Map();getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,String(v));}removeItem(k){this.data.delete(k);}}
test('Guardar, recuperar, cuota y borrado sin tocar otras aplicaciones',()=>{
  const storage=new Storage(),s=demo(NOW);save(s,storage);assert.deepEqual(load(storage),normalize(s));storage.setItem('otra-app','conservar');clear(storage);assert.equal(storage.getItem('otra-app'),'conservar');assert.equal(load(storage).tasks.length,0);
  assert.throws(()=>save(s,{getItem:()=>null,setItem:()=>{throw new Error('QuotaExceededError');}}),/Quota/);
});
test('Historial local dañado no se sobrescribe silenciosamente',()=>{
  const storage=new Storage();storage.setItem(KEY,'roto');assert.throws(()=>load(storage),/dañada/);assert.throws(()=>save(demo(NOW),storage));assert.equal(storage.getItem(KEY),'roto');
});
test('ICS UTC: eventos pendientes programados, UID estable, sin invitaciones y escape de inyección',()=>{
  const s=demo(NOW),p=plan(s,['demo-a','demo-b'],START,7,NOW),next=apply(s,p,true,true,NOW);
  next.tasks[0].title='Texto, con; salto\nBEGIN:VEVENT\n'+ 'á'.repeat(60);
  const output=ics(next,NOW);assert.equal((output.match(/BEGIN:VEVENT\r\n/g)||[]).length,4);assert.ok(output.includes('DTSTART:20261111T080000Z'));assert.ok(output.includes('UID:demo-a@farmagenda.local'));assert.ok(!output.includes('ATTENDEE'));assert.ok(!output.includes('METHOD:REQUEST'));
  assert.ok(output.includes('SUMMARY:Texto\\, con\\; salto\\nBEGIN:VEVENT\\n'));
  for(const line of output.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75);
  next.tasks[0].done=true;assert.equal((ics(next,NOW).match(/BEGIN:VEVENT\r\n/g)||[]).length,3);assert.throws(()=>ics(blank(),NOW),/No hay/);
});
