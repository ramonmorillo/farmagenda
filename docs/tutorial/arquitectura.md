# Arquitectura y decisiones · FarmaAgenda Smart v1

Se verificó ramonmorillo/farmagenda, inicialmente vacío. Se prepararon main y feature/farmagenda. La ficha definía actividades, vencimientos, propuestas confirmadas y el reto de duración/responsable/prioridad.

Se reutilizan identidad visual, fuentes con licencia, favicon, lector seguro del tutorial y patrón de workflows. No se modifican aplicaciones anteriores. Motor y casos de planificación son propios.

1. Web estática, sin backend, IA, APIs, telemetría o calendario externo. Solo conoce las tareas aportadas.
2. Esquema 1: settings, tasks e history; máximo 500 tareas, 50 seleccionadas por búsqueda y 1000 cambios recientes. No es auditoría inmutable.
3. Instantes UTC canónicos, fechas límite por día local y zona IANA explícita. Intl contrasta candidatos de desplazamiento; las horas locales ambiguas o inexistentes se rechazan, no se adivinan.
4. Horario dentro del mismo día y días configurados, sin festivos ni turnos nocturnos implícitos. Capacidad por responsable; bloques fijos son ocupación que el buscador no mueve.
5. Heurística determinista: prioridad, fecha límite e ID; primer hueco de 15 minutos, hasta 30 días naturales. Conservadora: no libera reservas actuales ni divide tareas. No promete optimalidad ni disponibilidad real.
6. Proponer no muta. El paquete conserva una copia normalizada de referencia; aplicar comprueba que la agenda sigue igual, confirma cambios y revalida horario, capacidad y conflictos que afecten a la selección.
7. Fecha límite se conserva; excederla requiere reconocimiento adicional. Reprogramada no equivale a completada ni elimina el vencimiento.
8. La edición manual puede registrar solapamientos, que se muestran; el buscador no crea nuevos conflictos para sus propuestas. Completadas no ocupan huecos futuros en este modelo, pero no se borran de calendarios externos.
9. Guardado local manual, copia JSON con sustitución confirmada y clave exclusiva farmagenda.agenda.v1. Error de datos dañados no se sobrescribe. Borrado total conserva otras apps y no elimina archivos descargados.
10. ICS de pendientes programadas como eventos UTC, UID estables y revisión SEQUENCE, CRLF y líneas de hasta 75 bytes sin partir caracteres. Texto escapado, sin ATTENDEE/METHOD:REQUEST. No implementa sincronización ni garantiza tratamiento de reimportación de cada cliente.
11. DOM seguro y CSP sin conexiones. Tutorial carga solo documentos del mismo origen. Rutas relativas bajo /farmagenda/; aplicación pública sin heredar contraseña del taller.

Código: core.mjs, demos.mjs, app.mjs, index.html/agenda.css; tutorial y docs/tutorial/; tests/core.test.mjs y scripts/test-farmagenda.py; CI/Pages en .github/workflows/. La plantilla del taller y su cifrado permanecen en el repositorio de la web.
