# TecCreate Backend (Local)

Este proyecto expone un backend en Node.js/Express con autenticación por Google OAuth y conexión a una base de datos PostgreSQL local.

## Despliegue en Render

1. Asegúrate de haber subido el repositorio con el archivo `render.yaml` incluido en la raíz del backend.
2. En Render crea un Blueprint (Deploy > New Blueprint) apuntando al repositorio. Render detectará `render.yaml` y provisionará:
   - Un servicio web Node (`presentador-ia-backend`) con `npm run start`.
   - Una base de datos PostgreSQL gratuita (`presentador-ia-db`).
3. Completa las variables de entorno sensibles desde el panel de Render (menú **Environment**). Las claves marcadas con `sync: false` en `render.yaml` deben definirse manualmente:
   - `CLIENT_URL`: URL del frontend permitido por CORS.
   - `GROQ_API_KEY`, `GEMINI_API_KEY` si necesitas IA.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` para OAuth.
   - `ADMIN_EMAILS`, `PUBLIC_BASE_URL`, `ALLOWED_ORIGINS` según tu configuración.
4. Render generará automáticamente `SESSION_SECRET` y `JWT_SECRET`. Puedes regenerarlas desde el dashboard cuando lo necesites.
5. Verifica el health check visitando `https://<tu-servicio>.onrender.com/healthz`. Debe responder con `{ "status": "ok" }`.
 6. Si usas dominios personalizados, actualiza `PUBLIC_BASE_URL` y agrega la URL a `ALLOWED_ORIGINS` para que CORS acepte el nuevo dominio.

## Manual de usuario completo

Consulta la guía integral en `docs/Backend-Manual.md`, que cubre:
- Variables de entorno y configuración por entorno
- Esquema de base de datos y script `estructura_presentador_ia.sql`
- Despliegue en Render y on‑premise
- OAuth (Google), CORS y sesiones
- Endpoints por módulo (auth, presentaciones, admin, reportes, soporte)
- IA (Groq/Gemini) y exportación a PPTX
- Seguridad y solución de problemas

## Requisitos previos

- Node.js 18 o superior
- PostgreSQL 14 o superior
- Cuenta de Google autorizada (dominio `@tecsup.edu.pe`)

## Configuración de la base de datos

1. Inicia sesión en PostgreSQL con un usuario con permisos (por defecto `postgres`).
2. Crea la base de datos si aún no existe:

   ```sql
   CREATE DATABASE "TecCreateBD";
   ```
3. Dentro de la base de datos, crea las tablas mínimas necesarias:

   ```sql
   CREATE TABLE IF NOT EXISTS usuarios (
     id SERIAL PRIMARY KEY,
     nombre TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     foto TEXT,
     fecha_registro TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE IF NOT EXISTS presentaciones (
     id SERIAL PRIMARY KEY,
     titulo TEXT NOT NULL,
     contenido JSONB,
     email TEXT NOT NULL REFERENCES usuarios(email),
     plantilla TEXT,
     fuente TEXT,
     idioma TEXT,
     numero_slides INTEGER,
     fecha_creacion TIMESTAMP DEFAULT NOW()
   );
   ```

   > Ajusta los campos según la última versión del esquema que estés utilizando.

## Variables de entorno

El archivo `.env` ya está configurado para un entorno local:

```
PORT=3001
DATABASE_URL=postgresql://postgres:root@localhost:5432/TecCreateBD
DATABASE_SSL=false
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
CLIENT_URL=http://localhost:3000
ADMIN_EMAILS=junior.osorio@tecsup.edu.pe
JWT_SECRET=admin
JWT_EXPIRES_IN=1d
GROQ_API_KEY=...
```

Modifica cualquier dato sensible según tu entorno (usuario, contraseña, lista de administradores, etc.).

### Exportación a PPTX asistida por IA

- `GROQ_API_KEY` es obligatoria para generar el guion de las diapositivas cuando llames a los endpoints IA.
- El backend usa `pptxgenjs` para ensamblar el `.pptx`, con texto listo para abrir en PowerPoint incluso si Groq falla (hay degradación controlada con plantillas base).
- Si falta la clave, los endpoints responderán `503 Servicio no disponible` o devolverán un bosquejo básico.

### 🧠 Guía rápida: generador de presentaciones IA

1. **Configura el `.env` mínimo**

    ```ini
    PORT=3001
    GROQ_API_KEY=tu_clave_groq
    ```

2. **Instala dependencias**

    ```powershell
    npm install
    ```

3. **Levanta el backend**

    ```powershell
    node index.js
    ```

    Verás en consola: `✅ Servidor corriendo en puerto 3001`.

4. **Genera un borrador IA con texto estructurado**

    - Endpoint protegido: agrega `Authorization: Bearer <token>`.
    - Solicitud:

       ```http
       POST http://localhost:3001/presentaciones/ia/generar
       Content-Type: application/json

       {
          "tema": "Historia del Internet",
          "idioma": "Español",
          "numeroSlides": 6
       }
       ```

   - Respuesta (ejemplo):

       ```json
       {
          "tema": "Historia del Internet",
          "idioma": "Español",
          "slides": [
             {
                "titulo": "Orígenes",
                "bullets": [
                   "En 1969 la red ARPANET enlazó UCLA, Stanford Research Institute, UC Santa Barbara y la Universidad de Utah, sentando las bases del intercambio de datos descentralizado.",
                   "Investigadores como Vint Cerf y Robert Kahn propusieron en 1974 el protocolo TCP, clave para que redes independientes pudieran comunicarse sin perder paquetes.",
                   "El creciente interés académico y militar impulsó el financiamiento de la DARPA, que exigía resiliencia ante fallas de nodos y rutas alternativas en tiempo real.",
                   "A finales de la década de 1970, las primeras pruebas exitosas de conmutación de paquetes demostraron que la comunicación digital superaba en flexibilidad a la telefonía analógica."
                ],
                "contenido": "En 1969 la red ARPANET enlazó UCLA, Stanford Research Institute, UC Santa Barbara y la Universidad de Utah, sentando las bases del intercambio de datos descentralizado.\n\nInvestigadores como Vint Cerf y Robert Kahn propusieron en 1974 el protocolo TCP, clave para que redes independientes pudieran comunicarse sin perder paquetes.\n\nEl creciente interés académico y militar impulsó el financiamiento de la DARPA, que exigía resiliencia ante fallas de nodos y rutas alternativas en tiempo real.\n\nA finales de la década de 1970, las primeras pruebas exitosas de conmutación de paquetes demostraron que la comunicación digital superaba en flexibilidad a la telefonía analógica."
             }
          ]
       }
       ```

5. **Guarda la presentación (opcional pero requerido para exportar)**

    El paso anterior sólo genera el contenido en memoria. Para exportarlo como `.pptx`, persiste la presentación:

    ```http
    POST http://localhost:3001/presentaciones
    Authorization: Bearer <token>
    Content-Type: application/json

    {
       "titulo": "Historia del Internet",
   "contenido": [ /* slides con bullets */ ],
       "idioma": "Español"
    }
    ```

    La respuesta incluye `id`, que usarás para descargar el PPT.

6. **Descarga el `.pptx` listo**

    ```http
    GET http://localhost:3001/presentaciones/{id}/export
    Authorization: Bearer <token>
    Accept: application/vnd.openxmlformats-officedocument.presentationml.presentation
    ```

    El archivo `TecCreate-<titulo>.pptx` contendrá cada slide con:
    - Título + bullets redactados por Groq.
    - Párrafos separados en el cuerpo.

   > ¿Quieres saltarte el guardado intermedio? Usa `POST /presentaciones/ia/generar/export` con el mismo payload del paso 4 (y opcional `guardar: true`) para recibir el `.pptx` directamente. Si `guardar` es `true`, el backend responde con el header `X-Presentacion-Id` para que puedas recuperar o volver a exportar la presentación más adelante.

7. **Solución de problemas**

    | Síntoma | Revisión sugerida |
    | --- | --- |
   | `503 Servicio no disponible` | Falta `GROQ_API_KEY`. |
    | El servidor no arranca | Asegura que `.env` se está cargando (`node -e "require('dotenv').config();console.log(process.env.GROQ_API_KEY)"`). |

## Instalación y ejecución

1. Instala dependencias:

   ```powershell
   npm install
   ```
2. Inicia el servidor:

   ```powershell
   node index.js
   ```

El backend quedará disponible en `http://localhost:3001` y aceptará solicitudes desde el frontend configurado en `CLIENT_URL`.

### Descargar una presentación como PPTX

1. Inicia sesión para obtener el token JWT.
2. Llama a `GET http://localhost:3001/presentaciones/:id/export` con el header `Authorization: Bearer <token>`.
3. Añade `Accept: application/vnd.openxmlformats-officedocument.presentationml.presentation` para forzar la descarga.
4. El backend generará un archivo `TecCreate-<titulo>.pptx` listo para abrir en PowerPoint.

## Verificación rápida

- Asegúrate de que en la consola aparezca `✅ Servidor corriendo en puerto 3001`.
- Observa en la salida que la conexión a PostgreSQL no arroje errores.
- Prueba iniciar sesión con una cuenta del dominio `@tecsup.edu.pe` para verificar Google OAuth.

## Próximos pasos sugeridos

- Automatizar migraciones de base de datos con una herramienta como Prisma, Sequelize o Knex.
- Añadir pruebas automatizadas para los controladores.
- Integrar un script `npm start` para levantar el servidor con mayor ergonomía.
