# 1. Del listado a una agenda revisable

FarmaAgenda Smart organiza actividades, identifica vencimientos y propone horarios con responsable, duración y prioridad. No programa tratamientos ni toma decisiones clínicas.

## Requisitos verificables

- Tarea con ID estable, título, responsable, duración, prioridad, fecha límite y programación opcional.
- Estados pendiente/completada y bloques fijos no seleccionables para propuestas.
- Configuración explícita de zona IANA, días, horario y capacidad diaria por responsable.
- Conflictos entre tareas pendientes del mismo responsable; equipos diferentes pueden trabajar en paralelo.
- Propuestas por prioridad y fecha límite, en intervalos de 15 minutos, sin solapar ni exceder capacidad.
- Confirmación humana y reconocimiento adicional si se rebasa una fecha límite. Esa fecha no se cambia automáticamente.
- Cambios de agenda invalidan propuestas antiguas.
- Agenda local con guardado manual, copia JSON y calendario ICS con eventos UTC e identificadores estables.

El algoritmo es una búsqueda conservadora, no una IA ni un optimizador global. Solo conoce las tareas registradas. No consulta festivos, permisos, cualificaciones o calendarios reales; modela los bloqueos necesarios de manera explícita.

Ejercicio: distingue fecha límite, horario reservado y estado completado. Una tarea reprogramada después de su fecha límite sigue vencida hasta que el usuario revise expresamente esa fecha; moverla no la convierte en cumplida.
