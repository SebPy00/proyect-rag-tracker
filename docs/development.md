# Desarrollo

El flujo vigente está en el [README](../README.md#desarrollo). Vite sustituye a Create React App y usa Node 22.12+, puerto 3000 y `VITE_API_URL` opcional. Usa `npm ci`, `npm start`, `npm test`, `npm run build`.

Django usa `DEBUG=true` solo en desarrollo, PostgreSQL/pgvector y las variables `POSTGRES_NAME`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` y `POSTGRES_PORT`. Los valores predeterminados de IA son `false`; no se necesitan librerías ML. El Compose de desarrollo es independiente de `compose.prod.yml`.

No uses la base de producción para tests: Django crea `test_<POSTGRES_NAME>` y requiere un rol con permiso CREATEDB. Los modelos de IA no se cargan durante las pruebas del flujo deshabilitado. `requirements-ai.txt` es opcional.

El frontend separa vistas, componentes de tablero, operaciones de datos (`useProject`), transformaciones de orden puras y sesión JWT. Las notificaciones se comparten mediante `FeedbackProvider`. El backend valida pertenencia de padres y guarda un reordenamiento completo en `/api/projects/{id}/reorder/`.
