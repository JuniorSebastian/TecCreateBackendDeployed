# Gestión de usuarios (API Admin)

Este módulo expone endpoints REST bajo `/admin/usuarios` para administrar cuentas dentro de TecCreate. Todos los endpoints requieren token válido y rol `admin`.

## Catálogos disponibles

```
GET /admin/usuarios/catalogos
Authorization: Bearer <token>
```

Respuesta:

```json
{
  "roles": ["admin", "usuario"],
  "estados": ["activo", "inactivo", "suspendido"]
}
```

## Listar usuarios

```
GET /admin/usuarios?search=<texto>&rol=admin&estado=activo&limit=20&offset=0
Authorization: Bearer <token>
```

- `search` y `q`: buscan por nombre, email o título de presentación.
- `rol` / `role`: filtra por rol (`admin`, `usuario`).
- `estado` / `status`: filtra por estado (`activo`, `inactivo`, `suspendido`).
- `limit`: 1-100 (por defecto 20).
- `offset`: desplazamiento (por defecto 0).

Respuesta (ejemplo):

```json
{
  "usuarios": [
    {
      "id": 1,
      "nombre": "Junior Sebastian Osorio Toribio",
      "email": "junior.osorio@tecsup.edu.pe",
      "foto": null,
      "rol": "admin",
      "estado": "activo",
      "fechaRegistro": "2025-10-21T14:32:10.123Z",
      "totalPresentaciones": 8,
      "ultimaActividad": "2025-10-22T01:00:00.000Z",
      "ultimaPresentacion": {
        "id": 17,
        "titulo": "Tema: Fundamentos de Programación",
        "fecha": "2025-10-22T01:00:00.000Z",
        "plantilla": "software",
        "fuente": "segoe-ui",
        "numeroSlides": 12
      }
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0
  },
  "meta": {
    "rolesDisponibles": ["admin", "usuario"],
    "estadosDisponibles": ["activo", "inactivo", "suspendido"]
  }
}
```

## Detalle de un usuario

```
GET /admin/usuarios/:id
Authorization: Bearer <token>
```

Devuelve la misma estructura que el listado para un usuario específico. `:id` es el identificador numérico de la tabla `usuarios`.

## Historial de presentaciones por usuario

```
GET /admin/usuarios/:id/presentaciones?limit=10&offset=0
Authorization: Bearer <token>
```

Respuesta:

```json
{
  "usuario": {
    "id": 1,
    "nombre": "Junior Sebastian Osorio Toribio",
    "email": "junior.osorio@tecsup.edu.pe"
  },
  "presentaciones": [
    {
      "id": 17,
      "titulo": "Tema: Fundamentos de Programación",
      "plantilla": "software",
      "fuente": "segoe-ui",
      "numeroSlides": 12,
      "fechaCreacion": "2025-10-22T01:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 10,
    "offset": 0
  }
}
```

## Actualizar rol

```
PATCH /admin/usuarios/:id/rol
Content-Type: application/json
Authorization: Bearer <token>

{
  "rol": "admin"
}
```

Respuesta:

```json
{
  "mensaje": "Rol actualizado",
  "usuario": {
    "id": 1,
    "nombre": "Junior Sebastian Osorio Toribio",
    "email": "junior.osorio@tecsup.edu.pe",
    "rol": "admin"
  }
}
```

Acepta únicamente `admin` o `usuario`.

Si la columna `rol` no existe en la tabla `usuarios`, el backend responde `501 Not Implemented` con una sugerencia SQL mínima para habilitar la funcionalidad:

```json
{
  "error": "La columna rol no existe en la tabla usuarios. Operación no implementada en este esquema.",
  "solucion": "Agrega la columna rol (admin|usuario) o usa solo lectura.",
  "sqlSugerido": "ALTER TABLE usuarios ADD COLUMN rol VARCHAR(20); UPDATE usuarios SET rol='usuario' WHERE rol IS NULL;"
}
```

## Actualizar estado

```
PATCH /admin/usuarios/:id/estado
Content-Type: application/json
Authorization: Bearer <token>

{
  "estado": "suspendido"
}
```

Respuesta:

```json
{
  "mensaje": "Estado actualizado",
  "usuario": {
    "id": 2,
    "nombre": "Rodrigo Diaz",
    "email": "rodrigo.diaz@tecsup.edu.pe",
    "estado": "suspendido"
  }
}
```

Estados permitidos: `activo`, `inactivo`, `suspendido`.

Si la columna `estado` no existe, el backend responde `501 Not Implemented` con la sugerencia SQL:

```json
{
  "error": "La columna estado no existe en la tabla usuarios. Operación no implementada en este esquema.",
  "solucion": "Agrega la columna estado (activo|inactivo|suspendido) o usa solo lectura.",
  "sqlSugerido": "ALTER TABLE usuarios ADD COLUMN estado VARCHAR(20); UPDATE usuarios SET estado='activo' WHERE estado IS NULL;"
}
```

## Eliminar usuario

```
DELETE /admin/usuarios/:id
Authorization: Bearer <token>
```

Borra el registro de `usuarios` y, gracias al `ON DELETE CASCADE` ya definido, elimina también sus presentaciones asociadas. Respuesta:

```json
{
  "mensaje": "Usuario eliminado correctamente"
}
```

## Errores comunes

| Código | Situación |
| ------ | --------- |
| 400 | Parámetros inválidos, rol/estado no permitido, o columnas `rol`/`estado` ausentes en la tabla `usuarios`. |
| 401 | Falta token. |
| 403 | El usuario autenticado no es administrador. |
| 404 | Usuario no encontrado. |
| 500 | Error inesperado en la base de datos. |

Utiliza esta referencia al momento de integrar el frontend de administración.
