# Paneles del workspace: validación de interfaz

Estas pruebas usan respuestas API simuladas por Playwright y datos ficticios. No requieren Django, PostgreSQL, Ollama, Docker ni acceso a DataLab. No contienen credenciales reales ni realizan un despliegue.

Desde `frontend/`:

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Si ya hay un Chromium compatible instalado:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright inicia Vite en el puerto local 4173 y comprueba el tipado de sus pruebas antes de ejecutarlas. Los resultados y traces de fallos quedan en `test-results/`, ignorado por Git. Vitest ejecuta solo las pruebas unitarias de `src/`.

Cobertura:

- Navegación de escritorio de 248/64 px, links con etiquetas y tooltip, logout y alternancia con teclado.
- Preferencias independientes (`tracker.sidebar-expanded` y `tracker.assistant-expanded`) y persistencia al recargar. Ante almacenamiento inválido/bloqueado, las pruebas unitarias verifican que la interfaz siga funcionando.
- Asistente oculto por defecto, sin consultas iniciales a capacidades/historial; después de abrirlo, ocultarlo conserva su borrador y estado durante la visita al proyecto. La preferencia de visibilidad es global del navegador; la conversación mantiene el contrato por proyecto.
- Recuperación de 320 px de panel + 24 px de separación al ocultar el asistente; 184 px adicionales al contraer la navegación. Las columnas crecen de 300 hasta 400 px cuando hay espacio libre y conservan el scroll horizontal cuando no caben.
- Drawer móvil siempre completo, cierre al navegar y al pasar a escritorio; asistente debajo del Kanban en móvil/tablet, sin desbordamiento horizontal del documento.
- Modales de tareas, reordenamiento con teclado y traslado de tareas con puntero después de alternar paneles.
- Login, logout y restricción de administración para un miembro sin permisos.

Las capturas de `screenshots/` corresponden a 1600 × 1000 con datos simulados. El primer escenario genera las cuatro combinaciones en su directorio de resultados; las copias adjuntas permiten revisar este cambio sin ejecutar las pruebas. No representan una captura del servidor real.

No se modifica la autenticación ni los contratos del asistente/API. Las transiciones duran 220 ms y se desactivan al solicitar movimiento reducido. El build conserva la advertencia informativa de Vite por el tamaño del bundle inicial; no impide generar la aplicación.


## Resultado de esta rama

- `npm test`: **16 pruebas unitarias aprobadas** (11 existentes y 5 nuevas).
- `npm run build`: TypeScript y Vite aprobados; permanece la advertencia informativa del chunk inicial mayor a 500 kB.
- `npm run test:e2e`: **4 escenarios aprobados** en Chromium, incluyendo el tipado de las pruebas y mediciones reales del layout. El primer escenario también comprueba que las columnas crezcan sin superar 400 px.
- Capturas: [ambos abiertos](screenshots/panels-open.png), [ambos cerrados](screenshots/panels-closed.png), [navegación abierta y asistente cerrado](screenshots/sidebar-open-assistant-closed.png), [navegación cerrada y asistente abierto](screenshots/sidebar-closed-assistant-open.png).

La validación se limita al frontend con API simulada y no sustituye la comprobación manual posterior en DataLab. No se modificaron backend, autenticación, permisos ni configuraciones de producción.
