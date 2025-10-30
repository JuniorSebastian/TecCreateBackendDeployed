# 🚀 Configuración para Deploy en DigitalOcean

## URLs de Producción

- **Backend (DigitalOcean)**: `https://teccreate-f6g5r.ondigitalocean.app`
- **Frontend (Vercel)**: `https://tec-create-fronted-deployed-p8as.vercel.app`

## ⚙️ Variables de Entorno para DigitalOcean

Configura estas variables en el panel de DigitalOcean App Platform:

```env
# URLs de producción
CLIENT_URL=https://tec-create-fronted-deployed-p8as.vercel.app
PUBLIC_BASE_URL=https://teccreate-f6g5r.ondigitalocean.app
ALLOWED_ORIGINS=https://tec-create-fronted-deployed-p8as.vercel.app,https://teccreate-f6g5r.ondigitalocean.app

# Google OAuth (IMPORTANTE: actualizar callback URL)
GOOGLE_CLIENT_ID=<tu_google_client_id>
GOOGLE_CLIENT_SECRET=<tu_google_client_secret>
GOOGLE_CALLBACK_URL=https://teccreate-f6g5r.ondigitalocean.app/auth/google/callback

# Base de datos
DATABASE_URL=<tu_postgresql_connection_string>
DATABASE_SSL=true
PGPOOL_MAX=2
PGPOOL_CONNECTION_TIMEOUT=5000
PGPOOL_IDLE_TIMEOUT=10000

# APIs de IA
GROQ_API_KEY=<tu_groq_api_key>
GEMINI_API_KEY=<tu_gemini_api_key>
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
GEMINI_IMAGE_MODEL_FALLBACK=gemini-2.0-flash-preview-image-generation

# Seguridad
JWT_SECRET=<tu_jwt_secret_seguro>
SESSION_SECRET=<tu_session_secret_seguro>
JWT_EXPIRES_IN=1d

# Configuración de servidor
NODE_ENV=production
PORT=8080

# Administradores
ADMIN_EMAILS=junior.osorio@tecsup.edu.pe

# Soporte (opcional)
SUPPORT_EMAIL=soporte@tecsup.edu.pe
MAINTENANCE_GATE_SECRET=<tu_maintenance_secret>
```

## 🔐 Configuración de Google Cloud Console

**MUY IMPORTANTE**: Debes actualizar los **Authorized redirect URIs** en Google Cloud Console:

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Selecciona tu OAuth 2.0 Client ID
3. En **Authorized redirect URIs**, agrega:
   ```
   https://teccreate-f6g5r.ondigitalocean.app/auth/google/callback
   ```
4. En **Authorized JavaScript origins**, agrega:
   ```
   https://teccreate-f6g5r.ondigitalocean.app
   https://tec-create-fronted-deployed-p8as.vercel.app
   ```

## 📋 Checklist de Deploy

- [ ] ✅ Variables de entorno configuradas en DigitalOcean
- [ ] ✅ `GOOGLE_CALLBACK_URL` actualizada a DigitalOcean
- [ ] ✅ Redirect URIs actualizados en Google Cloud Console
- [ ] ✅ `CLIENT_URL` apunta al frontend de Vercel
- [ ] ✅ CORS configurado con `ALLOWED_ORIGINS`
- [ ] ✅ Base de datos PostgreSQL accesible
- [ ] ✅ API keys de Groq y Gemini configuradas
- [ ] ✅ `NODE_ENV=production` establecida

## 🔄 Flujo de Autenticación OAuth

1. Usuario hace clic en "Iniciar sesión con Google" en el frontend (Vercel)
2. Frontend redirige a: `https://teccreate-f6g5r.ondigitalocean.app/auth/google`
3. Backend redirige a Google para autenticación
4. Google valida y redirige a: `https://teccreate-f6g5r.ondigitalocean.app/auth/google/callback`
5. Backend procesa usuario y redirige a: `https://tec-create-fronted-deployed-p8as.vercel.app/oauth-success?token=...`
6. Frontend recibe el token y completa el login

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- **Causa**: El callback URL no está registrado en Google Cloud Console
- **Solución**: Agrega `https://teccreate-f6g5r.ondigitalocean.app/auth/google/callback` en Google Console

### Error: "CORS policy"
- **Causa**: El frontend no está en la lista de orígenes permitidos
- **Solución**: Verifica `ALLOWED_ORIGINS` incluya ambas URLs (frontend y backend)

### Error: "Invalid credentials"
- **Causa**: `GOOGLE_CLIENT_ID` o `GOOGLE_CLIENT_SECRET` incorrectos
- **Solución**: Verifica las credenciales en Google Cloud Console

### Usuario no puede crear presentaciones
- **Causa**: APIs de IA no configuradas
- **Solución**: Verifica `GROQ_API_KEY` y `GEMINI_API_KEY` estén correctas

## 📝 Notas Importantes

1. **NUNCA** subas archivos `.env` al repositorio
2. **SIEMPRE** usa variables de entorno en el panel de DigitalOcean
3. **Revoca y regenera** las API keys si se expusieron públicamente
4. **Verifica** que `NODE_ENV=production` esté configurada para seguridad adecuada
5. **Configura** `SESSION_SECRET` y `JWT_SECRET` con valores únicos y seguros

## 🔗 Enlaces Útiles

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Configurar Variables de Entorno en DO](https://docs.digitalocean.com/products/app-platform/how-to/use-environment-variables/)
