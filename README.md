# TecCreate Backend

Backend en Node.js/Express para generar presentaciones asistidas por IA, integrando autenticación con Google OAuth, PostgreSQL, Groq (texto) y Gemini (imágenes). Este README explica cómo instalar, configurar, desplegar y operar todo el backend.

## Índice

- [Características principales](#características-principales)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Variables de entorno](#variables-de-entorno)
- [Configuración de la base de datos](#configuración-de-la-base-de-datos)
- [Ejecución local](#ejecución-local)
- [Guía paso a paso de despliegue](#guía-paso-a-paso-de-despliegue)
- [Despliegue](#despliegue)
  - [Render (Blueprint incluido)](#render-blueprint-incluido)
  - [Servidor propio / on-premise](#servidor-propio--on-premise)
- [OAuth con Google](#oauth-con-google)
- [Flujo funcional principal](#flujo-funcional-principal)
- [API resumida](#api-resumida)
- [IA y generación de PPTX](#ia-y-generación-de-pptx)
- [Soporte y mantenimiento](#soporte-y-mantenimiento)
- [Salud, CORS y sesiones](#salud-cors-y-sesiones)
- [Solución de problemas](#solución-de-problemas)
- [Documentación complementaria](#documentación-complementaria)

## Características principales

- Autenticación con Google OAuth; sólo correos institucionales preconfigurados pueden ingresar.
- Roles: usuario, admin (profesor/coordinador) y soporte.
- Gestión de presentaciones con IA (Groq) y exportación a PPTX con plantillas, fuentes e imágenes generadas (Gemini).
- Dashboard para administradores con métricas y tendencias.
- Módulo de soporte: reportes, modo mantenimiento, logs e historial.
- Endpoints protegidos con JWT (enviado desde el frontend en el header `Authorization: Bearer <token>`).

## Arquitectura

- **Express**: rutas en `routes/` (auth, presentaciones, admin, reportes, soporte).
- **Passport**: autenticación Google OAuth 2.0.
- **PostgreSQL**: conexión vía `pg` (pool central en `db.js`).
- **Servicios IA**: `groqService` (texto), `geminiService` (imágenes).
- **Exportación PPTX**: `pptService` con `pptxgenjs`.
- **Estáticos**: `/public` (descargas, imágenes, QR).
- **Healthcheck**: `GET /healthz` devuelve `{ status: "ok" }`.

## Requisitos

- Node.js 18.17+ (LTS recomendado).
- npm 9+.
- PostgreSQL 14+.
- Proyecto OAuth en Google Cloud con redirect URI configurado.
- (Opcional) API keys de Groq y Gemini.

## Variables de entorno

Defínelas en tu `.env`, en Render o en tu gestor de secretos. Sustituye `<...>` por tus datos reales.

```
NODE_ENV=production
HOST=0.0.0.0
PORT=3001

PUBLIC_BASE_URL=https://<tu-backend>
CLIENT_URL=https://<tu-frontend>
ALLOWED_ORIGINS=https://<tu-frontend>,https://<tu-backend>

DATABASE_URL=postgresql://<user>:<pass>@<host>:<port>/<db>
DATABASE_SSL=true
PGPOOL_MAX=3
PGPOOL_IDLE_TIMEOUT=10000
PGPOOL_CONNECTION_TIMEOUT=5000

SESSION_SECRET=<aleatorio>
JWT_SECRET=<aleatorio>
JWT_EXPIRES_IN=1d
ADMIN_EMAILS=correo1@instituto.edu,correo2@instituto.edu

GOOGLE_CLIENT_ID=<client_id>
GOOGLE_CLIENT_SECRET=<client_secret>
GOOGLE_CALLBACK_URL=https://<tu-backend>/auth/google/callback

GROQ_API_KEY=<opcional>
GEMINI_API_KEY=<opcional>
GEMINI_IMAGE_MODEL=<opcional-deja-vacio-si-no-tienes-modelo>
MAINTENANCE_GATE_SECRET=<opcional>
SUPPORT_EMAIL=soporte@tu-dominio.com
```

Notas:
- Ajusta `PGPOOL_MAX` según el límite de conexiones de tu Postgres (planes pequeños: 2–5).
- `ALLOWED_ORIGINS` controla qué dominios pueden consumir el backend.
- Todos los secretos (JWT, sesión, OAuth, Groq, Gemini) deben generarse en tus propias cuentas; no compartas ni subas los valores reales al repositorio.

## Configuración de la base de datos

Ejecuta el script completo `estructura_presentador_ia.sql` para crear todas las tablas, índices y triggers.
Con una única ejecución tendrás todo el esquema listo en PostgreSQL (no requiere pasos manuales adicionales).

```bash
psql -U <usuario> -d <base> -h <host> -p <puerto> -f estructura_presentador_ia.sql
```

Este script incluye usuarios, presentaciones, imágenes, reportes, logs, modo mantenimiento, etc.

## Ejecución local

```bash
npm install
node index.js
```

Comprueba:

```bash
curl http://localhost:3001/healthz
```

Deberías obtener `{ "status": "ok" }`.

## Guía paso a paso de despliegue

### 1. Preparar el entorno (común a cualquier despliegue)

1. **Clonar el repositorio**
  ```bash
  git clone https://github.com/<tu-organizacion>/TecCreateBackendLocal.git
  cd TecCreateBackendLocal/backend
  ```
2. **Instalar dependencias**
  ```bash
  npm install
  ```
3. **Crear el archivo `.env`** tomando como referencia la sección [Variables de entorno](#variables-de-entorno). Usa secretos propios para JWT, sesión y las integraciones.
4. **Provisionar PostgreSQL** (local, Render o servidor institucional) y apunta `DATABASE_URL` a esa instancia.
5. **Aplicar el esquema**
  ```bash
  psql "<cadena-connection>" -f estructura_presentador_ia.sql
  ```
6. **Configurar OAuth de Google** siguiendo la sección [OAuth con Google](#oauth-con-google). Verifica que el `redirect_uri` coincida con tu dominio.
7. **Verificar claves IA** (opcional) creando `GROQ_API_KEY` y `GEMINI_API_KEY`.

### 2A. Desplegar con Render (automatizado)

1. **Verificar `render.yaml`**: confirma que el archivo está en la raíz del backend y contiene el servicio web y la base de datos.
2. **Crear Blueprint** en Render:
  - Render → Deploy → New Blueprint → conecta el repositorio.
  - Render detectará `render.yaml` y sugerirá los recursos.
3. **Revisar variables de entorno**:
  - Render marca con `sync: false` las variables que debes completar manualmente (CLIENT_URL, OAuth, IA, etc.).
  - Usa el botón **Generate** para `SESSION_SECRET` y `JWT_SECRET` o pega valores propios.
4. **Deploy**: Render instalará dependencias y ejecutará `npm run start` (definido en el blueprint).
5. **Probar salud**:
  ```bash
  curl https://<tu-servicio>.onrender.com/healthz
  ```
6. **Configurar dominio personalizado** (opcional): actualiza `PUBLIC_BASE_URL` y agrega el dominio a `ALLOWED_ORIGINS`.
7. **Supervisar logs**: en Render → Logs confirma que Express se levantó y la conexión a Postgres fue exitosa.

### 2B. Desplegar en servidor privado / instituto (manual)

1. **Instalar dependencias del servidor**:
  - Node.js 18+ (`nvm`, instalador oficial o repositorio del SO).
  - npm 9+.
  - PostgreSQL 14+ (puede ser en el mismo servidor o gestionado por TI del instituto).
2. **Crear usuario del sistema** (opcional pero recomendado) y directorio:
  ```bash
  sudo useradd --system --create-home --shell /bin/bash teccreate
  sudo mkdir -p /srv/teccreate
  sudo chown teccreate:teccreate /srv/teccreate
  ```
3. **Deploy del código**:
  - Clona el repositorio dentro de `/srv/teccreate` o usa Git pull desde un CI.
  - Asegúrate de que `node_modules` no quede expuesto públicamente.
4. **Configurar `.env` seguro**:
  - Guarda un archivo `/srv/teccreate/backend/.env` con permisos restringidos (`chmod 600`).
  - Alternativamente usa variables en el gestor de procesos (PM2, systemd, Docker secrets, etc.).
5. **Ejecutar migraciones**: importa `estructura_presentador_ia.sql` en la base institucional (`psql ... -f estructura_presentador_ia.sql`).
6. **Iniciar el servicio**:
  - Con PM2:
    ```bash
    pm2 start index.js --name teccreate-backend --cwd /srv/teccreate/backend --env production
    pm2 save
    pm2 startup
    ```
  - Con systemd: crea `/etc/systemd/system/teccreate.service` (ver plantilla en la sección [Servidor propio / on-premise](#servidor-propio--on-premise)).
7. **Reverse proxy + HTTPS**:
  - Configura Nginx/Traefik para exponer el backend solo por HTTPS.
  - Redirige tráfico externo al puerto interno (3001 por defecto).
  - Habilita certificados válidos (Let’s Encrypt, wildcard institucional, etc.).
8. **Probar** desde la red del instituto:
  ```bash
  curl https://backend.tec-instituto.edu/healthz
  ```
9. **Monitorear logs y recursos**:
  - PM2: `pm2 logs teccreate-backend`.
  - systemd: `journalctl -u teccreate.service -f`.
  - Postgres: revisa conexiones activas y ajustes de pool si es necesario.

### 3. Post-despliegue

1. **Crear cuentas administrativas**: añade correos institucionales a `ADMIN_EMAILS` y prueba flujos admin/soporte.
2. **Verificar dashboards y reportes**: confirma que las tablas de métricas y soporte se llenan correctamente.
3. **Configurar respaldos**: programa backups de la base y descarga periódica de `public/shared-presentaciones` si se usa.
4. **Plan de mantenimiento**: documenta cómo activar `modo mantenimiento` (`PATCH /soporte/mantenimiento`) y cómo notificar al equipo de soporte.

## Despliegue

### Render (Blueprint incluido)

1. Asegúrate de que `render.yaml` esté en la raíz.
2. En Render → Deploy → New Blueprint → selecciona el repo.
3. Render creará:
   - Servicio web Node con comando `npm run start`.
   - Base de datos Postgres (plan free) si la plantilla lo especifica.
4. Completa las variables marcadas con `sync: false` (CLIENT_URL, OAuth, IA, etc.).
5. Render puede generar `SESSION_SECRET` y `JWT_SECRET` (usa la opción "Generate").
6. Tras el deploy, visita `https://<servicio>.onrender.com/healthz`.
7. Si conectas un dominio propio, agrega la URL a `ALLOWED_ORIGINS` y actualiza `PUBLIC_BASE_URL`.

### Servidor propio / on-premise

1. Instala Node 18+, npm y PostgreSQL.
2. Clona el repositorio y ejecuta `npm install`.
3. Aplica `estructura_presentador_ia.sql` a tu base.
4. Define variables en `/etc/teccreate/backend.env` (o similar) y protégelas.
5. Ejecuta con PM2 o systemd. Ejemplo con PM2:

```bash
pm2 start index.js --name teccreate-backend --env production
pm2 save
pm2 startup
```

6. Configura un reverse proxy (Nginx/Traefik) con HTTPS y redirige tráfico al puerto interno (por defecto 3001).
7. Abre únicamente el puerto 443/HTTPS hacia el público.

## OAuth con Google

1. En Google Cloud Console crea un OAuth Client ID (tipo Web Application).
2. `Authorized redirect URI`: `https://<tu-backend>/auth/google/callback`.
3. `Authorized JavaScript origins`: incluye tu backend y frontend.
4. Copia `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` a tus variables de entorno.
5. Si cambias de dominio, actualiza Google Cloud y la variable `GOOGLE_CALLBACK_URL`.

## Flujo funcional principal

1. Usuario inicia sesión (OAuth) → backend genera JWT → redirección al frontend con `token` y `redirect` según rol.
2. Usuario crea presentación (`POST /presentaciones` o `POST /presentaciones/generar`).
3. Puede editar (`PUT /presentaciones/:id`), listar (`GET /presentaciones/mias`) y consultar detalle (`GET /presentaciones/:id`).
4. Exporta a PPTX (`GET /presentaciones/:id/export`) o comparte (`POST /presentaciones/:id/share`).
5. Admin revisa dashboard y usuarios (`/admin`), soporte gestiona reportes (`/reportes`, `/soporte`).

## API resumida

Ruta | Método | Rol | Descripción
--- | --- | --- | ---
`/auth/google` | GET | público | Inicia OAuth Google.
`/auth/google/callback` | GET | público | Procesa OAuth, genera JWT y redirige al frontend.
`/presentaciones` | POST | usuario/admin | Crear presentación (con esquema propio o IA).
`/presentaciones/generar` | POST | usuario/admin | Generar esquema con Groq.
`/presentaciones/generar/export` | POST | usuario/admin | Generar + exportar PPTX.
`/presentaciones/:id` | GET/PUT/DELETE | usuario/admin/soporte | Consultar, actualizar o eliminar presentación.
`/presentaciones/:id/export` | GET | usuario/admin | Descargar PPTX.
`/presentaciones/:id/share` | POST | usuario/admin | Crear enlace público de descarga.
`/presentaciones/:id/imagenes` | POST | usuario/admin | Generar imágenes (Gemini).
`/admin/dashboard/resumen` | GET | admin | Métricas generales.
`/admin/usuarios` | GET | admin | Listado usuarios.
`/reportes` | GET/POST/PATCH/DELETE | soporte/admin | Gestión de reportes de soporte.
`/soporte/*` | varios | soporte/admin | Modo mantenimiento, logs, historiales y notificaciones.

Para detalles completos revisa los controladores en `controllers/` o el manual técnico (`docs/Backend-Manual.md`).

## IA y generación de PPTX

- Groq (`GROQ_API_KEY`) genera el contenido textual de las slides.
- Gemini (`GEMINI_API_KEY` + `GEMINI_IMAGE_MODEL`) crea imágenes temáticas opcionales. **Si no tienes un modelo disponible con cuota, deja `GEMINI_IMAGE_MODEL` vacío y las presentaciones se generarán sin imágenes**.
- Modelos recomendados (si tu proyecto tiene cuota disponible): `gemini-2.5-flash-image`, `gemini-exp-1206` (experimental). Verifica disponibilidad en https://ai.google.dev/gemini-api/docs/models/gemini#imagen.
- `pptxgenjs` arma el PPTX usando plantillas (`utils/pptThemes.js`) y fuentes (`utils/pptFonts.js`).
- Si no hay claves IA o el modelo no está disponible, el backend funciona con degradación (esquemas básicos sin imágenes).

## Soporte y mantenimiento

- `POST /reportes`: usuarios envían incidencias.
- `GET /reportes`: soporte/admin las revisan.
- `PATCH /soporte/mantenimiento`: activar o desactivar modo mantenimiento (bloquea usuarios regulares).
- `GET /soporte/notificaciones`: alertas internas para el equipo de soporte.

## Salud, CORS y sesiones

- Healthcheck: `GET /healthz` → usado por Render u orquestadores.
- CORS: se valida contra `CLIENT_URL`, `PUBLIC_BASE_URL`, `RENDER_EXTERNAL_URL` y `ALLOWED_ORIGINS` (se normalizan URLs).
- Sesiones: `express-session` con cookies `httpOnly`, `secure` y `sameSite=none` en producción. Para múltiples instancias, considera Redis u otro store.

## Solución de problemas

- **`too many connections`**: reduce `PGPOOL_MAX`, reinicia la base, usa PgBouncer o sube el plan de Postgres.
- **`redirect_uri_mismatch`**: la URI configurada en Google Cloud no coincide con `GOOGLE_CALLBACK_URL`.
- **`503 Servicio IA no configurado`**: falta `GROQ_API_KEY` o `GEMINI_API_KEY`.
- **CORS bloqueado**: añade tu frontend a `ALLOWED_ORIGINS`.
- **Dashboard 500**: ejecuta `estructura_presentador_ia.sql` para crear columnas/tablas faltantes.
- **Sesiones persistentes**: considera migrar el store a Redis/Postgres si habrá escalado horizontal.

## Documentación complementaria

- `docs/Backend-Manual.md`: guía técnica completa (infraestructura, despliegue, endpoints, seguridad).
- `docs/Manual-Usuario-Backend.md`: guía operativa para profesores, soporte y usuarios (funcionalidades, pasos y ejemplos de API).
- `render.yaml`: blueprint listo para Render (servicio web + Postgres + variables clave).
- `estructura_presentador_ia.sql`: script de creación y actualización del esquema de base de datos.

---

Este README es independiente de dominios o bases específicas. Sustituye las variables y URLs por las de tu ambiente y utiliza los scripts provistos para tener una instalación reproducible.
