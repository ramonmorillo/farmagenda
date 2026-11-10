# 3. Encargo y especificación reproducible

## Encargo real

«cuando termines con este, continua con el siguiente, ya tienes creado el repo se llama farmagenda».

La ficha del taller describía actividades, tareas vencidas y propuestas de nuevas fechas sujetas a confirmación humana; su reto añadía duración, responsable y prioridad. La siguiente especificación concreta esa necesidad para reproducir esta versión; no se presenta como una transcripción de otro agente ni una validación institucional.

## Prompt reproducible

```text
Construye FarmaAgenda Smart y tutorial en ramonmorillo/farmagenda. Inspecciona
el repositorio y conserva cambios ajenos. Web estática con HTML, CSS y módulos
JavaScript; sin backend, IA, claves, telemetría o calendarios externos.
Tareas con ID estable, título, responsable, duración 1-720 minutos, prioridad,
fecha límite, programación UTC opcional, estado y bloque fijo. Máximo 500.
Configura zona horaria IANA, días, jornada sin turno nocturno y capacidad diaria
por responsable. No supongas festivos o disponibilidad real. Distingue fecha
límite vencida, programación pasada y completada, usando el día de la zona.
Convierte entradas locales a UTC y rechaza horas ambiguas o inexistentes en
cambios horarios. Identifica solapamientos entre pendientes del mismo equipo.
Propón horarios para 1-50 tareas pendientes no fijas: prioridad, límite e ID,
intervalos de 15 minutos, horizonte 1-30 días. Respeta bloques y capacidad.
Sé conservador: no liberes huecos actuales durante la búsqueda ni dividas
actividades. Informa sin hueco; no finjas optimización global ni agenda real.
No mutar al proponer. Exige confirmación para aplicar y reconocimiento extra
si se supera un límite. No cambies fechas límite automáticamente. Revalida
conflictos/capacidad y rechaza propuestas si la agenda cambió.
CRUD de tareas, completar/reabrir y filtros. Guardado manual local, recuperación,
borrado, copia JSON y hasta 1000 cambios recientes sin pretender auditoría.
No sobrescribas datos locales dañados. Importar agenda reemplaza tras confirmar.
Exporta pendientes programadas a ICS: eventos UTC, UID estables, SEQUENCE,
texto escapado, CRLF y líneas limitadas por bytes. Sin ATTENDEE ni invitaciones.
No afirme sincronización o eliminación de eventos ya importados en otro cliente.
Demo relativa a hoy: dos vencidas, bloque fijo y otro equipo en paralelo.
Interfaz accesible/móvil; DOM seguro y CSP sin conexiones. Rutas /farmagenda/.
Tutorial de seis pasos con documentos, prompts y ejercicio. Pruebas Node y
navegador de zona/DST, conflictos, propuestas, confirmación, límites, persistencia,
JSON, ICS, XSS, controles, teclado, móvil, tutorial y privacidad.
Prepara Pages e integra solo la ficha FarmaAgenda tras comprobar despliegue.
No alteres otras aplicaciones, contraseña o materiales del taller. Registra
límites y pruebas ejecutadas; no inventes comprobaciones clínicas o remotas.
```

Funcional: tareas, propuestas y confirmación. Técnico: estado, tiempos UTC, restricciones y exportación. Visual: revisión legible y teclado. Seguridad: no cambios ocultos, propuestas obsoletas, privacidad y ausencia de invitaciones.
