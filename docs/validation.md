# Validación de la modernización

Pruebas locales en un entorno aislado, sin despliegue en DataLab ni cambios en servidores reales.

## Resultados

- `npm ci`: instalación desde lockfile, sin opciones para ignorar conflictos de peers.
- `npm test`: **11 pruebas** en tres archivos, todas aprobadas (sesión/renovación concurrente/salida durante refresh, login, rutas restringidas, asistente deshabilitado y sin respuestas falsas, movimientos de tareas/columnas).
- `npm run build`: TypeScript y Vite aprobados. Las vistas de tablero y administración se cargan por separado.
- `python manage.py test api --noinput`: **14 pruebas**, aprobadas tanto en el flujo backend como contra la instancia PostgreSQL 16/pgvector del Compose de producción. Cobertura de permisos, CRUD, propietarios, validación de padres, reordenamiento atómico y rechazo de layouts obsoletos, autenticación y flags de IA.
- `python manage.py check --deploy --fail-level WARNING`: aprobado sin advertencias con configuración de producción.
- `python manage.py makemigrations --check --dry-run`: no hay cambios de esquema pendientes.
- `docker compose ... -f compose.prod.yml config --quiet`: aprobado con variables locales de prueba.
- Imágenes de producción construidas; migraciones aplicadas sobre una base nueva. PostgreSQL 16, Gunicorn y Nginx saludables. Ningún servicio Ollama en ejecución o requerido.
- Se verificó dentro de la imagen normal que `torch` y `sentence_transformers` **no están instalados**.
- Smoke HTTP a través de Nginx: salud, SPA y ruta directa de administración, login, capacidades, CRUD de proyectos/columnas/tareas, reordenamiento, IA 503 y sin escritura en historial.
- Chromium 154 headless: login, listado y tablero, edición y cambio de columna de una tarea, persistencia tras recarga, drag & drop por teclado y puntero con guardado confirmado, administración al acceder directamente a su URL y navegación móvil (390 px) sin desbordamiento horizontal del documento. Sin errores JavaScript de página. Capturas en [images](images/).
- Dump PostgreSQL en formato custom y restauración en una base distinta y temporal: filas de proyectos y extensión pgvector verificadas. La base temporal fue eliminada tras la comprobación; no se restauró sobre la base fuente.

En reposo después del smoke, se observaron aproximadamente 130 MiB para backend, 55 MiB para PostgreSQL y 6 MiB para Nginx. Son mediciones de un entorno de prueba con datos pequeños, **no** una prueba de carga ni una garantía para el host compartido de 8 GB.

## Límites y riesgos pendientes

- Vite informa un chunk inicial de aproximadamente 532 kB minificado (170 kB gzip), por encima de su umbral informativo de 500 kB. No impide compilar; se puede optimizar después con mediciones reales.
- La ejecución de IA habilitada no se validó con modelos reales. El flujo inicial no depende de sus dominios, descargas ni recursos. Los tests de error del proveedor usan mocks.
- El dominio, certificados HTTPS, puertos disponibles, cargas existentes y capacidad efectiva de DataLab deben verificarse durante la instalación manual. La prueba local usa el encabezado de protocolo para simular el proxy HTTPS de confianza.
- JWT permanece en localStorage; el refresh no se revoca al cerrar sesión. El README describe este límite y el alcance de una futura migración a cookies HttpOnly.
- El workflow de GitHub Actions se agregó, pero no se afirma que haya ejecutado remotamente. La creación del PR requiere acceso a `api.github.com`, bloqueado por el proxy del entorno durante esta tarea.
