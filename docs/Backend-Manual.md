# TecCreate Backend – Manual de Usuario (Completo)

Backend en Node.js/Express con PostgreSQL, OAuth2 (Google), generación de presentaciones con IA (Groq) e imágenes (Gemini), y exportación a PPTX. Este documento sirve como guía integral para configurar, desplegar, operar y mantener el servicio, tanto en Render como en servidores propios.

## 1. Vista general

- Stack: Node.js 18+, Express 5, PostgreSQL 14+, Passport (Google OAuth 2.0), JWT, pptxgenjs, Groq SDK, Gemini.
- Autenticación: Google OAuth → genera JWT (enviado al frontend) y sesiones de Passport (solo en backend).
- Autorización por roles: admin, soporte, usuario.
- CORS configurable por variables de entorno.
- Exportación PPTX con plantillas/temas y fuentes configurables.
- Modo mantenimiento y módulo de soporte con reportes y notificaciones.

## 2. Arquitectura (alto nivel)

- Express expone rutas REST bajo `/auth`, `/presentaciones`, `/admin`, `/reportes`, `/soporte`.
- PostgreSQL almacena usuarios, presentaciones, imágenes, reportes y logs.
- Groq/Gemini (opcionales) para IA de contenido e imágenes.
- Archivos estáticos en `/public` (por ejemplo `/public/shared-presentaciones`).
- Health check en `GET /healthz`.

## 3. Requisitos previos

- Node.js 18.17+ (se recomienda LTS) y npm.
- PostgreSQL 14+.
- Proyecto OAuth2 en Google Cloud con redirect URI configurado.
- (Opcional) Claves de Groq y Gemini.

## 4. Variables de entorno

No uses dominios ni credenciales del autor; reemplázalos por los de tu entorno. Define al menos:

```
NODE_ENV=production
HOST=0.0.0.0
PORT=3001

PUBLIC_BASE_URL=https://<tu-dominio-backend>
CLIENT_URL=https://<tu-dominio-frontend>
ALLOWED_ORIGINS=https://<tu-frontend>,https://<tu-backend>

DATABASE_URL=postgresql://<user>:<pass>@<host>:<port>/<db>
DATABASE_SSL=true                  # o false si tu red es interna sin TLS
PGPOOL_MAX=3                       # ajusta según límite de conexiones del servidor
PGPOOL_IDLE_TIMEOUT=10000
PGPOOL_CONNECTION_TIMEOUT=5000

SESSION_SECRET=<aleatorio>
JWT_SECRET=<aleatorio>
JWT_EXPIRES_IN=1d
ADMIN_EMAILS=correo1@instituto.edu,correo2@instituto.edu

GOOGLE_CLIENT_ID=<tu_client_id>
GOOGLE_CLIENT_SECRET=<tu_client_secret>
GOOGLE_CALLBACK_URL=https://<tu-dominio-backend>/auth/google/callback

GROQ_API_KEY=<opcional>
GEMINI_API_KEY=<opcional>
MAINTENANCE_GATE_SECRET=<opcional>
SUPPORT_EMAIL=soporte@tu-dominio.com
```

Notas:
- `CLIENT_URL` y `GOOGLE_CALLBACK_URL` deben usar tus propios dominios. Si cambian, actualízalos aquí y en Google Cloud Console.
- Ajusta `PGPOOL_MAX` al límite de tu base (p. ej. 2–5 para planes pequeños).

## 5. Base de datos y esquema

Ejecuta el script `estructura_presentador_ia.sql` en tu base para crear/actualizar toda la estructura necesaria (usuarios, presentaciones, reportes, logs, modo mantenimiento, etc.). Ejemplo con psql:

```bash
psql -U <user> -d <db> -h <host> -p <port> -f estructura_presentador_ia.sql
```

## 6. Ejecución local

```bash
npm install
node index.js
```

Comprueba `http://localhost:3001/healthz`.

## 7. Despliegue

### 7.1 Render (Blueprint incluido)

- Se incluye `render.yaml` con servicio web y base Postgres de ejemplo. Crear un Blueprint en Render y completar variables de entorno.
- Añade tus claves sensibles (CLIENT_URL, Google, IA) desde el panel de Render.
- Visita `/healthz` para validar disponibilidad.

### 7.2 Servidor propio (on‑premise)

- Instalar Node 18+, npm y PostgreSQL; clonar repo y `npm install`.
- Definir variables en un archivo `.env` o variables de sistema.
- Opcional: ejecutar con PM2 o systemd para reinicio automático.
- Recomendar un reverse proxy (Nginx/Traefik) con TLS frente a Express.

## 8. Autenticación y autorización

- Login: `GET /auth/google` → OAuth Google → callback `GET /auth/google/callback`.
- Si el login es exitoso, se redirige a `${CLIENT_URL}/oauth-success?...` con `token` (JWT), `user` (JSON) y `redirect` (ruta sugerida por rol).
- JWT: incluir en las peticiones protegidas `Authorization: Bearer <token>`.
- Roles:
  - admin: acceso completo a admin y soporte.
  - soporte: acceso a rutas de soporte y reportes.
  - usuario: rutas de presentaciones propias.

## 9. CORS y sesiones

- Orígenes permitidos definidos por `CLIENT_URL`, `PUBLIC_BASE_URL`, `RENDER_EXTERNAL_URL` (si existe) y `ALLOWED_ORIGINS`.
- En producción las cookies de sesión se marcan `secure` y `sameSite=none`.
- Nota: `MemoryStore` de `express-session` no es recomendado para alta escala; si es necesario, usar Redis o Postgres como store.

## 10. Endpoints principales

Rutas protegidas requieren `Authorization: Bearer <token>` y rol adecuado.

### 10.1 Autenticación (`/auth`)
- `GET /auth/google` → inicia OAuth.
- `GET /auth/google/callback` → procesa OAuth y redirige al frontend con JWT.

### 10.2 Presentaciones (`/presentaciones`)
- `GET /presentaciones/plantillas` → lista plantillas PPT (roles: admin, usuario, soporte)
- `GET /presentaciones/fuentes` → lista fuentes PPT (roles: admin, usuario, soporte)
- `GET /presentaciones/temas` → lista temas sugeridos (roles: admin, usuario, soporte)
- `GET /presentaciones/temas/:tema` → detalle por clave de tema (roles: admin, usuario, soporte)
- `GET /presentaciones/mias` → mis presentaciones (roles: admin, usuario, soporte)
- `POST /presentaciones` → crear presentación
- `PUT /presentaciones/:id` → actualizar
- `DELETE /presentaciones/:id` → eliminar (admin, usuario, soporte)
- `GET /presentaciones/:id` → detalle (propietario o roles elevados)
- `POST /presentaciones/generar` → IA (Groq) genera esquema
- `POST /presentaciones/generar/export` → IA + exportación directa a PPTX (opcional `guardar: true`)
- `POST /presentaciones/temas/:tema/export` → exportar tema sugerido en PPTX
- `POST /presentaciones/:id/imagenes` → generar imágenes IA para una presentación existente (Gemini)
- `GET /presentaciones/:id/export` → descarga PPTX
- `POST /presentaciones/:id/share` → genera link y QR de descarga en `/public/shared-presentaciones`

### 10.3 Administración (`/admin`)
- `GET /admin/dashboard/resumen` → métricas, tendencias y últimos elementos (rol: admin)

### 10.4 Reportes (`/reportes`)
- `GET /reportes/categorias` → categorías disponibles (público)
- `GET /reportes/estados` → estados (admin/soporte)
- `POST /reportes` → crear reporte (adjunta usuario si hay token)
- `GET /reportes` → listar (admin/soporte)
- `PATCH /reportes/:id` → actualizar estado (admin/soporte)
- `DELETE /reportes/:id` → eliminar (admin)

### 10.5 Soporte (`/soporte`)
- `GET /soporte/mantenimiento` / `PATCH /soporte/mantenimiento` → estado y activación del modo mantenimiento
- `GET /soporte/usuarios` → listar usuarios
- `GET /soporte/usuarios/:id/presentaciones` → listar presentaciones de un usuario
- `GET /soporte/usuarios/:id/presentaciones/:presentacionId` → detalle
- `GET /soporte/usuarios/:email` → buscar usuario por email
- `GET /soporte/reportes` / `PATCH /soporte/reportes/:id` / `DELETE /soporte/reportes/:id`
- `GET /soporte/reportes/:id/comentarios` / `POST /soporte/reportes/:id/comentarios`
- `GET /soporte/reportes/metricas` / `GET /soporte/reportes/exportar`
- Historial y logs: `GET /soporte/historial/*`, `GET/POST /soporte/logs`
- Notificaciones: `GET /soporte/notificaciones`, `PATCH /soporte/notificaciones/:id/leido`, `POST /soporte/notificaciones`

## 11. IA y exportación a PPTX

- Groq (`GROQ_API_KEY`) para generar contenido de slides. Si no está configurado, algunos endpoints IA devolverán `503` o usarán degradación controlada.
- Gemini (`GEMINI_API_KEY`) para generar imágenes por slide (opcional).
- PPTX: `pptxgenjs` genera presentaciones con plantillas, fuentes y estilos del proyecto. Las imágenes se incorporan si están disponibles.

## 12. Health check y estáticos

- `GET /healthz` → `{ status: "ok" }` con `uptime` y `timestamp`.
- Archivos compartidos: `/public/shared-presentaciones/<archivo>.pptx` (servicio de descarga generado por compartir).

## 13. Seguridad y buenas prácticas

- Mantén secretos fuera del repo (usa gestores de secretos o variables del sistema).
- Habilita HTTPS en el reverse proxy (Nginx/Traefik) o en la plataforma (Render).
- Define `ALLOWED_ORIGINS` correctamente para CORS.
- Usa `PGPOOL_MAX` acorde al límite de conexiones de tu base.
- Considera un store de sesión persistente (Redis) si habrá múltiples instancias.

## 14. Solución de problemas (FAQ)

- `too many connections`: baja `PGPOOL_MAX` (p. ej. 2–3), reinicia la base o usa PgBouncer.
- `redirect_uri_mismatch`: `GOOGLE_CALLBACK_URL` no coincide con lo registrado en Google Cloud; actualiza ambos.
- `503 Servicio Groq/Gemini no configurado`: agrega sus API keys y redeploy.
- `CORS bloqueado`: agrega el dominio del frontend a `ALLOWED_ORIGINS`.
- `500 en /admin/dashboard/resumen`: ejecuta `estructura_presentador_ia.sql` y revisa columnas/tablas faltantes.

## 15. Scripts útiles

- `npm start` → inicia el servidor.
- `render.yaml` → blueprint para Render (servicio web + Postgres + env vars).
- Carpeta `scripts/` → utilidades de soporte (listar, seed, tests de middleware).

## 16. Licencia y autores

- Licencia: ISC
- Autoría principal del backend en este repo; personaliza variables de entorno, dominios y base de datos según tu despliegue.
