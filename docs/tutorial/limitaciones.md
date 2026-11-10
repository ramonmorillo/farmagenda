# Limitaciones y registro de validación

- Agenda docente, sin decisiones clínicas o programación de tratamientos; solo actividades ficticias.
- No conoce disponibilidad, festivos, ausencias, cualificaciones o agendas que no se hayan registrado explícitamente.
- No es optimización global. No divide tareas, libera reservas actuales durante la búsqueda ni admite turnos nocturnos. Las tareas sin hueco se explican.
- Una propuesta después de la fecha límite requiere reconocimiento; no cambia esa fecha ni elimina el vencimiento.
- Las tareas completadas no ocupan huecos futuros en el modelo local. Ninguna acción elimina o cambia eventos ya importados en otro calendario.
- ICS es un fichero de eventos UTC, no sincronización o invitación. UID estable no garantiza que un cliente actualice o deduplique una reimportación. La compatibilidad visual debe revisarse en el cliente de calendario elegido.
- Historial hasta los últimos 1000 cambios, local, editable y sin firma. Borrar una tarea conserva el registro; borrar toda la agenda elimina también el historial.
- Sin almacenamiento cifrado, cuentas, colaboración o backend. Archivos descargados se borran aparte. La clave del taller no protege esta ruta.

## Resultados

Validación local del 10 de noviembre de 2026:

- Node 24: 18 pruebas aprobadas, sin fallos ni omisiones. Cubren campos, configuración, zonas, cambio horario, vencimientos, conflictos, prioridad, capacidad, bloques, horizonte, confirmación, límites conservados, propuestas obsoletas, JSON, persistencia e ICS.
- Chromium con Playwright: altas, edición, completar/reabrir, eliminación, campos inválidos y hora ambigua, guardar/recargar y entrada HTML mostrada literalmente: aprobados.
- Demostración de dos vencidas y dos bloques fijos: prioridad, duración, responsabilidad, propuestas sin mutar, confirmaciones, fechas límite conservadas y cambio de parámetros que invalida propuestas: aprobados.
- Capacidad insuficiente sin inventar huecos, cambio de zona sin desplazar instantes, conflicto manual visible, filtros, importación válida e incompatible, recuperación y borrado sin tocar otra aplicación: aprobados.
- JSON comprobado por contenido. ICS comprobado como texto RFC: eventos/UTC/duración, UID estable y revisión tras editar, omisión de completadas, CRLF, escape de inyección y líneas de hasta 75 bytes. No se envían invitaciones. No se afirma una prueba de importación real en Google Calendar, Outlook o Apple Calendar.
- Datos locales dañados no se sobrescriben y la cuota se comprueba en Node.
- Etiquetas, selección por teclado, tabla desplazable y anchuras 360, 390, 768 y 1440 px en aplicación/tutorial, sin desbordamiento de página. Capturas revisadas.
- Seis pasos del tutorial, copia de prompts, progreso/restablecimiento, enlaces bajo /farmagenda/ y Markdown sin JavaScript: aprobados. Sin tráfico externo, errores JavaScript o respuestas HTTP fallidas durante los recorridos.
- YAML y empaquetado estático de Pages comprobados localmente; la CI y publicación se verifican por separado.

Una suite incompleta, una descarga sin comprobar o una rama subida no demuestra funcionalidad ni publicación. No se afirma validación institucional, clínica, de accesibilidad certificada o de todos los navegadores y clientes de calendario.
