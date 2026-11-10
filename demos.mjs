import {blank,addDays,localDay,weekday,toUTC,task} from './core.mjs';
export function demo(now=new Date().toISOString()){
  const state=blank(),today=localDay(now,state.settings.zone);let next=addDays(today,1);while(!state.settings.days.includes(weekday(next)))next=addDays(next,1);
  state.tasks=[
    task({id:'demo-a',title:'Revisar un documento ficticio',owner:'Equipo ficticio A',duration:60,priority:'alta',deadline:addDays(today,-1)}),
    task({id:'demo-b',title:'Preparar material docente ficticio',owner:'Equipo ficticio A',duration:45,priority:'media',deadline:addDays(today,-1)}),
    task({id:'demo-c',title:'Reunión ficticia: bloque fijo',owner:'Equipo ficticio A',duration:60,priority:'alta',deadline:next,start:toUTC(next+'T10:00',state.settings.zone),fixed:true}),
    task({id:'demo-d',title:'Actividad fija de otro equipo ficticio',owner:'Equipo ficticio B',duration:60,priority:'media',deadline:next,start:toUTC(next+'T09:00',state.settings.zone),fixed:true}),
  ];return state;
}
