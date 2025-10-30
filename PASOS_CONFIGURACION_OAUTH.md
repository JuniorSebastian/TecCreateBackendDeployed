# 🔐 Pasos para Configurar OAuth con DigitalOcean

## ✅ Lo que YA está hecho en el código:

1. ✅ Backend configurado para usar variables de entorno
2. ✅ CORS configurado para aceptar Vercel y DigitalOcean
3. ✅ Rutas de autenticación preparadas para producción
4. ✅ Redirecciones configuradas dinámicamente según `CLIENT_URL`

## 🔧 Lo que DEBES hacer (PASO A PASO):

### 1️⃣ Configurar Variables de Entorno en DigitalOcean

Ve al panel de tu aplicación en DigitalOcean y configura estas variables:

```env
CLIENT_URL=https://tec-create-fronted-deployed-p8as.vercel.app
PUBLIC_BASE_URL=https://teccreate-f6g5r.ondigitalocean.app
ALLOWED_ORIGINS=https://tec-create-fronted-deployed-p8as.vercel.app,https://teccreate-f6g5r.ondigitalocean.app
GOOGLE_CALLBACK_URL=https://teccreate-f6g5r.ondigitalocean.app/auth/google/callback
NODE_ENV=production
```

**Usa tus credenciales reales para:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`

### 2️⃣ Actualizar Google Cloud Console (MUY IMPORTANTE)

**Este es el paso CRÍTICO que arregla el error de redirect_uri_mismatch**

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Haz clic en tu OAuth 2.0 Client ID
3. En la sección **Authorized redirect URIs**, agrega:
   ```
   https://teccreate-f6g5r.ondigitalocean.app/auth/google/callback
   ```
4. En la sección **Authorized JavaScript origins**, agrega:
   ```
   https://teccreate-f6g5r.ondigitalocean.app
   https://tec-create-fronted-deployed-p8as.vercel.app
   ```
5. Haz clic en **SAVE** (Guardar)

### 3️⃣ Verificar el Frontend (Vercel)

Asegúrate de que tu frontend esté usando la URL correcta del backend:

```javascript
// En tu archivo de configuración del frontend
const API_URL = "https://teccreate-f6g5r.ondigitalocean.app";

// Ejemplo de llamada de login:
window.location.href = `${API_URL}/auth/google`;
```

### 4️⃣ Redeploy tu aplicación en DigitalOcean

Después de configurar las variables de entorno:
1. Ve al panel de DigitalOcean
2. Haz clic en **"Redeploy"** o espera el deploy automático desde GitHub

## 🔄 Flujo Completo de Autenticación

```
1. Usuario en Vercel hace clic en "Login con Google"
   ↓
2. Frontend redirige a: https://teccreate-f6g5r.ondigitalocean.app/auth/google
   ↓
3. Backend (DO) redirige a Google OAuth
   ↓
4. Usuario autoriza en Google
   ↓
5. Google redirige a: https://teccreate-f6g5r.ondigitalocean.app/auth/google/callback
   ↓
6. Backend procesa usuario y genera JWT
   ↓
7. Backend redirige a: https://tec-create-fronted-deployed-p8as.vercel.app/oauth-success?token=...
   ↓
8. Frontend recibe token y completa login ✅
```

## ❌ Errores Comunes y Soluciones

### Error: "redirect_uri_mismatch"
**Causa**: Google no reconoce la URL de callback
**Solución**: Verifica que hayas agregado exactamente:
```
https://teccreate-f6g5r.ondigitalocean.app/auth/google/callback
```
en Google Cloud Console (sin espacios, sin "/" al final)

### Error: "CORS policy"
**Causa**: Frontend no está autorizado
**Solución**: Verifica `ALLOWED_ORIGINS` en DigitalOcean incluya:
```
https://tec-create-fronted-deployed-p8as.vercel.app,https://teccreate-f6g5r.ondigitalocean.app
```

### Error: "Failed to fetch"
**Causa**: Backend no está accesible o URL incorrecta
**Solución**: Verifica que el frontend use `https://teccreate-f6g5r.ondigitalocean.app`

### Usuario logea pero no redirige
**Causa**: `CLIENT_URL` incorrecta en backend
**Solución**: Verifica que `CLIENT_URL=https://tec-create-fronted-deployed-p8as.vercel.app`

## 📋 Checklist Final

Antes de probar, verifica:

- [ ] ✅ Variables de entorno configuradas en DigitalOcean
- [ ] ✅ `GOOGLE_CALLBACK_URL` apunta a DigitalOcean (NO a Render)
- [ ] ✅ Redirect URI agregado en Google Cloud Console
- [ ] ✅ JavaScript origins agregados en Google Cloud Console
- [ ] ✅ Frontend apunta a `https://teccreate-f6g5r.ondigitalocean.app`
- [ ] ✅ Backend redeployado con nuevas variables
- [ ] ✅ Probaste el flujo completo de login

## 🧪 Cómo Probar

1. Abre tu frontend en: https://tec-create-fronted-deployed-p8as.vercel.app
2. Haz clic en "Iniciar sesión con Google"
3. Deberías ser redirigido a Google para autorizar
4. Después de autorizar, deberías volver a tu frontend con sesión iniciada

Si todo funciona, verás tu perfil y podrás crear presentaciones.

## 🆘 Si Sigues Teniendo Problemas

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta hacer login
4. Captura el error exacto que aparece
5. Verifica que las URLs coincidan exactamente

## 📝 Notas Importantes

- **NO uses localhost** en producción
- **TODAS las URLs** deben ser HTTPS (excepto en desarrollo local)
- **Los redirect URIs** deben coincidir EXACTAMENTE (sin / al final)
- **Espera 5-10 minutos** después de cambiar configuración en Google Console
