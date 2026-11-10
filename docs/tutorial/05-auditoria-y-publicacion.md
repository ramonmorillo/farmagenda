# 5. Auditoría y publicación

Audita tareas, campos, conflictos, prioridades, capacidad, bloques y horarios. Comprueba que generar no muta, aplicar exige confirmación y los límites no cambian automáticamente. Repite después de editar una tarea y verifica que no se aceptan propuestas antiguas.

Comprueba ISO UTC, DST, JSON y formato ICS: ID estable, CRLF, escape y plegado de líneas. No hay invitaciones, sincronización ni borrado remoto. Las pruebas de exportación no sustituyen revisar el fichero en el cliente de calendario institucional.

## Pages

Repositorio: https://github.com/ramonmorillo/farmagenda, sin CNAME. Rutas relativas bajo /farmagenda/.

1. Settings → Pages → Source: GitHub Actions.
2. Fusiona el desarrollo revisado a main.
3. pages.yml prueba el núcleo, prepara aplicación/assets/docs y publica.
4. Comprueba ejecución y SHA. URL prevista: https://ramonmorillo.github.io/farmagenda/, que puede heredar ramonmorillo.es conservando el prefijo.
5. Comprueba demo, propuesta, exportación y tutorial antes de publicar el enlace en el taller.

ci.yml ejecuta Node en push y PR; el navegador se ejecuta aparte. No confundas CI o una rama subida con publicación. Si falta acceso de administración, registra el bloqueo sin inventar un despliegue.

Fuente y cifrado del taller permanecen en su repositorio. Cambia solo FarmaAgenda y regenera solo Santiago con la clave actual. No transfieras la contraseña a esta aplicación pública.
