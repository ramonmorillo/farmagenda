# 4. Construcción y pruebas

core.mjs contiene esquema, fechas/zonas, validación, conflictos, búsqueda, aplicación confirmada, persistencia e ICS. demos.mjs crea ejemplos ficticios con fechas relativas a hoy. app.mjs conecta formularios, tabla, propuestas y exportaciones. index.html/agenda.css presentan los controles; tutorial.html/tutorial.mjs leen estos documentos sin interpretar HTML.

```sh
npm test
npm run test:browser
git diff --check
```

Node usa su runner sin dependencias. El navegador requiere Playwright para Python y Chromium, herramientas de desarrollo disponibles en el entorno; no se descargan a los usuarios. En otro entorno prepara herramientas oficiales conservando TLS, usa CHROMIUM_PATH o chromium en PATH, o instala el navegador de Playwright.

El script monta /farmagenda/, usa agenda ficticia y comprueba JSON e ICS por contenido, UTC, duración, identificadores, escape y ausencia de invitaciones. Escribe artefactos fuera del checkout. No basta con descargar un archivo o no ver errores en consola.

## Depuración

Sin propuestas: revisa capacidad, duración, días y horizonte; no se divide una tarea. Conflicto manual: corrige o reprograma explícitamente. Propuesta obsoleta: vuelve a generar tras cambios. Hora inexistente/ambigua: usa otra hora o UTC, no la desplaces silenciosamente. Copia inválida: no reemplaces la agenda anterior hasta validar el JSON completo. ICS duplicado en otro cliente: recuerda que importar un fichero no equivale a sincronizar.

Ejercicio: prueba 29 de marzo de 2026 a las 02:30 y 25 de octubre de 2026 a las 02:30 en Europe/Madrid. Deben rechazarse por inexistencia/ambigüedad. Después verifica un evento de las 09:00 en verano e invierno en UTC.
