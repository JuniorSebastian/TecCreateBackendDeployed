# Manual de Usuario – Backend TecCreate

Este documento describe cómo usar el backend de TecCreate desde la perspectiva funcional (usuario y administrador), mapeando cada acción a los endpoints y requisitos del API. No contiene secretos ni URLs del autor: sustituye dominios y credenciales por los de tu entorno.

## Roles y acceso

- Usuario: puede crear, listar, editar y exportar sus presentaciones.
- Admin (profesor/coordinador): además de lo anterior, puede ver el dashboard, gestionar usuarios y revisar/administrar reportes de soporte.
- Soporte: gestiona reportes y modo mantenimiento.

Autenticación: el backend utiliza Google OAuth. Tras iniciar sesión, el frontend recibe un JWT que deberá enviarse en cada solicitud protegida como:

```
Authorization: Bearer <token>
```

Nota: por política, sólo correos del dominio institucional configurado están permitidos (p. ej. @instituto.edu). Los correos listados en `ADMIN_EMAILS` reciben rol admin.

---

## Funcionalidad 1: Apartado Administrador (moderación y control)

Objetivo: permitir a profesores/coordinadores verificar usuarios creados y el uso correcto de la plataforma.

Endpoints relevantes (rol: admin):

- Dashboard con métricas: `GET /admin/dashboard/resumen`
- Usuarios (listado): `GET /admin/usuarios`
- Usuario (detalle): `GET /admin/usuarios/:id`
- Presentaciones de un usuario: `GET /admin/usuarios/:id/presentaciones`
- Actualizar rol: `PATCH /admin/usuarios/:id/rol` (body: `{ "rol": "admin|usuario|soporte" }`)
- Actualizar estado: `PATCH /admin/usuarios/:id/estado` (body: `{ "estado": "activo|inactivo|suspendido" }`)

Ejemplos (cURL):

```bash
# Dashboard
curl -H "Authorization: Bearer <token>" \
  https://<backend>/admin/dashboard/resumen

# Listar usuarios
curl -H "Authorization: Bearer <token>" \
  https://<backend>/admin/usuarios

# Cambiar rol a soporte
curl -X PATCH -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"rol":"soporte"}' \
  https://<backend>/admin/usuarios/123/rol

# Suspender usuario
curl -X PATCH -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"estado":"suspendido"}' \
  https://<backend>/admin/usuarios/123/estado
```

---

## Funcionalidad 2: Creación de presentaciones (núcleo del sistema)

Permite crear presentaciones con prompt propio, configuraciones rápidas (número de slides, estilo/plantilla, idioma y nivel de detalle), generar un esquema sugerido con IA (Groq) y editar antes de descargar.

Flujo API típico del usuario:

1) Generar esquema con IA (opcional)

```bash
POST /presentaciones/generar
Authorization: Bearer <token>
Content-Type: application/json

{
  "tema": "Historia de Internet",
  "idioma": "Español",
  "numeroSlides": 8
}
```

Respuesta: `slides` con títulos y bullets sugeridos. Requiere `GROQ_API_KEY` configurada; si falta, puede responder 503 o devolver un esquema básico.

2) Crear y guardar la presentación

```bash
POST /presentaciones
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Historia de Internet",
  "contenido": [
    "Orígenes: ARPANET, TCP/IP y primeras redes académicas",
    "Expansión comercial: WWW y navegadores",
    "Ecosistema actual: servicios en la nube y móviles"
  ],
  "idioma": "es",
  "plantilla": "default",
  "fuente": "inter",
  "numero_slides": 8
}
```

3) Editar (si se requiere)

```bash
PUT /presentaciones/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Historia del Internet (Actualizada)",
  "contenido": ["Nuevo esquema..."],
  "plantilla": "modern"
}
```

4) Listar y consultar detalle

```bash
GET /presentaciones/mias
Authorization: Bearer <token>

GET /presentaciones/:id
Authorization: Bearer <token>
```

---

## Funcionalidad 3: Descarga de diapositivas (PPTX)

Exporta a `.pptx` con los títulos y contenido; puede incluir imágenes generadas slide a slide si Gemini está configurado.

Opciones de exportación:

- Exportar una presentación existente (por id):

```bash
GET /presentaciones/:id/export
Authorization: Bearer <token>
Accept: application/vnd.openxmlformats-officedocument.presentationml.presentation
```

- Generar con IA y exportar en un paso:

```bash
POST /presentaciones/generar/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "tema": "Historia de Internet",
  "numeroSlides": 8,
  "guardar": true,
  "plantilla": "default",
  "fuente": "inter"
}
```

- Compartir (genera archivo y QR para descarga pública temporal):

```bash
POST /presentaciones/:id/share
Authorization: Bearer <token>
```

Respuesta: `shareUrl` y `qrCodeDataUrl`.

---

## Guía paso a paso (mapeado a tus 8 pasos)

1. Iniciar sesión con cuenta institucional → `GET /auth/google` (flujo OAuth) → frontend recibe `token` JWT.
2. “Crear presentación” → en backend equivale a usar `POST /presentaciones/generar` (borrador IA) o directamente `POST /presentaciones`.
3. Configurar idioma, estilo (plantilla), número de slides y detalle → parámetros en el body de las llamadas anteriores.
4. Ver esquema sugerido → proviene de la respuesta de `POST /presentaciones/generar`.
5. Editar el esquema → `PUT /presentaciones/:id` para guardar los cambios.
6. Guardar y volver al panel → confirmación de la actualización vía `PUT` y listado con `GET /presentaciones/mias`.
7. Descargar PPT → `GET /presentaciones/:id/export`.
8. Verificar PPT local → Archivo `.pptx` descargado (títulos, bullets e imagen por slide si está disponible).

---

## Reportes de soporte y modo mantenimiento

- Crear reporte (público, adjunta usuario si hay token): `POST /reportes`
- Listar reportes (admin/soporte): `GET /reportes`
- Cambiar estado: `PATCH /reportes/:id`
- Eliminar: `DELETE /reportes/:id` (admin)
- Mantenimiento (soporte/admin):
  - Estado: `GET /soporte/mantenimiento`
  - Activar/actualizar: `PATCH /soporte/mantenimiento`

---

## Errores comunes

- 401 No autenticado: falta o es inválido el JWT.
- 403 Inactivo/Suspendido: el usuario no puede operar (verifica estado en admin).
- 503 Servicio IA no disponible: faltan `GROQ_API_KEY` o `GEMINI_API_KEY`.
- 500 Dashboard: si faltan tablas/columnas, ejecutar `estructura_presentador_ia.sql`.
- Demasiadas conexiones: reduce `PGPOOL_MAX` o usa PgBouncer/plan superior.

---

## Recomendaciones

- CORS: define `CLIENT_URL` y `ALLOWED_ORIGINS` con los dominios reales (frontend y backend).
- Seguridad: mantén secretos fuera del código (usa variables de entorno/secret manager).
- Sesiones: para producción, considera Redis/Postgres como store en lugar de MemoryStore.

