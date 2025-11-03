# 🎯 TecCreate Backend - Documentación Completa

**Backend empresarial desarrollado para Tecsup** - Plataforma de generación de presentaciones asistidas por IA para docentes e instructores. Sistema integral con autenticación institucional, gestión multi-rol, y exportación PPTX profesional. Integra Google OAuth 2.0, PostgreSQL, Groq (generación de texto), Gemini (generación de imágenes) y arquitectura modular escalable.

**Institución:** Instituto de Educación Superior Tecsup  
**Carreras soportadas:** Diseño y Desarrollo de Software, Gestión y Mantenimiento de Maquinaria, Mecatrónica Industrial, Procesos Químicos y Metalúrgicos

---

## 📑 Índice Completo

### 🚀 Inicio Rápido
- [Resumen Ejecutivo](#-resumen-ejecutivo)
- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Requisitos del Sistema](#-requisitos-del-sistema)

### 🏗️ Arquitectura y Diseño
- [Visión General de la Arquitectura](#-visión-general-de-la-arquitectura)
- [Estructura de Carpetas](#-estructura-de-carpetas-detallada)
- [Flujo de Datos](#-flujo-de-datos)
- [Patrones de Diseño](#-patrones-de-diseño)

### ⚙️ Configuración
- [Variables de Entorno](#-variables-de-entorno-completas)
- [Configuración de Base de Datos](#-configuración-de-base-de-datos)
- [Configuración de OAuth](#-configuración-de-oauth-con-google)
- [Configuración de Servicios IA](#-configuración-de-servicios-ia)

### 🔧 Instalación y Despliegue
- [Instalación Local](#-instalación-local)
- [Despliegue en Producción](#-despliegue-en-producción)
- [Despliegue con Docker](#-despliegue-con-docker)
- [Despliegue en DigitalOcean](#-despliegue-en-digitalocean)
- [Despliegue en Render](#-despliegue-en-render)

### 📡 API y Endpoints
- [Autenticación y Seguridad](#-autenticación-y-seguridad)
- [Endpoints de Autenticación](#-endpoints-de-autenticación)
- [Endpoints de Presentaciones](#-endpoints-de-presentaciones)
- [Endpoints de Administración](#-endpoints-de-administración)
- [Endpoints de Reportes y Soporte](#-endpoints-de-reportes-y-soporte)

### 🤖 Servicios de IA
- [Servicio Groq (Texto)](#-servicio-groq-texto)
- [Servicio Gemini (Imágenes)](#-servicio-gemini-imágenes)
- [Generación de Presentaciones](#-generación-de-presentaciones)
- [Exportación a PPTX](#-exportación-a-pptx)

### 👥 Gestión de Usuarios y Roles
- [Sistema de Roles](#-sistema-de-roles)
- [Permisos y Autorización](#-permisos-y-autorización)
- [Administración de Usuarios](#-administración-de-usuarios)

### 🛠️ Mantenimiento y Operaciones
- [Monitoreo y Logs](#-monitoreo-y-logs)
- [Modo Mantenimiento](#-modo-mantenimiento)
- [Respaldos y Recuperación](#-respaldos-y-recuperación)
- [Solución de Problemas](#-solución-de-problemas-detallada)

### 📚 Recursos Adicionales
- [Scripts Útiles](#-scripts-útiles)
- [Mejores Prácticas](#-mejores-prácticas)
- [FAQ](#-preguntas-frecuentes-faq)
- [Documentación Complementaria](#-documentación-complementaria)

---

## 🎯 Resumen Ejecutivo

**TecCreate Backend** es una plataforma empresarial robusta diseñada específicamente para **Tecsup** (Instituto de Educación Superior) que permite a docentes, instructores y coordinadores generar presentaciones profesionales asistidas por IA en minutos. El sistema maneja autenticación institucional con correos de Tecsup, control de acceso basado en roles, generación de contenido con IA especializada para carreras técnicas, exportación a formatos estándar y administración centralizada.

### ¿Por qué TecCreate?

✅ **Autenticación Institucional Tecsup**: Integración con Google Workspace para control de acceso seguro con correos @tecsup.edu.pe  
✅ **IA Avanzada**: Generación de contenido con Groq (70B parámetros) e imágenes con Gemini  
✅ **Multi-idioma**: Soporte para Español, English y Français  
✅ **Plantillas para Carreras Tecsup**: 7 temas visuales optimizados (Software, Maquinaria, Mecatrónica, Química)  
✅ **Escalable**: Arquitectura modular preparada para crecimiento institucional  
✅ **Seguro**: JWT, CORS configurado, SSL/TLS, protección contra ataques comunes  

---

## 🌟 Características Principales

### 🔐 Autenticación y Seguridad
- **Google OAuth 2.0**: Integración completa con Google Workspace institucional
- **JWT (JSON Web Tokens)**: Autenticación stateless con tokens firmados
- **Control de Acceso Basado en Roles (RBAC)**: 3 roles (Usuario, Admin, Soporte)
- **Whitelist de Correos**: Solo correos institucionales preaprobados
- **Sesiones Seguras**: express-session con cookies httpOnly, secure y sameSite
- **CORS Configurado**: Protección contra peticiones no autorizadas
- **Rate Limiting**: Protección contra ataques de fuerza bruta (opcional)

### 🤖 Inteligencia Artificial
- **Groq SDK**: Generación de contenido textual con modelos LLaMA 3 (70B parámetros)
- **Google Gemini**: Generación de imágenes temáticas con modelos flash
- **Sistema de Fallback**: Cambio automático entre modelos si uno falla
- **3 Niveles de Detalle**: Brief, Medium, Detailed
- **3 Estilos de Escritura**: Professional, Casual, Academic
- **3 Idiomas**: Español, English, Français
- **Generación Inteligente**: Prompts optimizados para contexto educativo

### 📊 Gestión de Presentaciones
- **Creación Manual o IA**: Esquemas propios o generados automáticamente
- **Edición Completa**: Modificar título, slides, bullets, imágenes
- **Exportación PPTX**: Generación de archivos PowerPoint profesionales
- **7 Plantillas Visuales**: Temas para carreras (Software, Mecatrónica, Química, etc.)
- **Compartir Público**: Enlaces compartibles con QR descargable
- **Historial**: Registro completo de creación y modificaciones
- **Búsqueda y Filtros**: Buscar por tema, fecha, tags

### 👥 Administración
- **Dashboard Completo**: Métricas, tendencias, estadísticas en tiempo real
- **Gestión de Usuarios**: CRUD completo con cambio de roles
- **Reportes de Soporte**: Sistema de tickets con prioridades
- **Modo Mantenimiento**: Bloquear acceso a usuarios durante actualizaciones
- **Logs de Actividad**: Auditoría completa de acciones críticas
- **Notificaciones**: Sistema de alertas para administradores

### 📦 Arquitectura Técnica
- **Express 5.x**: Framework web moderno y robusto
- **PostgreSQL**: Base de datos relacional con índices optimizados
- **Connection Pool**: Gestión eficiente de conexiones DB
- **Arquitectura MVC**: Separación clara de responsabilidades
- **Servicios Modulares**: Lógica de negocio encapsulada
- **Middleware Pipeline**: Autenticación, validación, manejo de errores
- **Healthchecks**: Endpoint de salud para orquestadores
- **Graceful Shutdown**: Cierre limpio de conexiones

---

## 🛠️ Tecnologías Utilizadas

### Backend Core
```json
{
  "runtime": "Node.js 18+ LTS",
  "framework": "Express 5.1.0",
  "language": "JavaScript (CommonJS)",
  "architecture": "MVC + Services"
}
```

### Base de Datos
```json
{
  "database": "PostgreSQL 14+",
  "driver": "pg (node-postgres)",
  "pooling": "pg.Pool",
  "migrations": "SQL scripts"
}
```

### Autenticación
```json
{
  "oauth": "Google OAuth 2.0",
  "strategy": "Passport.js (passport-google-oauth20)",
  "tokens": "jsonwebtoken (JWT)",
  "sessions": "express-session"
}
```

### Servicios IA
```json
{
  "text_generation": "Groq SDK (groq-sdk)",
  "image_generation": "Google Gemini (GenerativeAI)",
  "models_text": ["llama3-70b-8192", "mixtral-8x7b-32768"],
  "models_image": ["gemini-2.0-flash-preview-image-generation", "gemini-2.5-flash-image"]
}
```

### Exportación y Procesamiento
```json
{
  "pptx_generation": "pptxgenjs",
  "image_processing": "sharp",
  "qr_codes": "qrcode"
}
```

### Seguridad y Middleware
```json
{
  "cors": "cors",
  "helmet": "helmet (opcional)",
  "compression": "compression (opcional)",
  "rate_limiting": "express-rate-limit (opcional)",
  "logging": "pino / pino-http (opcional)"
}
```

---

## 💻 Requisitos del Sistema

### Requisitos Mínimos (Desarrollo Local)
- **Node.js**: 18.17.0 o superior (LTS recomendado: 20.x)
- **npm**: 9.0.0 o superior
- **PostgreSQL**: 14.0 o superior
- **RAM**: 2 GB disponibles
- **Disco**: 500 MB libres (sin node_modules)
- **SO**: Windows 10+, macOS 12+, Ubuntu 20.04+

### Requisitos Recomendados (Producción)
- **Node.js**: 20.x LTS
- **npm**: 10.x
- **PostgreSQL**: 15+ (o servicio gestionado)
- **RAM**: 4 GB+ (según tráfico)
- **CPU**: 2+ cores
- **Disco**: 10 GB+ (logs, imágenes generadas, backups)
- **Red**: HTTPS obligatorio, dominio configurado

### Cuentas y Servicios Externos
- ✅ **Google Cloud Console**: Proyecto con OAuth 2.0 configurado
- ✅ **Groq API**: Cuenta y API Key ([groq.com](https://groq.com))
- ✅ **Google AI Studio**: API Key para Gemini ([aistudio.google.com](https://aistudio.google.com/apikey))
- ✅ **PostgreSQL**: Instancia local o gestionada (DigitalOcean, Render, AWS RDS, etc.)
- 🔄 **Redis** (Opcional): Para sesiones en producción multi-instancia

---

## 🏗️ Visión General de la Arquitectura

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Frontend)                          │
│                     React/Vue/Angular + Axios                        │
└────────────────────────┬────────────────────────────────────────────┘
                         │ HTTPS + JWT
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       REVERSE PROXY (Nginx)                          │
│                    SSL/TLS Termination + CORS                        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EXPRESS SERVER (Node.js)                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      MIDDLEWARE PIPELINE                      │  │
│  │  1. CORS  2. Helmet  3. Compression  4. Rate Limit  5. Auth  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                           RUTAS                               │  │
│  │  /auth  /presentaciones  /admin  /reportes  /soporte         │  │
│  └──────────────────────┬───────────────────────────────────────┘  │
│                         ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       CONTROLLERS                             │  │
│  │  authController  presentacionesController  adminController    │  │
│  └──────────────────────┬───────────────────────────────────────┘  │
│                         ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        SERVICES                               │  │
│  │  groqService  geminiService  pptService  presentacionService  │  │
│  └──────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │   Groq API   │  │  Gemini API  │
│   Database   │  │  (Text Gen)  │  │  (Img Gen)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Flujo de Peticiones

1. **Cliente** → Envía petición HTTPS con JWT en header `Authorization: Bearer <token>`
2. **Nginx** → Valida SSL, aplica CORS, redirige a Express
3. **Express Middleware** → Valida JWT, verifica permisos de rol
4. **Controller** → Recibe petición, valida datos, delega a Services
5. **Service** → Ejecuta lógica de negocio, consulta DB o APIs externas
6. **Response** → Devuelve JSON estructurado al cliente

### Capas de la Aplicación

```
┌─────────────────────────────────────────┐
│      ROUTES (routes/)                   │  ← Define endpoints y métodos HTTP
├─────────────────────────────────────────┤
│      MIDDLEWARE (middlewares/)          │  ← Autenticación, roles, validación
├─────────────────────────────────────────┤
│      CONTROLLERS (controllers/)         │  ← Maneja req/res, orquesta lógica
├─────────────────────────────────────────┤
│      SERVICES (services/)               │  ← Lógica de negocio pura
├─────────────────────────────────────────┤
│      DATABASE (db.js)                   │  ← Connection pool PostgreSQL
└─────────────────────────────────────────┘
```

---

## 📁 Estructura de Carpetas Detallada

```
backend/
│
├── 📄 index.js                          # Punto de entrada principal
├── 📄 db.js                             # Pool de conexiones PostgreSQL
├── 📄 database.js                       # Helper de conexión (legacy)
├── 📄 package.json                      # Dependencias y scripts npm
├── 📄 .env                              # Variables de entorno (NO VERSIONAR)
├── 📄 .env.example                      # Plantilla de variables
├── 📄 .gitignore                        # Archivos excluidos de Git
├── 📄 README.md                         # Este archivo
├── 📄 render.yaml                       # Blueprint para Render (opcional)
├── 📄 estructura_presentador_ia.sql     # Schema completo de PostgreSQL
│
├── 📁 config/                           # Configuraciones
│   └── passport.js                      # Estrategia Google OAuth 2.0
│
├── 📁 routes/                           # Definición de rutas
│   ├── authRoutes.js                    # /auth/* (login, callback, logout)
│   ├── presentacionesRoutes.js          # /presentaciones/* (CRUD, export)
│   ├── adminRoutes.js                   # /admin/* (dashboard, usuarios)
│   ├── reportesRoutes.js                # /reportes/* (soporte)
│   └── soporteRoutes.js                 # /soporte/* (mantenimiento, logs)
│
├── 📁 controllers/                      # Controladores (req/res handling)
│   ├── adminController.js               # Lógica admin (dashboard, usuarios)
│   ├── presentacionesController.js      # Lógica presentaciones
│   ├── reportesController.js            # Lógica reportes soporte
│   ├── soporteController.js             # Modo mantenimiento, logs
│   └── usuariosAdminController.js       # CRUD usuarios (admin)
│
├── 📁 services/                         # Lógica de negocio pura
│   ├── groqService.js                   # Generación texto con Groq
│   ├── geminiService.js                 # Generación imágenes con Gemini
│   ├── groqClient.js                    # Cliente Groq configurado
│   ├── pptService.js                    # Generación archivos PPTX
│   ├── presentacionService.js           # Lógica CRUD presentaciones
│   ├── slideGeneratorService.js         # Orquestador de generación IA
│   ├── dashboardService.js              # Métricas y estadísticas
│   ├── usuariosService.js               # Lógica usuarios
│   ├── reportesService.js               # Lógica reportes
│   ├── soporteService.js                # Mantenimiento y notificaciones
│   └── maintenanceService.js            # Modo mantenimiento
│
├── 📁 middlewares/                      # Middleware personalizados
│   ├── authMiddleware.js                # Validación JWT
│   └── roleMiddleware.js                # Validación de roles
│
├── 📁 utils/                            # Utilidades y helpers
│   ├── ortografia.js                    # Corrección ortográfica
│   ├── pptFonts.js                      # Fuentes personalizadas PPTX
│   ├── pptImages.js                     # Procesamiento imágenes
│   ├── pptThemes.js                     # Plantillas visuales (7 temas)
│   ├── presentaciones.js                # Helpers presentaciones
│   ├── presentacionTopics.js            # Temas sugeridos por carrera
│   ├── asyncHandler.js                  # Wrapper async para manejo de errores
│   └── supportReports.js                # Helpers reportes
│
├── 📁 public/                           # Archivos estáticos públicos
│   ├── images/slides/                   # Imágenes generadas por Gemini
│   └── shared-presentaciones/           # PPTX compartidos públicamente
│
├── 📁 docs/                             # Documentación complementaria
│   ├── gestion-usuarios.md              # Guía gestión usuarios
│   ├── roles-permissions.md             # Matriz roles y permisos
│   ├── Backend-Manual.md                # Manual técnico completo
│   └── Manual-Usuario-Backend.md        # Manual operativo usuarios
│
├── 📁 scripts/                          # Scripts de utilidad
│   ├── clear-support-logs.js            # Limpia logs antiguos
│   ├── list-reportes.js                 # Lista reportes en DB
│   ├── query-user.js                    # Consulta usuario por email
│   ├── seed-support-logs.js             # Genera datos de prueba
│   ├── test-maintenance-gate.js         # Prueba modo mantenimiento
│   ├── test-middleware-suspended.js     # Prueba usuarios suspendidos
│   ├── test-reportes-backend.js         # Prueba endpoints reportes
│   └── test-suspended-user.js           # Prueba suspensión usuario
│
├── 📁 certs/                            # Certificados SSL (NO versionar)
│   └── *.crt, *.pem                     # Certificados CA para PostgreSQL
│
├── 📁 archive/                          # Archivos archivados (backups)
│   └── cleanup-20251102/                # Limpieza Nov 2025
│       ├── services_groqService-corrupted.js
│       ├── services_groqService-clean.js
│       └── services_groqService.js.backup.txt
│
├── 📄 Archivos de configuración raíz
│   ├── ca-certificate.crt               # Certificado CA PostgreSQL (DigitalOcean)
│   ├── CODE_OF_CONDUCT.md               # Código de conducta del proyecto
│   ├── CONTRIBUTING.md                  # Guía de contribución
│   ├── DEPLOY_DIGITALOCEAN.md           # Guía específica de deployment en DO
│   ├── FIX_CALLBACK_DIGITALOCEAN.md     # Solución a problemas de OAuth callback
│   ├── PASOS_CONFIGURACION_OAUTH.md     # Tutorial paso a paso OAuth Google
│   └── SOLUCION_URGENTE_FRONTEND.md     # Fixes urgentes para frontend
│
└── 📄 Scripts de raíz (mover a scripts/ recomendado)
    ├── check-admin.js                   # Verificar usuarios admin
    ├── check-presentaciones.js          # Verificar presentaciones en DB
    ├── check-usuarios.js                # Listar usuarios registrados
    └── create-groq-service.js           # Generador de servicio Groq
```

### Explicación de Carpetas Clave

#### **`lib/`** - Utilidades y Helpers
Módulos reutilizables sin lógica de negocio:
- **ortografia.js**: Corrector ortográfico usando nspell + diccionario español
- **pptFonts.js**: Configuración de fuentes personalizadas para PPTX
- **pptImages.js**: Procesamiento y optimización de imágenes con sharp
- **pptThemes.js**: 7 plantillas visuales (default, modern, minimal, software, maquinaria, mecatronica, quimica)
- **presentaciones.js**: Helpers de validación y transformación de presentaciones
- **presentacionTopics.js**: Temas sugeridos organizados por carrera técnica
- **asyncHandler.js**: Wrapper para manejar errores en rutas async/await
- **supportReports.js**: Utilidades para formatear reportes de soporte

#### **`certs/`** - Certificados SSL
Almacena certificados CA para conexiones PostgreSQL seguras. **Importante**: Esta carpeta está en `.gitignore` y NO debe versionarse.

#### **`archive/`** - Archivos Archivados
Backups de código antiguo o corrupto mantenidos por historial. No se ejecutan en producción.

---

## 📋 Archivos de Documentación Adicionales

El proyecto incluye varios archivos markdown complementarios en la raíz:

### `CODE_OF_CONDUCT.md`
**Código de Conducta del Proyecto**

Define las normas de comportamiento esperadas para contribuidores y usuarios:
- Compromiso con ambiente inclusivo y respetuoso
- Ejemplos de comportamiento aceptable e inaceptable
- Proceso de reporte de incidentes
- Consecuencias por violaciones

**Uso:** Leer antes de contribuir al proyecto o participar en discusiones.

---

### `CONTRIBUTING.md`
**Guía de Contribución**

Instrucciones detalladas para contribuir al proyecto:
- Configuración del entorno de desarrollo
- Estándares de código (ESLint, Prettier)
- Convenciones de commits (Conventional Commits)
- Proceso de Pull Requests
- Testing y validación
- Revisión de código

**Pasos básicos:**
```bash
# 1. Fork el repositorio
# 2. Crea rama feature
git checkout -b feature/nueva-funcionalidad

# 3. Haz cambios y commits
git commit -m "feat(presentaciones): add new feature"

# 4. Push y abre PR
git push origin feature/nueva-funcionalidad
```

---

### `DEPLOY_DIGITALOCEAN.md`
**Guía Específica de Deployment en DigitalOcean**

Tutorial paso a paso para desplegar en DigitalOcean App Platform:
1. Crear cuenta y conectar GitHub
2. Configurar App Platform desde repositorio
3. Configurar variables de entorno (con ejemplos)
4. Crear y conectar base de datos PostgreSQL
5. Configurar certificado SSL para DB (`DATABASE_SSL_CA_B64`)
6. Configurar dominio personalizado
7. Monitoreo y logs
8. Troubleshooting específico de DigitalOcean

**Nota:** Este README ya incluye la guía de deployment completa en la sección [Despliegue en DigitalOcean](#️-despliegue-en-digitalocean), pero `DEPLOY_DIGITALOCEAN.md` puede tener detalles adicionales específicos de la plataforma.

---

### `FIX_CALLBACK_DIGITALOCEAN.md`
**Solución a Problemas de OAuth Callback**

Documenta el fix para el error común `redirect_uri_mismatch` en DigitalOcean:

**Problema:**
```
Error: redirect_uri_mismatch
The redirect URI in the request, https://tu-app.ondigitalocean.app/auth/google/callback,
does not match the ones authorized for the OAuth client.
```

**Solución:**
1. Obtener URL exacta de la app en DigitalOcean (con o sin trailing slash)
2. Ir a Google Cloud Console → Credentials
3. Editar OAuth Client ID
4. Agregar EXACTAMENTE la URL en "Authorized redirect URIs"
5. Actualizar `GOOGLE_CALLBACK_URL` en variables de entorno
6. Restart de la app

**Verificación:**
```bash
curl https://tu-app.ondigitalocean.app/auth/google
# Debe redirigir a Google OAuth sin errores
```

---

### `PASOS_CONFIGURACION_OAUTH.md`
**Tutorial Paso a Paso: Configuración OAuth Google**

Guía visual (con capturas o descripciones detalladas) para configurar Google OAuth desde cero:

#### Fase 1: Crear Proyecto en Google Cloud
1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear nuevo proyecto: "TecCreate Backend"
3. Seleccionar el proyecto

#### Fase 2: Habilitar APIs
1. Menú → APIs & Services → Library
2. Buscar "Google+ API" o "People API"
3. Click "Enable"

#### Fase 3: Configurar Pantalla de Consentimiento
1. APIs & Services → OAuth consent screen
2. Seleccionar tipo (Internal para Google Workspace, External para público)
3. Completar información:
   - App name: TecCreate
   - User support email: soporte@tecsup.edu.pe
   - Logo (opcional)
   - App domain (tecsup.teccreate.edu)
4. Scopes: Agregar `userinfo.email`, `userinfo.profile`
5. Test users (si es External): Agregar emails de prueba
6. Guardar y continuar

#### Fase 4: Crear Credenciales
1. APIs & Services → Credentials → Create Credentials
2. Seleccionar "OAuth Client ID"
3. Application type: Web application
4. Name: TecCreate Backend
5. **Authorized JavaScript origins:**
   ```
   https://api.teccreate.edu
   http://localhost:3001
   ```
6. **Authorized redirect URIs:**
   ```
   https://api.teccreate.edu/auth/google/callback
   http://localhost:3001/auth/google/callback
   ```
7. Click "Create"
8. **COPIAR Client ID y Client Secret** (guardar en lugar seguro)

#### Fase 5: Configurar Backend
```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_CALLBACK_URL=https://api.tecsup.teccreate.edu/auth/google/callback
ADMIN_EMAILS=coordinador@tecsup.edu.pe,director@tecsup.edu.pe,soporte@tecsup.edu.pe
```

#### Fase 6: Probar
1. Arrancar backend: `npm start`
2. Abrir navegador: `http://localhost:3001/auth/google`
3. Login con un email de `ADMIN_EMAILS`
4. Verificar redirección exitosa con token

**Troubleshooting incluido en el archivo para:**
- redirect_uri_mismatch
- invalid_client
- access_denied
- Correos no autorizados

---

### `SOLUCION_URGENTE_FRONTEND.md`
**Fixes Urgentes para Integración Frontend**

Documenta soluciones a problemas comunes de integración con el frontend:

#### 1. CORS Bloqueado
```javascript
// Frontend: Configurar Axios base URL
import axios from 'axios';

axios.defaults.baseURL = 'https://api.teccreate.edu';
axios.defaults.withCredentials = true;

// Interceptor para JWT
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

```env
# Backend: Configurar CORS
ALLOWED_ORIGINS=https://app.teccreate.edu,https://admin.teccreate.edu
CLIENT_URL=https://app.teccreate.edu
```

#### 2. Token Expirado (403)
```javascript
// Interceptor para refrescar o redirigir
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 3. Exportar PPTX (Blob)
```javascript
// Correcto manejo de descarga
async function descargarPPTX(presentacionId) {
  try {
    const response = await axios.get(`/presentaciones/${presentacionId}/export`, {
      responseType: 'blob'  // ⚠️ IMPORTANTE
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `presentacion_${presentacionId}.pptx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar:', error);
    alert('No se pudo descargar la presentación');
  }
}
```

#### 4. Manejo de Estados de Carga
```javascript
// Al generar presentación (puede tardar 10-30s)
const [loading, setLoading] = useState(false);
const [progress, setProgress] = useState(0);

async function generarPresentacion(datos) {
  setLoading(true);
  setProgress(0);

  // Simulador de progreso (opcional)
  const progressInterval = setInterval(() => {
    setProgress(prev => Math.min(prev + 10, 90));
  }, 1000);

  try {
    const response = await axios.post('/presentaciones/generar', datos, {
      timeout: 60000  // 60 segundos
    });
    
    setProgress(100);
    clearInterval(progressInterval);
    // Manejar respuesta exitosa
  } catch (error) {
    clearInterval(progressInterval);
    // Manejar error
  } finally {
    setLoading(false);
  }
}
```

#### 5. Validación de Formularios
```javascript
// Validar antes de enviar
const validarFormulario = (datos) => {
  const errores = {};

  if (!datos.tema || datos.tema.length < 3) {
    errores.tema = 'El tema debe tener al menos 3 caracteres';
  }

  if (datos.numeroSlides < 3 || datos.numeroSlides > 30) {
    errores.numeroSlides = 'Debe ser entre 3 y 30 slides';
  }

  if (!['Español', 'English', 'French'].includes(datos.idioma)) {
    errores.idioma = 'Idioma no soportado';
  }

  return errores;
};
```

---

## 🛠️ Scripts de Raíz (Utilidades)

Los siguientes scripts están en la raíz del proyecto (se recomienda moverlos a `scripts/`):

### `check-admin.js`
**Verificar Usuarios Administradores**

Lista todos los usuarios con rol `admin` o `soporte`:

```bash
node check-admin.js
```

**Output:**
```
=== USUARIOS ADMINISTRADORES ===
1. Juan Pérez (juan.perez@tecsup.edu.pe) - admin - Activo
2. María García (maria.garcia@tecsup.edu.pe) - soporte - Activo

Total: 2 administradores
```

**Uso:** Auditoría rápida de quiénes tienen permisos elevados.

---

### `check-presentaciones.js`
**Verificar Presentaciones en Base de Datos**

Muestra estadísticas y estado de las presentaciones:

```bash
node check-presentaciones.js
```

**Output:**
```
=== ESTADÍSTICAS DE PRESENTACIONES ===
Total: 324
- Borradores: 120
- Finalizadas: 180
- Compartidas: 24

Últimas 5 creadas:
1. [ID: 324] Blockchain - Usuario: 5 - 2025-11-02
2. [ID: 323] IA en Salud - Usuario: 12 - 2025-11-01
...
```

**Uso:** Diagnóstico rápido del estado del sistema.

---

### `check-usuarios.js`
**Listar Usuarios Registrados**

Muestra todos los usuarios con sus datos básicos:

```bash
node check-usuarios.js

# Filtrar por rol
node check-usuarios.js --rol=usuario

# Filtrar por estado
node check-usuarios.js --estado=activo
```

**Output:**
```
=== USUARIOS REGISTRADOS ===
ID  | Nombre              | Email                         | Rol     | Estado
1   | Juan Pérez          | juan.perez@tecsup.edu.pe      | admin   | activo
2   | María García        | maria.garcia@tecsup.edu.pe    | usuario | activo
...

Total: 47 usuarios
```

---

### `create-groq-service.js`
**Generador de Servicio Groq**

Script auxiliar para regenerar o validar la configuración del servicio Groq:

```bash
node create-groq-service.js
```

**Uso:** Desarrollo y debugging del servicio de IA.

---

## 📦 Carpeta `lib/` Detallada

### `ortografia.js` - Corrector Ortográfico

**Propósito:** Validar y corregir ortografía en español antes de generar presentaciones.

**Dependencias:**
- `nspell`: Biblioteca de corrección ortográfica
- `dictionary-es`: Diccionario español

**Funciones principales:**
```javascript
// Verificar si una palabra está correcta
function esPalabraCorrecta(palabra);

// Obtener sugerencias para palabra incorrecta
function obtenerSugerencias(palabra);

// Corregir texto completo
function corregirTexto(texto);
```

**Ejemplo de uso:**
```javascript
const ortografia = require('./lib/ortografia');

const texto = 'Intelijencia Artificial en la educasion';
const textoCo

rregido = ortografia.corregirTexto(texto);
// "Inteligencia Artificial en la educación"
```

---

### `asyncHandler.js` - Wrapper de Errores

**Propósito:** Envolver funciones async para manejar errores automáticamente sin try/catch repetitivos.

**Implementación:**
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

**Uso en rutas:**
```javascript
const asyncHandler = require('../lib/asyncHandler');

// Sin asyncHandler (verbose)
router.get('/presentaciones', async (req, res, next) => {
  try {
    const presentaciones = await presentacionService.listar();
    res.json(presentaciones);
  } catch (error) {
    next(error);
  }
});

// Con asyncHandler (limpio)
router.get('/presentaciones', asyncHandler(async (req, res) => {
  const presentaciones = await presentacionService.listar();
  res.json(presentaciones);
}));
```

---

### `presentacionTopics.js` - Temas Sugeridos por Carrera

**Propósito:** Proveer temas predefinidos organizados por carrera técnica para facilitar la creación de presentaciones.

**Estructura:**
```javascript
module.exports = {
  'software': [
    'Arquitectura de Microservicios',
    'Desarrollo Full Stack con MERN',
    'DevOps y CI/CD',
    'Machine Learning Básico',
    'Seguridad en Aplicaciones Web',
    'Patrones de Diseño en JavaScript'
  ],
  'maquinaria': [
    'Mantenimiento Predictivo',
    'Sistemas Hidráulicos Industriales',
    'Automatización de Procesos',
    'Gestión de Activos',
    'Lubricación Industrial'
  ],
  'mecatronica': [
    'Robótica Industrial',
    'IoT y Sensores Inteligentes',
    'Sistemas de Control Automatizado',
    'Industria 4.0',
    'Impresión 3D y Prototipado'
  ],
  'quimica': [
    'Procesos de Refinación',
    'Seguridad en Laboratorios',
    'Química Analítica Instrumental',
    'Tratamiento de Aguas Residuales',
    'Nanotecnología Aplicada'
  ]
};
```

**Uso en frontend:**
```javascript
// Mostrar sugerencias al usuario según su carrera
const temas = presentacionTopics[usuarioCarrera];
```

---

## 🔍 Verificación Final de Cobertura

### ✅ Arquitectura y Diseño
- [x] Diagramas de arquitectura
- [x] Flujos de datos (OAuth, generación, autorización)
- [x] Patrones de diseño (MVC, Service Layer, Factory, etc.)
- [x] Estructura de carpetas COMPLETA con nuevas adiciones

### ✅ Configuración
- [x] Variables de entorno exhaustivas
- [x] PostgreSQL (conexión, pool, SSL, CA certificates)
- [x] OAuth Google paso a paso
- [x] Servicios IA (Groq, Gemini, fallback)

### ✅ Deployment
- [x] Local (paso a paso)
- [x] Docker (Dockerfile + docker-compose)
- [x] DigitalOcean App Platform
- [x] DigitalOcean Droplet (VPS manual)
- [x] Render (Blueprint y manual)

### ✅ API Completa
- [x] TODOS los endpoints documentados
- [x] Headers, body, responses, errores
- [x] Ejemplos de código frontend

### ✅ Servicios y Lógica
- [x] Groq (prompts, modelos, respuestas)
- [x] Gemini (fallback, optimización, guardado)
- [x] PPTX generation completa
- [x] Flujo end-to-end de generación

### ✅ Seguridad
- [x] JWT (generación, validación)
- [x] CORS (configuración, troubleshooting)
- [x] OAuth (setup completo)
- [x] Helmet, Rate Limiting, Sanitización

### ✅ Roles y Permisos
- [x] 3 roles (usuario, admin, soporte)
- [x] Middleware de autorización
- [x] Ejemplos de uso

### ✅ Troubleshooting
- [x] 20+ problemas comunes con soluciones
- [x] Database (connections, SSL, timeouts)
- [x] Auth (OAuth, JWT, whitelist)
- [x] IA (rate limits, modelos, errors)
- [x] CORS, PPTX, Performance, Deployment

### ✅ Operaciones
- [x] Logs y debugging
- [x] Scripts útiles (12+ documentados)
- [x] Mejores prácticas (seguridad, performance, mantenibilidad)
- [x] Backups y recuperación

### ✅ Recursos
- [x] FAQ (30+ preguntas)
- [x] Documentación complementaria (links a archivos markdown)
- [x] Archivos adicionales (CODE_OF_CONDUCT, CONTRIBUTING, etc.)
- [x] Changelog
- [x] Licencia y créditos

### ✅ Utilidades (`lib/`)
- [x] ortografia.js (corrector)
- [x] pptFonts.js (fuentes)
- [x] pptImages.js (procesamiento)
- [x] pptThemes.js (plantillas)
│   ├── test-middleware-suspended.js     # Prueba usuarios suspendidos
│   ├── test-reportes-backend.js         # Prueba endpoints reportes
│   └── test-suspended-user.js           # Prueba suspensión usuario
│
└── 📁 archive/                          # Archivos archivados (backups)
    └── cleanup-20251102/                # Limpieza Nov 2025
        ├── services_groqService-corrupted.js
        ├── services_groqService-clean.js
        └── services_groqService.js.backup.txt
```

### Explicación de Carpetas Clave

#### **`routes/`** - Definición de Endpoints
Cada archivo define un conjunto de rutas relacionadas:
- Importa el controller correspondiente
- Define métodos HTTP (GET, POST, PUT, PATCH, DELETE)
- Aplica middlewares específicos (auth, roles)
- Exporta el router para ser montado en `index.js`

#### **`controllers/`** - Orquestación de Peticiones
Funciones que:
- Reciben `req` y `res` de Express
- Validan parámetros y body
- Llaman a services para lógica de negocio
- Manejan errores con try/catch
- Envían respuestas JSON estructuradas

#### **`services/`** - Lógica de Negocio Pura
Funciones sin dependencia de req/res:
- Consultas a base de datos
- Llamadas a APIs externas (Groq, Gemini)
- Transformaciones de datos
- Validaciones de negocio
- Reutilizables desde múltiples controllers

#### **`middlewares/`** - Interceptores de Peticiones
- **authMiddleware.js**: Valida JWT, extrae usuario, bloquea no autenticados
- **roleMiddleware.js**: Factory de middleware para validar roles específicos

#### **`utils/`** - Helpers y Configuraciones
Módulos auxiliares sin estado:
- Configuraciones de plantillas PPTX
- Procesamiento de imágenes
- Corrección de texto
- Constantes y mapeos

---

## 🔄 Flujo de Datos

### 1. Flujo de Autenticación (OAuth)
---

## 🔄 Flujo de Datos

### 1. Flujo de Autenticación (OAuth)

```
Usuario                 Frontend              Backend              Google OAuth          PostgreSQL
  │                        │                     │                      │                     │
  │  Click "Login"         │                     │                      │                     │
  ├────────────────────────>                     │                      │                     │
  │                        │  GET /auth/google   │                      │                     │
  │                        ├─────────────────────>                      │                     │
  │                        │                     │  Redirect to Google  │                     │
  │                        │                     ├──────────────────────>                     │
  │                        │                     │                      │                     │
  │  Login en Google       │                     │                      │                     │
  ├────────────────────────┼─────────────────────┼──────────────────────>                     │
  │                        │                     │                      │                     │
  │                        │                     │ GET /auth/google/callback?code=XXX         │
  │                        │                     <──────────────────────┤                     │
  │                        │                     │                      │                     │
  │                        │                     │  Exchange code       │                     │
  │                        │                     ├──────────────────────>                     │
  │                        │                     │  Return profile      │                     │
  │                        │                     <──────────────────────┤                     │
  │                        │                     │                      │                     │
  │                        │                     │  Verificar email whitelist                 │
  │                        │                     ├────────────────────────────────────────────>
  │                        │                     │  Crear/actualizar usuario                  │
  │                        │                     <────────────────────────────────────────────┤
  │                        │                     │                      │                     │
  │                        │                     │  Generar JWT         │                     │
  │                        │  Redirect con token │                      │                     │
  │                        <─────────────────────┤                      │                     │
  │  Guarda JWT            │                     │                      │                     │
  <────────────────────────┤                     │                      │                     │
```

### 2. Flujo de Generación de Presentación

```
1. Usuario solicita generar presentación
   POST /presentaciones/generar
   Body: { tema, idioma, numeroSlides, detailLevel, estilo }
   Header: Authorization: Bearer <JWT>

2. Backend valida JWT y extrae usuario_id

3. Backend llama a groqService.generarEsquema()
   ├─> Construye prompt con parámetros
   ├─> Envía a Groq API (llama3-70b-8192)
   └─> Recibe JSON con estructura de slides

4. Backend guarda presentación en PostgreSQL
   INSERT INTO presentaciones (usuario_id, tema, esquema_json, ...)

5. (Opcional) Usuario solicita generar imágenes
   POST /presentaciones/:id/imagenes
   
6. Backend llama a geminiService.generarImagen() por cada slide
   ├─> Envía prompt a Gemini API
   ├─> Recibe imagen en base64
   ├─> Guarda en public/images/slides/
   └─> Inserta registro en tabla imagenes

7. Usuario solicita exportar
   GET /presentaciones/:id/export

8. Backend llama a pptService.generarPresentacion()
   ├─> Lee esquema_json de PostgreSQL
   ├─> Aplica plantilla visual (pptThemes)
   ├─> Inserta imágenes si existen
   ├─> Genera archivo PPTX en memoria
   └─> Envía como attachment

9. Usuario descarga archivo .pptx
```

### 3. Flujo de Autorización por Roles

```
Request: PUT /admin/usuarios/123 (cambiar rol de usuario)
  │
  ▼
authMiddleware.verificarToken()
  │ ├─ Extrae token del header
  │ ├─ Verifica firma con JWT_SECRET
  │ ├─ Decodifica payload { usuario_id, email, rol }
  │ └─ Adjunta req.usuario
  ▼
roleMiddleware.verificarRol(['admin', 'soporte'])
  │ ├─ Lee req.usuario.rol
  │ ├─ Compara con roles permitidos
  │ └─ Si no coincide → 403 Forbidden
  ▼
usuariosAdminController.actualizarUsuario()
  │ ├─ Valida parámetros
  │ ├─ Llama a usuariosService.actualizarRol()
  │ └─ Retorna { message: "Usuario actualizado", usuario }
  ▼
Response 200 OK
```

---

## 🎨 Patrones de Diseño

### 1. **MVC (Model-View-Controller)**
- **Model**: PostgreSQL + queries en services
- **View**: JSON responses (no templates server-side)
- **Controller**: Orquestación en `controllers/`

### 2. **Service Layer Pattern**
Separación de lógica de negocio de controllers:
```javascript
// ❌ MAL: Lógica en controller
router.post('/presentaciones', async (req, res) => {
  const result = await db.query('INSERT INTO presentaciones...');
  // Lógica compleja aquí
});

// ✅ BIEN: Controller delega a service
router.post('/presentaciones', presentacionesController.crear);
// Controller llama a presentacionService.crear()
```

### 3. **Factory Pattern** (Middleware de Roles)
```javascript
// roleMiddleware.js
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (rolesPermitidos.includes(req.usuario.rol)) {
      return next();
    }
    return res.status(403).json({ error: 'Sin permisos' });
  };
};

// Uso
router.get('/admin/dashboard', verificarRol(['admin']), controller.dashboard);
```

### 4. **Singleton Pattern** (Database Pool)
```javascript
// db.js
const { Pool } = require('pg');
const pool = new Pool({ /* config */ });
module.exports = pool; // Una única instancia compartida
```

### 5. **Strategy Pattern** (Generación IA)
Diferentes estrategias de generación según parámetros:
```javascript
// groqService.js
function construirPrompt(tema, idioma, detailLevel, estilo) {
  const estrategias = {
    'Brief': () => '3 bullets, 8-12 words each',
    'Medium': () => '4 bullets, 10-18 words each',
    'Detailed': () => '5 bullets, 15-25 words each'
  };
  return estrategias[detailLevel]();
}
```

---

## ⚙️ Variables de Entorno Completas

Crea un archivo `.env` en la raíz del proyecto (usa `.env.example` como referencia):

```bash
# ============================================
# ENTORNO Y SERVIDOR
# ============================================
NODE_ENV=production                          # development | production | test
HOST=0.0.0.0                                 # 0.0.0.0 escucha en todas las interfaces
PORT=3001                                    # Puerto del servidor Express

# ============================================
# URLs Y DOMINIOS
# ============================================
PUBLIC_BASE_URL=https://api.teccreate.edu    # URL pública del backend
CLIENT_URL=https://app.teccreate.edu         # URL del frontend (para redirecciones)
ALLOWED_ORIGINS=https://app.teccreate.edu,https://api.teccreate.edu  # CORS origins (separados por coma)

# ============================================
# BASE DE DATOS POSTGRESQL
# ============================================
DATABASE_URL=postgresql://usuario:password@host:5432/teccreate  # Connection string completa
DATABASE_SSL=true                            # true para conexiones TLS (producción)
DATABASE_SSL_ALLOW_SELF_SIGNED=false         # ⚠️ Solo para desarrollo, NO usar en producción
DATABASE_SSL_CA_B64=LS0tLS1CRUdJTi...        # Certificado CA en base64 (opcional, recomendado)

# Pool de conexiones (ajustar según plan de PostgreSQL)
PGPOOL_MAX=3                                 # Máximo de conexiones simultáneas
PGPOOL_IDLE_TIMEOUT=10000                    # Tiempo antes de cerrar conexión idle (ms)
PGPOOL_CONNECTION_TIMEOUT=5000               # Timeout de conexión (ms)

# ============================================
# SEGURIDAD Y AUTENTICACIÓN
# ============================================
SESSION_SECRET=genera-un-string-aleatorio-seguro-min-32-caracteres
JWT_SECRET=otra-clave-aleatoria-diferente-para-firmar-tokens
JWT_EXPIRES_IN=1d                            # Duración del JWT (1d = 1 día, 7d = 7 días)

# Whitelist de correos institucionales Tecsup permitidos (separados por coma)
ADMIN_EMAILS=coordinador@tecsup.edu.pe,director@tecsup.edu.pe,soporte@tecsup.edu.pe

# ============================================
# GOOGLE OAUTH 2.0
# ============================================
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcd1234
GOOGLE_CALLBACK_URL=https://api.tecsup.teccreate.edu/auth/google/callback

# ============================================
# SERVICIOS DE IA
# ============================================
# Groq (Generación de texto)
GROQ_API_KEY=gsk_abcd1234efgh5678ijkl  # Opcional, obtén en https://groq.com

# Gemini (Generación de imágenes)
GEMINI_API_KEY=AIzaSyAaBbCcDdEeFfGg  # Obtén en https://aistudio.google.com/apikey
GEMINI_IMAGE_MODEL=gemini-2.0-flash-preview-image-generation  # Modelo principal
GEMINI_IMAGE_MODEL_FALLBACK=gemini-2.5-flash-image            # Modelo de respaldo

# ============================================
# REDIS (Opcional, recomendado para producción)
# ============================================
REDIS_URL=redis://:password@host:6379        # Para almacenar sesiones en Redis

# ============================================
# SOPORTE Y MANTENIMIENTO
# ============================================
SUPPORT_EMAIL=soporte@tecsup.edu.pe          # Email de contacto de soporte Tecsup
MAINTENANCE_GATE_SECRET=clave-secreta-modo-mantenimiento  # Para activar modo mantenimiento

# ============================================
# LOGS Y MONITOREO (Opcional)
# ============================================
LOG_LEVEL=info                               # trace | debug | info | warn | error | fatal
ENABLE_REQUEST_LOGGING=true                  # Logs de todas las peticiones HTTP
```

### 🔐 Generación de Secretos Seguros

**En PowerShell (Windows):**
```powershell
# Generar SESSION_SECRET y JWT_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | % {[char]$_})
```

**En Bash/Zsh (Linux/macOS):**
```bash
# Generar secretos aleatorios
openssl rand -base64 32
```

**En Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

### 📋 Configuración por Entorno

#### Development (local)
```env
NODE_ENV=development
HOST=localhost
PORT=3001
CLIENT_URL=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:3001
DATABASE_SSL=false
DATABASE_SSL_ALLOW_SELF_SIGNED=true
```

#### Production (DigitalOcean, Render, etc.)
```env
NODE_ENV=production
HOST=0.0.0.0
PORT=8080
CLIENT_URL=https://app.teccreate.edu
PUBLIC_BASE_URL=https://api.teccreate.edu
DATABASE_SSL=true
DATABASE_SSL_ALLOW_SELF_SIGNED=false  # ⚠️ Cambiar a false y usar DATABASE_SSL_CA_B64
```

---

## 🗄️ Configuración de Base de Datos

### 1. Crear Base de Datos

**Opción A: PostgreSQL Local**
```bash
# Crear base de datos
createdb teccreate

# O desde psql
psql -U postgres
CREATE DATABASE teccreate;
\c teccreate
```

**Opción B: Servicio Gestionado (DigitalOcean, Render, AWS RDS)**
1. Crea una base PostgreSQL desde el panel del proveedor
2. Copia la connection string proporcionada
3. Pégala en `DATABASE_URL`

### 2. Aplicar Schema Completo

El archivo `estructura_presentador_ia.sql` contiene TODO el schema necesario:
- 9 tablas principales
- Índices optimizados
- Triggers automáticos
- Funciones PostgreSQL

**Ejecutar schema:**
```bash
# Desde línea de comandos
psql "postgresql://usuario:password@host:5432/teccreate" -f estructura_presentador_ia.sql

# O si tienes psql configurado
psql -d teccreate -f estructura_presentador_ia.sql
```

**Verificar tablas creadas:**
```sql
\dt  -- Lista todas las tablas

-- Deberías ver:
-- usuarios
-- presentaciones
-- imagenes
-- reportes
-- logs_soporte
-- modo_mantenimiento
-- y otras...
```

### 3. Estructura de Tablas Principales

#### **`usuarios`**
```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  foto_perfil TEXT,
  rol VARCHAR(50) DEFAULT 'usuario',  -- usuario | admin | soporte
  estado VARCHAR(50) DEFAULT 'activo',  -- activo | suspendido | inactivo
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
```

#### **`presentaciones`**
```sql
CREATE TABLE presentaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  tema VARCHAR(500) NOT NULL,
  esquema_json JSONB NOT NULL,  -- Estructura completa de slides
  idioma VARCHAR(50) DEFAULT 'Español',
  nivel_detalle VARCHAR(50) DEFAULT 'Medium',
  estilo_escritura VARCHAR(50) DEFAULT 'Professional',
  plantilla VARCHAR(100) DEFAULT 'default',
  fuente VARCHAR(100) DEFAULT 'calibri',
  estado VARCHAR(50) DEFAULT 'borrador',  -- borrador | finalizada | compartida
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  vistas INTEGER DEFAULT 0,
  compartida BOOLEAN DEFAULT FALSE,
  enlace_publico VARCHAR(255) UNIQUE
);

CREATE INDEX idx_presentaciones_usuario ON presentaciones(usuario_id);
CREATE INDEX idx_presentaciones_estado ON presentaciones(estado);
CREATE INDEX idx_presentaciones_fecha ON presentaciones(fecha_creacion DESC);
```

#### **`imagenes`**
```sql
CREATE TABLE imagenes (
  id SERIAL PRIMARY KEY,
  presentacion_id INTEGER REFERENCES presentaciones(id) ON DELETE CASCADE,
  slide_numero INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  url_imagen TEXT NOT NULL,
  modelo_ia VARCHAR(100),  -- gemini-2.0-flash-preview-image-generation
  fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_imagenes_presentacion ON imagenes(presentacion_id);
```

### 4. Conexión y Pool

El archivo `db.js` gestiona el pool de conexiones:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: process.env.DATABASE_SSL_ALLOW_SELF_SIGNED !== 'true',
    ca: process.env.DATABASE_SSL_CA_B64 
      ? Buffer.from(process.env.DATABASE_SSL_CA_B64, 'base64').toString('utf-8')
      : undefined
  } : false,
  max: parseInt(process.env.PGPOOL_MAX) || 10,
  idleTimeoutMillis: parseInt(process.env.PGPOOL_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.PGPOOL_CONNECTION_TIMEOUT) || 2000,
});

// Manejo de errores del pool
pool.on('error', (err) => {
  console.error('Error inesperado en pool de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;
```

### 5. Configurar DATABASE_SSL_CA_B64 (Producción)
### 5. Configurar DATABASE_SSL_CA_B64 (Producción)

Si tu proveedor PostgreSQL requiere un certificado CA personalizado (DigitalOcean, AWS RDS, etc.):

**Paso 1: Descargar certificado**
- DigitalOcean: Panel → Databases → Connection Details → Download CA Certificate
- Descargarás un archivo `ca-certificate.crt`

**Paso 2: Convertir a Base64**

**PowerShell:**
```powershell
$pem = Get-Content -Raw '.\ca-certificate.crt'
$b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pem))
Write-Output $b64
```

**Bash:**
```bash
base64 -w 0 ca-certificate.crt
```

**Paso 3: Copiar output y pegar en variable de entorno**
```env
DATABASE_SSL_CA_B64=LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...
```

⚠️ **Cambiar `DATABASE_SSL_ALLOW_SELF_SIGNED` a `false` en producción**

### 6. Migraciones y Mantenimiento

**Backup de base de datos:**
```bash
pg_dump "postgresql://user:pass@host:5432/teccreate" > backup_$(date +%Y%m%d).sql
```

**Restaurar backup:**
```bash
psql "postgresql://user:pass@host:5432/teccreate" < backup_20251102.sql
```

**Limpiar datos de prueba:**
```sql
-- Eliminar presentaciones de prueba
DELETE FROM presentaciones WHERE tema LIKE '%test%' OR tema LIKE '%prueba%';

-- Eliminar imágenes huérfanas
DELETE FROM imagenes WHERE presentacion_id NOT IN (SELECT id FROM presentaciones);
```

---

## 🔐 Configuración de OAuth con Google

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google+ API** o **People API**

### 2. Configurar Pantalla de Consentimiento

1. Sidebar → **APIs & Services** → **OAuth consent screen**
2. Selecciona **Internal** (si es Google Workspace) o **External**
3. Completa:
   - **App name**: TecCreate
   - **User support email**: soporte@tecsup.edu.pe
   - **Developer contact**: soporte@tecsup.edu.pe
4. **Scopes**: Agrega `userinfo.email` y `userinfo.profile`
5. Guarda y continúa

### 3. Crear OAuth Client ID

1. Sidebar → **Credentials** → **Create Credentials** → **OAuth Client ID**
2. **Application type**: Web application
3. **Name**: TecCreate Backend
4. **Authorized JavaScript origins**:
   ```
   https://api.teccreate.edu
   http://localhost:3001  (solo para desarrollo)
   ```
5. **Authorized redirect URIs**:
   ```
   https://api.teccreate.edu/auth/google/callback
   http://localhost:3001/auth/google/callback  (solo para desarrollo)
   ```
6. Click **Create**
7. **Copia** el **Client ID** y **Client secret**

### 4. Configurar Variables de Entorno

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789
GOOGLE_CALLBACK_URL=https://api.teccreate.edu/auth/google/callback
```

### 5. Agregar Correos Institucionales Permitidos

Solo los correos listados en `ADMIN_EMAILS` podrán iniciar sesión:

```env
ADMIN_EMAILS=coordinador@tecsup.edu.pe,director@tecsup.edu.pe,soporte@tecsup.edu.pe
```

**Nota**: Separa múltiples correos con comas, sin espacios. Todos deben usar el dominio @tecsup.edu.pe.

### 6. Flujo de Autenticación

**Backend: `config/passport.js`**
```javascript
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    
    // Verificar whitelist
    const adminEmails = process.env.ADMIN_EMAILS.split(',');
    if (!adminEmails.includes(email)) {
      return done(null, false, { message: 'Correo no autorizado' });
    }
    
    // Buscar o crear usuario
    let usuario = await pool.query(
      'SELECT * FROM usuarios WHERE google_id = $1',
      [profile.id]
    );
    
    if (usuario.rows.length === 0) {
      // Crear nuevo usuario
      const result = await pool.query(
        'INSERT INTO usuarios (nombre, apellido, email, google_id, foto_perfil, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [profile.name.givenName, profile.name.familyName, email, profile.id, profile.photos[0].value, 'usuario']
      );
      usuario = result.rows[0];
    } else {
      usuario = usuario.rows[0];
      // Actualizar último acceso
      await pool.query(
        'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1',
        [usuario.id]
      );
    }
    
    return done(null, usuario);
  }
));
```

### 7. Endpoints de Autenticación

**Iniciar login:**
```
GET /auth/google
```

**Callback (manejado automáticamente):**
```
GET /auth/google/callback
```

**Logout:**
```
POST /auth/logout
```

### 8. Respuesta del Callback

Después del login exitoso, el backend redirige al frontend con el token:

```
https://app.teccreate.edu/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&redirect=/dashboard
```

El frontend extrae el token del query string y lo guarda en localStorage:

```javascript
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
if (token) {
  localStorage.setItem('token', token);
  window.location.href = params.get('redirect') || '/dashboard';
}
```

### 9. Solución de Problemas OAuth

| Error | Causa | Solución |
|-------|-------|----------|
| `redirect_uri_mismatch` | URI no coincide con Google Cloud | Verifica que `GOOGLE_CALLBACK_URL` esté en "Authorized redirect URIs" |
| `invalid_client` | Client ID o Secret incorrectos | Revisa `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` |
| `access_denied` | Usuario canceló el login | Normal, el usuario puede reintentar |
| `Correo no autorizado` | Email no está en whitelist | Agrega el correo a `ADMIN_EMAILS` |

---

## 🤖 Configuración de Servicios IA

### Groq (Generación de Texto)

#### 1. Obtener API Key

1. Ve a [groq.com](https://groq.com)
2. Crea una cuenta o inicia sesión
3. Dashboard → **API Keys** → **Create API Key**
4. Copia la clave (empieza con `gsk_`)

```env
GROQ_API_KEY=gsk_abc123def456ghi789jkl012mno345
```

#### 2. Modelos Disponibles

| Modelo | Descripción | Tokens | Velocidad |
|--------|-------------|--------|-----------|
| `llama3-70b-8192` | LLaMA 3 70B (recomendado) | 8,192 | 🔥 Ultra rápida |
| `mixtral-8x7b-32768` | Mixtral 8x7B | 32,768 | ⚡ Rápida |
| `llama3-8b-8192` | LLaMA 3 8B (más ligero) | 8,192 | 🚀 Muy rápida |

**Configuración en `groqService.js`:**
```javascript
const GROQ_MODEL = 'llama3-70b-8192';  // Modelo por defecto
```

#### 3. Límites de Rate

- **Requests por minuto (RPM)**: Varía según plan (free tier: ~30 RPM)
- **Tokens por minuto (TPM)**: Varía según plan
- **Recomendación**: Implementar cola de peticiones si generas múltiples presentaciones simultáneas

#### 4. Ejemplo de Prompt

```javascript
const prompt = `Crea una presentación educativa sobre "${tema}" en ${idioma} con ${numeroSlides} slides.

Nivel de detalle: ${detailLevel}
Estilo: ${estilo}

Estructura requerida:
{
  "tema": "...",
  "slides": [
    {
      "titulo": "...",
      "contenido": "...",
      "bullets": ["...", "...", "..."]
    }
  ]
}`;
```

### Google Gemini (Generación de Imágenes)

#### 1. Obtener API Key

1. Ve a [Google AI Studio](https://aistudio.google.com/apikey)
2. Inicia sesión con tu cuenta Google
3. Click en **Get API Key** → **Create API Key**
4. Copia la clave (empieza con `AIzaSy`)

```env
GEMINI_API_KEY=AIzaSyAaBbCcDdEeFfGgHhIiJjKkLlMm
```

⚠️ **IMPORTANTE: Nunca subas esta clave a GitHub o repositorios públicos**

#### 2. Modelos de Imagen

**Modelo Principal:**
```env
GEMINI_IMAGE_MODEL=gemini-2.0-flash-preview-image-generation
```

**Límites (Tier 1 - Pago):**
- **RPM**: 1,000 requests/minuto
- **TPM**: 1,000,000 tokens/minuto
- **RPD**: 10,000 requests/día

**Modelo de Respaldo:**
```env
GEMINI_IMAGE_MODEL_FALLBACK=gemini-2.5-flash-image
```

#### 3. Sistema de Fallback Automático

El backend cambia automáticamente al modelo de respaldo si:
- El modelo principal retorna error 400, 403, 404
- El mensaje contiene: "not found", "unsupported", "deprecated"

```javascript
// geminiService.js
async function generarImagen(prompt, slideNumero) {
  let modelo = process.env.GEMINI_IMAGE_MODEL;
  
  try {
    return await generarConModelo(modelo, prompt);
  } catch (error) {
    if (debeUsarFallback(error)) {
      console.warn(`Modelo ${modelo} falló, usando fallback`);
      modelo = process.env.GEMINI_IMAGE_MODEL_FALLBACK;
      return await generarConModelo(modelo, prompt);
    }
    throw error;
  }
}
```

#### 4. Formato de Request

```javascript
const request = {
  contents: [{
    parts: [{
      text: `Genera una imagen fotorealista sobre: ${prompt}. Estilo: ${estilo}, alta calidad, 16:9.`
    }]
  }],
  generationConfig: {
    responseModalities: ['TEXT', 'IMAGE'],  // ⚠️ Importante: incluir ambos
    temperature: 1.0,
    topP: 0.95
  }
};
```

#### 5. Procesamiento de Respuesta

```javascript
const candidate = response.candidates[0];
const imagePart = candidate.content.parts.find(p => p.inlineData);

if (imagePart && imagePart.inlineData) {
  const base64Image = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType;  // image/jpeg, image/png
  
  // Guardar en public/images/slides/
  const filename = `slide_${presentacionId}_${slideNumero}.${extension}`;
  const buffer = Buffer.from(base64Image, 'base64');
  fs.writeFileSync(`public/images/slides/${filename}`, buffer);
}
```

#### 6. Optimización de Prompts para Imágenes

```javascript
function construirPromptImagen(contenidoSlide, estilo) {
  const estilos = {
    'Professional': 'fotorealista, corporativo, limpio, profesional, alta calidad',
    'Casual': 'ilustración moderna, colores vibrantes, friendly, accesible',
    'Academic': 'diagrama técnico, científico, preciso, educativo'
  };
  
  return `Genera una imagen ${estilos[estilo]} que represente: "${contenidoSlide}". 
  Formato 16:9, sin texto, alta resolución.`;
}
```

#### 7. Límites y Costos

**Plan Free:**
- 15 RPM
- 1 millón de tokens/mes
- Solo modelos básicos

**Plan de Pago (Tier 1):**
- 1,000 RPM
- Facturación por tokens consumidos
- Acceso a modelos preview

**Recomendación**: Monitorea uso en Google AI Studio → Usage

---

## 💾 Instalación Local

### Paso 1: Clonar Repositorio

```bash
git clone https://github.com/JuniorSebastian/TecCreateBackendLocal.git
cd TecCreateBackendLocal/backend
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

**Dependencias principales instaladas:**
- express, cors, cookie-parser
- pg (PostgreSQL driver)
- passport, passport-google-oauth20
- jsonwebtoken, express-session
- groq-sdk, @google/generative-ai
- pptxgenjs, sharp, qrcode
- helmet, compression, express-rate-limit (opcionales)

### Paso 3: Configurar Variables de Entorno

```bash
cp .env.example .env
```

**Edita `.env` con tus valores:**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/teccreate
DATABASE_SSL=false
CLIENT_URL=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:3001
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
SESSION_SECRET=genera-clave-aleatoria-32-caracteres
JWT_SECRET=otra-clave-diferente-32-caracteres
ADMIN_EMAILS=tu-email@gmail.com
GROQ_API_KEY=gsk_tu_clave
GEMINI_API_KEY=AIzaSy_tu_clave
```

### Paso 4: Configurar PostgreSQL Local

**Opción A: Instalación nativa**
```bash
# Windows (con Chocolatey)
choco install postgresql

# macOS (con Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Opción B: Docker**
```bash
docker run --name teccreate-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=teccreate \
  -p 5432:5432 \
  -d postgres:15
```

### Paso 5: Aplicar Schema

```bash
psql -U postgres -d teccreate -f estructura_presentador_ia.sql
```

**Verificar:**
```bash
psql -U postgres -d teccreate -c "\dt"
```

### Paso 6: Iniciar Servidor

```bash
npm start
```

**Output esperado:**
```
[INFO] Servidor escuchando en http://localhost:3001
[INFO] Conexión a PostgreSQL establecida
[INFO] Pool de conexiones: max=10, idle=30000ms
```

### Paso 7: Verificar Healthcheck

```bash
curl http://localhost:3001/healthz
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T10:30:00.000Z",
  "uptime": 15.234
}
```

### Paso 8: Probar Autenticación

1. Abre tu navegador en `http://localhost:3001/auth/google`
2. Inicia sesión con un correo de `ADMIN_EMAILS`
3. Deberías ser redirigido a `http://localhost:5173/?token=eyJ...&redirect=/dashboard`

---

## 🚀 Despliegue en Producción

### Checklist Pre-Despliegue

- [ ] Variables de entorno configuradas (sin valores de desarrollo)
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_SSL=true`
- [ ] `DATABASE_SSL_ALLOW_SELF_SIGNED=false` (usar `DATABASE_SSL_CA_B64`)
- [ ] Secretos generados de forma segura (SESSION_SECRET, JWT_SECRET)
- [ ] OAuth redirect URIs actualizados en Google Cloud
- [ ] PostgreSQL con respaldos automáticos configurados
- [ ] CORS configurado correctamente (`ALLOWED_ORIGINS`)
- [ ] Dominio con HTTPS/SSL válido
- [ ] Logs y monitoreo configurados
- [ ] Rate limiting habilitado (opcional pero recomendado)

---

## 🐳 Despliegue con Docker

### 1. Crear Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

# Metadata
LABEL maintainer="soporte@tecsup.edu.pe"
LABEL description="TecCreate Backend - Generador de presentaciones IA para Tecsup"

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p public/images/slides public/shared-presentaciones

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exponer puerto
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/healthz', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Comando de inicio
CMD ["node", "index.js"]
```

### 2. Crear docker-compose.yml (Desarrollo)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: teccreate-postgres
    environment:
      POSTGRES_DB: teccreate
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./estructura_presentador_ia.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: teccreate-backend
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/teccreate
      PORT: 3001
      # Agregar resto de variables desde .env
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./public:/app/public
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. Construir y Ejecutar

```bash
# Construir imagen
docker build -t teccreate-backend:latest .

# Ejecutar con docker-compose
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Detener
docker-compose down
```

### 4. Despliegue en Docker Swarm / Kubernetes

**Docker Swarm:**
```bash
docker stack deploy -c docker-compose.prod.yml teccreate
```

**Kubernetes** (ejemplo básico):
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: teccreate-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: teccreate-backend
  template:
    metadata:
      labels:
        app: teccreate-backend
    spec:
      containers:
      - name: backend
        image: tu-registry/teccreate-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: teccreate-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /healthz
            port: 3001
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /healthz
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 10
```

---

## ☁️ Despliegue en DigitalOcean

### Opción A: App Platform (Recomendado)

#### 1. Crear App desde GitHub

1. Panel DigitalOcean → **App Platform** → **Create App**
2. **Source**: Conecta tu repositorio GitHub
3. **Branch**: `main` o `production`
4. **Autodeploy**: ✅ Habilitar (deploy automático en push)

#### 2. Configurar Build

- **Type**: Web Service
- **Environment**: Node.js
- **Build Command**: `npm install`
- **Run Command**: `node index.js` o `npm start`
- **HTTP Port**: 3001 (o variable `PORT`)
- **HTTP Request Routes**: `/`

#### 3. Agregar Base de Datos

1. **Add Resource** → **Database** → **PostgreSQL**
2. Selecciona plan (Basic $15/mes o superior)
3. DigitalOcean creará automáticamente `DATABASE_URL`
4. Descarga **CA Certificate** para `DATABASE_SSL_CA_B64`

#### 4. Configurar Variables de Entorno

En **Settings** → **Environment Variables**:

```
NODE_ENV=production
HOST=0.0.0.0
PORT=8080
PUBLIC_BASE_URL=https://tu-app.ondigitalocean.app
CLIENT_URL=https://tu-frontend.ondigitalocean.app
ALLOWED_ORIGINS=https://tu-frontend.ondigitalocean.app
DATABASE_SSL=true
DATABASE_SSL_CA_B64=LS0tLS1CRUdJTi...  (descargado del panel)
SESSION_SECRET=<genera-uno-seguro>
JWT_SECRET=<genera-otro-diferente>
GOOGLE_CLIENT_ID=<tu-client-id>
GOOGLE_CLIENT_SECRET=<tu-client-secret>
GOOGLE_CALLBACK_URL=https://tu-app.ondigitalocean.app/auth/google/callback
ADMIN_EMAILS=coordinador@tecsup.edu.pe,director@tecsup.edu.pe,soporte@tecsup.edu.pe
GROQ_API_KEY=gsk_tu_clave
GEMINI_API_KEY=AIzaSy_tu_clave
```

#### 5. Aplicar Schema a Base de Datos

```bash
# Obtener connection string del panel (Connection Details)
psql "postgresql://user:pass@host:25060/db?sslmode=require" -f estructura_presentador_ia.sql
```

#### 6. Deploy

Click **Create Resources** → Espera 5-10 minutos

**Verificar:**
```bash
curl https://tu-app.ondigitalocean.app/healthz
```

#### 7. Configurar Dominio Personalizado (Opcional)

1. **Settings** → **Domains**
2. **Add Domain** → `api.teccreate.edu`
3. Agrega registros DNS en tu proveedor:
   ```
   CNAME api.teccreate.edu → tu-app.ondigitalocean.app
   ```
4. Actualiza variables:
   ```
   PUBLIC_BASE_URL=https://api.teccreate.edu
   GOOGLE_CALLBACK_URL=https://api.teccreate.edu/auth/google/callback
   ```

### Opción B: Droplet (VPS Manual)

#### 1. Crear Droplet

- **Image**: Ubuntu 22.04 LTS
- **Plan**: Basic ($12/mes - 2GB RAM)
- **Datacenter**: Más cercano a tus usuarios
- **SSH Key**: Agrega tu clave pública

#### 2. Conectar por SSH

```bash
ssh root@tu-droplet-ip
```

#### 3. Instalar Dependencias

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Nginx
apt install -y nginx

# Instalar PM2 globalmente
npm install -g pm2
```

#### 4. Configurar PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE teccreate;
CREATE USER teccreate_user WITH ENCRYPTED PASSWORD 'tu-password-segura';
GRANT ALL PRIVILEGES ON DATABASE teccreate TO teccreate_user;
\q

# Aplicar schema
psql -U teccreate_user -d teccreate -f estructura_presentador_ia.sql
```

#### 5. Clonar y Configurar Backend

```bash
cd /var/www
git clone https://github.com/tu-usuario/TecCreateBackendLocal.git backend
cd backend
npm install --production

# Crear .env
nano .env
# (Pega tus variables de producción)

# Cambiar propietario
chown -R www-data:www-data /var/www/backend
```

#### 6. Configurar PM2

```bash
# Iniciar backend
pm2 start index.js --name teccreate-backend

# Guardar configuración PM2
pm2 save

# Auto-start en boot
pm2 startup systemd
# (ejecuta el comando que PM2 te muestre)
```

#### 7. Configurar Nginx como Reverse Proxy

```bash
nano /etc/nginx/sites-available/teccreate
```

```nginx
server {
    listen 80;
    server_name api.teccreate.edu;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Habilitar sitio
ln -s /etc/nginx/sites-available/teccreate /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 8. Configurar HTTPS con Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.teccreate.edu

# Auto-renovación (ya configurada por defecto)
certbot renew --dry-run
```

#### 9. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## 🎨 Despliegue en Render

### 1. Crear Cuenta en Render

Ve a [render.com](https://render.com) y crea una cuenta (gratis).

### 2. Opción A: Con Blueprint (render.yaml)

El archivo `render.yaml` en la raíz define infraestructura como código:

```yaml
services:
  - type: web
    name: teccreate-backend
    env: node
    region: oregon
    plan: starter  # $7/mes
    buildCommand: npm install
    startCommand: node index.js
    healthCheckPath: /healthz
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8080
      - key: DATABASE_URL
        fromDatabase:
          name: teccreate-postgres
          property: connectionString
      - key: SESSION_SECRET
        generateValue: true
      - key: JWT_SECRET
        generateValue: true
      # Resto de variables (agregar manualmente)

databases:
  - name: teccreate-postgres
    databaseName: teccreate
    user: teccreate_user
    region: oregon
    plan: starter  # $7/mes
```

**Pasos:**
1. Dashboard Render → **New** → **Blueprint**
2. Conecta tu repo GitHub
3. Render detectará `render.yaml`
4. **Review** → Verifica servicios
5. **Apply** → Deploy automático

### 2. Opción B: Manual (Sin Blueprint)

#### Crear Web Service

1. **New** → **Web Service**
2. **GitHub**: Conecta repositorio
3. **Branch**: `main`
4. **Root Directory**: `backend` (si está en subdirectorio)
5. **Environment**: Node
6. **Build Command**: `npm install`
7. **Start Command**: `node index.js`
8. **Plan**: Starter ($7/mes)

#### Crear PostgreSQL Database

1. **New** → **PostgreSQL**
2. **Name**: teccreate-postgres
3. **Database**: teccreate
4. **User**: teccreate_user
5. **Plan**: Starter ($7/mes)
6. **Create Database**

#### Conectar Database a Web Service

1. En el Web Service → **Environment** → **Add Environment Variable**
2. **Key**: `DATABASE_URL`
3. **Value**: Copia el **Internal Connection String** de la base

#### Agregar Variables de Entorno

```
NODE_ENV=production
PORT=8080
PUBLIC_BASE_URL=https://teccreate-backend.onrender.com
CLIENT_URL=https://tu-frontend.onrender.com
DATABASE_SSL=true
SESSION_SECRET=<auto-generado por Render>
JWT_SECRET=<auto-generado por Render>
GOOGLE_CLIENT_ID=<tu-client-id>
GOOGLE_CLIENT_SECRET=<tu-client-secret>
GOOGLE_CALLBACK_URL=https://teccreate-backend.onrender.com/auth/google/callback
ADMIN_EMAILS=coordinador@tecsup.edu.pe,director@tecsup.edu.pe,soporte@tecsup.edu.pe
GROQ_API_KEY=gsk_tu_clave
GEMINI_API_KEY=AIzaSy_tu_clave
GEMINI_IMAGE_MODEL=gemini-2.0-flash-preview-image-generation
GEMINI_IMAGE_MODEL_FALLBACK=gemini-2.5-flash-image
```

#### Aplicar Schema

```bash
# Obtener connection string (External)
psql "<External-Connection-String>" -f estructura_presentador_ia.sql
```

### 3. Deploy

Render desplegará automáticamente. Monitorea en **Logs**.

**Verificar:**
```bash
curl https://teccreate-backend.onrender.com/healthz
```

### 4. Configurar Custom Domain

1. **Settings** → **Custom Domain**
2. **Add Custom Domain** → `api.teccreate.edu`
3. Agrega CNAME en tu DNS:
   ```
   CNAME api → teccreate-backend.onrender.com
   ```
4. Render proveerá SSL automáticamente (Let's Encrypt)

---

## 📡 Autenticación y Seguridad

### JWT (JSON Web Tokens)

#### Generación de Token

**En `config/passport.js` después de OAuth:**
```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    usuario_id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre
  },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
);
```

#### Validación de Token

**Middleware `authMiddleware.js`:**
```javascript
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;  // Adjuntar datos del usuario a req
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { verificarToken };
```

#### Uso en Rutas

```javascript
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/presentaciones/mias', verificarToken, presentacionesController.listarMias);
```

### CORS (Cross-Origin Resource Sharing)

**Configuración en `index.js`:**
```javascript
const cors = require('cors');

// Normalizar URLs (remover trailing slash)
const normalizeUrl = (url) => url.replace(/\/+$/, '');

const allowedOrigins = [
  normalizeUrl(process.env.CLIENT_URL),
  normalizeUrl(process.env.PUBLIC_BASE_URL),
  ...process.env.ALLOWED_ORIGINS.split(',').map(normalizeUrl)
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(normalizeUrl(origin))) {
      callback(null, true);
    } else {
      callback(new Error(`Origen ${origin} no permitido por CORS`));
    }
  },
  credentials: true,  // Permite cookies/sessions
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Helmet (Seguridad Headers HTTP)

**Instalación opcional pero recomendada:**
```bash
npm install helmet
```

**Configuración:**
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,  // 1 año
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting

**Protección contra ataques de fuerza bruta:**
```bash
npm install express-rate-limit
```

**Configuración:**
```javascript
const rateLimit = require('express-rate-limit');

// Limitar peticiones globales
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,  // 100 requests por IP
  message: 'Demasiadas peticiones desde esta IP, intenta más tarde'
});

app.use(limiter);

// Limitar login específicamente
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // Solo 5 intentos de login
  skipSuccessfulRequests: true
});

app.use('/auth/google', loginLimiter);
```

### Sanitización de Inputs

**Prevención de SQL Injection:**
```javascript
// ❌ MAL: Vulnerable a SQL injection
const resultado = await pool.query(
  `SELECT * FROM usuarios WHERE email = '${req.body.email}'`
);

// ✅ BIEN: Usar parámetros preparados
const resultado = await pool.query(
  'SELECT * FROM usuarios WHERE email = $1',
  [req.body.email]
);
```

### Validación de Datos

**Ejemplo con express-validator:**
```bash
npm install express-validator
```

```javascript
const { body, validationResult } = require('express-validator');

router.post('/presentaciones',
  verificarToken,
  [
    body('tema').isString().isLength({ min: 3, max: 500 }).trim().escape(),
    body('numeroSlides').isInt({ min: 3, max: 30 }),
    body('idioma').isIn(['Español', 'English', 'French']),
    body('detailLevel').isIn(['Brief', 'Medium', 'Detailed'])
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  presentacionesController.crear
);
```

---

## 🔌 Endpoints de Autenticación

### `GET /auth/google`
**Inicia el flujo OAuth con Google**

**Acceso:** Público (no requiere autenticación)

**Descripción:** Redirige al usuario a la página de login de Google. Después del login exitoso, Google redirige a `/auth/google/callback`.

**Ejemplo de uso:**
```javascript
// Desde el frontend
window.location.href = 'https://api.teccreate.edu/auth/google';
```

---

### `GET /auth/google/callback`
**Callback de Google OAuth**

**Acceso:** Público (manejado automáticamente por Passport)

**Descripción:** Google redirige aquí después del login. El backend:
1. Recibe el código de autorización
2. Intercambia el código por el perfil del usuario
3. Verifica que el email esté en la whitelist (`ADMIN_EMAILS`)
4. Crea o actualiza el usuario en la base de datos
5. Genera un JWT
6. Redirige al frontend con el token

**Query params recibidos de Google:**
- `code`: Código de autorización temporal

**Redirección final:**
```
https://app.teccreate.edu/?token=eyJhbGc...&redirect=/dashboard
```

**Errores posibles:**
- `403 Forbidden`: Email no autorizado (no está en whitelist)
- `500 Internal Server Error`: Error al crear usuario en DB

---

### `POST /auth/logout`
**Cerrar sesión**

**Acceso:** Usuario autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

**Descripción:** Destruye la sesión en el servidor. El frontend debe eliminar el token de localStorage.

**Ejemplo frontend:**
```javascript
await axios.post('/auth/logout', {}, {
  headers: { Authorization: `Bearer ${token}` }
});
localStorage.removeItem('token');
window.location.href = '/login';
```

---

## 📊 Endpoints de Presentaciones

### `POST /presentaciones`
**Crear presentación con esquema manual**

**Acceso:** Usuario autenticado

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "tema": "Inteligencia Artificial en la Educación",
  "esquema_json": {
    "tema": "Inteligencia Artificial en la Educación",
    "slides": [
      {
        "titulo": "Introducción a la IA",
        "contenido": "La inteligencia artificial está transformando...",
        "bullets": [
          "Definición de IA",
          "Historia y evolución",
          "Aplicaciones actuales"
        ]
      }
    ]
  },
  "idioma": "Español",
  "plantilla": "default",
  "fuente": "calibri"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Presentación creada exitosamente",
  "presentacion": {
    "id": 42,
    "usuario_id": 5,
    "tema": "Inteligencia Artificial en la Educación",
    "esquema_json": { ... },
    "idioma": "Español",
    "plantilla": "default",
    "fuente": "calibri",
    "estado": "borrador",
    "fecha_creacion": "2025-11-02T10:30:00.000Z"
  }
}
```

**Errores:**
- `400 Bad Request`: Faltan campos obligatorios o formato inválido
- `401 Unauthorized`: Token no proporcionado
- `403 Forbidden`: Token inválido o expirado

---

### `POST /presentaciones/generar`
**Generar presentación con IA (Groq)**

**Acceso:** Usuario autenticado

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "tema": "Blockchain y Criptomonedas",
  "numeroSlides": 10,
  "idioma": "Español",
  "detailLevel": "Medium",
  "estilo": "Professional",
  "plantilla": "software",
  "fuente": "roboto"
}
```

**Parámetros:**
- `tema` (string, requerido): Tema de la presentación (min: 3, max: 500 caracteres)
- `numeroSlides` (integer, requerido): Cantidad de slides (min: 3, max: 30)
- `idioma` (string, opcional): `"Español"` | `"English"` | `"French"` (default: `"Español"`)
- `detailLevel` (string, opcional): `"Brief"` | `"Medium"` | `"Detailed"` (default: `"Medium"`)
- `estilo` (string, opcional): `"Professional"` | `"Casual"` | `"Academic"` (o frontend: `"Default"` | `"Modern"` | `"Minimal"`)
- `plantilla` (string, opcional): `"default"` | `"modern"` | `"minimal"` | `"software"` | `"maquinaria"` | `"mecatronica"` | `"quimica"`
- `fuente` (string, opcional): `"calibri"` | `"arial"` | `"roboto"` | etc.

**Respuesta exitosa (201):**
```json
{
  "message": "Presentación generada exitosamente",
  "presentacion": {
    "id": 43,
    "usuario_id": 5,
    "tema": "Blockchain y Criptomonedas",
    "esquema_json": {
      "tema": "Blockchain y Criptomonedas",
      "slides": [
        {
          "titulo": "¿Qué es Blockchain?",
          "contenido": "Blockchain es una tecnología de registro distribuido...",
          "bullets": [
            "Definición de blockchain y su arquitectura descentralizada",
            "Características fundamentales: inmutabilidad y transparencia",
            "Diferencias entre blockchain pública y privada",
            "Casos de uso más allá de las criptomonedas"
          ]
        }
        // ... más slides
      ]
    },
    "idioma": "Español",
    "nivel_detalle": "Medium",
    "estilo_escritura": "Professional",
    "plantilla": "software",
    "fuente": "roboto",
    "estado": "borrador",
    "fecha_creacion": "2025-11-02T10:35:00.000Z"
  }
}
```

**Errores:**
- `400 Bad Request`: Parámetros inválidos o fuera de rango
- `503 Service Unavailable`: Groq API no disponible o `GROQ_API_KEY` no configurada
- `500 Internal Server Error`: Error al procesar respuesta de Groq

---

### `POST /presentaciones/generar/export`
**Generar y exportar presentación en un solo paso**

**Acceso:** Usuario autenticado

**Descripción:** Genera el esquema con IA y exporta directamente a PPTX sin guardar en DB.

**Body:** Igual que `/presentaciones/generar`

**Respuesta exitosa (200):**
```
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
Content-Disposition: attachment; filename="Blockchain_y_Criptomonedas.pptx"

[Binary PPTX file]
```

**Uso desde frontend:**
```javascript
const response = await axios.post('/presentaciones/generar/export', {
  tema: 'Blockchain y Criptomonedas',
  numeroSlides: 10,
  idioma: 'Español',
  detailLevel: 'Medium',
  estilo: 'Professional'
}, {
  headers: { Authorization: `Bearer ${token}` },
  responseType: 'blob'
});

// Descargar archivo
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', 'presentacion.pptx');
document.body.appendChild(link);
link.click();
link.remove();
```

---

### `GET /presentaciones/mias`
**Listar mis presentaciones**

**Acceso:** Usuario autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Query params (opcionales):**
- `page` (integer): Número de página (default: 1)
- `limit` (integer): Resultados por página (default: 10, max: 50)
- `estado` (string): Filtrar por estado (`"borrador"` | `"finalizada"` | `"compartida"`)
- `search` (string): Buscar en tema (búsqueda parcial, case-insensitive)

**Ejemplo:**
```
GET /presentaciones/mias?page=1&limit=20&estado=finalizada&search=inteligencia
```

**Respuesta exitosa (200):**
```json
{
  "presentaciones": [
    {
      "id": 43,
      "tema": "Inteligencia Artificial en la Educación",
      "idioma": "Español",
      "nivel_detalle": "Medium",
      "estilo_escritura": "Professional",
      "plantilla": "default",
      "estado": "finalizada",
      "fecha_creacion": "2025-11-01T14:20:00.000Z",
      "fecha_modificacion": "2025-11-01T15:30:00.000Z",
      "vistas": 15,
      "compartida": true,
      "enlace_publico": "abc123def456"
    }
    // ... más presentaciones
  ],
  "paginacion": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### `GET /presentaciones/:id`
**Obtener detalle de presentación**

**Acceso:** Usuario autenticado (solo propietario, admin o soporte)

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "id": 43,
  "usuario_id": 5,
  "tema": "Blockchain y Criptomonedas",
  "esquema_json": {
    "tema": "Blockchain y Criptomonedas",
    "slides": [ ... ]
  },
  "idioma": "Español",
  "nivel_detalle": "Medium",
  "estilo_escritura": "Professional",
  "plantilla": "software",
  "fuente": "roboto",
  "estado": "finalizada",
  "fecha_creacion": "2025-11-02T10:35:00.000Z",
  "fecha_modificacion": "2025-11-02T11:00:00.000Z",
  "vistas": 8,
  "compartida": false,
  "enlace_publico": null,
  "imagenes": [
    {
      "id": 101,
      "slide_numero": 1,
      "url_imagen": "/images/slides/slide_43_1.jpg",
      "modelo_ia": "gemini-2.0-flash-preview-image-generation",
      "fecha_generacion": "2025-11-02T10:40:00.000Z"
    }
  ]
}
```

**Errores:**
- `404 Not Found`: Presentación no existe
- `403 Forbidden`: Usuario no tiene permiso (no es propietario ni admin/soporte)

---

### `PUT /presentaciones/:id`
**Actualizar presentación**

**Acceso:** Usuario autenticado (solo propietario o admin)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (todos opcionales):**
```json
{
  "tema": "Nuevo título actualizado",
  "esquema_json": { ... },
  "plantilla": "modern",
  "fuente": "arial",
  "estado": "finalizada"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Presentación actualizada exitosamente",
  "presentacion": { ... }
}
```

---

### `DELETE /presentaciones/:id`
**Eliminar presentación**

**Acceso:** Usuario autenticado (solo propietario, admin o soporte)

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "message": "Presentación eliminada exitosamente"
}
```

**Nota:** Elimina en cascada todas las imágenes asociadas.

---

### `GET /presentaciones/:id/export`
**Exportar presentación a PPTX**

**Acceso:** Usuario autenticado (propietario, admin o soporte)

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
Content-Disposition: attachment; filename="Blockchain_y_Criptomonedas.pptx"

[Binary PPTX file]
```

**Descripción:** Genera un archivo PowerPoint con:
- Plantilla visual aplicada según `plantilla`
- Fuente personalizada según `fuente`
- Todas las slides del `esquema_json`
- Imágenes insertadas si existen en la tabla `imagenes`
- Formato 16:9 profesional

---

### `POST /presentaciones/:id/share`
**Compartir presentación públicamente**

**Acceso:** Usuario autenticado (solo propietario)

**Headers:**
```
Authorization: Bearer <token>
```

**Descripción:** Genera un enlace público para descargar la presentación sin autenticación.

**Respuesta exitosa (200):**
```json
{
  "message": "Presentación compartida exitosamente",
  "enlace_publico": "https://api.teccreate.edu/presentaciones/shared/abc123def456",
  "codigo_qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**El frontend puede:**
- Mostrar el enlace para copiar
- Mostrar el QR para escanear
- Permitir descargar la imagen del QR

---

### `POST /presentaciones/:id/imagenes`
**Generar imágenes para slides con Gemini**

**Acceso:** Usuario autenticado (solo propietario o admin)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (opcional):**
```json
{
  "slides": [1, 3, 5]  // Generar solo para estas slides (opcional, por defecto: todas)
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Imágenes generadas exitosamente",
  "imagenes": [
    {
      "slide_numero": 1,
      "url_imagen": "/images/slides/slide_43_1.jpg",
      "modelo_ia": "gemini-2.0-flash-preview-image-generation"
    },
    {
      "slide_numero": 3,
      "url_imagen": "/images/slides/slide_43_3.jpg",
      "modelo_ia": "gemini-2.5-flash-image"  // Usó fallback
    }
  ],
  "errores": []  // Slides que fallaron (si alguna)
}
```

**Descripción:**
- Lee el contenido de cada slide del `esquema_json`
- Construye prompts optimizados según el estilo
- Llama a Gemini API para generar cada imagen
- Guarda imágenes en `public/images/slides/`
- Registra en tabla `imagenes` con URL y modelo usado
- Sistema de fallback automático si el modelo principal falla

**Errores:**
- `503 Service Unavailable`: Gemini API no disponible o sin `GEMINI_API_KEY`
- `404 Not Found`: Presentación no existe

---

## 👨‍💼 Endpoints de Administración

### `GET /admin/dashboard/resumen`
**Obtener métricas del dashboard**

**Acceso:** Solo admin

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "usuarios": {
    "total": 47,
    "activos": 42,
    "suspendidos": 3,
    "inactivos": 2,
    "nuevos_mes": 8
  },
  "presentaciones": {
    "total": 324,
    "mes_actual": 45,
    "compartidas": 89,
    "por_estado": {
      "borrador": 120,
      "finalizada": 180,
      "compartida": 24
    }
  },
  "actividad": {
    "sesiones_activas": 15,
    "presentaciones_hoy": 12,
    "exportaciones_semana": 67
  },
  "tendencias": {
    "temas_populares": [
      { "tema": "Inteligencia Artificial", "count": 23 },
      { "tema": "Blockchain", "count": 18 }
    ],
    "plantillas_mas_usadas": [
      { "plantilla": "software", "count": 145 },
      { "plantilla": "default", "count": 98 }
    ]
  }
}
```

---

### `GET /admin/usuarios`
**Listar todos los usuarios**

**Acceso:** Solo admin

**Query params:**
- `page`, `limit`: Paginación
- `rol`: Filtrar por rol (`usuario` | `admin` | `soporte`)
- `estado`: Filtrar por estado (`activo` | `suspendido` | `inactivo`)
- `search`: Buscar por nombre o email

**Respuesta exitosa (200):**
```json
{
  "usuarios": [
    {
      "id": 5,
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan.perez@tecsup.edu.pe",
      "rol": "usuario",
      "estado": "activo",
      "fecha_registro": "2025-09-15T08:00:00.000Z",
      "ultimo_acceso": "2025-11-02T09:30:00.000Z",
      "total_presentaciones": 12
    }
  ],
  "paginacion": { ... }
}
```

---

### `PATCH /admin/usuarios/:id`
**Actualizar usuario (cambiar rol o estado)**

**Acceso:** Solo admin

**Body:**
```json
{
  "rol": "admin",
  "estado": "activo"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Usuario actualizado exitosamente",
  "usuario": { ... }
}
```

---

### `GET /admin/presentaciones`
**Listar todas las presentaciones (todos los usuarios)**

**Acceso:** Solo admin o soporte

**Query params:** Igual que `/presentaciones/mias` + `usuario_id`

---

## 🛠️ Endpoints de Reportes y Soporte

### `POST /reportes`
**Crear reporte de soporte**

**Acceso:** Usuario autenticado

**Body:**
```json
{
  "asunto": "Error al exportar presentación",
  "descripcion": "Al intentar exportar mi presentación #43, obtengo un error 500",
  "prioridad": "media",
  "categoria": "tecnico"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Reporte creado exitosamente",
  "reporte": {
    "id": 15,
    "usuario_id": 5,
    "asunto": "Error al exportar presentación",
    "descripcion": "...",
    "estado": "abierto",
    "prioridad": "media",
    "categoria": "tecnico",
    "fecha_creacion": "2025-11-02T11:00:00.000Z"
  }
}
```

---

### `GET /reportes`
**Listar reportes**

**Acceso:** 
- Usuario: Solo sus propios reportes
- Admin/Soporte: Todos los reportes

**Query params:**
- `estado`: `abierto` | `en_proceso` | `resuelto` | `cerrado`
- `prioridad`: `baja` | `media` | `alta` | `critica`
- `categoria`: `tecnico` | `funcional` | `sugerencia`

---

### `PATCH /reportes/:id`
**Actualizar reporte**

**Acceso:** Admin o soporte

**Body:**
```json
{
  "estado": "resuelto",
  "respuesta": "El problema ha sido solucionado en la última actualización."
}
```

---

### `PATCH /soporte/mantenimiento`
**Activar/desactivar modo mantenimiento**

**Acceso:** Solo soporte (con `MAINTENANCE_GATE_SECRET`)

**Body:**
```json
{
  "activo": true,
  "mensaje": "Sistema en mantenimiento. Volveremos pronto.",
  "secret": "valor-de-MAINTENANCE_GATE_SECRET"
}
```

**Efecto:** Bloquea acceso a usuarios regulares (solo admin y soporte pueden acceder)

---

### `GET /healthz`
**Health check**

**Acceso:** Público

**Respuesta exitosa (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T11:30:00.000Z",
  "uptime": 3600.45,
  "database": "connected",
  "memory": {
    "used": "256 MB",
    "total": "512 MB"
  }
}
```

**Uso:** Orquestadores (Docker, Kubernetes, DigitalOcean) lo usan para verificar que el servidor está vivo.

---

## 🤖 Servicio Groq (Texto)

### Configuración

**Archivo:** `services/groqService.js`

**Modelo por defecto:** `llama3-70b-8192`

**Características:**
- 70 mil millones de parámetros
- Contexto de 8,192 tokens
- Velocidad ultrarrápida (inferencia en ms)
- Soporta múltiples idiomas

### Construcción de Prompts

```javascript
function construirPrompt(tema, idioma, numeroSlides, detailLevel, estilo) {
  const detallesNivel = {
    'Brief': '3 bullets por slide (8-12 palabras cada uno), 2 oraciones descriptivas',
    'Medium': '4 bullets por slide (10-18 palabras cada uno), 3 oraciones descriptivas',
    'Detailed': '5 bullets por slide (15-25 palabras cada uno), 4 oraciones descriptivas'
  };

  const estilosPrompt = {
    'Professional': 'Usa lenguaje corporativo, datos precisos, métricas y KPIs. Incluye casos de estudio empresariales.',
    'Casual': 'Usa lenguaje cotidiano, analogías simples, tono conversacional y ejemplos del día a día.',
    'Academic': 'Usa terminología científica, análisis crítico, teorías y estudios de investigación.'
  };

  return `Eres un experto en crear presentaciones educativas profesionales.

Tema: "${tema}"
Idioma: ${idioma}
Número de slides: ${numeroSlides}
Nivel de detalle: ${detailLevel} - ${detallesNivel[detailLevel]}
Estilo: ${estilo} - ${estilosPrompt[estilo]}

Genera una presentación completa siguiendo EXACTAMENTE este formato JSON:

{
  "tema": "${tema}",
  "slides": [
    {
      "titulo": "Título conciso y atractivo",
      "contenido": "Descripción detallada en ${detallesNivel[detailLevel].split(',')[1]}",
      "bullets": ["Bullet point 1", "Bullet point 2", ...]
    }
  ]
}

REQUISITOS IMPORTANTES:
1. PRIMERA SLIDE: Debe ser portada con título principal y subtítulo descriptivo
2. ÚLTIMA SLIDE: Debe ser de conclusiones o cierre
3. Cada bullet debe ser informativo y específico al tema
4. El contenido debe ser coherente y educativo
5. Responde SOLO con el JSON, sin texto adicional
6. Asegura que el JSON sea válido (comillas dobles, comas correctas)`;
}
```

### Manejo de Respuestas

```javascript
async function generarEsquema(tema, opciones) {
  try {
    const prompt = construirPrompt(tema, opciones.idioma, opciones.numeroSlides, 
                                   opciones.detailLevel, opciones.estilo);
    
    const response = await groqClient.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096
    });

    const contenido = response.choices[0].message.content.trim();
    
    // Limpiar respuesta (remover markdown, backticks, etc.)
    const jsonLimpio = contenido
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const esquema = JSON.parse(jsonLimpio);
    
    // Validar estructura
    if (!esquema.slides || !Array.isArray(esquema.slides)) {
      throw new Error('Respuesta de Groq no tiene formato válido');
    }

    return esquema;
  } catch (error) {
    console.error('Error en Groq:', error);
    throw new Error('No se pudo generar el esquema de presentación');
  }
}
```

---

## 🎨 Servicio Gemini (Imágenes)

### Configuración

**Archivo:** `services/geminiService.js`

**Modelos:**
- Principal: `gemini-2.0-flash-preview-image-generation`
- Fallback: `gemini-2.5-flash-image`

### Sistema de Fallback Automático

```javascript
async function generarImagen(prompt, slideNumero, presentacionId) {
  let modelo = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';
  
  try {
    return await intentarGenerarConModelo(modelo, prompt, slideNumero, presentacionId);
  } catch (error) {
    // Detectar si debe usar fallback
    if (debeUsarFallback(error)) {
      console.warn(`[Gemini] Modelo ${modelo} falló, usando fallback`);
      modelo = process.env.GEMINI_IMAGE_MODEL_FALLBACK || 'gemini-2.5-flash-image';
      return await intentarGenerarConModelo(modelo, prompt, slideNumero, presentacionId);
    }
    throw error;
  }
}

function debeUsarFallback(error) {
  const status = error.status || error.response?.status;
  const message = error.message?.toLowerCase() || '';
  
  return (
    [400, 403, 404].includes(status) ||
    message.includes('not found') ||
    message.includes('unsupported') ||
    message.includes('deprecated')
  );
}
```

### Optimización de Prompts

```javascript
function construirPromptImagen(contenidoSlide, estilo, idioma) {
  const estilosVisuales = {
    'Professional': 'fotorealista, corporativo, limpio, profesional, iluminación suave, alta calidad, 4K',
    'Casual': 'ilustración moderna, colores vibrantes, estilo flat design, friendly, accesible',
    'Academic': 'diagrama técnico preciso, científico, educativo, esquemático, colores académicos'
  };

  const instruccionesIdioma = {
    'Español': 'sin texto en español',
    'English': 'no text in english',
    'French': 'sans texte en français'
  };

  return `Generate a high-quality ${estilosVisuales[estilo]} image representing: "${contenidoSlide}". 
  16:9 aspect ratio, ${instruccionesIdioma[idioma]}, no watermarks, professional composition.`;
}
```

### Procesamiento y Almacenamiento

```javascript
async function guardarImagen(base64Data, presentacionId, slideNumero) {
  const buffer = Buffer.from(base64Data, 'base64');
  const extension = 'jpg';  // Gemini retorna JPEG por defecto
  const filename = `slide_${presentacionId}_${slideNumero}.${extension}`;
  const filepath = path.join(__dirname, '../public/images/slides', filename);

  // Optimizar imagen con sharp
  await sharp(buffer)
    .resize(1920, 1080, { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toFile(filepath);

  return `/images/slides/${filename}`;
}
```

---

## 📝 Generación de Presentaciones (Flujo Completo)

### 1. Usuario solicita generación

```javascript
// Frontend
const response = await axios.post('/presentaciones/generar', {
  tema: 'Machine Learning en Medicina',
  numeroSlides: 12,
  idioma: 'Español',
  detailLevel: 'Detailed',
  estilo: 'Academic',
  plantilla: 'software',
  fuente: 'roboto'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 2. Backend orquesta el flujo

```javascript
// presentacionesController.js
async function generar(req, res) {
  try {
    // 1. Validar parámetros
    const { tema, numeroSlides, idioma, detailLevel, estilo, plantilla, fuente } = req.body;
    
    // 2. Generar esquema con Groq
    const esquema = await groqService.generarEsquema(tema, {
      numeroSlides,
      idioma: idioma || 'Español',
      detailLevel: detailLevel || 'Medium',
      estilo: estilo || 'Professional'
    });

    // 3. Guardar en base de datos
    const result = await pool.query(
      `INSERT INTO presentaciones 
       (usuario_id, tema, esquema_json, idioma, nivel_detalle, estilo_escritura, plantilla, fuente, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'borrador')
       RETURNING *`,
      [req.usuario.usuario_id, tema, JSON.stringify(esquema), idioma, detailLevel, estilo, plantilla, fuente]
    );

    const presentacion = result.rows[0];

    res.status(201).json({
      message: 'Presentación generada exitosamente',
      presentacion
    });
  } catch (error) {
    console.error('Error al generar presentación:', error);
    res.status(500).json({ error: 'No se pudo generar la presentación' });
  }
}
```

### 3. Usuario solicita imágenes (opcional)

```javascript
// Frontend
await axios.post(`/presentaciones/${presentacionId}/imagenes`, {}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 4. Backend genera imágenes

```javascript
// presentacionesController.js
async function generarImagenes(req, res) {
  const { id } = req.params;
  
  // Obtener presentación
  const presentacion = await obtenerPresentacion(id);
  const { esquema_json, estilo_escritura, idioma } = presentacion;

  const imagenes = [];
  const errores = [];

  // Generar imagen para cada slide
  for (let i = 0; i < esquema_json.slides.length; i++) {
    try {
      const slide = esquema_json.slides[i];
      const prompt = construirPromptImagen(slide.contenido, estilo_escritura, idioma);
      
      const urlImagen = await geminiService.generarImagen(prompt, i + 1, id);
      
      // Guardar en DB
      await pool.query(
        'INSERT INTO imagenes (presentacion_id, slide_numero, prompt, url_imagen, modelo_ia) VALUES ($1, $2, $3, $4, $5)',
        [id, i + 1, prompt, urlImagen, 'gemini-2.0-flash-preview-image-generation']
      );

      imagenes.push({ slide_numero: i + 1, url_imagen: urlImagen });
    } catch (error) {
      errores.push({ slide_numero: i + 1, error: error.message });
    }
  }

  res.json({ message: 'Imágenes generadas', imagenes, errores });
}
```

### 5. Usuario exporta a PPTX

```javascript
// Frontend
const response = await axios.get(`/presentaciones/${id}/export`, {
  headers: { Authorization: `Bearer ${token}` },
  responseType: 'blob'
});

const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.download = 'presentacion.pptx';
link.click();
```

### 6. Backend genera PPTX

```javascript
// pptService.js
async function generarPresentacion(presentacion, imagenes) {
  const pptx = new PptxGenJS();
  
  // Aplicar plantilla
  const tema = pptThemes[presentacion.plantilla] || pptThemes.default;
  
  // Slide de portada
  const portada = pptx.addSlide();
  portada.background = { color: tema.background };
  portada.addText(presentacion.tema, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: tema.titleColor,
    align: 'center',
    fontFace: presentacion.fuente || 'Calibri'
  });

  // Slides de contenido
  presentacion.esquema_json.slides.forEach((slide, index) => {
    const pptSlide = pptx.addSlide();
    pptSlide.background = { color: tema.background };

    // Título
    pptSlide.addText(slide.titulo, {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 32,
      bold: true,
      color: tema.titleColor,
      fontFace: presentacion.fuente
    });

    // Bullets
    pptSlide.addText(slide.bullets.map(b => ({ text: b, options: { bullet: true } })), {
      x: 0.5, y: 1.5, w: 5.5, h: 4,
      fontSize: 18,
      color: tema.textColor,
      fontFace: presentacion.fuente
    });

    // Imagen (si existe)
    const imagen = imagenes.find(img => img.slide_numero === index + 1);
    if (imagen) {
      pptSlide.addImage({
        path: path.join(__dirname, '../public', imagen.url_imagen),
        x: 6.5, y: 1.5, w: 3, h: 4
      });
    }
  });

  // Generar archivo
  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  return buffer;
}
```

---

## 🔐 Sistema de Roles

### Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **usuario** | Profesor o estudiante regular | Crear/editar/eliminar sus propias presentaciones, ver dashboard personal, crear reportes |
| **admin** | Coordinador o director | Todo lo de usuario + gestionar usuarios, ver dashboard global, acceder a todas las presentaciones, gestionar reportes |
| **soporte** | Equipo técnico | Todo lo de admin + activar modo mantenimiento, ver logs del sistema, gestionar infraestructura |

### Middleware de Autorización

```javascript
// roleMiddleware.js
function verificarRol(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        error: 'Sin permisos',
        requiere: rolesPermitidos,
        tienes: req.usuario.rol
      });
    }

    next();
  };
}

// Exportar helpers
module.exports = {
  verificarRol,
  soloAdmin: verificarRol(['admin']),
  soloSoporte: verificarRol(['soporte']),
  adminOSoporte: verificarRol(['admin', 'soporte']),
  todos: verificarRol(['usuario', 'admin', 'soporte'])
};
```

### Uso en Rutas

```javascript
const { verificarToken } = require('../middlewares/authMiddleware');
const { soloAdmin, adminOSoporte } = require('../middlewares/roleMiddleware');

// Solo admins
router.get('/admin/usuarios', verificarToken, soloAdmin, adminController.listarUsuarios);

// Admins y soporte
router.get('/admin/presentaciones', verificarToken, adminOSoporte, adminController.listarTodasPresentaciones);

// Todos los usuarios autenticados
router.get('/presentaciones/mias', verificarToken, presentacionesController.listarMias);
```

---

## 🔧 Solución de Problemas Detallada

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

## Buenas prácticas aplicadas en este repo

- Nunca versionar archivos con secretos (usa `.env` y `.env.example`).
- Añadimos `.gitignore` para evitar subir `node_modules`, certificados, logs y archivos temporales.
- Documentamos variables de entorno en `.env.example` para facilitar deploys reproducibles.
- Se creó una rama `cleanup/remove-tests` con artefactos locales de prueba removidos. Mantén las ramas de limpieza y revisiones antes de merge.
- El servidor hace un `waitForDb()` al arrancar para evitar fallos por dependencias no listas.

Si quieres que habilite linting automático (ESLint) o un workflow de CI (GitHub Actions) para checks automáticos, dímelo y lo preparo: añadiré la configuración y los scripts (requiere instalar dependencias o crear el workflow). 

## Cambios recientes (limpieza y organización)

Actualizado el repositorio para aplicar buenas prácticas y limpiar artefactos locales. Resumen de los cambios aplicados y dónde encontrarlos:

- Archivos de prueba locales eliminados de la raíz y `scripts/`: `test-*.js`, `Untitled-1.html` y varios scripts de test se eliminaron porque no forman parte del backend en producción.
- Scripts utilitarios movidos a `scripts/` desde la raíz: `create-groq-service.js`, `check-admin.js`, `check-presentaciones.js`, `check-usuarios.js`.
- Backups/ variantes de `groqService` archivadas en `archive/cleanup-20251102/` como marcadores (placeholders):
  - `archive/cleanup-20251102/services_groqService-corrupted.js`
  - `archive/cleanup-20251102/services_groqService-clean.js`
  - `archive/cleanup-20251102/services_groqService.js.backup.txt`
  El contenido original queda en el historial de Git si necesitas recuperarlo. Los placeholders evitan que esos archivos sean ejecutables por accidente.
- Añadido `.env.example` con las variables necesarias y un `.gitignore` mejorado.
- Pequeñas mejoras en `package.json` (scripts) y en el README con instrucciones operativas.
- Rama de trabajo: los cambios se hicieron en la rama `cleanup/remove-tests` y luego se fusionaron a `main`.

Estos cambios se aplicaron para dejar el árbol del proyecto más limpio y facilitar el mantenimiento. Si prefieres que borre completamente los backups (en vez de archivarlos), puedo hacerlo (ten en cuenta que la eliminación permanente sólo se recupera mediante el historial de Git).

### Cómo restaurar archivos archivados

Si necesitas recuperar el contenido original de cualquiera de los archivos archivados, puedes:

1. Buscar en el historial de Git (ej.: `git log -- services/groqService-corrupted.js` o `git checkout <commit> -- path/to/file`).
2. O recuperar el placeholder desde `archive/cleanup-20251102/` y reemplazar manualmente en `services/`.

## Cómo verificar localmente después de la limpieza (smoke test)

1. Asegúrate de tener un `.env` con variables mínimas: `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `CLIENT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (o usa variables de prueba locales). Usa `.env.example` como guía.
2. Instala dependencias e inicia el servidor:

```powershell
npm install
npm run start
```

3. En otra terminal, comprueba el endpoint de salud:

```powershell
curl http://localhost:8080/healthz
```

Si el proyecto está configurado con otro `PORT`, sustituye `8080` por el puerto correcto (o consulta `PORT` en tu `.env`).

Si el servidor no arranca, revisa los logs; los problemas más comunes son variables de entorno faltantes o errores de conexión a la base de datos (TLS/CA). En caso de error TLS con Postgres, revisa la sección de `DATABASE_SSL_CA_B64` más abajo.

## Puntos de atención / recomendaciones tras la limpieza

- Sustituir cualquier uso temporal de `DATABASE_SSL_ALLOW_SELF_SIGNED=true` por `DATABASE_SSL_CA_B64` (configura la CA real en DigitalOcean u otro proveedor).
- Evitar usar `MemoryStore` de `express-session` en producción: configura `REDIS_URL` y provee `connect-redis`/`ioredis` si vas a ejecutar múltiples instancias.
- Añadir ESLint + Prettier y un workflow de CI para automatizar checks (puedo preparar los archivos de configuración y el workflow en un commit separado).
- Mantener un procedimiento de backups fuera del repositorio para CA PEMs o certificados; no versionar certificados reales.

## Siguientes pasos recomendados

1. Ejecutar un smoke test en tu entorno local o staging.
2. Reemplazar el override inseguro TLS por `DATABASE_SSL_CA_B64` en producción.
3. Opcional: configurar ESLint y un workflow de CI (te puedo dejar el PR listo).


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
ADMIN_EMAILS=coordinador@tecsup.edu.pe,director@tecsup.edu.pe,soporte@tecsup.edu.pe

GOOGLE_CLIENT_ID=<client_id>
GOOGLE_CLIENT_SECRET=<client_secret>
GOOGLE_CALLBACK_URL=https://<tu-backend>/auth/google/callback

GROQ_API_KEY=<opcional>
GEMINI_API_KEY=<tu_gemini_api_key>
GEMINI_IMAGE_MODEL=gemini-2.0-flash-preview-image-generation
GEMINI_IMAGE_MODEL_FALLBACK=gemini-2.5-flash-image
MAINTENANCE_GATE_SECRET=<opcional>
SUPPORT_EMAIL=soporte@tu-dominio.com
DATABASE_SSL_CA_B64=<opcional: PEM del CA codificado en base64, preferido en entornos cloud>
REDIS_URL=redis://:<password>@<host>:<port>  # opcional, recomendado para sesiones en producción
```

**Notas importantes:**
- Ajusta `PGPOOL_MAX` según el límite de conexiones de tu Postgres (planes pequeños: 2–5).
- `ALLOWED_ORIGINS` controla qué dominios pueden consumir el backend.
- `GEMINI_API_KEY`: Obtén tu clave en [Google AI Studio](https://aistudio.google.com/apikey). **IMPORTANTE: Nunca compartas ni subas esta clave al repositorio.**
- `GEMINI_IMAGE_MODEL` define el modelo principal para generar imágenes (por defecto: `gemini-2.0-flash-preview-image-generation` con límites de **1K RPM, 1M TPM, 10K RPD**).
- `GEMINI_IMAGE_MODEL_FALLBACK` define el modelo de respaldo que se usa automáticamente si el principal falla (por defecto: `gemini-2.5-flash-image`). El sistema cambia automáticamente al fallback si detecta errores 400, 403, 404 o mensajes "not found", "unsupported", "deprecated".
- Todos los secretos (JWT, sesión, OAuth, Groq, Gemini) deben generarse en tus propias cuentas; **nunca compartas ni subas los valores reales al repositorio**.

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

### 2A. Despliegue con proveedor (Blueprint opcional)

1. **Verificar `render.yaml`** (opcional): si tu proveedor soporta blueprints/manifests, confirma que el archivo esté en la raíz y contenga el servicio web y la base de datos.
2. **Crear Blueprint / Conectar repo** en tu proveedor de hosting:
  - Conecta el repositorio y aplica el manifest (si aplica).
  - El proveedor detectará `render.yaml` y sugerirá recursos si soporta este método.
3. **Revisar variables de entorno**:
  - El panel de tu proveedor mostrará las variables que debes completar manualmente (CLIENT_URL, OAuth, IA, etc.).
  - Usa cualquier herramienta del proveedor para generar `SESSION_SECRET` y `JWT_SECRET` o pega valores propios.
4. **Deploy**: el proveedor instalará dependencias y ejecutará `npm run start` (definido en el blueprint o manifest).
5. **Probar salud**:
  ```bash
  curl https://<tu-servicio>/healthz
  ```
6. **Configurar dominio personalizado** (opcional): actualiza `PUBLIC_BASE_URL` y agrega el dominio a `ALLOWED_ORIGINS`.
7. **Supervisar logs**: en el panel de tu proveedor revisa que Express se levantó y la conexión a Postgres fue exitosa.

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

### Blueprint (opcional)

1. Asegúrate de que `render.yaml` esté en la raíz.
2. En Render → Deploy → New Blueprint → selecciona el repo.
3. Render creará:
   - Servicio web Node con comando `npm run start`.
   - Base de datos Postgres (plan free) si la plantilla lo especifica.
4. Completa las variables marcadas con `sync: false` (CLIENT_URL, OAuth, IA, etc.).
5. El proveedor puede generar `SESSION_SECRET` y `JWT_SECRET` (usa la opción "Generate").
6. Tras el deploy, visita `https://<servicio>/healthz`.
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

### Modelos de IA

- **Groq** (`GROQ_API_KEY`): genera el contenido textual de las slides con modelos como `llama3-70b-8192`.
- **Gemini** (`GEMINI_API_KEY` + `GEMINI_IMAGE_MODEL` + `GEMINI_IMAGE_MODEL_FALLBACK`): crea imágenes temáticas opcionales para cada diapositiva.
  - **Modelo principal**: configurado en `GEMINI_IMAGE_MODEL` (por defecto: `gemini-2.0-flash-preview-image-generation`)
    - **Límites**: 1,000 RPM | 1M TPM | 10,000 RPD (nivel de pago 1)
  - **Modelo de respaldo**: configurado en `GEMINI_IMAGE_MODEL_FALLBACK` (por defecto: `gemini-2.5-flash-image`)
    - Se activa automáticamente si el modelo principal falla
  - **Sistema de fallback automático**: 
    - Detecta errores 400, 403, 404 y mensajes como "not found", "unsupported", "deprecated"
    - Cambia automáticamente al modelo de respaldo sin intervención manual
    - Si ambos modelos fallan, devuelve un error descriptivo
  - **Endpoint**: usa `:generateContent` (no `:generateImage`)
  - **Request body**: incluye `responseModalities: ['TEXT', 'IMAGE']`
  - **Response**: imagen en `candidates[].content.parts[].inlineData.data`
  - **pptxgenjs**: arma el archivo PPTX usando plantillas temáticas (`lib/pptThemes.js`) y fuentes personalizadas (`lib/pptFonts.js`).
- **Degradación elegante**: si no hay claves configuradas o ningún modelo está disponible, el backend funciona sin imágenes generadas (se crean esquemas básicos con texto únicamente).

### Idiomas soportados

El sistema soporta **3 idiomas** validados y normalizados automáticamente:

- **Español** (por defecto)
- **English**
- **French**

Para usar un idioma específico, envía el parámetro `idioma` en tus peticiones:

```json
{
  "tema": "Inteligencia Artificial",
  "idioma": "English",
  "numeroSlides": 8
}
```

Si se envía un idioma no soportado, el sistema usará automáticamente Español.

### Niveles de detalle

El sistema ofrece **3 niveles de detalle** para controlar la profundidad del contenido generado:

- **Brief**: Presentación concisa y directa
  - 3 bullets por slide (8-12 palabras cada uno)
  - 2 oraciones en el contenido descriptivo
  - Ideal para: resúmenes ejecutivos, pitch decks, presentaciones rápidas

- **Medium** (por defecto): Equilibrio profesional
  - 4 bullets por slide (10-18 palabras cada uno)
  - 3 oraciones en el contenido descriptivo
  - Ideal para: presentaciones corporativas, clases estándar, informes

- **Detailed**: Exhaustivo y profundo
  - 5 bullets por slide (15-25 palabras cada uno)
  - 4 oraciones en el contenido descriptivo
  - Ideal para: documentación técnica, capacitaciones extensas, investigación

Ejemplo de uso:

```json
{
  "tema": "Arquitectura de Microservicios",
  "idioma": "Español",
  "detailLevel": "Detailed",
  "numeroSlides": 10
}
```

### Estilos de escritura

El sistema soporta **3 estilos de escritura** que controlan el tono y vocabulario del contenido generado.

**Puedes usar los nombres del frontend o los nombres técnicos:**

| **Frontend** | **Backend** | **Descripción** |
|-------------|------------|----------------|
| `Default` | `Professional` | Tono formal y técnico con terminología corporativa |
| `Modern` | `Casual` | Tono conversacional y accesible con lenguaje cotidiano |
| `Minimal` | `Academic` | Tono riguroso y analítico con terminología científica |

**Características de cada estilo:**

- **Professional (Default)**: 
  - Lenguaje corporativo con datos precisos, métricas y KPIs
  - Casos de estudio empresariales y estadísticas verificables
  - Ideal para: presentaciones ejecutivas, informes corporativos, propuestas de negocio

- **Casual (Modern)**: 
  - Lenguaje cotidiano con analogías simples y tono cercano
  - Ejemplos del día a día y metáforas familiares
  - Ideal para: talleres, presentaciones educativas, onboarding

- **Academic (Minimal)**: 
  - Terminología científica con análisis crítico y argumentación fundamentada
  - Teorías, modelos y estudios de investigación
  - Ideal para: tesis, papers, conferencias académicas, capacitaciones técnicas

Ejemplo de uso:

```json
{
  "tema": "Machine Learning Basics",
  "idioma": "English",
  "detailLevel": "Medium",
  "estilo": "Default",
  "numeroSlides": 12
}
```

O con el nombre técnico:

```json
{
  "tema": "Machine Learning Basics",
  "idioma": "English",
  "detailLevel": "Medium",
  "estilo": "Professional",
  "numeroSlides": 12
}
```

### Plantillas visuales (Temas de carrera)

El sistema incluye **7 plantillas visuales**:

**Estilos básicos:**
- **default**: TecCreate Clásico - Paleta corporativa con azules brillantes
- **modern**: Moderno - Diseño contemporáneo con gradientes suaves
- **minimal**: Minimalista - Diseño limpio y elegante

**Temas de carrera:**
- **software**: Diseño y Desarrollo de Software - UI modernas con azul eléctrico y acentos violetas
- **maquinaria**: Gestión y Mantenimiento de Maquinaria - Colores industriales con amarillo maquinaria
- **mecatronica**: Mecatrónica Industrial - Azul cobalto y verde neón para look futurista
- **quimica**: Procesos Químicos y Metalúrgicos - Azul petróleo con acentos cobre

Ejemplo de uso:

```json
{
  "tema": "Industria 4.0",
  "plantilla": "mecatronica",
  "fuente": "roboto"
}
```

## Soporte y mantenimiento

- `POST /reportes`: usuarios envían incidencias.
- `GET /reportes`: soporte/admin las revisan.
- `PATCH /soporte/mantenimiento`: activar o desactivar modo mantenimiento (bloquea usuarios regulares).
- `GET /soporte/notificaciones`: alertas internas para el equipo de soporte.

## Salud, CORS y sesiones

- Healthcheck: `GET /healthz` → usado por orquestadores (DigitalOcean, otros).
- CORS: se valida contra `CLIENT_URL`, `PUBLIC_BASE_URL` y `ALLOWED_ORIGINS` (se normalizan URLs).
- Sesiones: `express-session` con cookies `httpOnly`, `secure` y `sameSite=none` en producción. Para múltiples instancias, considera Redis u otro store.
  - Para habilitar Redis como store en producción, define `REDIS_URL` en tu entorno (ej: `redis://:password@host:6379`). El backend usa `connect-redis`/`ioredis` si `REDIS_URL` está presente.
  - Si no puedes usar Redis inmediatamente, recuerda que `MemoryStore` es inseguro en prod y causa fugas de memoria en procesos de larga duración.

## Instrucciones rápidas para `DATABASE_SSL_CA_B64`

- Si tu proveedor (p. ej. DigitalOcean) requiere una CA para validar Postgres TLS, genera la variable `DATABASE_SSL_CA_B64` conteniendo el PEM del CA en base64. Esto evita problemas con saltos de línea en UIs de variables.
- PowerShell para generar base64 desde un archivo PEM:
  ```powershell
  $pem = Get-Content -Raw '.\ca-certificate.crt'
  $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pem))
  Write-Output $b64
  ```
  Pega el contenido resultante en la variable `DATABASE_SSL_CA_B64` en tu panel de despliegue.

---

## 🔧 Solución de Problemas Detallada

### Problemas de Base de Datos

#### `Error: too many connections`

**Causa:** PostgreSQL alcanzó el límite de conexiones simultáneas.

**Solución:**
```env
# 1. Reducir máximo de conexiones en pool
PGPOOL_MAX=3  # Para planes básicos (25 conexiones max)
```

```sql
-- 2. Ver conexiones actuales
SELECT count(*) FROM pg_stat_activity;

-- 3. Matar conexiones idle (si es necesario)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < NOW() - INTERVAL '10 minutes';
```

**Prevención:**
- Usa PgBouncer como connection pooler
- Upgrade a un plan con más conexiones
- Asegúrate de cerrar conexiones correctamente

---

#### `Error: self signed certificate`

**Causa:** PostgreSQL usa certificado autofirmado y `rejectUnauthorized` está en `true`.

**Solución temporal (solo desarrollo):**
```env
DATABASE_SSL_ALLOW_SELF_SIGNED=true
```

**Solución correcta (producción):**
```env
DATABASE_SSL_ALLOW_SELF_SIGNED=false
DATABASE_SSL_CA_B64=<certificado-CA-en-base64>
```

---

#### `Error: Connection timeout`

**Causa:** La base de datos no responde a tiempo.

**Solución:**
```env
# Aumentar timeout
PGPOOL_CONNECTION_TIMEOUT=10000  # 10 segundos
```

**Verificar conectividad:**
```bash
# Probar conexión manual
psql "postgresql://user:pass@host:5432/db"

# Verificar firewall/seguridad en proveedor cloud
# DigitalOcean: Trusted Sources debe incluir tu IP o 0.0.0.0/0
```

---

### Problemas de Autenticación

#### `Error: redirect_uri_mismatch`

**Causa:** La URI de callback no coincide con Google Cloud Console.

**Solución:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials → Tu OAuth Client
3. Authorized redirect URIs debe incluir **EXACTAMENTE**:
   ```
   https://api.teccreate.edu/auth/google/callback
   ```
4. Verifica que `GOOGLE_CALLBACK_URL` tenga el mismo valor

**⚠️ Atención:**
- No trailing slash: `❌ .../callback/` vs `✅ .../callback`
- Protocolo correcto: `https://` en producción
- Dominio exacto (sin www si no lo usas)

---

#### `Error: invalid_client`

**Causa:** `GOOGLE_CLIENT_ID` o `GOOGLE_CLIENT_SECRET` incorrectos.

**Solución:**
1. Verifica que copiaste correctamente las credenciales
2. Regenera las credenciales en Google Cloud si es necesario
3. Asegúrate de no tener espacios extras al pegar

---

#### `Error: Token inválido o expirado (403)`

**Causa:** El JWT del usuario expiró o es inválido.

**Solución (frontend):**
```javascript
// Interceptor de Axios para refrescar token
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      // Token expirado, redirigir a login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Configuración backend:**
```env
# Aumentar duración del token si es necesario
JWT_EXPIRES_IN=7d  # 7 días en lugar de 1d
```

---

#### `Error: Correo no autorizado`

**Causa:** El email del usuario no está en `ADMIN_EMAILS`.

**Solución:**
```env
# Agregar el correo a la whitelist
ADMIN_EMAILS=existente@instituto.edu,nuevo@instituto.edu,otro@instituto.edu
```

**Nota:** Reinicia el servidor después de cambiar `ADMIN_EMAILS`.

---

### Problemas de Servicios IA

#### `Error: 503 Service Unavailable (Groq)`

**Causa:** No se puede conectar a Groq API.

**Diagnóstico:**
```bash
# Verificar que la clave funciona
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

**Solución:**
1. Verifica que `GROQ_API_KEY` esté configurada
2. Verifica que la clave sea válida (no expirada)
3. Chequea límites de rate en [groq.com/console](https://groq.com/console)

**Degradación elegante:**
- El sistema permite crear presentaciones manualmente sin Groq
- Implementa un sistema de cola si tienes muchas peticiones simultáneas

---

#### `Error: Gemini API - Model not found`

**Causa:** El modelo especificado no existe o no está disponible.

**Solución:**
```env
# Usar modelos correctos
GEMINI_IMAGE_MODEL=gemini-2.0-flash-preview-image-generation
GEMINI_IMAGE_MODEL_FALLBACK=gemini-2.5-flash-image
```

**El sistema tiene fallback automático:**
- Si el modelo principal falla → usa el modelo de fallback
- Si ambos fallan → retorna error descriptivo

---

#### `Error: Rate limit exceeded (429)`

**Causa:** Superaste el límite de peticiones por minuto.

**Solución:**
```javascript
// Implementar cola con delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generarImagenesConCola(slides, presentacionId) {
  const imagenes = [];
  
  for (const [index, slide] of slides.entries()) {
    try {
      const imagen = await geminiService.generarImagen(slide.contenido, index + 1, presentacionId);
      imagenes.push(imagen);
      
      // Esperar 1 segundo entre peticiones
      await delay(1000);
    } catch (error) {
      console.error(`Error slide ${index + 1}:`, error);
    }
  }
  
  return imagenes;
}
```

---

### Problemas de CORS

#### `Error: CORS policy blocked`

**Causa:** El origen del frontend no está en `ALLOWED_ORIGINS`.

**Solución:**
```env
ALLOWED_ORIGINS=https://app.teccreate.edu,https://admin.teccreate.edu,http://localhost:5173
```

**Verificar configuración:**
```javascript
// En el navegador (consola)
fetch('https://api.teccreate.edu/healthz')
  .then(res => console.log('CORS OK'))
  .catch(err => console.error('CORS blocked:', err));
```

**Importante:**
- No trailing slashes en URLs
- Separar con comas SIN espacios
- Incluir protocolo completo (http:// o https://)

---

### Problemas de Exportación PPTX

#### `Error: Cannot find module 'pptxgenjs'`

**Causa:** Dependencia no instalada.

**Solución:**
```bash
npm install pptxgenjs
```

---

#### `Error: Invalid image path`

**Causa:** La imagen no existe en `public/images/slides/`.

**Solución:**
```javascript
// Verificar que la imagen existe antes de insertarla
const fs = require('fs');
const imagePath = path.join(__dirname, '../public', imagen.url_imagen);

if (fs.existsSync(imagePath)) {
  pptSlide.addImage({ path: imagePath, x, y, w, h });
} else {
  console.warn(`Imagen no encontrada: ${imagePath}`);
}
```

---

#### `Error: PPTX generado está corrupto`

**Causa:** Problema con fuentes o imágenes.

**Solución:**
1. Verifica que las fuentes estén disponibles
2. Asegura que las imágenes sean válidas (JPEG/PNG)
3. Prueba con plantilla básica:

```javascript
// Generar PPTX mínimo para debugging
const pptx = new PptxGenJS();
const slide = pptx.addSlide();
slide.addText('Test', { x: 1, y: 1, fontSize: 24 });
const buffer = await pptx.write({ outputType: 'nodebuffer' });
// Si esto funciona, el problema está en tus datos
```

---

### Problemas de Rendimiento

#### `Error: Memory limit exceeded`

**Causa:** Node.js se queda sin memoria (generando muchas imágenes o PPTX grandes).

**Solución:**
```bash
# Aumentar límite de memoria
node --max-old-space-size=4096 index.js  # 4GB
```

**En producción (DigitalOcean App Platform):**
```yaml
# .do/app.yaml
services:
  - name: backend
    instance_size_slug: professional-xs  # 1GB RAM
    # o
    instance_size_slug: professional-s   # 2GB RAM
```

---

#### `Error: Request timeout`

**Causa:** Generación de presentación tarda demasiado.

**Solución:**
```javascript
// En el frontend, aumentar timeout
axios.post('/presentaciones/generar', data, {
  headers: { Authorization: `Bearer ${token}` },
  timeout: 60000  // 60 segundos
});
```

**En Express (backend):**
```javascript
// Aumentar timeout global
app.use((req, res, next) => {
  req.setTimeout(120000);  // 2 minutos
  res.setTimeout(120000);
  next();
});
```

---

### Problemas de Deployment

#### `Error: Application failed to start (DigitalOcean)`

**Diagnóstico:**
1. Ve a **Logs** en el panel de DigitalOcean
2. Busca el error específico

**Errores comunes:**

**"Cannot find module 'X'"**
```bash
# Asegúrate de que package.json tiene todas las dependencias
npm install
git add package.json package-lock.json
git commit -m "fix: add missing dependencies"
git push
```

**"Port already in use"**
```env
# DigitalOcean usa PORT=8080 por defecto
# Asegúrate de usar process.env.PORT
PORT=8080
```

**"Database connection failed"**
```env
# Verifica DATABASE_URL y SSL settings
DATABASE_URL=postgresql://...
DATABASE_SSL=true
DATABASE_SSL_CA_B64=<base64-cert>
```

---

#### `Error: Build failed`

**Causa:** Error durante `npm install`.

**Solución:**
```json
// package.json - asegurar engines
{
  "engines": {
    "node": ">=18.17.0 <21"
  }
}
```

**Limpiar cache:**
```bash
# Localmente
rm -rf node_modules package-lock.json
npm install

# En DigitalOcean: forzar rebuild
# Settings → Force Rebuild and Deploy
```

---

### Logs y Debugging

#### Habilitar logs detallados

```env
# .env
LOG_LEVEL=debug  # trace | debug | info | warn | error
ENABLE_REQUEST_LOGGING=true
```

```javascript
// index.js - agregar logger de peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
```

---

#### Ver logs en producción

**DigitalOcean:**
```bash
# Desde el panel: Runtime Logs
# O con doctl CLI
doctl apps logs <app-id> --follow
```

**Render:**
```bash
# Desde el panel: Logs tab (auto-refresh)
```

**Servidor propio (PM2):**
```bash
pm2 logs teccreate-backend
pm2 logs teccreate-backend --lines 100
pm2 logs teccreate-backend --err  # Solo errores
```

---

## 🛠️ Scripts Útiles

El proyecto incluye varios scripts en `scripts/` para mantenimiento y debugging:

### `query-user.js`
**Consultar usuario por email**

```bash
node scripts/query-user.js profesor@instituto.edu
```

**Output:**
```
Usuario encontrado:
- ID: 5
- Nombre: Juan Pérez
- Email: profesor@instituto.edu
- Rol: usuario
- Estado: activo
- Último acceso: 2025-11-02 09:30:00
- Presentaciones: 12
```

---

### `list-reportes.js`
**Listar reportes de soporte**

```bash
node scripts/list-reportes.js

# Filtrar por estado
node scripts/list-reportes.js --estado=abierto

# Filtrar por prioridad
node scripts/list-reportes.js --prioridad=alta
```

---

### `clear-support-logs.js`
**Limpiar logs antiguos**

```bash
# Eliminar logs de más de 30 días
node scripts/clear-support-logs.js --days=30
```

---

### `seed-support-logs.js`
**Generar datos de prueba**

```bash
# Crear 50 reportes de prueba
node scripts/seed-support-logs.js --count=50
```

---

### `test-maintenance-gate.js`
**Probar modo mantenimiento**

```bash
node scripts/test-maintenance-gate.js
```

---

## ✅ Mejores Prácticas

### Seguridad

1. **Nunca versionar secretos**
   ```bash
   # Verificar que .gitignore incluye:
   .env
   .env.local
   .env.*.local
   *.pem
   *.key
   *.crt
   ```

2. **Rotar secretos regularmente**
   ```bash
   # Generar nuevos secretos cada 3-6 meses
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Usar HTTPS en producción**
   - Nunca desplegar sin SSL/TLS
   - Configurar HSTS headers con Helmet
   - Validar certificados (`DATABASE_SSL_CA_B64`)

4. **Implementar rate limiting**
   ```javascript
   // Especialmente en endpoints sensibles
   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5
   });
   app.use('/auth/google', loginLimiter);
   ```

5. **Sanitizar inputs**
   ```javascript
   // Siempre usar parámetros preparados
   await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
   // NUNCA interpolar directamente: `... WHERE email = '${email}'`
   ```

---

### Performance

1. **Optimizar queries PostgreSQL**
   ```sql
   -- Crear índices para búsquedas frecuentes
   CREATE INDEX idx_presentaciones_usuario_fecha 
   ON presentaciones(usuario_id, fecha_creacion DESC);
   
   -- Analizar queries lentas
   EXPLAIN ANALYZE SELECT * FROM presentaciones WHERE usuario_id = 5;
   ```

2. **Cachear respuestas frecuentes**
   ```javascript
   // Usar Redis para cachear dashboard
   const cachedDashboard = await redis.get('dashboard:resumen');
   if (cachedDashboard) {
     return JSON.parse(cachedDashboard);
   }
   const dashboard = await calcularDashboard();
   await redis.setex('dashboard:resumen', 300, JSON.stringify(dashboard)); // 5 min
   ```

3. **Comprimir respuestas**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

4. **Paginar resultados grandes**
   ```javascript
   // Siempre limitar queries
   const limit = Math.min(parseInt(req.query.limit) || 10, 50);
   const offset = (page - 1) * limit;
   ```

---

### Mantenibilidad

1. **Documentar código complejo**
   ```javascript
   /**
    * Genera esquema de presentación con IA
    * @param {string} tema - Tema de la presentación
    * @param {Object} opciones - Configuración de generación
    * @param {string} opciones.idioma - Español | English | French
    * @param {number} opciones.numeroSlides - Entre 3 y 30
    * @param {string} opciones.detailLevel - Brief | Medium | Detailed
    * @returns {Promise<Object>} Esquema JSON con slides
    */
   async function generarEsquema(tema, opciones) { ... }
   ```

2. **Usar ESLint y Prettier**
   ```bash
   npm install --save-dev eslint prettier eslint-config-prettier
   npx eslint --init
   ```

   ```json
   // .eslintrc.json
   {
     "env": { "node": true, "es2021": true },
     "extends": ["eslint:recommended", "prettier"],
     "parserOptions": { "ecmaVersion": "latest" },
     "rules": {
       "no-console": "off",
       "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
     }
   }
   ```

3. **Testing (configuración básica)**
   ```bash
   npm install --save-dev jest supertest
   ```

   ```javascript
   // __tests__/healthz.test.js
   const request = require('supertest');
   const app = require('../index');

   describe('GET /healthz', () => {
     it('should return 200 OK', async () => {
       const res = await request(app).get('/healthz');
       expect(res.statusCode).toBe(200);
       expect(res.body.status).toBe('ok');
     });
   });
   ```

4. **Git commits descriptivos**
   ```bash
   # Formato: tipo(scope): descripción
   git commit -m "feat(presentaciones): add image generation endpoint"
   git commit -m "fix(auth): handle expired tokens correctly"
   git commit -m "docs(readme): update deployment instructions"
   git commit -m "refactor(services): extract prompt builder to helper"
   ```

---

### Deployment

1. **Variables de entorno por ambiente**
   ```
   .env.development
   .env.staging
   .env.production
   ```

2. **Health checks configurados**
   ```yaml
   # DigitalOcean app.yaml
   health_check:
     http_path: /healthz
     initial_delay_seconds: 30
     period_seconds: 10
     timeout_seconds: 5
     success_threshold: 1
     failure_threshold: 3
   ```

3. **Rollback plan**
   ```bash
   # Etiquetar releases
   git tag -a v1.2.0 -m "Release 1.2.0"
   git push origin v1.2.0

   # Rollback si es necesario
   git checkout v1.1.0
   git push deploy HEAD:main --force
   ```

4. **Monitoreo post-deploy**
   - Verificar logs durante 15-30 min después del deploy
   - Revisar métricas de CPU/RAM
   - Probar endpoints críticos manualmente

---

## ❓ Preguntas Frecuentes (FAQ)

### General

**Q: ¿Puedo usar este backend sin el frontend de TecCreate?**  
A: Sí, el backend es completamente independiente. Puedes consumir la API desde cualquier cliente (React, Vue, Angular, mobile apps, etc.) siempre que envíes el JWT en el header `Authorization: Bearer <token>`.

**Q: ¿Cuánto cuesta operar este backend?**  
A: Depende de tu infraestructura:
- **Free tier**: DigitalOcean no tiene free tier para Apps, pero Render ofrece plan gratuito (con limitaciones)
- **Mínimo recomendado**: ~$14-20/mes (App Platform Básico + PostgreSQL Básico en DigitalOcean)
- **APIs IA**: Groq tiene tier gratuito generoso, Gemini cobra por uso (consultar precios actuales)

**Q: ¿Soporta múltiples instituciones (multi-tenant)?**  
A: Actualmente no está optimizado para multi-tenant. Necesitarías agregar un campo `institucion_id` a las tablas y filtrar por él. Sin embargo, puedes desplegar instancias separadas para cada institución.

---

### Autenticación

**Q: ¿Puedo usar otro provider OAuth además de Google?**  
A: Sí, Passport.js soporta múltiples estrategias. Para agregar Microsoft, Facebook, etc., instala la estrategia correspondiente y configúrala en `config/passport.js`.

**Q: ¿Cómo agrego más correos institucionales?**  
A: Edita la variable `ADMIN_EMAILS` agregando los correos separados por comas, luego reinicia el servidor.

**Q: ¿Puedo permitir registro abierto?**  
A: Sí, pero requiere modificar `config/passport.js`. Actualmente la whitelist es por seguridad institucional. Si lo abres, implementa verificación por email.

---

### Presentaciones

**Q: ¿Cuántas slides puedo generar como máximo?**  
A: El límite está en 30 slides (configurado en validación). Puedes aumentarlo modificando el validator en el controller, pero considera que más slides = más tiempo de generación y mayor consumo de tokens.

**Q: ¿Puedo generar presentaciones sin usar IA?**  
A: Sí, usa `POST /presentaciones` con tu propio `esquema_json` en lugar de `POST /presentaciones/generar`.

**Q: ¿Las imágenes generadas son libres de derechos?**  
A: Las imágenes generadas por Gemini están sujetas a los [términos de servicio de Google AI](https://ai.google.dev/terms). Revísalos antes de uso comercial.

---

### Deployment

**Q: ¿Puedo desplegar en AWS/Azure/GCP?**  
A: Sí, el backend es estándar Node.js/Express. Puedes desplegarlo en:
- **AWS**: Elastic Beanstalk, ECS, Lambda (con ajustes)
- **Azure**: App Service, Container Instances
- **GCP**: Cloud Run, App Engine

**Q: ¿Necesito usar Docker?**  
A: No es obligatorio. Docker facilita el despliegue pero puedes correr directamente con `node index.js` en cualquier servidor.

**Q: ¿Cómo actualizo el código en producción?**  
A:
```bash
# Con Git deploy (DigitalOcean/Render)
git push deploy main

# Con PM2 (servidor propio)
git pull
npm install
pm2 restart teccreate-backend
```

---

### Performance

**Q: ¿Cuántas peticiones concurrentes soporta?**  
A: Depende de tu infraestructura:
- **Plan básico**: ~50-100 req/s (limitado por PostgreSQL connections)
- **Con Redis + load balancer**: Miles de req/s

**Q: ¿Cómo escalo horizontalmente?**  
A:
1. Migrar sesiones a Redis (`REDIS_URL`)
2. Usar load balancer (Nginx, DigitalOcean Load Balancer)
3. Desplegar múltiples instancias del backend
4. Considerar CDN para archivos estáticos

---

### Troubleshooting

**Q: ¿Dónde veo los logs de errores?**  
A:
- **Local**: Terminal donde corre el servidor
- **DigitalOcean**: Panel → Runtime Logs
- **Render**: Panel → Logs tab
- **PM2**: `pm2 logs teccreate-backend`

**Q: ¿Qué hago si el servidor no arranca?**  
A:
1. Verifica logs para el error específico
2. Comprueba que todas las variables de entorno están configuradas
3. Prueba conexión a PostgreSQL manualmente
4. Verifica que el puerto no está en uso

**Q: ¿Cómo recupero presentaciones eliminadas accidentalmente?**  
A: Si tienes backups de PostgreSQL:
```bash
# Restaurar desde backup
psql "DATABASE_URL" < backup_20251102.sql
```
Sin backups, los datos no son recuperables (configura backups automáticos).

---

## 📚 Documentación Complementaria

Este README cubre los aspectos fundamentales. Para información más específica:

### Documentación Interna

- **`docs/Backend-Manual.md`**: Manual técnico exhaustivo
  - Arquitectura detallada
  - Diagramas de secuencia
  - Especificaciones de API completas
  - Guías de troubleshooting avanzado

- **`docs/Manual-Usuario-Backend.md`**: Guía operativa
  - Dirigida a profesores y coordinadores
  - Ejemplos de uso de la API
  - Tutoriales paso a paso
  - Casos de uso comunes

- **`docs/gestion-usuarios.md`**: Gestión de usuarios
  - Flujo de aprobación de usuarios
  - Cambio de roles
  - Suspensión y reactivación
  - Auditoría de actividad

- **`docs/roles-permissions.md`**: Matriz de permisos
  - Tabla completa de permisos por rol
  - Restricciones de acceso
  - Casos especiales

### Archivos de Configuración

- **`render.yaml`**: Blueprint para Render
  - Definición de infraestructura como código
  - Variables de entorno plantilla
  - Configuración de base de datos

- **`estructura_presentador_ia.sql`**: Schema PostgreSQL
  - Todas las tablas con comentarios
  - Índices optimizados
  - Triggers y funciones
  - Datos de ejemplo (opcional)

- **`.env.example`**: Plantilla de variables
  - Todas las variables necesarias
  - Valores de ejemplo seguros
  - Comentarios explicativos

### Recursos Externos

- **Node.js**: [nodejs.org/docs](https://nodejs.org/docs)
- **Express**: [expressjs.com](https://expressjs.com)
- **PostgreSQL**: [postgresql.org/docs](https://www.postgresql.org/docs/)
- **Passport.js**: [passportjs.org](https://www.passportjs.org/)
- **Groq API**: [groq.com/docs](https://groq.com/docs)
- **Google Gemini**: [ai.google.dev](https://ai.google.dev/)
- **pptxgenjs**: [gitbrent.github.io/PptxGenJS](https://gitbrent.github.io/PptxGenJS/)

---

## 🤝 Soporte y Contribuciones

### Reportar Problemas

Si encuentras un bug o tienes una sugerencia:

1. **Revisa issues existentes**: [GitHub Issues](https://github.com/JuniorSebastian/TecCreateBackendLocal/issues)
2. **Crea un nuevo issue** con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Logs relevantes
   - Versión de Node.js y sistema operativo

### Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit tus cambios: `git commit -m "feat: agregar nueva funcionalidad"`
4. Push a tu fork: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

**Convenciones de código:**
- Sigue el estilo existente (considera usar ESLint)
- Documenta funciones públicas
- Agrega tests si es posible
- Actualiza README si cambias comportamiento

---

## 📄 Licencia

Este proyecto está desarrollado para uso educativo exclusivo de **Tecsup - Instituto de Educación Superior Tecnológica**. 

Propiedad intelectual de TecCreate y Tecsup. Para términos de uso, licenciamiento o implementación en otras instituciones, contactar con:
- **Email**: soporte@tecsup.edu.pe
- **Web**: https://tecsup.edu.pe

---

## 🎓 Créditos

**Desarrollado para:** Tecsup - Instituto de Educación Superior  
**Desarrollado por:** Equipo TecCreate  
**Mantenido por:** JuniorSebastian  
**Institución:** Tecsup (Instituto de Educación Superior Tecnológica)  
**Ubicación:** Arequipa, Lima, Trujillo (Perú)

**Carreras beneficiadas:**
- Diseño y Desarrollo de Software
- Gestión y Mantenimiento de Maquinaria Industrial
- Mecatrónica Industrial
- Procesos Químicos y Metalúrgicos

**Tecnologías principales:**
- Node.js & Express.js
- PostgreSQL
- Google OAuth 2.0
- Groq (LLaMA 3)
- Google Gemini
- pptxgenjs

---

## 📞 Contacto

- **Email de soporte**: Configurado en `SUPPORT_EMAIL`
- **GitHub**: [TecCreateBackendLocal](https://github.com/JuniorSebastian/TecCreateBackendLocal)
- **Documentación**: Este README y `docs/`

---

## 🔄 Changelog

### v1.2.0 (2025-11-02)
- ✨ Documentación exhaustiva del README
- ✨ Sistema de fallback automático para modelos Gemini
- ✨ Soporte para 3 niveles de detalle (Brief, Medium, Detailed)
- ✨ 3 estilos de escritura (Professional, Casual, Academic)
- ✨ 7 plantillas visuales para diferentes carreras
- 🐛 Fix: Manejo de dependencias opcionales (pino, helmet)
- 📚 Docs: Guías completas de deployment para DigitalOcean y Render

### v1.1.0 (2025-10-15)
- ✨ Generación de imágenes con Gemini
- ✨ Compartir presentaciones con QR
- ✨ Dashboard de administración
- 🔧 Mejoras en pool de conexiones PostgreSQL

### v1.0.0 (2025-09-01)
- 🎉 Lanzamiento inicial
- ✨ Autenticación con Google OAuth
- ✨ Generación de presentaciones con Groq
- ✨ Exportación a PPTX
- ✨ Sistema de roles (usuario, admin, soporte)

---

**¿Necesitas ayuda?** Revisa la sección [Solución de Problemas](#-solución-de-problemas-detallada) o contacta al equipo de soporte.

**¿Quieres contribuir?** Lee la sección [Soporte y Contribuciones](#-soporte-y-contribuciones).

**¡Gracias por usar TecCreate Backend! 🚀**
