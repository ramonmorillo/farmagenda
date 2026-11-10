# FarmaAgenda Smart

Agenda docente local para actividades, vencimientos, responsables y propuestas de reprogramación sujetas a confirmación humana. Sin conexión a calendarios externos ni decisiones clínicas.

## Incluye

- Crear, editar, completar/reabrir y eliminar tareas con responsable, duración, prioridad, fecha límite y programación opcional.
- Bloques fijos, filtros, pendientes/vencidas y conflictos de horario del mismo responsable.
- Zona IANA, días, horario y capacidad diaria por responsable, todos configurados explícitamente.
- Propuestas por prioridad y fecha límite, sin solapamientos nuevos ni superar capacidad; no se aplican automáticamente.
- Reconocimiento adicional si se supera una fecha límite; esa fecha nunca se cambia a escondidas.
- Rechazo de propuestas obsoletas y horas ambiguas/inexistentes por cambios horarios.
- Guardado local manual, copia JSON y exportación ICS con eventos UTC, UID estables y texto escapado.
- Demostración relativa a hoy, tutorial de seis pasos y prompts copiables.

## Ejecutar y probar

Node.js 24 y Python 3; sin npm install, backend, claves o compilación.

```sh
git clone https://github.com/ramonmorillo/farmagenda.git
cd farmagenda
npm run serve
```

Abre la raíz del servidor y tutorial.html, no file://. La versión inicial está incorporada a main; para futuras mejoras utiliza una rama y abre una PR. Rutas relativas probadas bajo /farmagenda/.

```sh
npm test
npm run test:browser
```

Node usa el runner incorporado. El navegador requiere Playwright para Python y Chromium, no son dependencias de producción. Artefactos en una carpeta temporal fuera del checkout. Resultados en docs/tutorial/limitaciones.md.

## Circuito de demostración

1. Carga la agenda ficticia con dos vencidas y dos bloques fijos de equipos diferentes.
2. Selecciona las dos vencidas y genera desde mañana. La prioridad alta se coloca antes y se respeta el bloque fijo.
3. Comprueba que las tareas siguen sin modificar hasta confirmar.
4. Reconoce las fechas límite pendientes y aplica; después guarda si deseas conservarlo tras cerrar.
5. Exporta JSON o ICS. Las fechas límite siguen iguales y no se envían invitaciones ni se sincroniza con terceros.

## Límites

Solo actividades ficticias, sin datos de pacientes. El buscador es conservador, no un optimizador global: no libera huecos actuales mientras propone alternativas ni divide tareas. Horizonte de 1-30 días, selección de 1-50 tareas, hasta 500 tareas. No admite turnos que crucen medianoche. No conoce festivos, cualificaciones, ausencias o actividades no registradas; modela bloqueos de forma explícita.

Las fechas límite son días en la zona configurada; la programación es un instante UTC. Cambiar zona conserva instantes, no mueve tareas. Completar/borrar aquí no elimina eventos ya importados fuera. ICS es un fichero de eventos, no una sincronización ni una garantía de actualización/deduplicación de cada cliente. Revisa el resultado en tu calendario.

La agenda se guarda sin cifrar ni sincronizar y conserva hasta 1000 cambios recientes, no una auditoría inmutable. Guardado manual, sin telemetría ni APIs. La aplicación es pública y no hereda la clave del taller ni es un producto sanitario certificado. Archivos exportados y eventos importados fuera se borran por separado.

## Publicar

Settings → Pages → Source: GitHub Actions. pages.yml ejecuta pruebas, prepara aplicación/assets/docs y publica al incorporar a main; ci.yml ejecuta Node en push y PR. Las pruebas de navegador se ejecutan aparte. Sin CNAME.

Publicación confirmada por GitHub Pages: **https://ramonmorillo.es/farmagenda/**. Tutorial: **https://ramonmorillo.es/farmagenda/tutorial.html**. El proyecto conserva /farmagenda/ bajo el dominio del propietario. Comprueba cada despliegue antes de anunciar cambios; una rama subida no implica publicación.

## Estructura

core.mjs: modelo, tiempo, conflictos y plan; demos.mjs: datos ficticios; app.mjs/index.html/agenda.css: interfaz; tutorial.html/tutorial.mjs y docs/tutorial/: guía; tests/ y scripts/: pruebas; .github/workflows/: CI/Pages. Procedencia en NOTICE.md y licencias de fuentes en assets/fonts/.
