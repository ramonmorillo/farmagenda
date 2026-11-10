# Prompts de auditoría y mejora

## Prompt de auditoría

```text
Audita FarmaAgenda sin cambiar otras herramientas. Ejecuta npm test y npm run
test:browser. Prueba tareas, duración, prioridad, responsable, vencimientos,
bloques fijos, conflictos, capacidad y horizonte. Generar no debe mutar y
aplicar requiere confirmación y reconocimiento de límites sin cambiarlos.
Rechaza propuestas obsoletas. Prueba Europe/Madrid, Canarias, UTC y DST.
Comprueba JSON, guardar/recuperar/borrar, almacenamiento dañado y cuota.
Verifica ICS por contenido, UTC, duración, UID, SEQUENCE, escape y líneas
multibyte; sin invitaciones ni afirmación de sincronización. Prueba XSS,
móvil, teclado, etiquetas, tutorial y ausencia de red. No debilites tests.
Distingue pruebas aprobadas, fallidas y no ejecutadas. No publiques ni programes
tratamientos, envíes invitaciones o introduzcas calendarios privados.
```

## Prompt de extensión

```text
En una rama aplica docs/tutorial/06-personalizacion.md. Añade bloqueos o festivos
explícitos sin inferir reglas laborales. Conserva zona, confirmación y límites.
Amplía esquema, planificación y aplicación defensiva a la vez. Prueba capacidad,
conflictos, propuestas obsoletas y fechas DST. Mantén los formatos y el modo
local; no añadas servicios persistentes, invitaciones o claves por defecto.
```
