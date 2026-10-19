# Frontend

React 19, TypeScript, MUI, dnd-kit y Vite. Requiere Node 22.12+.

```bash
npm ci
npm start
npm test
npm run build
```

La configuración de desarrollo reenvía `/api` y `/auth` al puerto local 8000. `VITE_API_URL` permite otro origen público, nunca secretos. En producción Nginx sirve `dist` y reenvía API/auth al backend en el mismo origen HTTPS. Ver [README principal](../README.md) para Docker y DataLab.

Usa el asa de arrastre con puntero o teclado (espacio, flechas, espacio; Escape cancela). El detalle de tarea ofrece otra forma de cambiar de columna. La administración exige permisos comprobados por Django; ocultar navegación no constituye autorización.
