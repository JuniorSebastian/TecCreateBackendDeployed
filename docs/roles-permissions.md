# TecCreate Backend – Roles, Estados y Permisos

Esta guía resume la lógica actualizada de control de acceso para el backend de TecCreate.

## Roles soportados

| Rol      | Acceso principal |
|----------|------------------|
| `admin`  | Gestión completa (usuarios, estados, roles, dashboard, reportes, presentaciones) |
| `soporte`| Gestión de soporte (`/soporte/**`), puede eliminar presentaciones puntuales; sin acceso al resto del panel admin |
| `usuario`| Uso normal del generador de presentaciones (perfil y presentaciones propias) |

## Estados de usuario

- `activo`: acceso completo según rol.
- `inactivo`: puede autenticarse pero no crear/exportar presentaciones.
- `suspendido`: bloqueo total (login rechazado y rutas protegidas responden 403).

## Flujo de autenticación (Google OAuth)

1. Al autenticarse se garantiza que el usuario exista en `usuarios`.
2. Si el correo está en `ADMIN_EMAILS`, se fuerza el rol `admin`.
3. Se bloquea el inicio si el estado es `suspendido` (mensaje: `Tu cuenta está suspendida. Contacta con soporte.`).
4. El JWT serializa `{ id, nombre, email, foto, rol, estado }`.
5. `/auth/google/callback` incluye `redirect` según rol:
   - admin → `/admin`
   - soporte → `/soporte`
   - usuario → `/perfil`

## Middlewares clave

```
verificarToken  // valida JWT, bloquea suspendidos
verificarEstado // expone estado normalizado y vuelve a bloquear suspendidos
verificarRol([...roles]) // valida el rol normalizado
```

Alias disponibles:
- `soloAdmin(req,res,next)` continúa funcionando, mapeado a `verificarRol(['admin'])`.

## Rutas protegidas

- `/admin/**`: `verificarToken` → `verificarEstado` → `verificarRol(['admin'])`
- `/presentaciones/**`: `verificarToken` → `verificarEstado` → `verificarRol(['admin','usuario','soporte'])`
- `/reportes/**`:
  - GET/PATCH `/reportes` requiere `verificarRol(['admin','soporte'])`
  - DELETE `/reportes/:id` exclusivo `admin`
  - POST `/reportes` accesible sin autenticación (se toma email del cuerpo)

## Reglas adicionales

- Un admin no puede degradar su propio rol (`actualizarRolUsuario`).
- Se registran logs de cambios de rol/estado vía `console.info` para auditoría básica.
- Usuarios `inactivo` reciben 403 al intentar crear/exportar presentaciones.
- Soporte solo tiene acceso de lectura existente más la capacidad de eliminar presentaciones (`DELETE /presentaciones/:id`).

## Requerimientos de entorno

Variables relevantes:

```
ADMIN_EMAILS=correo1@tecsup.edu.pe,correo2@tecsup.edu.pe
JWT_SECRET=... (compartido con frontend)
JWT_EXPIRES_IN=12h (ejemplo)
CLIENT_URL=https://app.teccreate.pe
```

## Consideraciones para el frontend

- Leer el parámetro `redirect` devuelto por `/oauth-success` y redirigir según corresponda.
- Guardar `rol` y `estado` del JWT para condicionar vistas.
- Mostrar mensajes claros cuando el backend retorna 403 por estado/rol.
- Suspender accesos a creación de PPT cuando `estado === 'inactivo'`.
- Exponer:
  - `/admin` solo para `admin`.
  - `/soporte` solo para `soporte`.
  - `/perfil` para `usuario` y `admin`.

## Módulo Soporte (API backend)

> Todas las rutas viven bajo `/soporte/**` y exigen `Authorization: Bearer <token>` con rol `admin` o `soporte`.

### 1. Modo mantenimiento

| Método | Ruta                      | Descripción |
|--------|---------------------------|-------------|
| GET    | `/soporte/mantenimiento`  | Estado actual del modo mantenimiento. |
| PATCH  | `/soporte/mantenimiento`  | Activa o desactiva el modo mantenimiento. |
| DELETE | `/soporte/reportes/:id`      | Marca el reporte como eliminado (soft-delete). Registra auditoría y notificación. |

- **Payload PATCH**

- **Comentarios por reporte**
  - GET `/soporte/reportes/:id/comentarios` → lista los comentarios asociados (estructura: `{ id, reporte_id, autor_email, autor_nombre, autor_foto, mensaje, tipo, creado_en }`).
  - POST `/soporte/reportes/:id/comentarios` → crea comentario. Payload:
    ```json
    {
      "mensaje": "Detalle del seguimiento",
      "tipo": "interno" // opcional: "interno" (default) | "publico"
    }
    ```
  ```json
  {
    "activo": true,
    "mensaje": "Mantenimiento programado (opcional)"
  }
  ```
- **Respuesta**: `{ ok, data: { id, activo, mensaje, activado_por, fecha_activacion }, message }`
- Efecto colateral: cuando `activo === true`, cualquier petición autenticada de rol `usuario` es rechazada con `503` y el login vía Google redirige al frontend a `/mantenimiento` con el mensaje configurado.

### 2. Gestión de usuarios (solo lectura)

| Método | Ruta                 | Descripción |
|--------|----------------------|-------------|
| GET    | `/soporte/usuarios`  | Lista usuarios con filtros `rol`, `estado`, `limit`, `offset`. |
| GET    | `/soporte/usuarios/:email` | Devuelve un usuario puntual (404 si no existe). |

Respuesta estándar:
```json
{
  "ok": true,
  "data": [
    {
      "id": 5,
      "nombre": "Nombre",
      "email": "correo@tecsup.edu.pe",
      "rol": "usuario",
      "estado": "activo",
      "fecha_registro": "2025-10-24T12:00:00.000Z"
    }
  ]
}
```

### 3. Reportes de soporte

| Método | Ruta                         | Descripción |
|--------|------------------------------|-------------|
| GET    | `/soporte/reportes`          | Lista con filtros `categoria`, `estado`, `search`. Devuelve campos normalizados (`categoria`, `categoriaKey`, `estado`, `estadoKey`, `resumen`, `atendido_por`). |
| PATCH  | `/soporte/reportes/:id`      | Actualiza estado (acepta `pendiente`, `en_proceso`, `resuelto`). Guarda automáticamente `atendido_por` con el email del agente y registra auditoría. |
| GET    | `/soporte/reportes/metricas` | Totales y conteos por estado: `{ total, pendientes, en_proceso, resueltos, usuarios_unicos }`. |
| GET    | `/soporte/reportes/exportar` | Exporta CSV con encabezados: `id,categoria,estado,atendido_por,nombre,correo,resumen,mensaje,creado_en,actualizado_en,resuelto_en`. |

- **Notas**:
  - Por defecto responde JSON: `{ ok, data: { filename, mimeType, base64, size }, message }`. Decodifica `base64` para reconstruir el CSV.
  - Si se envía `formato=archivo` (o `csv`/`stream`) en query, o `Accept: text/csv`, la respuesta será la descarga directa del archivo.

- Respuesta estándar PATCH:
  ```json
  {
    "ok": true,
    "data": {
      "id": 42,
      "estado": "En proceso",
      "estadoKey": "en_proceso",
      "atendido_por": "agente@tecsup.edu.pe",
      "actualizado_en": "2025-10-24T13:00:00.000Z"
    },
    "message": "Estado del reporte actualizado correctamente."
  }
  ```

### 4. Historial y auditoría

| Método | Ruta                                   | Descripción |
|--------|----------------------------------------|-------------|
| GET    | `/soporte/historial/mantenimientos`    | Lista (paginada) de activaciones/desactivaciones de mantenimiento. |
| GET    | `/soporte/historial/reportes`          | Acciones del equipo soporte sobre reportes (`accion = "reporte_estado"`). |

Cada elemento incluye `soporte_email`, `accion`, `detalle`, `fecha`.

### 5. Logs del sistema

| Método | Ruta              | Descripción |
|--------|-------------------|-------------|
| GET    | `/soporte/logs`   | Filtra por `tipo` (error | advertencia | info) y `origen` (backend, frontend, IA, etc.) con paginación. |
| POST   | `/soporte/logs`   | Permite registrar un log manual desde la consola de soporte. |

- **POST payload**
  ```json
  {
    "tipo": "info",
    "origen": "panel_soporte",
    "mensaje": "Validación manual completada",
    "usuarioEmail": "agente@tecsup.edu.pe"
  }
  ```
- Respuesta: `{ ok: true, data: { id, tipo, origen, mensaje, usuario_email, fecha }, message }`.

### 6. Notificaciones de soporte

| Método | Ruta                                   | Descripción |
|--------|----------------------------------------|-------------|
| GET    | `/soporte/notificaciones`              | Lista notificaciones; acepta `soloNoLeidas=true`, `limit`, `offset`. |
| PATCH  | `/soporte/notificaciones/:id/leido`    | Marca como leída. |
| POST   | `/soporte/notificaciones`              | Crea notificación manual.

- Las notificaciones automáticas cubren: activación/desactivación de mantenimiento y cambio de estado de reportes.
- Estructura base: `{ id, tipo, mensaje, leido, creado_en }`.

### 7. Integraciones internas

- **Auditoría**: cada cambio de estado de reporte (`PATCH /soporte/reportes/:id`) se inserta en `historial_acciones_soporte` con `accion = "reporte_estado"`.
- **Modo mantenimiento**: el middleware `verificarToken` consulta la última entrada activa; si `activo === true` y `rol === 'usuario'`, responde `503` con `{ mensaje, mantenimiento }`.
- **Login Google**: si mantenimiento está activo y el rol detectado es `usuario`, la autenticación devuelve `info.code = "MAINTENANCE_ACTIVE"` y el callback redirige a `/mantenimiento?activo=1&mensaje=...` en el frontend.

### 8. Dashboard Admin (soporte)

- `GET /admin/dashboard/resumen` ahora incluye `soporte.ticketsResueltosPorAgente`, p.ej.:
  ```json
  {
    "soporte": {
      "ticketsResueltosPorAgente": [
        {
          "email": "agente@tecsup.edu.pe",
          "nombre": "Agente Soporte",
          "resueltos": 12,
          "ultimo_resuelto_en": "2025-10-24T18:10:00.000Z"
        }
      ]
    }
  }
  ```
- Se contabilizan solo reportes `estado = 'resuelto'`, `eliminado = false` y con `atendido_por` asignado.

## Pendientes sugeridos

- Persistir auditoría en base de datos.
- Agregar pruebas automatizadas de autorización.
- Implementar página de soporte en frontend con CRUD de reportes.
