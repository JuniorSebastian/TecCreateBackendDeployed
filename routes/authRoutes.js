// backend/routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const pool = require('../database');
const { getMaintenanceGateInfo } = require('../services/maintenanceService');
const router = express.Router();

// Inicio login con Google
// Construimos manualmente la URL de autorización de Google para asegurar
// que `redirect_uri` sea exactamente la variable de entorno esperada
// (sin parámetros extra ni modificaciones).
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Google OAuth no está configurado correctamente.' });
  }

  const encodedClientId = encodeURIComponent(clientId);
  const encodedRedirect = encodeURIComponent(redirectUri);
  // Solo los parámetros obligatorios solicitados por el usuario
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodedClientId}&redirect_uri=${encodedRedirect}&response_type=code&scope=openid%20email%20profile`;
  return res.redirect(authUrl);
});

// Callback de Google
router.get('/google/callback', async (req, res) => {
  // Helper to send structured errors: JSON when requested, or redirect to frontend /oauth-error
  const sendError = (errorCode, message, status = 400) => {
    console.error('OAuth callback error:', errorCode, message);
    const acceptsJson = String(req.headers.accept || '').includes('application/json') || req.xhr;
    if (acceptsJson) {
      return res.status(status).json({ error: errorCode, message });
    }
    // Redirect to frontend oauth-error page (frontend should implement this route)
    const safeMsg = message ? `&message=${encodeURIComponent(message)}` : '';
    return res.redirect(`${process.env.CLIENT_URL}/oauth-error?error=${encodeURIComponent(errorCode)}${safeMsg}`);
  };

  try {
    console.log('Callback recibido:', req.query);
    const code = req.query.code;
    const error = req.query.error;

    if (error) {
      return sendError('google_error', `Google returned error: ${error}`, 400);
    }

    if (!code) {
      return sendError('missing_code', 'Missing authorization code from Google', 400);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      return sendError('oauth_not_configured', 'OAuth environment variables not configured', 500);
    }

    console.log('Intercambiando código por tokens...');
    // 1) Intercambiar code por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      return sendError('token_exchange_failed', `Token exchange failed: ${text}`, 502);
    }

    const tokenJson = await tokenResponse.json();
    console.log('Token response received (id_token present?):', Boolean(tokenJson.id_token));
    const idToken = tokenJson.id_token;
    const accessToken = tokenJson.access_token;

    if (!idToken) {
      return sendError('no_id_token', 'No id_token returned from Google', 502);
    }

    console.log('Validando id_token...');
    // 2) Verificar id_token usando tokeninfo endpoint
    const infoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!infoResponse.ok) {
      const text = await infoResponse.text();
      return sendError('invalid_id_token', `id_token validation failed: ${text}`, 502);
    }

    const profile = await infoResponse.json();
    console.log('Perfil obtenido del id_token:', { email: profile.email, name: profile.name });

    const email = (profile.email || '').toLowerCase();
    const nombre = profile.name || profile.given_name || '';
    const foto = profile.picture || null;

    if (!email) {
      return sendError('no_email', 'No email in id_token payload', 502);
    }

    if (!email.endsWith('@tecsup.edu.pe')) {
      return sendError('email_not_allowed', 'Email domain is not allowed', 403);
    }

    console.log('Buscando/creando usuario en la BD:', email);
    // 4) Upsert user in DB and check suspension
    try {
      await pool.query(`
        INSERT INTO usuarios (nombre, email, foto)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre, foto = EXCLUDED.foto
      `, [nombre, email, foto]);

      const userResult = await pool.query(
        `SELECT id, nombre, email, foto, rol, estado FROM usuarios WHERE email = $1`,
        [email]
      );

      if (!userResult.rows.length) {
        return sendError('user_fetch_failed', 'User inserted but cannot be retrieved', 500);
      }

      const user = userResult.rows[0];
      console.log('Usuario encontrado/creado:', { id: user.id, email: user.email, estado: user.estado });

      if (user.estado === 'suspendido') {
        const tokenSuspendido = jwt.sign({ id: user.id, nombre: user.nombre, email: user.email, foto: user.foto, rol: user.rol, estado: user.estado }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const redirectUrl = `${process.env.CLIENT_URL}/oauth-success?token=${tokenSuspendido}&user=${encodeURIComponent(JSON.stringify({ id: user.id, nombre: user.nombre, email: user.email }))}&redirect=/cuenta-suspendida&suspendido=1`;
        return res.redirect(redirectUrl);
      }

      try {
        const mantenimiento = await getMaintenanceGateInfo();
        if (mantenimiento.activo && (user.rol || 'usuario').toLowerCase() === 'usuario') {
          return res.redirect(`${process.env.CLIENT_URL}/mantenimiento?activo=1&mensaje=${encodeURIComponent(mantenimiento.mensaje || 'Mantenimiento activo')}`);
        }
      } catch (mErr) {
        console.error('Error checking maintenance gate:', mErr);
      }

      const token = jwt.sign({ id: user.id, nombre: user.nombre, email: user.email, foto: user.foto, rol: (user.rol || 'usuario').toLowerCase(), estado: user.estado || 'activo' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

      const roleRedirects = { admin: '/admin', soporte: '/soporte', usuario: '/perfil' };
      const redirectPath = roleRedirects[(user.rol || 'usuario').toLowerCase()] || roleRedirects.usuario;

      const redirectUrl = `${process.env.CLIENT_URL}/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: user.id, nombre: user.nombre, email: user.email }))}&redirect=${encodeURIComponent(redirectPath)}`;
      console.log('Login exitoso, redirigiendo a frontend:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (dbErr) {
      return sendError('db_error', `Database error: ${dbErr.message}`, 500);
    }
  } catch (ex) {
    return sendError('unexpected_error', `Unexpected error: ${String(ex && ex.message ? ex.message : ex)}`, 500);
  }
});

module.exports = router;
