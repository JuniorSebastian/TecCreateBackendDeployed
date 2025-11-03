# Estructura del proyecto y buenas prácticas

Resumen de la organización actual del repositorio y convenciones recomendadas.

Estructura principal (carpetas relevantes):

- `routes/` — definición de rutas Express. Cada fichero exporta un router.
- `controllers/` — lógica de controladores; reciben req/res y llaman a servicios.
- `services/` — lógica de negocio y llamadas a APIs externas (Groq, Gemini, generación PPT).
- `lib/` — utilidades puras y helpers (ortografía, formatos, generación de bullets, etc.).
- `middlewares/` — middlewares reutilizables (auth, roles, validaciones).
- `public/` — assets estáticos (imágenes, recursos públicos).
- `scripts/` — herramientas y scripts de mantenimiento (no parte del runtime del servidor).
- `archive/` — backups/archivos históricos (no deben usarse en producción). Se añadieron placeholders para referencias antiguas.

Convenciones y buenas prácticas aplicadas:

- Mantener la raíz limpia: scripts de mantenimiento en `scripts/`, no en la raíz del proyecto.
- No versionar secretos: usar `.env` y `.env.example` (ya añadido).
- Archivar versiones o backups en `archive/` como placeholders (si se desea borrado permanente, hacerlo explícito).
- Importar servicios desde rutas relativas claras (p. ej. `../services/groqService`). Evitar imports dinámicos no necesarios.
- Hacer que dependencias no críticas sean opcionales en tiempo de ejecución (ya aplicado para pino/helmet/compression/rate-limit).

Recomendaciones siguientes:

1. Añadir ESLint + Prettier y un workflow de CI para aplicar formato y reglas de calidad automáticamente.
2. Configurar un store de sesiones (Redis) para producción en vez de `MemoryStore`.
3. Mantener `archive/` fuera de la rama principal si se quiere reducir el tamaño del repo (puede guardarse en almacenamiento externo).
