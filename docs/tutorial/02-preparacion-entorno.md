# 2. Preparación del entorno

Repositorio independiente: https://github.com/ramonmorillo/farmagenda.

```sh
git clone https://github.com/ramonmorillo/farmagenda.git
cd farmagenda
git switch -c ejercicio/farmagenda
npm run serve
```

Si el desarrollo inicial aún no está incorporado a main, parte de feature/farmagenda. Abre la raíz del servidor y tutorial.html; no uses file://. Node 24 y Python 3, sin paquetes npm o compilación.

En la nube usa el checkout existente: cada tarea está aislada. No crees worktrees salvo petición explícita; revisa git status y conserva cambios ajenos.

Claude Code: sigue https://code.claude.com/docs/ para instalación y autenticación, entra en la carpeta y abre claude. Codex: sigue https://developers.openai.com/codex/ para terminal, editor o nube, selecciona repositorio y rama. En ambos casos pide inspección y pruebas antes de modificar. Las credenciales del agente no forman parte de la aplicación.

Conserva estructura y licencias de assets al copiar el proyecto. Las rutas relativas se comprueban bajo /farmagenda/. La clave del taller no protege esta aplicación pública.

Ejercicio: localiza core.mjs, demos.mjs y app.mjs. Explica por qué la planificación se prueba sin depender de la interfaz ni de un calendario externo.
